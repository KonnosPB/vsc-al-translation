// import * as fs from 'fs';
// import * as path from 'path';
// import { json } from 'stream/consumers';
// import { parseString, Builder } from "xml2js";


// /**
//  * Recursively walk a directory asynchronously and obtain all file names (with full path).
//  *
//  * @param dir Folder name you want to recursively process
//  * @param done Callback function, returns all files with full path.
//  * @param filter Optional filter to specify which files to include, 
//  *   e.g. for json files: (f: string) => /.json$/.test(f)
//  * @see https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search/50345475#50345475
//  */
// const walk = (
//     dir: string,
//     done: (err: Error | null, results?: string[]) => void,
//     filter?: (f: string) => boolean
// ) => {
//     let results: string[] = [];
//     fs.readdir(dir, (err: Error, list: string[]) => {
//         if (err) {
//             return done(err);
//         }
//         let pending = list.length;
//         if (!pending) {
//             return done(null, results);
//         }
//         list.forEach((file: string) => {
//             file = path.resolve(dir, file);
//             fs.stat(file, (err2, stat) => {
//                 if (stat && stat.isDirectory()) {
//                     walk(file, (err3, res) => {
//                         if (res) {
//                             results = results.concat(res);
//                         }
//                         if (!--pending) {
//                             done(null, results);
//                         }
//                     }, filter);
//                 } else {
//                     if (typeof filter === 'undefined' || (filter && filter(file))) {
//                         results.push(file);
//                     }
//                     if (!--pending) {
//                         done(null, results);
//                     }
//                 }
//             });
//         });
//     });
// };

// interface ILanguageFileInfo {
//     Path: string;
//     jContent: any;
//     LanguageCode: string;
//     IsMain: boolean;
//     ModifiedDate: Date;
// }

// interface IDiagnostic {
//     Severity: string,
//     Id: string,
//     Message: string;
//     ErrorCode: string;
// }

// interface IData {
//     Id: string;
//     SourceLanguageCode: string;
//     TargetLanguageCode: string;
//     OverallStatus: string;
//     SourceText: string;
//     SourceCopyText: string;
//     State: string;
//     TargetText: string;
//     NavComment: string;
//     NavObject: string;
//     NavElement: string;
//     NavSubelement: string;
//     Handled: boolean;
// }

// export class LanguageParser {
//     private rootDirPath: string;
//     private languageFileInfo: ILanguageFileInfo[] = [];
//     private xlfFilePaths: string[] = [];
//     private data: Array<IData>;

//     constructor(rootDirPath: string) {
//         this.rootDirPath = rootDirPath;
//     }

//     public calcDataGrid() {
//         this.collectXlfFiles(this.rootDirPath)
//             .then(values => {
//             this.xlfFilePaths = values;
//         });
//         this.buildLanguageInfos(this.xlfFilePaths)
//             .then(values => {
//                 this.languageFileInfo = values;
//             });        
//     }

//     public async getLanguagesAsync(): Promise<string[]> {
//         if (await this.isDirtyAsync()) {
//             await this.calcDataGrid();
//         }
//         const languages: string[] = [];
//         this.languageFileInfo.forEach(element => {
//             languages.push(element.LanguageCode);
//         });
//         return languages;
//     }

//     public async buildDataAsync(): Promise<any> {
//         const sourceDataArr: Array<IData> = [];
//         const targetDataArr: Array<IData> = [];
//         this.data = [];

//         this.languageFileInfo.filter(sourceLanguageInfo => {
//             return sourceLanguageInfo.IsMain;
//         }).forEach(sourceLanguageInfo => {
//             const jSourceContent = sourceLanguageInfo.jContent;
//             const jSourceTransUnitArr: Array<any> = jSourceContent.xliff.file.body.group["trans-unit"];
//             jSourceTransUnitArr.forEach(jSourceTransUnit => {
//                 const sourceDataObj = this.convert(sourceLanguageInfo.LanguageCode, jSourceTransUnit);
//                 sourceDataArr.push(sourceDataObj);
//             });
//         });

