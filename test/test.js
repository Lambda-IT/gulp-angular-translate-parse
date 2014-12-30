"use strict";

var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var savefile = require('gulp-savefile');
var ngTranslate = require("../");

function testBufferedFile(params, expectedFile, done) {

    // ignore null files
    var stream = ngTranslate(params);
    //stream
    //  .pipe(function (file) { if (file.length != 0) throw "0 length expected"; });

    stream.on('error', function (err) {
        console.log(err);
    });

    stream.on('data', function (data) {
        console.log("data");
    });

    stream.on('end', function (data) {
        console.log("end");
    });

    stream.write(new gutil.File());
    stream.end();

    // handle one file
    var srcFile = new gutil.File({
        path: "test/fixtures/example.html",
        cwd: "test/",
        base: "test",
        contents: fs.readFileSync("test/fixtures/example.html")
    });

    var options = {
        defaultLang: 'de',
        moduleName: 'Translations',
        deleteInnerText: false
    };
    var stream = ngTranslate(params, options);

    stream.pipe(savefile());

    stream.on("data", function (newFile) {
        if (path.extname(newFile.path) === ".js" && newFile.contents) {
            done();
        }
        else
            throw "new file not ok!";
    });

    stream.write(srcFile);
    stream.end();

    // remove text in html and return html
    options.deleteInnerText = true;

    var htmlStream = ngTranslate(params, options);

    //htmlStream.pipe(savefile());

    htmlStream.on("data", function (newFile) {
        if (path.extname(newFile.path) === ".html" && newFile.contents) {
            done();
        }
        else
            throw "new file not ok!";

        newFile.path = "test/expected/example.html";
    });

    htmlStream.write(srcFile);
    htmlStream.end();
}

//var expectedFile = new gutil.File({
//    path: "test/expected/example.js",
//    cwd: "test/",
//    base: "test/expected",
//    contents: fs.readFileSync("test/expected/example.js")
//});

function done() {
    console.log("done");
}

testBufferedFile(['de', 'en'], null, done);