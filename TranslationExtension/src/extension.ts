'use strict';

import * as vscode from 'vscode';

import { DepNodeProvider, Dependency } from './nodeDependencies';
import { YattViewer } from './YattViewer';

export function activate(context: vscode.ExtensionContext) {

	// Samples of `window.registerTreeDataProvider`
	//const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath);
	// vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	// vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	// vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	// vscode.commands.registerCommand('nodeDependencies.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
	// vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	// vscode.commands.registerCommand('nodeDependencies.deleteEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
	
	// Test View
	//new TranslatableElementsView(context);
	vscode.commands.registerCommand('yatt: open translation viewer',()=> {
		const panel = vscode.window.createWebviewPanel(
				'yattTranslationViewer',  // Identifies the type of the webview. Used internally
				'YATT Translation Viewer', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{} // Webview options
		);

		// And set its HTML content
		const yattViewer = new YattViewer(context);
		yattViewer.getWebviewContent().then(webViewerContent => {
			panel.webview.html = webViewerContent;
		});
		
	});		
}