//         this.languageFileInfo.filter(targetLanguageInfos => {
//             return !targetLanguageInfos.IsMain;
//         }).forEach(targetLanguageInfo => {
//             const jTargetContent = targetLanguageInfo.jContent;
//             const jTargetTransUnitArr: Array<any> = jTargetContent.xliff.file.body.group["trans-unit"];
//             jTargetTransUnitArr.forEach(jTargettTransUnit => {
//                 const targetDataobj = this.convert(targetLanguageInfo.LanguageCode, jTargettTransUnit);
//                 targetDataArr.push(targetDataobj);
//             });
//         });

//         sourceDataArr.forEach(sourceData => {
//             sourceData.Handled = true;
//             const matchingTargetData = targetDataArr.find(targetData => {
//                 return targetData.Handled === false && sourceData.Id === targetData.Id;
//             });
//             if (matchingTargetData !== undefined) {
//                 matchingTargetData.Handled = true;
//                 const merge: IData = {
//                     Id: sourceData.Id,
//                     SourceLanguageCode: sourceData.SourceLanguageCode,
//                     TargetLanguageCode: matchingTargetData.SourceLanguageCode,  //No mistake
//                     OverallStatus: "",
//                     SourceText: sourceData.SourceText,
//                     SourceCopyText: matchingTargetData.SourceText,
//                     State: matchingTargetData.State,
//                     TargetText: matchingTargetData.TargetText,
//                     NavComment: sourceData.NavComment,
//                     NavObject: sourceData.NavObject,
//                     NavElement: sourceData.NavElement,
//                     NavSubelement: sourceData.NavSubelement,
//                     Handled: false
//                 };
//                 this.data.push(merge);
//             } else {
//                 const merge: IData = {
//                     Id: sourceData.Id,
//                     SourceLanguageCode: sourceData.SourceLanguageCode,
//                     TargetLanguageCode: "",
//                     OverallStatus: "",
//                     SourceText: "",
//                     SourceCopyText: "",
//                     State: "",
//                     TargetText: sourceData.TargetText,
//                     NavComment: sourceData.NavComment,
//                     NavObject: sourceData.NavObject,
//                     NavElement: sourceData.NavElement,
//                     NavSubelement: sourceData.NavSubelement,
//                     Handled: false
//                 };
//                 this.data.push(merge);
//             }
//         });

//         targetDataArr.filter(targetData => {
//             return targetData.Handled === false;
//         }).forEach(targetData => {
//             targetData.Handled = true;
//             const merge: IData = {
//                 Id: targetData.Id,
//                 SourceLanguageCode: targetData.SourceLanguageCode,
//                 TargetLanguageCode: targetData.SourceLanguageCode,
//                 OverallStatus: "",
//                 SourceText: "",
//                 SourceCopyText: targetData.SourceText,
//                 State: targetData.State,
//                 TargetText: targetData.TargetText,
//                 NavComment: targetData.NavComment,
//                 NavObject: targetData.NavObject,
//                 NavElement: targetData.NavElement,
//                 NavSubelement: targetData.NavSubelement,
//                 Handled: false
//             };
//             this.data.push(merge);
//         });
//         return this.data;
//     }

//     public async getDiagnosticsAsync(): Promise<Array<IDiagnostic>> {
//         const diagnostics: Array<IDiagnostic> = [];
//         this.data.forEach(async data => {
//             const partDiagnostics = await this.getDiagnosticAsync(data);
//             diagnostics.concat(partDiagnostics);
//         });
//         return diagnostics;
//     }

//     public async getDiagnosticAsync(data: IData): Promise<Array<IDiagnostic>> {
//         const diagnostics: Array<IDiagnostic> = [];
//         if (data.SourceText !== data.SourceCopyText) {
//             data.OverallStatus = "Error";
//             const diagnostic: IDiagnostic = {
//                 ErrorCode: 'TRANSLATE-0001',
//                 Severity: "error",
//                 Id: data.Id,
//                 Message: `Source text of ${data.TargetLanguageCode} not up to date`
//             };
//             diagnostics.push(diagnostic);
//         }

