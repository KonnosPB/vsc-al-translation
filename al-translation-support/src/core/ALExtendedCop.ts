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
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('al');
        this.ctx.subscriptions.push(this.diagnosticCollection);
        this.ctx.subscriptions.push(vscode.commands.registerCommand(this.checkCommand, this.checkCommandHandler));
        this.diagnosticMap = new Map();
    }

    public check(textDocument: vscode.TextDocument | undefined) {
        if (!textDocument) {
            return;
        }        
        this.diagnosticCollection.clear();

        this.checkFile(textDocument.fileName);
    }

    private getALCCompilerPath(): string{
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

    private getCheckGlobalProcedures(): boolean{
        let checkGlobalProcedures: boolean = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');        
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkGlobalProcedures !== null && workSpaceConfiguration.checkGlobalProcedures !== undefined && workSpaceConfiguration.checkGlobalProcedures === false) {
            checkGlobalProcedures = false;
        }
        return checkGlobalProcedures;
    }

    private getCheckApplicationAreaValidity(): boolean{
        let checkApplicationAreaValidity: boolean = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');        
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkApplicationAreaValidity !== null && workSpaceConfiguration.checkApplicationAreaValidity !== undefined && workSpaceConfiguration.checkApplicationAreaValidity === false) {
            checkApplicationAreaValidity = false;
        }
        return checkApplicationAreaValidity;
    }

    private getTranslation(): boolean{
        let checkTranslation: boolean = true;
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');        
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.checkTranslation !== null && workSpaceConfiguration.checkTranslation !== undefined && workSpaceConfiguration.checkTranslation === false) {
            checkTranslation = false;
        }
        return checkTranslation;
    }

    private getValidApplicationAreas(): string{
        let validApplicationAreas: string = "";
        let workSpaceConfiguration = vscode.workspace.getConfiguration('kvs');        
        if (workSpaceConfiguration !== null && workSpaceConfiguration !== undefined && workSpaceConfiguration.validiApplicationAreas !== null && workSpaceConfiguration.validiApplicationAreas !== undefined && workSpaceConfiguration.validiApplicationAreas === false) {
            validApplicationAreas = workSpaceConfiguration.validiApplicationAreas;
        }
        return validApplicationAreas;
    }

    private checkFile(canonicalFile: string) {        
        const alcCompilerPath: string = this.getALCCompilerPath();
        const checkGlobalProcedures: boolean = this.getCheckGlobalProcedures();
        const validApplicationAreas: string = this.getValidApplicationAreas();
        const checkApplicationAreaValidity: boolean = this.getCheckApplicationAreaValidity();
        const checkTranslation: boolean = this.getTranslation();

        PowershellAdapter.getAlDiagnostics(
            alcCompilerPath, 
            canonicalFile, 
            checkGlobalProcedures, 
            checkApplicationAreaValidity, 
            validApplicationAreas, 
            checkTranslation
            )
            .then((diagnostics: Array<vscode.Diagnostic>) => {
                console.log("Test");
                this.diagnosticMap.set(canonicalFile, diagnostics);                
                this.diagnosticMap.forEach((diags, file) => {
                    this.diagnosticCollection.set(vscode.Uri.parse(file), diags);
                });
            });
    }
}