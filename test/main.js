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

        it("should generate the translations file", function (done) {
            var expectedFile = new gutil.File({
                path: "test/expected/translations.de.json",
                cwd: "test/",
                base: "test/expected",
                contents: fs.readFileSync("test/expected/translations.de.json")
            });

            testBufferedFile(['de', 'en'], expectedFile, done);
        });

        function testBufferedFile(params, expectedFile, done) {
            var srcFile = new gutil.File({
                path: "test/fixtures/example.html",
                cwd: "test/",
                base: "test/fixtures",
                contents: fs.readFileSync("test/fixtures/example.html")
            });

            var stream = ngTranslate(params);

            stream.on("data", function (newFile) {
                should.exist(newFile);
                path.extname(newFile.path).should.equal(".json");

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
});