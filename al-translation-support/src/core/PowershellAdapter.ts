import * as childProcessModule from 'child_process';
import * as path from 'path';
import { resolve } from 'dns';
import { stdout } from 'process';

function Invoke(psCmd: string, args: string, callback?: (error: childProcessModule.ExecException | null, stdout: string, stderr: string) => void): childProcessModule.ChildProcess {        
    const cmd = `PowerShell.exe -ExecutionPolicy Bypass -file "${psCmd}"  ${args}`;
    const options:any = {
        shell : true,
        windowsHide : true
    }    
    return childProcessModule.exec(cmd, options, callback)        
}

function getGetAlDiagnosticsPsScriptPath(){
    var scriptPath = path.join(path.dirname(__filename), "..", "dist", "powershell", "Get-ALDiagnostics.ps1");
    //var scriptPath = `D:\\Repos\\GitHub\\KonnosPB\\vsc-al-translation\\al-translation-support\\src\\powershell\\Get-ALDiagnostics.ps1`
    return scriptPath;
}

//export async function getAlDiagnostics(fileToCheck: string, callback?:(execError: childProcessModule.ExecException | null, jsonResult: any)=>void):Promise<any> {    
export async function getAlDiagnostics(fileToCheck: string):Promise<any> {   

    const powerShellScript = getGetAlDiagnosticsPsScriptPath();
    const args = fileToCheck;
    var promise = new Promise<any>((resolve, reject) =>{ 
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
}