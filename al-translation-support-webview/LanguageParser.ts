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

export class LanguageParser {
    private rootDirPath: string;
    private fileContentMapping = new Map<string, any>();
    private mainXlfFilePath: string;
    private xlfFilePaths: string[];
    private languages: string[];

    constructor(rootDirPath: string) {
        this.rootDirPath = rootDirPath;
    }

    public async calcDataGridAsync() {                
        this.xlfFilePaths = await this.collectXlfFilesAsync(this.rootDirPath);
        this.fileContentMapping = await this.loadContentsAsync(this.xlfFilePaths);                        
    }

    private determineLanguages(fileContentMapping: Map<string, any>()){
        
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

