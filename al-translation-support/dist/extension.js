/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/core/ALExtendedCop.ts":
/*!***********************************!*\
  !*** ./src/core/ALExtendedCop.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ALExtendedCop = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
const PowershellAdapter = __webpack_require__(/*! ./PowershellAdapter */ "./src/core/PowershellAdapter.ts");
class ALExtendedCop {
    constructor(ctx) {
        this.checkCommand = "al-extended-cop.checkCommand";
        this.checkCommandHandler = () => {
            const currentTextEditor = vscode.window.activeTextEditor;
            this.check(currentTextEditor === null || currentTextEditor === void 0 ? void 0 : currentTextEditor.document);
        };
        this.ctx = ctx;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('al');
        this.ctx.subscriptions.push(this.diagnosticCollection);
        this.ctx.subscriptions.push(vscode.commands.registerCommand(this.checkCommand, this.checkCommandHandler));
        this.diagnosticMap = new Map();
    }
    check(textDocument) {
        if (!textDocument) {
            return;
        }
        this.diagnosticCollection.clear();
        this.checkFile(textDocument.fileName);
        this.diagnosticMap.forEach((diags, file) => {
            this.diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
    }
    checkFile(canonicalFile) {
        PowershellAdapter.getAlDiagnostics(canonicalFile)
            .then((jsonResult) => {
            console.log("Test");
            //errors.forEach(error => {
            //let canonicalFile = vscode.Uri.file(error.file).toString();
            //let range = new vscode.Range(error.line-1, error.startColumn, error.line-1, error.endColumn);
            let diagnostics = this.diagnosticMap.get(canonicalFile);
            if (!diagnostics) {
                diagnostics = [];
            }
            //diagnostics.push(new vscode.Diagnostic(range, error.msg, error.severity));
            this.diagnosticMap.set(canonicalFile, diagnostics);
            //});
        });
    }
}
exports.ALExtendedCop = ALExtendedCop;


/***/ }),

/***/ "./src/core/PowershellAdapter.ts":
/*!***************************************!*\
  !*** ./src/core/PowershellAdapter.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAlDiagnostics = void 0;
const childProcessModule = __webpack_require__(/*! child_process */ "child_process");
const path = __webpack_require__(/*! path */ "path");
function Invoke(psCmd, args, callback) {
    const cmd = `PowerShell.exe -ExecutionPolicy Bypass -file "${psCmd}"  ${args}`;
    const options = {
        shell: true,
        windowsHide: true
    };
    return childProcessModule.exec(cmd, options, callback);
}
function getGetAlDiagnosticsPsScriptPath() {
    var scriptPath = path.join(path.dirname(__filename), "..", "dist", "powershell", "Get-ALDiagnostics.ps1");
    //var scriptPath = `D:\\Repos\\GitHub\\KonnosPB\\vsc-al-translation\\al-translation-support\\src\\powershell\\Get-ALDiagnostics.ps1`
    return scriptPath;
}
//export async function getAlDiagnostics(fileToCheck: string, callback?:(execError: childProcessModule.ExecException | null, jsonResult: any)=>void):Promise<any> {    
function getAlDiagnostics(fileToCheck) {
    return __awaiter(this, void 0, void 0, function* () {
        const powerShellScript = getGetAlDiagnosticsPsScriptPath();
        const args = fileToCheck;
        var promise = new Promise((resolve, reject) => {
            Invoke(powerShellScript, fileToCheck, (error, stdout, stderr) => {
                if (error) {
                    console.error(`getAlDiagnostics exec error: ${error}`);
                    reject(error);
                    return;
                }
                const resultString = stdout;
                const jsonResult = JSON.parse(resultString);
                resolve(jsonResult);
            });
        });
        return promise;
        //   Invoke(powerShellScript, fileToCheck, (error, stdout, stderr) => {
        //     let jsonResult = JSON.parse("{}");
        //     if (error) {
        //       console.error(`getAlDiagnostics exec error: ${error}`);          
        //       callback?.apply(error, jsonResult);  
        //       return;
        //     }
        //     const resultString = stdout;
        //     jsonResult = JSON.parse(resultString);      
        //     //callback?(jsonResult):null;
        //     callback?.apply(error, jsonResult);  
        //   });
    });
}
exports.getAlDiagnostics = getAlDiagnostics;


/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");;

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");;

/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("vscode");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(/*! vscode */ "vscode");
const ALExtendedCop_1 = __webpack_require__(/*! ./core/ALExtendedCop */ "./src/core/ALExtendedCop.ts");
let diagnosticCollection;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let alExendedCop = new ALExtendedCop_1.ALExtendedCop(context);
    //let uri = vscode.Uri.file("D:\\Repos\\GitHub\\KonnosPB\\vsc-al-translation\\al-translation-support\\src\\extension.ts");
    //alExendedCop.check(uri);
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "al-translation-support" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('al-translation-support.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from AL Translation Support!');
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map