//         if (data.SourceText !== "" && data.TargetText === "") {
//             data.OverallStatus = "Error";
//             const diagnostic: IDiagnostic = {
//                 ErrorCode: 'TRANSLATE-0002',
//                 Severity: "error",
//                 Id: data.Id,
//                 Message: `Translation of ${data.SourceText} in ${data.TargetLanguageCode} language file missing`
//             };
//             diagnostics.push(diagnostic);
//         }
//         else {
//             const sourcePlaceHolderMatchArr = data.SourceText.match(/%\d+/);
//             const targetPlaceHolderMatchArr = data.TargetText.match(/%\d+/);
//             if (sourcePlaceHolderMatchArr !== null && targetPlaceHolderMatchArr !== null) {
//                 if (sourcePlaceHolderMatchArr.length != targetPlaceHolderMatchArr.length) {
//                     data.OverallStatus = "Warning";
//                     const diagnostic: IDiagnostic = {
//                         ErrorCode: 'TRANSLATE-0003',
//                         Severity: "error",
//                         Id: data.Id,
//                         Message: `Mismatch of placeholders amount between source (${sourcePlaceHolderMatchArr.length}) and target (${targetPlaceHolderMatchArr.length}). `
//                     };
//                     diagnostics.push(diagnostic);
//                 }
//             }
//             if (sourcePlaceHolderMatchArr !== null) {
//                 let counter = 0;                
//                 sourcePlaceHolderMatchArr.forEach(m => {
//                     counter++;
//                     const expectedPlaceHolderIndex = `%${counter}`;
//                     if (m !== expectedPlaceHolderIndex) {
//                         const diagnostic: IDiagnostic = {
//                             ErrorCode: 'TRANSLATE-0004',
//                             Severity: "warning",
//                             Id: data.Id,
//                             Message: `Placeholder ${m} not ${expectedPlaceHolderIndex} as expected`
//                         };
//                     }
//                 });
//             }
//         }
//         return diagnostics;
//     }

//     private convert(languageCode: string, jTransUnit: any): IData {
//         const sourceId = jTransUnit.$.id;
//         const noteArrOrObj = jTransUnit.note;
//         let navComment = "";
//         let navObject = "";
//         let navElement = "";
//         let navSubelement = "";
//         let state = "";
//         if (noteArrOrObj.$ !== undefined && noteArrOrObj.$["from"] === "Xliff Generator") {
//             navComment = noteArrOrObj._;
//         } else {
//             const sourceNode = noteArrOrObj.find(sourceNode => {
//                 const from = sourceNode.$["from"];
//                 if (from === "Xliff Generator") {
//                     return true;
//                 }
//                 return false;
//             });
//             navComment = sourceNode._;
//         }

//         const splittedNavComments = this.extractNavComment(navComment);
//         navObject = splittedNavComments.objectName;
//         navElement = splittedNavComments.element;
//         navSubelement = splittedNavComments.subelement;
//         const source = jTransUnit.source;
//         let target = "";
//         if (jTransUnit.target !== undefined) {
//             state = jTransUnit.target.$["state"];
//             target = jTransUnit.target._;
//         }
//         const datasource: IData = {
//             Id: sourceId,
//             SourceCopyText: "",
//             SourceLanguageCode: languageCode,
//             SourceText: source,
//             TargetText: target,
//             NavComment: navComment,
//             NavSubelement: navSubelement,
//             NavElement: navElement,
//             NavObject: navObject,
//             TargetLanguageCode: "",
//             OverallStatus: "",
//             State: state,
//             Handled: false
//         };
//         return datasource;
//     }

//     private extractNavComment(navComment: string): { objectName: string, element: string, subelement: string } {
//         const matches = navComment.split(/ - \w+ /, 3);
//         if (matches.length < 1) {
//             return null;
//         }
//         const firstPart = matches[0].trimStart();
//         const objNameEndIndex = firstPart.indexOf(" ");
//         const objName = firstPart.substring(objNameEndIndex).trim();
//         if (matches.length < 2) {
//             return { objectName: objName, element: "", subelement: "" };
//         }
//         const elem = matches[1].trim();
//         if (matches.length < 3) {
//             return { objectName: objName, element: elem, subelement: "" };
//         }
//         const subElem = matches[2].trim();
//         return { objectName: objName, element: elem, subelement: subElem };
//     }

//     public async isDirtyAsync(): Promise<boolean> {
//         const promise = new Promise<boolean>((resolve, reject) => {
//             this.xlfFilePaths = await this.collectXlfFiles(this.rootDirPath);
//             if (this.languageFileInfo.length !== this.xlfFilePaths.length) {
//                 resolve(true);
//             }

