import * as vscode from 'vscode';
import * as PowershellAdapter from './PowershellAdapter';

export class ALExtendedCop {
    private ctx: vscode.ExtensionContext;
    private diagnosticMap: Map<string, vscode.Diagnostic[]>;
    private diagnosticCollection: vscode.DiagnosticCollection;
    private checkCommand = "al-extended-cop.checkCommand";

    private checkCommandHandler = () => {
        const currentTextEditor = vscode.window.activeTextEditor;
        this.check(currentTextEditor?.document);
    }

    constructor(ctx: vscode.ExtensionContext) {
        this.ctx = ctx;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('al-extended-cops');
        this.ctx.subscriptions.push(this.diagnosticCollection);
        this.ctx.subscriptions.push(vscode.commands.registerCommand(this.checkCommand, this.checkCommandHandler));
        this.diagnosticMap = new Map();

        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.fileName.endsWith("al")){
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
            this.check(document)
        });
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.check(editor.document);
            }
        }, undefined, this.ctx.subscriptions);
        vscode.workspace.textDocuments.forEach(document=> {             
            this.check(document);
        });
    }

    private getALCCompilerPath(): string {
        let alcCompilerPath: string = "";
        try {
            let alExtension = vscode.extensions.getExtension('ms-dynamics-smb.al');
            alcCompilerPath = alExtension?.extensionPath as string;
        } catch { }
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.alcPath !== null && workSpaceConfiguration.alcPath !== undefined && workSpaceConfiguration.alcPath !== "") {
            alcCompilerPath = workSpaceConfiguration.alcPath;
        }
        return alcCompilerPath;
    }

    private getCheckGlobalProcedures(): boolean {
        let checkGlobalProcedures: boolean = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkGlobalProcedures !== null && workSpaceConfiguration.checkGlobalProcedures !== undefined && workSpaceConfiguration.checkGlobalProcedures === false) {
            checkGlobalProcedures = false;
        }
        return checkGlobalProcedures;
    }

    private getCheckApplicationAreaValidity(): boolean {
        let checkApplicationAreaValidity: boolean = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkApplicationAreaValidity !== null && workSpaceConfiguration.checkApplicationAreaValidity !== undefined && workSpaceConfiguration.checkApplicationAreaValidity === false) {
            checkApplicationAreaValidity = false;
        }
        return checkApplicationAreaValidity;
    }

    private getTranslation(): boolean {
        let checkTranslation: boolean = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkTranslation !== null && workSpaceConfiguration.checkTranslation !== undefined && workSpaceConfiguration.checkTranslation === false) {
            checkTranslation = false;
        }
        return checkTranslation;
    }

    private getValidApplicationAreas(): string {
        let validApplicationAreas: string = "";
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.validApplicationAreas !== null && workSpaceConfiguration.validApplicationAreas !== undefined && workSpaceConfiguration.validApplicationAreas !== "") {
            validApplicationAreas = workSpaceConfiguration.validApplicationAreas;
        }
        return validApplicationAreas;
    }

    private getUri(fileName:string): vscode.Uri {
        //let path = fileName.split('\\')?.pop()?.split('/').pop() as string;        
        let uri =  vscode.Uri.parse(fileName, true);
        return uri;
    }

    public check(textDocument: vscode.TextDocument | undefined) {
        if (!textDocument) {
            return;
        }        
        const alcCompilerPath: string = this.getALCCompilerPath();
        const checkGlobalProcedures: boolean = this.getCheckGlobalProcedures();
        // const validApplicationAreas: string = this.getValidApplicationAreas();
        // const checkApplicationAreaValidity: boolean = this.getCheckApplicationAreaValidity();
        const checkTranslation: boolean = this.getTranslation();
        PowershellAdapter.getAlDiagnostics(
            alcCompilerPath,
            textDocument.fileName,
            checkTranslation
        )
            .then((diagnostics: Array<vscode.Diagnostic>) => {
                
                //this.diagnosticCollection.delete(this.getUri(canonicalFile));
                this.diagnosticCollection.set(textDocument.uri, diagnostics);
                // this.diagnosticMap.set(canonicalFile, diagnostics);
                // this.diagnosticMap.forEach((diags, file) => {                    
                //     this.diagnosticCollection.set(this.getUri(file), diags);
                // });
            }).catch((reason)=> {
                this.diagnosticCollection.clear();
            });
    }
}
