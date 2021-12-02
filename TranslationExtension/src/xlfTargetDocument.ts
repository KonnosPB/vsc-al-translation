// import * as vscode from 'vscode';
// import { Disposable, disposeAll } from './dispose';

// //https://github.com/microsoft/vscode-extension-samples/blob/main/custom-editor-sample/src/pawDrawEditor.ts

// class XlfTargetDocument extends Disposable implements vscode.CustomDocument {
// 	uri: vscode.Uri;
// 	dispose(): void {
// 		throw new Error('Method not implemented.');
// 	}
// }

// export class XlfTargetEditorProvider implements vscode.CustomEditorProvider<XlfTargetDocument> {
// 	onDidChangeCustomDocument: vscode.Event<vscode.CustomDocumentEditEvent<XlfTargetDocument>> | vscode.Event<vscode.CustomDocumentContentChangeEvent<XlfTargetDocument>>;
// 	saveCustomDocument(document: XlfTargetDocument, cancellation: vscode.CancellationToken): Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// 	saveCustomDocumentAs(document: XlfTargetDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// 	revertCustomDocument(document: XlfTargetDocument, cancellation: vscode.CancellationToken): Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// 	backupCustomDocument(document: XlfTargetDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
// 		throw new Error('Method not implemented.');
// 	}
// 	openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): XlfTargetDocument | Thenable<XlfTargetDocument> {
// 		throw new Error('Method not implemented.');
// 	}
// 	resolveCustomEditor(document: XlfTargetDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// }