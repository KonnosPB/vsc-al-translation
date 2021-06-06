import * as vscode from 'vscode';
import * as PowershellAdapter from './PowershellAdapter';

export class ALExtendedCop {
    private ctx: vscode.ExtensionContext;
    private diagnosticMap: Map<string, vscode.Diagnostic[]>;
    private diagnosticCollection: vscode.DiagnosticCollection;
    private checkCommand = "al-extended-cop.checkCommand";
    private alcCompilerPath: string | undefined;
    private checkCommandHandler = () => {
        const currentTextEditor = vscode.window.activeTextEditor;
        this.check(currentTextEditor?.document);
    }

    constructor(ctx: vscode.ExtensionContext) {
        this.ctx = ctx;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('al');
        this.ctx.subscriptions.push(this.diagnosticCollection);
        this.ctx.subscriptions.push(vscode.commands.registerCommand(this.checkCommand, this.checkCommandHandler));
        this.diagnosticMap = new Map();
        this.updateConfigurationData();
    }

    private updateConfigurationData() {
        try {
            let alExtension = vscode.extensions.getExtension('ms-dynamics-smb.al');
            this.alcCompilerPath = alExtension?.extensionPath as string;
        } catch { }
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');        
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.alcPath !== null && workSpaceConfiguration.alcPath !== undefined && workSpaceConfiguration.alcPath !== "") {
            this.alcCompilerPath = workSpaceConfiguration.alcPath;
        }
    }

    public check(textDocument: vscode.TextDocument | undefined) {
        if (!textDocument) {
            return;
        }        
        this.diagnosticCollection.clear();

        this.checkFile(textDocument.fileName);

        this.diagnosticMap.forEach((diags, file) => {
            this.diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
    }

    private checkFile(canonicalFile: string) {
        this.updateConfigurationData();
        PowershellAdapter.getAlDiagnostics(this.alcCompilerPath, canonicalFile)
            .then((jsonResult: any) => {
                console.log("Test");
                //errors.forEach(error => {
                //let canonicalFile = vscode.Uri.file(error.file).toString();
                //let range = new vscode.Range(error.line-1, error.startColumn, error.line-1, error.endColumn);
                let diagnostics = this.diagnosticMap.get(canonicalFile);
                if (!diagnostics) { diagnostics = []; }
                //diagnostics.push(new vscode.Diagnostic(range, error.msg, error.severity));
                this.diagnosticMap.set(canonicalFile, diagnostics);
                //});
            });
    }
}