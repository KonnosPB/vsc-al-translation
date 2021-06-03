"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const ALExtendedCop_1 = require("./core/ALExtendedCop");
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
//# sourceMappingURL=extension.js.map