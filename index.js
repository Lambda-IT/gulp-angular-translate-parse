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
        extractor.extract(file, function (error) { _this.emit('error', new PluginError(pluginName, error)); });
    }

    function endStream() {
        var _this = this;

        // no files passed in, no file goes out
        if (!firstFile) {
            return _this.queue(null);
        }

        _.forEach(languages, function (language) {

            var json = JSON.stringify(extractor.translations);
            var newFile = new File({
                path: './translations.' + language + '.json',
                base: "./",
                contents: new Buffer(json)
            });
            _this.queue(newFile);
        });

        _this.queue(null);      
    }

    return through(bufferContents, endStream);
};


var ExtractTranslations = (function () {
    function ExtractTranslations(deleteInnerText) {
        this.translations = {};
        this.deleteInnerText = deleteInnerText || false;

        this.extract = this.extract.bind(this);
    }

    ExtractTranslations.prototype.extract = function (file, error) {
        var _this = this;
        //console.log("this: " + JSON.stringify(this));
        var $ = cheerio.load(file.contents, { decodeEntities: false });

        $('*').each(function (index, n) {
            var node = $(n);
            var attr = node.attr();
            if (attr.hasOwnProperty('translate') && attr.translate) {
                var namespaces = attr.translate.split('.');

                var currentTranslations = _this.translations;
                var max = namespaces.length;

                _.forEach(namespaces, function (ns, i) {
                    if (i == max - 1) {
                        if (currentTranslations.hasOwnProperty(ns))
                            error(ns + ' namespace/key is not unique, complete translation key: ' + attr.translate);
                        else
                            currentTranslations[ns] = attr.translate;
                    }
                    else {
                        if (!currentTranslations.hasOwnProperty(ns))
                            currentTranslations[ns] = {};
                        currentTranslations = currentTranslations[ns];
                    }
                });

                if (_this.deleteInnerText && node.text)
                    node.text('');

            }
        });
    };

    return ExtractTranslations;
})();

module.exports = ngExtractTranslations;