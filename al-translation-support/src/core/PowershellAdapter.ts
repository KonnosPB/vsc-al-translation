import * as childProcessModule from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { resolve } from 'dns';
import { stdout } from 'process';

function Invoke(psCmd: string, args: string, callback?: (error: childProcessModule.ExecException | null, stdout: string, stderr: string) => void): childProcessModule.ChildProcess {
    const cmd = `PowerShell.exe -ExecutionPolicy Bypass -file "${psCmd}" ${args}`;
    const options: any = {
        shell: true,
        windowsHide: true,
    
    }
    return childProcessModule.exec(cmd, options, callback)
}

function getGetAlDiagnosticsPsScriptPath() {
    var scriptPath = path.join(path.dirname(__filename), "..", "dist", "powershell", "Get-ALDiagnostics.ps1");
    return scriptPath;
}

function GetResultObject(raw: string): any{
    let line = "";
    let jResultObject = "";
    let isResultObject = false;
    for(var i = 0; i < raw.length+1 ; i++) {
        line += raw.charAt(i);
        if (line.endsWith("\r\n")){ 
            let currentline = line.substring(0, line.length-2);
            line = "";            
            if (currentline.startsWith(">>>ResultObject>>>")){
                isResultObject = true;
                currentline = "{";
            }
            if (currentline.startsWith("<<<ResultObject<<<")){
                isResultObject = false;
                currentline = "";
                break;
            }
            if (isResultObject){
                jResultObject += currentline;
            }            
        }        
    };
    const jsonResult = JSON.parse(jResultObject);
    return jsonResult;
}


export async function getAlDiagnostics(alcCompilerPath: string | undefined, alFileToCheck: string, checkGlobalProcedures: boolean, checkApplicationAreaValidity: boolean, validApplicationAreas: string, checkTranslation: boolean): Promise<Array<vscode.Diagnostic>> {
    const powerShellScript = getGetAlDiagnosticsPsScriptPath();
    let args = `-AlcFolderPath "${alcCompilerPath}" -ALFileToCheck "${alFileToCheck}"`;
    if (checkGlobalProcedures){
        args += ` -CheckGlobalProcedures`;
    }
    if (checkApplicationAreaValidity){
        args += ` -CheckApplicationAreaValidity`;
        args += ` -ValidApplicationAreas "${validApplicationAreas}"`;
    }
    if (checkTranslation){
        args += ` -CheckTranslation`;
    }

    var promise = new Promise<any>((resolve, reject) => {
        Invoke(powerShellScript, args, (error, stdout, stderr) => {
            if (error) {
                console.error(`getAlDiagnostics exec error: ${error}`);
                reject(error);
                return;
            }
            if (stdout === "" && stderr !== ""){
                console.error(`getAlDiagnostics outputed error: ${stderr}`);
                reject(stderr);
                return;
            }

            let diagnosticCollection = new Array<vscode.Diagnostic>();
            const jsonResult = GetResultObject(stdout);
            jsonResult.Diagnostics.forEach((jDiagnostic: any) => {
                let startPos : vscode.Position = new vscode.Position(jDiagnostic.StartLinePositionLine, jDiagnostic.StartCharacter);
                let endPos : vscode.Position = new vscode.Position(jDiagnostic.EndLinePositionLine, jDiagnostic.EndCharacter);
                let diagnosticRange = new vscode.Range(startPos, endPos);
                let diagnosticMessage = jDiagnostic.Description;
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
                diagnosticCollection = diagnosticCollection.concat(diagnostic);
            });
            
            resolve(diagnosticCollection);
        });
    });
    return promise;
}