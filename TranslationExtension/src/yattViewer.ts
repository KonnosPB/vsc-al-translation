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
			const uri = vscode.Uri.joinPath(extensionUri, '/resources/yattViewer.html');
			vscode.workspace.fs.readFile(uri)
				.then(unit8Arr => {
					const webViewerContent = new TextDecoder().decode(unit8Arr);
					resolve(webViewerContent);
				});
		});
		return p;
	}
}
