"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LanguageParser_1 = require("./LanguageParser");
var lp = new LanguageParser_1.LanguageParser('D:\\Repos\\GitHub\\KonnosPB\\vsc-al-translation\\DemoTranslationFiles\\Med\\');
var result = lp.calcDataGridAsync();
result.then(function (value) {
});
result.catch(function (reason) {
});
//# sourceMappingURL=index.js.map