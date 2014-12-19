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

    });

    function testBufferedFile(params, options, expectedFile, done) {
        var srcFile = new gutil.File({
            path: "test/fixtures/example.html",
            cwd: "test/",
            base: "test/fixtures",
            contents: fs.readFileSync("test/fixtures/example.html")
        });

        var stream = ngTranslate(params, options);

        stream.on("data", function (newFile) {
            should.exist(newFile);
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