//             let fileFound = false;
//             let modifiedDateChanged = false;
//             this.xlfFilePaths.forEach(filePath => {
//                 fileFound = false;
//                 modifiedDateChanged = false;
//                 this.languageFileInfo.forEach(elem => {
//                     if (filePath === elem.Path) {
//                         fileFound = true;
//                         fs.stat(filePath, (err, stats) => {
//                             if (stats.mtime !== elem.ModifiedDate) {
//                                 modifiedDateChanged = true;
//                             }
//                         });
//                     }
//                 });
//                 if (!fileFound) {
//                     resolve(true);
//                 }
//                 if (modifiedDateChanged) {
//                     resolve(true);
//                 }
//             });

//             resolve(false);
//         });
//         return promise;
//     }

//     private async buildLanguageInfos(xlfFilePaths: string[]): Promise<ILanguageFileInfo[]> {
//         const promise = new Promise<ILanguageFileInfo[]>((resolve, reject) => {
//             const languageFileInfos: ILanguageFileInfo[] = [];
//             xlfFilePaths.forEach(async filePath => {
//                 const xml = await fs.readFileSync(filePath, "utf8");
//                 parseString(xml,
//                     { explicitArray: false },
//                     function (error, jObj) {
//                         if (error != undefined) {
//                             reject(error);
//                         }
//                         if (jObj !== undefined) {
//                             const targetLanguage = jObj.xliff.file.$['target-language'];
//                             const sourceLanguage = jObj.xliff.file.$['source-language'];
//                             const isMain = targetLanguage === sourceLanguage;
//                             fs.stat(filePath, (err, stats) => {
//                                 const modifiedDate = stats.mtime;
//                                 const languageInfo: ILanguageFileInfo = {
//                                     Path: filePath,
//                                     jContent: jObj,
//                                     LanguageCode: targetLanguage,
//                                     IsMain: isMain,
//                                     ModifiedDate: modifiedDate
//                                 };
//                                 languageFileInfos.push(languageInfo);
//                             });
//                         }
//                     });
//             });
//             resolve(languageFileInfos);
//         });
//         return promise;
//     }

//     private collectXlfFiles(rootDirPath: string): Promise<string[]> {
//         const promise = new Promise<string[]>((resolve, reject) => {
//             walk(rootDirPath,
//                 (err: Error | null, results?: string[]) => {
//                     if (err != null) {
//                         reject(err);
//                     }
//                     if (results != null) {
//                         resolve(results);
//                     }
//                 },
//                 (f: string) => { return f.endsWith(".xlf"); }
//             );
//         });
//         return promise;
//     }
// }

// export class TabulatorBuilder {
//     private rootDirPath: string;
//     constructor(rootDirPath: string) {
//         this.rootDirPath = rootDirPath;
//     }

//     public async buildAsync(){
//         const languageParser = new LanguageParser(this.rootDirPath);
//         const tableData = await languageParser.buildDataAsync();

//         const table = new Tabulator("#example-table", {
//             data:await languageParser.buildDataAsync(),           //load row data from array
//             layout:"fitColumns",      //fit columns to width of table
//             responsiveLayout:"hide",  //hide columns that dont fit on the table
//             tooltips:true,            //show tool tips on cells
//             addRowPos:"top",          //when adding a new row, add it to the top of the table
//             history:true,             //allow undo and redo actions on the table
//             pagination:"local",       //paginate the data
//             paginationSize:50,         //allow 7 rows per page of data
//             movableColumns:true,      //allow column order to be changed
//             resizableRows:true,       //allow row order to be changed
//             initialSort:[             //set the initial sort order of the data
//                 {column:"name", dir:"asc"},
//             ],
//             columns:[                 //define the table columns
//                 {title:"Status", field:"languageParser", editor:"input"},
//                 {title:"Source (main)", field:"SourceText", hozAlign:"left", formatter:"progress", editor:true},
//                 {title:"Source", field:"SourceCopyText", width:95, editor:"select", editorParams:{values:["male", "female"]}},
//                 {title:"Target", field:"TargetText", formatter:"star", hozAlign:"center", width:100, editor:true},
//                 {title:"State", field:"state", width:130, editor:"input"},
//                 {title:"Object", field:"NavObject", width:130, sorter:"date", hozAlign:"center"},
//                 {title:"Element", field:"NavElement", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
//                 {title:"Subelement", field:"NavSubelement", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
//                 {title:"Comment", field:"NavComment", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
//             ]
//         });        
//     }
// }
