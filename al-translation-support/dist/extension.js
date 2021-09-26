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
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('al-extended-cops');
        this.ctx.subscriptions.push(this.diagnosticCollection);
        this.ctx.subscriptions.push(vscode.commands.registerCommand(this.checkCommand, this.checkCommandHandler));
        this.diagnosticMap = new Map();
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.fileName.endsWith("al")) {
                this.check(document);
            }
        });
        vscode.workspace.onDidChangeTextDocument(evt => {
            //this.check(evt.document), undefined, this.ctx.subscriptions
            this.check(evt.document);
        });
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
            this.diagnosticCollection.delete(textDocument.uri);
        }, null, this.ctx.subscriptions);
        vscode.workspace.onDidSaveTextDocument(document => {
            this.check(document);
        });
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.check(editor.document);
            }
        }, undefined, this.ctx.subscriptions);
        vscode.workspace.textDocuments.forEach(document => {
            this.check(document);
        });
    }
    getALCCompilerPath() {
        let alcCompilerPath = "";
        try {
            let alExtension = vscode.extensions.getExtension('ms-dynamics-smb.al');
            alcCompilerPath = alExtension === null || alExtension === void 0 ? void 0 : alExtension.extensionPath;
        }
        catch (_a) { }
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.alcPath !== null && workSpaceConfiguration.alcPath !== undefined && workSpaceConfiguration.alcPath !== "") {
            alcCompilerPath = workSpaceConfiguration.alcPath;
        }
        return alcCompilerPath;
    }
    getCheckGlobalProcedures() {
        let checkGlobalProcedures = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkGlobalProcedures !== null && workSpaceConfiguration.checkGlobalProcedures !== undefined && workSpaceConfiguration.checkGlobalProcedures === false) {
            checkGlobalProcedures = false;
        }
        return checkGlobalProcedures;
    }
    getCheckApplicationAreaValidity() {
        let checkApplicationAreaValidity = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkApplicationAreaValidity !== null && workSpaceConfiguration.checkApplicationAreaValidity !== undefined && workSpaceConfiguration.checkApplicationAreaValidity === false) {
            checkApplicationAreaValidity = false;
        }
        return checkApplicationAreaValidity;
    }
    getTranslation() {
        let checkTranslation = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkTranslation !== null && workSpaceConfiguration.checkTranslation !== undefined && workSpaceConfiguration.checkTranslation === false) {
            checkTranslation = false;
        }
        return checkTranslation;
    }
    getValidApplicationAreas() {
        let validApplicationAreas = "";
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.validApplicationAreas !== null && workSpaceConfiguration.validApplicationAreas !== undefined && workSpaceConfiguration.validApplicationAreas !== "") {
            validApplicationAreas = workSpaceConfiguration.validApplicationAreas;
        }
        return validApplicationAreas;
    }
    getUri(fileName) {
        //let path = fileName.split('\\')?.pop()?.split('/').pop() as string;        
        let uri = vscode.Uri.parse(fileName, true);
        return uri;
    }
    check(textDocument) {
        if (!textDocument) {
            return;
        }
        const alcCompilerPath = this.getALCCompilerPath();
        const checkGlobalProcedures = this.getCheckGlobalProcedures();
        // const validApplicationAreas: string = this.getValidApplicationAreas();
        // const checkApplicationAreaValidity: boolean = this.getCheckApplicationAreaValidity();
        const checkTranslation = this.getTranslation();
        PowershellAdapter.getAlDiagnostics(alcCompilerPath, textDocument.fileName, checkTranslation)
            .then((diagnostics) => {
            //this.diagnosticCollection.delete(this.getUri(canonicalFile));
            this.diagnosticCollection.set(textDocument.uri, diagnostics);
            // this.diagnosticMap.set(canonicalFile, diagnostics);
            // this.diagnosticMap.forEach((diags, file) => {                    
            //     this.diagnosticCollection.set(this.getUri(file), diags);
            // });
        }).catch((reason) => {
            this.diagnosticCollection.clear();
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
const vscode = __webpack_require__(/*! vscode */ "vscode");
function Invoke(psCmd, args, callback) {
    const cmd = `PowerShell.exe -ExecutionPolicy Bypass -file "${psCmd}" ${args}`;
    const options = {
        shell: true,
        windowsHide: true,
    };
    return childProcessModule.exec(cmd, options, callback);
}
function getGetAlDiagnosticsPsScriptPath() {
    var scriptPath = path.join(path.dirname(__filename), "..", "dist", "powershell", "Get-ALDiagnostics.ps1");
    return scriptPath;
}
function GetResultObject(raw) {
    let line = "";
    let jResultObject = "";
    let isResultObject = false;
    for (var i = 0; i < raw.length + 1; i++) {
        line += raw.charAt(i);
        if (line.endsWith("\r\n")) {
            let currentline = line.substring(0, line.length - 2);
            line = "";
            if (currentline.startsWith(">>>")) {
                isResultObject = true;
                currentline = "{";
            }
            if (currentline.startsWith("<<<")) {
                isResultObject = false;
                currentline = "";
                break;
            }
            if (isResultObject) {
                jResultObject += currentline;
            }
        }
    }
    ;
    const jsonResult = JSON.parse(jResultObject);
    return jsonResult;
}
function getAlDiagnostics(alcCompilerPath, alFileToCheck, checkTranslation) {
    return __awaiter(this, void 0, void 0, function* () {
        const powerShellScript = getGetAlDiagnosticsPsScriptPath();
        let args = `-AlcFolderPath "${alcCompilerPath}" -ALFileToCheck "${alFileToCheck}"`;
        if (checkTranslation) {
            args += ` -CheckTranslation`;
        }
        var promise = new Promise((resolve, reject) => {
            Invoke(powerShellScript, args, (error, stdout, stderr) => {
                if (error) {
                    console.error(`getAlDiagnostics exec error: ${error}`);
                    reject(error);
                    return;
                }
                if (stdout === "" && stderr !== "") {
                    console.error(`getAlDiagnostics outputed error: ${stderr}`);
                    reject(stderr);
                    return;
                }
                let diagnosticCollection = new Array();
                const jsonResult = GetResultObject(stdout);
                jsonResult.Diagnostics.forEach((jDiagnostic) => {
                    let startPos = new vscode.Position(jDiagnostic.StartLinePositionLine, jDiagnostic.StartCharacter);
                    let endPos = new vscode.Position(jDiagnostic.EndLinePositionLine, jDiagnostic.EndCharacter);
                    let diagnosticRange = new vscode.Range(startPos, endPos);
                    let diagnosticMessage = jDiagnostic.Description;
                    let diagnosticSeverity = vscode.DiagnosticSeverity.Error;
                    switch (jDiagnostic.DiagnosticSeverity) {
                        case "Error": {
                            diagnosticSeverity = vscode.DiagnosticSeverity.Error;
                            break;
                        }
                        case "Hidden": {
                            diagnosticSeverity = vscode.DiagnosticSeverity.Hint;
                            break;
                        }
                        case "Info": {
                            diagnosticSeverity = vscode.DiagnosticSeverity.Information;
                            break;
                        }
                        case "Warning": {
                            diagnosticSeverity = vscode.DiagnosticSeverity.Warning;
                            break;
                        }
                    }
                    let diagnostic = new vscode.Diagnostic(diagnosticRange, diagnosticMessage, diagnosticSeverity);
                    diagnosticCollection = diagnosticCollection.concat(diagnostic);
                });
                resolve(diagnosticCollection);
            });
        });
        return promise;
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
let alExendedCop;
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
function onChange() {
    const currentTextEditor = vscode.window.activeTextEditor;
    alExendedCop.check(currentTextEditor === null || currentTextEditor === void 0 ? void 0 : currentTextEditor.document);
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map