import * as vscode from 'vscode';
import { Disposable, disposeAll } from './dispose';

export interface IXlfSourceData{
	Id: string;
	Order: number;		
	Text: string;	
	NavComment: string;
	NavObject: string;
	NavElement: string;
	NavSubelement: string;
	Handled: boolean;
}

export interface IXlfSourceMetaData {
	JsonContent: any;
	LanguageCode: string;
	Data: ReadonlyArray<IXlfSourceData>;
}

// interface XlfSourceDocumentDelegate {
// 	getFileData(): Promise<Uint8Array>;
// }

// //https://github.com/microsoft/vscode-extension-samples/blob/main/custom-editor-sample/src/pawDrawEditor.ts

// class XlfSourceDocument extends Disposable implements vscode.CustomDocument {

// 	static async create(
// 		uri: vscode.Uri,
// 		backupId: string | undefined,
// 		delegate: XlfSourceDocumentDelegate,
// 	): Promise<XlfSourceDocument | PromiseLike<XlfSourceDocument>> {
// 		// If we have a backup, read that. Otherwise read the resource from the workspace
// 		const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
// 		const fileData = await XlfSourceDocument.readFile(dataFile);
// 		return new XlfSourceDocument(uri, fileData, delegate);
// 	}

// 	private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
// 		if (uri.scheme === 'untitled') {
// 			return new Uint8Array();
// 		}
// 		return vscode.workspace.fs.readFile(uri);
// 	}

// 	private readonly _uri: vscode.Uri;
// 	private _documentData: Uint8Array;
// 	private readonly _delegate: XlfSourceDocumentDelegate;

// 	private constructor(
// 		uri: vscode.Uri,
// 		initialContent: Uint8Array,
// 		delegate: XlfSourceDocumentDelegate
// 	) {
// 		super();
// 		this._uri = uri;
// 		this._documentData = initialContent;
// 		this._delegate = delegate;
// 	}

// 	public get uri() { return this._uri; }

// 	public get documentData(): Uint8Array { return this._documentData; }

// 	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());

// 	/**
// 	 * Fired when the document is disposed of.
// 	 */
// 	public readonly onDidDispose = this._onDidDispose.event;

// 	private readonly _onDidChangeDocument = this._register(new vscode.EventEmitter<{
// 		readonly content?: Uint8Array;
// 		readonly edits: readonly PawDrawEdit[];
// 	}>());

// 	/**
// 	 * Fired to notify webviews that the document has changed.
// 	 */
// 		 public readonly onDidChangeContent = this._onDidChangeDocument.event;

// 		 private readonly _onDidChange = this._register(new vscode.EventEmitter<{
// 			 readonly label: string,
// 			 undo(): void,
// 			 redo(): void,
// 		 }>());
	
	
// 	/**
// 	 * Called by VS Code when there are no more references to the document.
// 	 *
// 	 * This happens when all editors for it have been closed.
// 	 */
// 	 dispose(): void {
// 		this._onDidDispose.fire();
// 		super.dispose();
// 	}

// }

// export class XlfSourceViewProvider implements vscode.CustomEditorProvider<XlfSourceDocument> {
// 	onDidChangeCustomDocument: vscode.Event<vscode.CustomDocumentEditEvent<XlfSourceDocument>> | vscode.Event<vscode.CustomDocumentContentChangeEvent<XlfSourceDocument>>;
// 	saveCustomDocument(document: XlfSourceDocument, cancellation: vscode.CancellationToken): Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// 	saveCustomDocumentAs(document: XlfSourceDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// 	revertCustomDocument(document: XlfSourceDocument, cancellation: vscode.CancellationToken): Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// 	backupCustomDocument(document: XlfSourceDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
// 		throw new Error('Method not implemented.');
// 	}
// 	openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): XlfSourceDocument | Thenable<XlfSourceDocument> {
// 		throw new Error('Method not implemented.');
// 	}
// 	resolveCustomEditor(document: XlfSourceDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
// 		throw new Error('Method not implemented.');
// 	}
// }