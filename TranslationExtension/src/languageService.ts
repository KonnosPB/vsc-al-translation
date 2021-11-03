import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as xmlparser from 'fast-xml-parser';
import * as source from './xlfSourceDocument';


export class LanguageService {

	public static GetSourceJson(selectedTranslationFilePath: string): any {
		const normalizedPath = path.normalize(selectedTranslationFilePath);
		if (fs.existsSync(normalizedPath)) {
			const jsonContent = LanguageService.GetXlfAsJson(normalizedPath);
			const targetLanguage = jsonContent.xliff.file.$['target-language'];
			const sourceLanguage = jsonContent.xliff.file.$['source-language'];
			if (targetLanguage == sourceLanguage) {
				return jsonContent;
			}
			const dirPath = path.dirname(normalizedPath);
			const filePaths = fs.readdirSync(dirPath);
			filePaths.forEach(filePath => {
				const normalizedPath2 = path.normalize(filePath);
				if (normalizedPath2 === normalizedPath)
					return;
				const jsonContent = LanguageService.GetXlfAsJson(normalizedPath2);
				const targetLanguage = jsonContent.xliff.file.$['target-language'];
				const sourceLanguage = jsonContent.xliff.file.$['source-language'];
				if (targetLanguage == sourceLanguage) {
					return jsonContent;
				}
			});
		}
		return null;
	}

	public static GetXlfAsJson(xlfPath: string): any {
		if (fs.existsSync(xlfPath)) {
			const xmlContent = fs.readFileSync(xlfPath).toString();
			const jsonContent = xmlparser.parse(xmlContent);
			return jsonContent;
		}
		return null;
	}

	public static ConvertToSourceData(xlfJson: any): source.IXlfSourceMetaData {
		const sourceData: Array<source.IXlfSourceData> = [];
		const jTargetTransUnitArr: Array<any> = xlfJson.xliff.file.body.group["trans-unit"];
		let transUnitOrder = 0;
		jTargetTransUnitArr.forEach(jTransUnit => {
			transUnitOrder++;
			const sourceId = jTransUnit.$.id;
			const noteArrOrObj = jTransUnit.note;
			const source = jTransUnit.source;
			let navComment = "";
			let navObject = "";
			let navElement = "";
			let navSubelement = "";
			if (noteArrOrObj.$ !== undefined && noteArrOrObj.$["from"] === "Xliff Generator") {
				navComment = noteArrOrObj._;
				const splittedNavComments = LanguageService.extractNavComment(navComment);
				navObject = splittedNavComments.objectName;
				navElement = splittedNavComments.element;
				navSubelement = splittedNavComments.subelement;
			}

			const datasource: source.IXlfSourceData = {
				Id: sourceId,
				Handled: false,
				NavComment: navComment,
				NavElement: navElement,
				NavObject: navObject,
				NavSubelement: navSubelement,
				Order: transUnitOrder,
				Text: source
			};
			sourceData.push(datasource);
		});

		const targetLanguage = xlfJson.xliff.file.$['target-language'];
		const result: source.IXlfSourceMetaData = {
			JsonContent: xlfJson,
			LanguageCode: targetLanguage,
			Data: sourceData
		};
		return result;
	}


	private static extractNavComment(navComment: string): { objectName: string, element: string, subelement: string } {
		const matches = navComment.split(/ - \w+ /, 3);
		if (matches.length < 1) {
			return null;
		}
		const firstPart = matches[0].trimStart();
		const objNameEndIndex = firstPart.indexOf(" ");
		const objName = firstPart.substring(objNameEndIndex).trim();
		if (matches.length < 2) {
			return { objectName: objName, element: "", subelement: "" };
		}
		const elem = matches[1].trim();
		if (matches.length < 3) {
			return { objectName: objName, element: elem, subelement: "" };
		}
		const subElem = matches[2].trim();
		return { objectName: objName, element: elem, subelement: subElem };
	}

}