"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageParser = void 0;
var fs = require("fs");
var path = require("path");
var xml2js_1 = require("xml2js");
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
        this.fileContentMapping = new Map();
        this.rootDirPath = rootDirPath;
    }
    LanguageParser.prototype.calcDataGridAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.collectXlfFilesAsync(this.rootDirPath)];
                    case 1:
                        _a.xlfFilePaths = _c.sent();
                        _b = this;
                        return [4 /*yield*/, this.loadContentsAsync(this.xlfFilePaths)];
                    case 2:
                        _b.fileContentMapping = _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LanguageParser.prototype.loadContentsAsync = function (xlfFilePaths) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (resolve, reject) {
                    var pathContentMapping = new Map();
                    xlfFilePaths.forEach(function (xlfFilePath) { return __awaiter(_this, void 0, void 0, function () {
                        var xml;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fs.readFileSync(xlfFilePath, "utf8")];
                                case 1:
                                    xml = _a.sent();
                                    (0, xml2js_1.parseString)(xml, { explicitArray: false }, function (error, result) {
                                        if (error != undefined) {
                                            reject(error);
                                        }
                                        pathContentMapping.set(xlfFilePath, result);
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    resolve(pathContentMapping);
                });
                return [2 /*return*/, promise];
            });
        });
    };
    LanguageParser.prototype.getMainXlfFile = function (fileContentMapping) {
        fileContentMapping.forEach(function (value, key) {
            if (key.endsWith("g.xlf")) {
                var json_1 = value;
                // if (json.xliff.file."source-language" == json.xliff.file."target-language"){
                //     return key;
                // }
            }
        });
        return "";
    };
    LanguageParser.prototype.collectXlfFilesAsync = function (rootDirPath) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                promise = new Promise(function (resolve, reject) {
                    walk(rootDirPath, function (err, results) {
                        if (err != null) {
                            reject(err);
                        }
                        if (results != null) {
                            resolve(results);
                        }
                    }, function (f) { return f.endsWith(".xlf"); });
                });
                return [2 /*return*/, promise];
            });
        });
    };
    return LanguageParser;
}());
exports.LanguageParser = LanguageParser;
//# sourceMappingURL=LanguageParser.js.map