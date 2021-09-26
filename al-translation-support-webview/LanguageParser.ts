import * as fs from 'fs';
import * as path from 'path';
import { json } from 'stream/consumers';
import { parseString, Builder } from "xml2js";


/**
 * Recursively walk a directory asynchronously and obtain all file names (with full path).
 *
 * @param dir Folder name you want to recursively process
 * @param done Callback function, returns all files with full path.
 * @param filter Optional filter to specify which files to include, 
 *   e.g. for json files: (f: string) => /.json$/.test(f)
 * @see https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search/50345475#50345475
 */
const walk = (
    dir: string,
    done: (err: Error | null, results?: string[]) => void,
    filter?: (f: string) => boolean
) => {
    let results: string[] = [];
    fs.readdir(dir, (err: Error, list: string[]) => {
        if (err) {
            return done(err);
        }
        let pending = list.length;
        if (!pending) {
            return done(null, results);
        }
        list.forEach((file: string) => {
            file = path.resolve(dir, file);
            fs.stat(file, (err2, stat) => {
                if (stat && stat.isDirectory()) {
                    walk(file, (err3, res) => {
                        if (res) {
                            results = results.concat(res);
                        }
                        if (!--pending) {
                            done(null, results);
                        }
                    }, filter);
                } else {
                    if (typeof filter === 'undefined' || (filter && filter(file))) {
                        results.push(file);
                    }
                    if (!--pending) {
                        done(null, results);
                    }
                }
            });
        });
    });
};

interface LanguageFileInfo {
    Path : string;
    jContent: any;
    Language: string;
    IsMain: boolean;
}

export class LanguageParser {
    private rootDirPath: string;
    private languageFileInfo : LanguageFileInfo[];
    private mainXlfFilePath: string;
    private xlfFilePaths: string[];
    private availableLanguages: string[];    

    constructor(rootDirPath: string) {
        this.rootDirPath = rootDirPath;    
    }

    public async calcDataGridAsync() {                
        this.xlfFilePaths = await this.collectXlfFilesAsync(this.rootDirPath);


        var promise = new Promise<string[]>(async (resolve, reject) => {
            walk(this.rootDirPath,
                (err: Error | null, results?: string[]) => {
                    if (err != null) {
                        reject(err);
                    }
                    if (results != null) {
                        var languageFileInfo : ILanguageFileInfo[] = [];
                        results.forEach(async filePath => {                            
                            const xml = await fs.readFileSync(filePath, "utf8");
                            parseString(xml,
                            { explicitArray: false },
                            function (error, jObj) {
                                if (error != undefined) {
                                    reject(error);                            
                                }        
                                if (jObj !== undefined) {
                                    const targetLanguage = jObj.xliff.file.$['target-language'];
                                    const sourceLanguage = jObj.xliff.file.$['source-language'];
                                    const isMain = targetLanguage === sourceLanguage;
                                    var languageInfo : ILanguageFileInfo = {    
                                        Path : filePath,
                                        jContent: jObj,
                                        Language: targetLanguage,
                                        IsMain: isMain
                                    };
                                    languageFileInfo.push(languageInfo);
                                }
                            });                                  
                        });                        
                        resolve(languageFileInfo);
                    }
                },
                (f: string) => { return f.endsWith(".xlf"); }
            );
        });
        return promise;
        
        this.fileContentMapping = await this.loadContentsAsync(this.xlfFilePaths);   
        this.availableLanguages = this.determineLanguages(this.fileContentMapping);                    
    }

    private determineLanguages(fileContentMapping: Map<string, any>):string[]{
        let languages : string[] = [];
        fileContentMapping.forEach((value,key)=>{
            const json = value;                        
            const langVal =  json.xliff.file.$['target-language'];            
            if (langVal != undefined){
                languages.push(langVal);  
            }          
        });
        return languages;
    }

    private getMainXlf(fileContentMapping: Map<string, any>):{[path: string]: [language:string]}{
        let languages : string[] = [];
        fileContentMapping.forEach((value,key)=>{
            const json = value;                        
            const sourceLangVal =  json.xliff.file.$['target-language'];            
            const targetLangVal =  json.xliff.file.$['target-language'];            
            if (sourceLangVal != undefined && targetLangVal != undefined && targetLangVal === sourceLangVal){
                let result: {
                        path : "$(key)",
                        language : "$(targetLangVal)",
                    }
                return result;
            }          
        });
        return null;
    }

    private async loadContentsAsync(xlfFilePaths: string[]): Promise<Map<string, any>> {
        var promise = new Promise<Map<string, any>>((resolve, reject) => {
            let pathContentMapping = new Map<string, any>();
            xlfFilePaths.forEach(async xlfFilePath => {
                const xml = await fs.readFileSync(xlfFilePath, "utf8");
                parseString(xml,
                    { explicitArray: false },
                    function (error, result) {
                        if (error != undefined) {
                            reject(error);                            
                        }
                        pathContentMapping.set(xlfFilePath, result);                                                
                    });                    
            });
            resolve(pathContentMapping);
        });
        return promise;
    }

    private getMainXlfFile(fileContentMapping: Map<string, any>): string {
        fileContentMapping.forEach((value, key)=>{
            if (key.endsWith("g.xlf")){
                const json = value;
                // if (json.xliff.file."source-language" == json.xliff.file."target-language"){
                //     return key;
                // }
            }
        });
        return "";
    }

    private async collectXlfFilesAsync(rootDirPath: string): Promise<string[]> {
        var promise = new Promise<string[]>((resolve, reject) => {
            walk(rootDirPath,
                (err: Error | null, results?: string[]) => {
                    if (err != null) {
                        reject(err);
                    }
                    if (results != null) {
                        resolve(results);
                    }
                },
                (f: string) => { return f.endsWith(".xlf"); }
            );
        });
        return promise;
    }
}

