import * as childProcessModule from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { resolve } from 'dns';
import { stdout } from 'process';

function Invoke(psCmd: string, args: string, callback?: (error: childProcessModule.ExecException | null, stdout: string, stderr: string) => void): childProcessModule.ChildProcess {
    const cmd = `PowerShell.exe -ExecutionPolicy Bypass -file "${psCmd}"  ${args}`;
    const options: any = {
        shell: true,
        windowsHide: true
    }
    return childProcessModule.exec(cmd, options, callback)
}

function getGetAlDiagnosticsPsScriptPath() {
    var scriptPath = path.join(path.dirname(__filename), "..", "dist", "powershell", "Get-ALDiagnostics.ps1");
    return scriptPath;
}

function getDiagnostics(powershellOut: string){

}

export async function getAlDiagnostics(alcCompilerPath: string | undefined, alFileToCheck: string, checkGlobalProcedures: boolean, checkApplicationAreaValidity: boolean, validApplicationAreas: string, checkTranslation: boolean): Promise<Array<vscode.Diagnostic>> {
    const powerShellScript = getGetAlDiagnosticsPsScriptPath();
    let args = '-AlcFolderPath ${alcCompilerPath} -ALFileToCheck ${fileToCheck}';
    if (checkGlobalProcedures){
        args += ' -CheckGlobalProcedures'
    }
    if (checkApplicationAreaValidity){
        args += ' -CheckApplicationAreaValidity'
    }
    if (checkTranslation){
        args += ' -$CheckTranslation'
    }

    var promise = new Promise<any>((resolve, reject) => {
        Invoke(powerShellScript, alFileToCheck, (error, stdout, stderr) => {
            if (error) {
                console.error(`getAlDiagnostics exec error: ${error}`);
                reject(error);
                return;
            }
            const startMarker = ">>>ResultObject>>>";
            const stopMarker = "<<<ResultObject<<<";            
            const startPos = stdout.indexOf(startMarker) + startMarker.length;
            const endPos = stdout.indexOf(stopMarker);
            if (startPos <= startMarker.length || endPos < 0)
            {
                const errorMessage = `Result object not found. Current output from script is ` + stdout;
                console.error(errorMessage);
                reject(errorMessage)
                return
            }
            let diagnosticCollection = new Array<vscode.Diagnostic>();
            const resultString = stdout.substring(startPos, endPos - startPos);
            const jsonResult = JSON.parse(resultString);
            jsonResult.Diagnostics.forEach((jDiagnostic: any) => {
                let diagnosticRange = new vscode.Range(jDiagnostic.SpanStart, jDiagnostic.SpanEnd)
                let diagnosticMessage = jDiagnostic.Description
                let diagnosticSeverity : vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error;                
                switch(jDiagnostic.DiagnosticSeverity){
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
                diagnosticCollection.concat(diagnostic);
            });
            
            resolve(diagnosticCollection);
        });
    });
    return promise;
}