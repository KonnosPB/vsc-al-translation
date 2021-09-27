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

interface ILanguageFileInfo {
    Path: string;
    jContent: any;
    Language: string;
    IsMain: boolean;
    ModifiedDate: Date;
}

export class LanguageParser {
    private rootDirPath: string;
    private languageFileInfo: ILanguageFileInfo[] = [];
    private xlfFilePaths: string[] = [];
    private lastIp

    constructor(rootDirPath: string) {
        this.rootDirPath = rootDirPath;
    }

    public async calcDataGridAsync() {
        this.xlfFilePaths = await this.collectXlfFilesAsync(this.rootDirPath);
        this.languageFileInfo = await this.buildLanguageInfos(this.xlfFilePaths);
    }

    public getLanguages(): string[] {
        const languages: string[] = [];
        this.languageFileInfo.forEach(element => {
            languages.push(element.Language);
        });
        return languages;
    }

    public async isDirtyAsync(): Promise<boolean> {
        var promise = new Promise<boolean>(async (resolve, reject) => {
            this.xlfFilePaths = await this.collectXlfFilesAsync(this.rootDirPath);
            if (this.languageFileInfo.length !== this.xlfFilePaths.length) {
                resolve(true);
            }

            let fileFound: boolean = false;
            let modifiedDateChanged: boolean = false;
            this.xlfFilePaths.forEach(filePath => {
                fileFound = false;
                modifiedDateChanged = false;
                this.languageFileInfo.forEach(elem => {
                    if (filePath === elem.Path) {
                        fileFound = true;
                        fs.stat(filePath, (err, stats) => {
                            if (stats.mtime !== elem.ModifiedDate) {
                                modifiedDateChanged = true;
                            }
                        });
                    }
                });
                if (!fileFound) {
                    resolve(true);
                }
                if (modifiedDateChanged) {
                    resolve(true);
                }
            });

            resolve(false);
        });        
        return promise;
    }

    private async buildLanguageInfos(xlfFilePaths: string[]): Promise<ILanguageFileInfo[]> {
        var promise = new Promise<ILanguageFileInfo[]>((resolve, reject) => {
            let languageFileInfos: ILanguageFileInfo[] = [];
            xlfFilePaths.forEach(async filePath => {
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
                            fs.stat(filePath, (err, stats) => {
                                let modifiedDate = stats.mtime;
                                var languageInfo: ILanguageFileInfo = {
                                    Path: filePath,
                                    jContent: jObj,
                                    Language: targetLanguage,
                                    IsMain: isMain,
                                    ModifiedDate: modifiedDate
                                };
                                languageFileInfos.push(languageInfo);
                            });
                        }
                    });
            });
            resolve(languageFileInfos);
        });
        return promise;
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

