import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as yatt from '../../LanguageService';
import * as fs from 'fs';
import * as path from 'path';
import * as testenv from './../testenv';


suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');	

	test('LanguageService.GetXlfAsJson', () => {		
		if (! fs.existsSync(testenv.data.getXlfDEPath())){
			throw new Error('KUMAVISION med.de-DE.xlf not found here.' + path.normalize(testenv.data.getXlfDEPath()));
		}
		throw new Error('Yes');

		//yatt.LanguageService.GetXlfAsJson('');
	});
});
