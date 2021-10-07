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
        this.languageFileInfo = [];
        this.xlfFilePaths = [];
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
                        return [4 /*yield*/, this.buildLanguageInfos(this.xlfFilePaths)];
                    case 2:
                        _b.languageFileInfo = _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LanguageParser.prototype.getLanguagesAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var languages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.isDirtyAsync()];
                    case 1:
                        if (!_a.sent()) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.calcDataGridAsync()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        languages = [];
                        this.languageFileInfo.forEach(function (element) {
                            languages.push(element.LanguageCode);
                        });
                        return [2 /*return*/, languages];
                }
            });
        });
    };
    LanguageParser.prototype.buildDataAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sourceDataArr, targetDataArr;
            var _this = this;
            return __generator(this, function (_a) {
                sourceDataArr = [];
                targetDataArr = [];
                this.data = [];
                this.languageFileInfo.filter(function (sourceLanguageInfo) {
                    return sourceLanguageInfo.IsMain;
                }).forEach(function (sourceLanguageInfo) {
                    var jSourceContent = sourceLanguageInfo.jContent;
                    var jSourceTransUnitArr = jSourceContent.xliff.file.body.group["trans-unit"];
                    jSourceTransUnitArr.forEach(function (jSourceTransUnit) {
                        var sourceDataObj = _this.convert(sourceLanguageInfo.LanguageCode, jSourceTransUnit);
                        sourceDataArr.push(sourceDataObj);
                    });
                });
                this.languageFileInfo.filter(function (targetLanguageInfos) {
                    return !targetLanguageInfos.IsMain;
                }).forEach(function (targetLanguageInfo) {
                    var jTargetContent = targetLanguageInfo.jContent;
                    var jTargetTransUnitArr = jTargetContent.xliff.file.body.group["trans-unit"];
                    jTargetTransUnitArr.forEach(function (jTargettTransUnit) {
                        var targetDataobj = _this.convert(targetLanguageInfo.LanguageCode, jTargettTransUnit);
                        targetDataArr.push(targetDataobj);
                    });
                });
                sourceDataArr.forEach(function (sourceData) {
                    sourceData.Handled = true;
                    var matchingTargetData = targetDataArr.find(function (targetData) {
                        return targetData.Handled === false && sourceData.Id === targetData.Id;
                    });
                    if (matchingTargetData !== undefined) {
                        matchingTargetData.Handled = true;
                        var merge = {
                            Id: sourceData.Id,
                            SourceLanguageCode: sourceData.SourceLanguageCode,
                            TargetLanguageCode: matchingTargetData.SourceLanguageCode,
                            OverallStatus: "",
                            SourceText: sourceData.SourceText,
                            SourceCopyText: matchingTargetData.SourceText,
                            State: matchingTargetData.State,
                            TargetText: matchingTargetData.TargetText,
                            NavComment: sourceData.NavComment,
                            NavObject: sourceData.NavObject,
                            NavElement: sourceData.NavElement,
                            NavSubelement: sourceData.NavSubelement,
                            Handled: false
                        };
                        _this.data.push(merge);
                    }
                    else {
                        var merge = {
                            Id: sourceData.Id,
                            SourceLanguageCode: sourceData.SourceLanguageCode,
                            TargetLanguageCode: "",
                            OverallStatus: "",
                            SourceText: "",
                            SourceCopyText: "",
                            State: "",
                            TargetText: sourceData.TargetText,
                            NavComment: sourceData.NavComment,
                            NavObject: sourceData.NavObject,
                            NavElement: sourceData.NavElement,
                            NavSubelement: sourceData.NavSubelement,
                            Handled: false
                        };
                        _this.data.push(merge);
                    }
                });
                targetDataArr.filter(function (targetData) {
                    return targetData.Handled === false;
                }).forEach(function (targetData) {
                    targetData.Handled = true;
                    var merge = {
                        Id: targetData.Id,
                        SourceLanguageCode: targetData.SourceLanguageCode,
                        TargetLanguageCode: targetData.SourceLanguageCode,
                        OverallStatus: "",
                        SourceText: "",
                        SourceCopyText: targetData.SourceText,
                        State: targetData.State,
                        TargetText: targetData.TargetText,
                        NavComment: targetData.NavComment,
                        NavObject: targetData.NavObject,
                        NavElement: targetData.NavElement,
                        NavSubelement: targetData.NavSubelement,
                        Handled: false
                    };
                    _this.data.push(merge);
                });
                return [2 /*return*/, this.data];
            });
        });
    };
    LanguageParser.prototype.getDiagnosticsAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var diagnostics;
            var _this = this;
            return __generator(this, function (_a) {
                diagnostics = [];
                this.data.forEach(function (data) { return __awaiter(_this, void 0, void 0, function () {
                    var partDiagnostics;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.getDiagnosticAsync(data)];
                            case 1:
                                partDiagnostics = _a.sent();
                                diagnostics.concat(partDiagnostics);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/, diagnostics];
            });
        });
    };
    LanguageParser.prototype.getDiagnosticAsync = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var diagnostics, diagnostic, diagnostic, sourcePlaceHolderMatchArr, targetPlaceHolderMatchArr, diagnostic, counter_1;
            return __generator(this, function (_a) {
                diagnostics = [];
                if (data.SourceText !== data.SourceCopyText) {
                    data.OverallStatus = "Error";
                    diagnostic = {
                        ErrorCode: 'TRANSLATE-0001',
                        Severity: "error",
                        Id: data.Id,
                        Message: "Source text of " + data.TargetLanguageCode + " not up to date"
                    };
                    diagnostics.push(diagnostic);
                }
                ;
                if (data.SourceText !== "" && data.TargetText === "") {
                    data.OverallStatus = "Error";
                    diagnostic = {
                        ErrorCode: 'TRANSLATE-0002',
                        Severity: "error",
                        Id: data.Id,
                        Message: "Translation of " + data.SourceText + " in " + data.TargetLanguageCode + " language file missing"
                    };
                    diagnostics.push(diagnostic);
                }
                else {
                    sourcePlaceHolderMatchArr = data.SourceText.match(/%\d+/);
                    targetPlaceHolderMatchArr = data.TargetText.match(/%\d+/);
                    if (sourcePlaceHolderMatchArr !== null && targetPlaceHolderMatchArr !== null) {
                        if (sourcePlaceHolderMatchArr.length != targetPlaceHolderMatchArr.length) {
                            data.OverallStatus = "Warning";
                            diagnostic = {
                                ErrorCode: 'TRANSLATE-0003',
                                Severity: "error",
                                Id: data.Id,
                                Message: "Mismatch of placeholders amount between source (" + sourcePlaceHolderMatchArr.length + ") and target (" + targetPlaceHolderMatchArr.length + "). "
                            };
                            diagnostics.push(diagnostic);
                        }
                        ;
                    }
                    if (sourcePlaceHolderMatchArr !== null) {
                        counter_1 = 0;
                        sourcePlaceHolderMatchArr.forEach(function (m) {
                            counter_1++;
                            var expectedPlaceHolderIndex = "%" + counter_1;
                            if (m !== expectedPlaceHolderIndex) {
                                var diagnostic = {
                                    ErrorCode: 'TRANSLATE-0004',
                                    Severity: "warning",
                                    Id: data.Id,
                                    Message: "Placeholder " + m + " not " + expectedPlaceHolderIndex + " as expected"
                                };
                            }
                        });
                    }
                }
                return [2 /*return*/, diagnostics];
            });
        });
    };
    LanguageParser.prototype.convert = function (languageCode, jTransUnit) {
        var sourceId = jTransUnit.$.id;
        var noteArrOrObj = jTransUnit.note;
        var navComment = "";
        var navObject = "";
        var navElement = "";
        var navSubelement = "";
        var state = "";
        if (noteArrOrObj.$ !== undefined && noteArrOrObj.$["from"] === "Xliff Generator") {
            navComment = noteArrOrObj._;
        }
        else {
            var sourceNode = noteArrOrObj.find(function (sourceNode) {
                var from = sourceNode.$["from"];
                if (from === "Xliff Generator") {
                    return true;
                }
                return false;
            });
            navComment = sourceNode._;
        }
        var splittedNavComments = this.extractNavComment(navComment);
        navObject = splittedNavComments.objectName;
        navElement = splittedNavComments.element;
        navSubelement = splittedNavComments.subelement;
        var source = jTransUnit.source;
        var target = "";
        if (jTransUnit.target !== undefined) {
            state = jTransUnit.target.$["state"];
            target = jTransUnit.target._;
        }
        var datasource = {
            Id: sourceId,
            SourceCopyText: "",
            SourceLanguageCode: languageCode,
            SourceText: source,
            TargetText: target,
            NavComment: navComment,
            NavSubelement: navSubelement,
            NavElement: navElement,
            NavObject: navObject,
            TargetLanguageCode: "",
            OverallStatus: "",
            State: state,
            Handled: false
        };
        return datasource;
    };
    LanguageParser.prototype.extractNavComment = function (navComment) {
        var matches = navComment.split(/ - \w+ /, 3);
        if (matches.length < 1) {
            return null;
        }
        var firstPart = matches[0].trimStart();
        var objNameEndIndex = firstPart.indexOf(" ");
        var objName = firstPart.substring(objNameEndIndex).trim();
        if (matches.length < 2) {
            return { objectName: objName, element: "", subelement: "" };
        }
        var elem = matches[1].trim();
        if (matches.length < 3) {
            return { objectName: objName, element: elem, subelement: "" };
        }
        var subElem = matches[2].trim();
        return { objectName: objName, element: elem, subelement: subElem };
    };
    LanguageParser.prototype.isDirtyAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, fileFound, modifiedDateChanged;
                    var _this = this;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = this;
                                return [4 /*yield*/, this.collectXlfFilesAsync(this.rootDirPath)];
                            case 1:
                                _a.xlfFilePaths = _b.sent();
                                if (this.languageFileInfo.length !== this.xlfFilePaths.length) {
                                    resolve(true);
                                }
                                fileFound = false;
                                modifiedDateChanged = false;
                                this.xlfFilePaths.forEach(function (filePath) {
                                    fileFound = false;
                                    modifiedDateChanged = false;
                                    _this.languageFileInfo.forEach(function (elem) {
                                        if (filePath === elem.Path) {
                                            fileFound = true;
                                            fs.stat(filePath, function (err, stats) {
                                                if (stats.mtime !== elem.ModifiedDate) {
                                                    modifiedDateChanged = true;
                                                }
                                            });
                                        }
                                    });
                                    if (!fileFound) {
                                        resolve(true);
                                    }
                                    if (modifiedDateChanged) {
                                        resolve(true);
                                    }
                                });
                                resolve(false);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/, promise];
            });
        });
    };
    LanguageParser.prototype.buildLanguageInfos = function (xlfFilePaths) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (resolve, reject) {
                    var languageFileInfos = [];
                    xlfFilePaths.forEach(function (filePath) { return __awaiter(_this, void 0, void 0, function () {
                        var xml;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fs.readFileSync(filePath, "utf8")];
                                case 1:
                                    xml = _a.sent();
                                    (0, xml2js_1.parseString)(xml, { explicitArray: false }, function (error, jObj) {
                                        if (error != undefined) {
                                            reject(error);
                                        }
                                        if (jObj !== undefined) {
                                            var targetLanguage_1 = jObj.xliff.file.$['target-language'];
                                            var sourceLanguage = jObj.xliff.file.$['source-language'];
                                            var isMain_1 = targetLanguage_1 === sourceLanguage;
                                            fs.stat(filePath, function (err, stats) {
                                                var modifiedDate = stats.mtime;
                                                var languageInfo = {
                                                    Path: filePath,
                                                    jContent: jObj,
                                                    LanguageCode: targetLanguage_1,
                                                    IsMain: isMain_1,
                                                    ModifiedDate: modifiedDate
                                                };
                                                languageFileInfos.push(languageInfo);
                                            });
                                        }
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    resolve(languageFileInfos);
                });
                return [2 /*return*/, promise];
            });
        });
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