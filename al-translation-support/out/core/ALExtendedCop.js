"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALExtendedCop = void 0;
const vscode = require("vscode");
const PowershellAdapter = require("./PowershellAdapter");
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
//# sourceMappingURL=ALExtendedCop.js.map