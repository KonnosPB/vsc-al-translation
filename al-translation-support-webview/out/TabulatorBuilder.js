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
exports.TabulatorBuilder = void 0;
var LanguageParser_1 = require("./LanguageParser");
var TabulatorBuilder = /** @class */ (function () {
    function TabulatorBuilder(rootDirPath) {
        this.rootDirPath = rootDirPath;
    }
    TabulatorBuilder.prototype.buildAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var languageParser, tableData, table, _a, _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        languageParser = new LanguageParser_1.LanguageParser(this.rootDirPath);
                        return [4 /*yield*/, languageParser.buildDataAsync()];
                    case 1:
                        tableData = _d.sent();
                        _a = Tabulator.bind;
                        _b = [void 0, "#example-table"];
                        _c = {};
                        return [4 /*yield*/, languageParser.buildDataAsync()];
                    case 2:
                        table = new (_a.apply(Tabulator, _b.concat([(_c.data = _d.sent(),
                                _c.layout = "fitColumns",
                                _c.responsiveLayout = "hide",
                                _c.tooltips = true,
                                _c.addRowPos = "top",
                                _c.history = true,
                                _c.pagination = "local",
                                _c.paginationSize = 50,
                                _c.movableColumns = true,
                                _c.resizableRows = true,
                                _c.initialSort = [
                                    { column: "name", dir: "asc" },
                                ],
                                _c.columns = [
                                    { title: "Status", field: "languageParser", editor: "input" },
                                    { title: "Source (main)", field: "SourceText", hozAlign: "left", formatter: "progress", editor: true },
                                    { title: "Source", field: "SourceCopyText", width: 95, editor: "select", editorParams: { values: ["male", "female"] } },
                                    { title: "Target", field: "TargetText", formatter: "star", hozAlign: "center", width: 100, editor: true },
                                    { title: "State", field: "state", width: 130, editor: "input" },
                                    { title: "Object", field: "NavObject", width: 130, sorter: "date", hozAlign: "center" },
                                    { title: "Element", field: "NavElement", width: 90, hozAlign: "center", formatter: "tickCross", sorter: "boolean", editor: true },
                                    { title: "Subelement", field: "NavSubelement", width: 90, hozAlign: "center", formatter: "tickCross", sorter: "boolean", editor: true },
                                    { title: "Comment", field: "NavComment", width: 90, hozAlign: "center", formatter: "tickCross", sorter: "boolean", editor: true },
                                ],
                                _c)])))();
                        return [2 /*return*/];
                }
            });
        });
    };
    return TabulatorBuilder;
}());
exports.TabulatorBuilder = TabulatorBuilder;
//# sourceMappingURL=TabulatorBuilder.js.map