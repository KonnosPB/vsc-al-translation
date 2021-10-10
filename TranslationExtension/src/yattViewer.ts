import { TextDecoder } from 'util';
import * as vscode from 'vscode';

export class YattViewer {
	constructor(context: vscode.ExtensionContext) {
		// const view = vscode.window.createTreeView('testView', { treeDataProvider: aNodeWithIdTreeDataProvider(), showCollapseAll: true });
		// context.subscriptions.push(view);
		// vscode.commands.registerCommand('testView.reveal', async () => {
		// 	const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
		// 	if (key) {
		// 		await view.reveal({ key }, { focus: true, select: false, expand: true });
		// 	}
		// });
		// vscode.commands.registerCommand('testView.changeTitle', async () => {
		// 	const title = await vscode.window.showInputBox({ prompt: 'Type the new title for the Test View', placeHolder: view.title });
		// 	if (title) {
		// 		view.title = title;
		// 	}
		// });

		// TODO: Demodaten anzeigen.
		// TODO: Demodaten zur Laufzeit erzeugen.
	}

	public getWebviewContent(): Thenable<string> {
		const p = new Promise<string>((resolve, reject) => {	
			const extension = vscode.extensions.getExtension('KonnosPB.al-yatt');
			const extensionUri = extension.extensionUri;								
			const yattViewerUri = vscode.Uri.joinPath(extensionUri, '/resources/yattViewer.html');
			const jQueryJsUri = vscode.Uri.joinPath(extensionUri, '/assets/jquery/jquery-3.6.0.js');
			const jQueryUiJsUri = vscode.Uri.joinPath(extensionUri, '/assets/jquery/jquery-ui.js');
			const tabulatorJsUri = vscode.Uri.joinPath(extensionUri, '/assets/tabulator/js/tabulator.js');
			const tabulatorCssUri = vscode.Uri.joinPath(extensionUri, '/assets/tabulator/css/tabulator.css');
			const progressTrackerCssUri = vscode.Uri.joinPath(extensionUri, '/assets/progress-tracker/progress-tracker.css');
			vscode.workspace.fs.readFile(yattViewerUri)
				.then(unit8Arr => {
					const webViewerContent = new TextDecoder("utf-8").decode(unit8Arr)				
					.replace("%JQUERY_JS%", jQueryJsUri.fsPath)
					.replace("%JQUERY_UI_JS%", jQueryUiJsUri.fsPath)
					.replace("%TABULATOR_JS%", tabulatorJsUri.fsPath)
					.replace("%YATT_JS%", "")					
					.replace("%TABULATOR_CSS%", tabulatorCssUri.fsPath)
					.replace("%PROGRESS_TRACKER_CSS%", progressTrackerCssUri.fsPath);					
					resolve(webViewerContent);
				});
		});
		return p;
	}

	public updateWebview(): void {
		// TODO implement updateWebview;
	}
}
