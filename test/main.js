/*global describe, it*/
"use strict";

require("mocha");
var should = require('should');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var ngTranslate = require("../");

describe("gulp-angular-translate-parse", function () {
    describe("when file is provided via buffer", function () {
        it("should do nothing with no file", function (done) {
            // ignore null files
            var stream = ngTranslate(['de', 'en']);
            stream.on("end", function (data) {
                done();
            });

            stream.on("data", function (newFile) {
                newFile.should.have.lengthOf(0);
            });

            stream.write(new gutil.File());
            stream.end();
        });

        it("should generate the translations file (no options)", function (done) {
            var expectedFile = new gutil.File({
                path: "test/expected/translations.en.js",
                cwd: "test/",
                base: "test/expected",
                contents: fs.readFileSync("test/expected/translations.en.js")
            });

            testBufferedFile(['en'], null, expectedFile, done);
        });

        it("should remove the whitespace from translations", function (done) {
          var expectedFile = new gutil.File({
            path: "test/expected/translations.fr.js",
            cwd: "test/",
            base: "test/expected",
            contents: fs.readFileSync("test/expected/translations.fr.js")
          });

          var srcFile = new gutil.File({
            path: "test/fixtures/whitespace.html",
            cwd: "test/",
            base: "test/fixtures",
            contents: fs.readFileSync("test/fixtures/whitespace.html")
          });

          var stream = ngTranslate(['fr'], null);
          stream.on("data", function (newFile) {
            should.exist(newFile);

            path.extname(newFile.path).should.equal(".js");

            should.exist(newFile.contents);
            String(newFile.contents).should.equal(String(expectedFile.contents));

            //fs.writeFile('translations.fr.js', newFile.contents);
          });

          stream.on("end", function (data) {

            done();
          });

          stream.write(srcFile);
          stream.end();
      });

      it("should not remove the whitespace from translations when 'gulp-ng-translate-preserve-whitespace' attr is set", function (done) {
        var expectedFile = new gutil.File({
          path: "test/expected/translations.ar.js",
          cwd: "test/",
          base: "test/expected",
          contents: fs.readFileSync("test/expected/translations.ar.js")
        });

        var srcFile = new gutil.File({
          path: "test/fixtures/preserve_whitespace_attr.html",
          cwd: "test/",
          base: "test/fixtures",
          contents: fs.readFileSync("test/fixtures/preserve_whitespace_attr.html")
        });

        var stream = ngTranslate(['ar'], null);
        stream.on("data", function (newFile) {
          should.exist(newFile);

          path.extname(newFile.path).should.equal(".js");

          should.exist(newFile.contents);
          String(newFile.contents).should.equal(String(expectedFile.contents));

          // fs.writeFile('translations.ar.js', newFile.contents);
        });

        stream.on("end", function (data) {

          done();
        });

        stream.write(srcFile);
        stream.end();
      });
    });

    describe("when option is provided", function () {

        it("should generate the translations file and not prefix default translation language (option)", function (done) {
            var expectedFile = new gutil.File({
                path: "test/expected/translations.de.js",
                cwd: "test/",
                base: "test/expected",
                contents: fs.readFileSync("test/expected/translations.de.js")
            });

            var options = {
                defaultLang: 'de',
                moduleName: 'Translations',
                deleteInnerText: false
            };

            testBufferedFile(['de'], options, expectedFile, done);
        });

        it("should remove the text from html and remove 'gulp-ng-translate-preserve-whitespace' attributes (deleteInnerText option)", function (done) {
            var expectedFile = new gutil.File({
                path: "test/expected/example.html",
                cwd: "test/",
                base: "test/expected",
                contents: fs.readFileSync("test/expected/example.html")
            });

            var options = {
                defaultLang: 'de',
                moduleName: 'Translations',
                deleteInnerText: true
            };

            testBufferedFile(['de'], options, expectedFile, done);
        });

        it("should throw if key is used as namespace first and then as key", function(done) {

            var srcFile = new gutil.File({
                path: "test/fixtures/key_problem.html",
                cwd: "test/",
                base: "test/fixtures",
                contents: fs.readFileSync("test/fixtures/key_problem.html")
            });

            var stream = ngTranslate(['de'], null);
            stream.on("error", function (error) {
                error.message.should.match(/is used as namespace and key/);
                done();
            });
            stream.write(srcFile);
            stream.end();
        });

        it("should throw if namespace is used as key first and then as namespace", function (done) {

            var srcFile = new gutil.File({
                path: "test/fixtures/ns_problem.html",
                cwd: "test/",
                base: "test/fixtures",
                contents: fs.readFileSync("test/fixtures/ns_problem.html")
            });

            var stream = ngTranslate(['de'], null);
            stream.on("error", function (error) {
                error.message.should.match(/is used as namespace and key/);
                done();
            });
            stream.write(srcFile);
            stream.end();
        });

    });

    function testBufferedFile(params, options, expectedFile, done) {
        var srcFile = new gutil.File({
            path: "test/fixtures/example.html",
            cwd: "test/",
            base: "test/fixtures",
            contents: fs.readFileSync("test/fixtures/example.html")
        });

        var stream = ngTranslate(params, options);

        options = options || {};
        options.deleteInnerText = options.deleteInnerText || false;

        stream.on("data", function (newFile) {
            should.exist(newFile);

            if (options.deleteInnerText)
                path.extname(newFile.path).should.equal(".html");
            else
                path.extname(newFile.path).should.equal(".js");

            should.exist(newFile.contents);
            String(newFile.contents).should.equal(String(expectedFile.contents));

        });

        stream.on("end", function (data) {
            done();
        });

        stream.write(srcFile);
        stream.end();
    }

});
