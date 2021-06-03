"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlDiagnostics = void 0;
const childProcessModule = require("child_process");
const path = require("path");
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
//# sourceMappingURL=PowershellAdapter.js.map