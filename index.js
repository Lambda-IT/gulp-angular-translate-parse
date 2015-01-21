'use strict';

var _ = require('lodash');
var cheerio = require('cheerio');
var fs = require('fs');
var gutil = require('gulp-util');
var through = require('through');
var path = require('path');
var glob = require('glob');

var File = gutil.File;
var PluginError = gutil.PluginError;

var pluginName = require('./package.json').name;

function ngExtractTranslations(lang, opt) {

  if (!lang) {
    throw new PluginError(pluginName, 'Missing languages option');
  }

  var options = opt || {};

  options.moduleName = options.moduleName || 'Translations';
  options.deleteInnerText = options.deleteInnerText || false;
  options.defaultLang = options.defaultLang || '';
  options.preserveWhitespace = options.preserveWhitespace || false;

  var languages = lang;
  var firstFile = null;
  var extractor = null;

  function bufferContents(file) {
    var _this = this;

    // ignore empty files
    if (file.isNull()) {
      return;
    }

    // we dont do streams (yet)
    if (file.isStream()) {
      return _this.emit('error', new PluginError(pluginName, 'Streaming not supported'));
    }

    // set first file if not already set
    if (!firstFile) {
      firstFile = file;
    }

    // construct extractor instance
    if (!extractor) {
      //console.log("create extractor");
      extractor = new ExtractTranslations(options.deleteInnerText);
      //console.log("after create: " + JSON.stringify(extractor));
    }

    // add file to extractor instance
    extractor.extract(file, function(error) {
      _this.emit('error', new PluginError(pluginName, error));
    });

    // if deleting return modified input file
    if (options.deleteInnerText) {
      file.contents = new Buffer(extractor.htmlData);
      _this.queue(file);
    }
  }

  function endStream() {
    var _this = this;

    // no files passed in, no file goes out
    if (!firstFile) {
      return _this.queue(null);
    }

    if (!options.deleteInnerText) {
      _.forEach(languages, function(language) {

        var json = extractor.getTranslations(language, options.moduleName, options.defaultLang);
        var newFile = new File({
          path: './translations.' + language + '.js',
          base: "./",
          contents: new Buffer(json)
        });
        _this.queue(newFile);
      });
    }

    _this.queue(null);
  }

  return through(bufferContents, endStream);
};


var ExtractTranslations = (function() {
  function extractTranslations(deleteInnerText, preserveWhitespace) {
    this.translations = {};
    this.deleteInnerText = deleteInnerText;
    this.preserveWhitespace = preserveWhitespace;

    this.extract = extractTranslations.prototype.extract.bind(this);
    this.getTranslations = extractTranslations.prototype.getTranslations.bind(this);
  }

  extractTranslations.prototype.getTranslations = function(lang, moduleName, defaultLang) {
    var ret = 'var ' + moduleName + '; (function (' + moduleName + ') {';

    var clone = _.cloneDeep(orderObjectProprtiesAlphabetically(this.translations), function(val) {
      if (lang === defaultLang)
        return _.isString(val) ? val : undefined;

      return _.isString(val) ? (lang + '_' + val) : undefined;
    });

    ret += 'var ' + lang + ' = ' + JSON.stringify(clone) + ';';
    ret += moduleName + '.' + lang + ' = ' + lang + '; })(' + moduleName + ' || (' + moduleName + ' = {}));';

    return ret;
  }

  function orderObjectProprtiesAlphabetically(obj) {
    var arr = [],
      i;

    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        arr.push(i);
      }
    }

    arr.sort();

    var newobj = {};

    for (i = 0; i < arr.length; i++) {
      var propName = arr[i];
      if (_.isObject(obj[propName]))
        newobj[propName] = orderObjectProprtiesAlphabetically(obj[propName]);
      else
        newobj[propName] = obj[propName];
    }

    return newobj;
  }

  extractTranslations.prototype.extract = function(file, error) {
    var _this = this;
    //console.log("this: " + JSON.stringify(this));
    var $ = cheerio.load(file.contents, {
      decodeEntities: false,
      xmlMode: true
    });

    $('*[translate]').each(function(index, n) {
      var node = $(n);
      var attr = node.attr();
      if (attr.hasOwnProperty('translate') && attr.translate) {

        if (_this.deleteInnerText && node.text){
          node.text('');
          if(attr.hasOwnProperty('gulp-ng-translate-preserve-whitespace'))
            node.removeAttr('gulp-ng-translate-preserve-whitespace');
        }
        else {
          var nodeText = node.text();
          var extraWhitespaceRegEx = /(\t|[\s\r\t]+\n|\n[\s\r\t]+)/g;

          if (!_this.preserveWhitespace) {
            var preserve = attr.hasOwnProperty('gulp-ng-translate-preserve-whitespace');
            if (!preserve) {
              nodeText = nodeText.replace(extraWhitespaceRegEx, ' ');
              nodeText = nodeText.replace(/\s[\s]+/g, ' ');
              nodeText = nodeText.replace(/\n/g, '');
            }
          }

          var namespaces = attr.translate.split('.');

          var currentTranslations = _this.translations;
          var max = namespaces.length;

          _.forEach(namespaces, function(ns, i) {
            if (i === max - 1) {
              if (currentTranslations.hasOwnProperty(ns)) {
                if (typeof currentTranslations[ns] !== "string")
                  error(ns + ' namespace/key is used as namespace and key: ' + attr.translate);
                else
                  console.log(ns + ' namespace/key is not unique, complete translation key: ' + attr.translate);
              } else
                currentTranslations[ns] = nodeText || attr.translate;
            } else {
              if (!currentTranslations.hasOwnProperty(ns))
                currentTranslations[ns] = {};
              else if (typeof currentTranslations[ns] === "string")
                error(ns + ' namespace/key is used as namespace and key: ' + attr.translate);

              currentTranslations = currentTranslations[ns];
            }
          });
        }
      }
    });

    _this.htmlData = $.xml();
  };

  return extractTranslations;
})();

module.exports = ngExtractTranslations;
