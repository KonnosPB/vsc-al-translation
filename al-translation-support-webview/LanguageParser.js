"use strict";
exports.__esModule = true;
exports.LanguageParser = void 0;
var fs = require("fs");
var path = require("path");
/**
 * Recursively walk a directory asynchronously and obtain all file names (with full path).
 *
 * @param dir Folder name you want to recursively process
 * @param done Callback function, returns all files with full path.
 * @param filter Optional filter to specify which files to include,
 *   e.g. for json files: (f: string) => /.json$/.test(f)
 * @see https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search/50345475#50345475
 */
var walk = function (dir, done, filter) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) {
            return done(err);
        }
        var pending = list.length;
        if (!pending) {
            return done(null, results);
        }
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err2, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err3, res) {
                        if (res) {
                            results = results.concat(res);
                        }
                        if (!--pending) {
                            done(null, results);
                        }
                    }, filter);
                }
                else {
                    if (typeof filter === 'undefined' || (filter && filter(file))) {
                        results.push(file);
                    }
                    if (!--pending) {
                        done(null, results);
                    }
                }
            });
        });
    });
};
var LanguageParser = /** @class */ (function () {
    function LanguageParser(rootDirPath) {
        this.xlfFilePaths = this.collectXlfFiles(rootDirPath);
    }
    LanguageParser.prototype.collectXlfFiles = function (rootDirPath) {
        var result;
        walk(rootDirPath, function (err, list) {
            result = list;
        }, function (file) {
            if (file.endsWith("xlf")) {
                return true;
            }
            return false;
        });
        return result;
    };
    return LanguageParser;
}());
exports.LanguageParser = LanguageParser;
