'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { DepNodeProvider, Dependency } from './nodeDependencies';
import { YattViewer } from './YattViewer';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('yatt: open translation viewer', () => {			
			YattViewer.createOrShow(context.extensionUri);
		})
	);

	vscode.commands.registerCommand('yatt: refresh translation viewer', () => {
		// And set its HTML content		
		//yattViewer.updateWebview();
	});
}