import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'assets'), vscode.Uri.joinPath(extensionUri, 'resources')]
	};
}

export class YattViewer {
	public static currentPanel: YattViewer | undefined;
	public static readonly viewType = 'yattViewer';
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (YattViewer.currentPanel) {
			YattViewer.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			YattViewer.viewType,
			'YaTT Viewer',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		YattViewer.currentPanel = new YattViewer(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		YattViewer.currentPanel = new YattViewer(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		YattViewer.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;

		// Vary the webview's content based on where it is located in the editor.
		this._panel.title = 'YaTT Viewer';
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}


	private _getHtmlForWebview(webview: vscode.Webview) {					
		const extensionPath = this._extensionUri;
		const jQueryPath = vscode.Uri.joinPath(extensionPath, 'assets', 'jquery', 'jquery-3.6.0.js');
		const jQueryUIPath = vscode.Uri.joinPath(extensionPath, 'assets', 'jquery-ui', 'jquery-ui.js');
		const tabulatorPath = vscode.Uri.joinPath(extensionPath, 'assets', 'tabulator', 'js', 'tabulator.js');
		const tabulatorCssPath = vscode.Uri.joinPath(extensionPath, 'assets', 'tabulator', 'css', 'tabulator.css');
		const progressTrackerPath = vscode.Uri.joinPath(extensionPath, 'assets', 'progress-tracker', 'progress-tracker.css');

		const jQueryUri = webview.asWebviewUri(jQueryPath);		
		const jQueryUIUri = webview.asWebviewUri(jQueryUIPath);		
		const tabulatorUri = webview.asWebviewUri(tabulatorPath);		
		const tabulatorCssUri = webview.asWebviewUri(tabulatorCssPath);		
		const progressTrackerUri = webview.asWebviewUri(progressTrackerPath);
		const yatt_js = "";
		
		const yattViewerHtml = `<!DOCTYPE html>
		<html>		
		<head>
			<meta charset="utf-8">
			<script nonce="${getNonce()}" src="${jQueryUri}" ></script>
			<script nonce="${getNonce()}" src="${jQueryUIUri}"></script>
			<script nonce="${getNonce()}" src="${tabulatorUri}" ></script>
			<script nonce="${getNonce()}" src="${yatt_js}" ></script>
			<link href="${tabulatorCssUri}" rel="stylesheet">
			<link href="${progressTrackerUri}" rel="stylesheet">		
		</head>		
		<body>		
			<script>
				var table = new Tabulator("#example-table", {
					columns: [
						{ title: "Name", field: "name" },
						{ title: "Progress", field: "progress", sorter: "number" },
						{ title: "Gender", field: "gender" },
						{ title: "Rating", field: "rating" },
						{ title: "Favourite Color", field: "col" },
						{ title: "Date Of Birth", field: "dob", hozAlign: "center" },
					],
				});
			</script>					
			<div id="example-table"></div>		
			<div class="progress-container" style="visibility:hidden;">
				<ul class="progress-tracker progress-tracker--text progress-tracker--center">
					<li class="progress-step is-complete">
						<div class="progress-marker"></div>
						<div class="progress-text">
							<h4 class="progress-title">Step 1</h4>
							Summary text explaining this step to the user
						</div>
					</li>		
					<li class="progress-step is-complete">
						<div class="progress-marker"></div>
						<div class="progress-text">
							<h4 class="progress-title">Step 2</h4>
							Summary text explaining this step to the user
						</div>
					</li>		
					<li class="progress-step is-active" aria-current="step">
						<div class="progress-marker"></div>
						<div class="progress-text">
							<h4 class="progress-title">Step 3</h4>
							Summary text explaining this step to the user
						</div>
					</li>		
					<li class="progress-step">
						<div class="progress-marker"></div>
						<div class="progress-text">
							<h4 class="progress-title">Step 4</h4>
							Shorter summary text
						</div>
					</li>		
					<li class="progress-step">
						<div class="progress-marker"></div>
						<div class="progress-text">
							<h4 class="progress-title">Step 5</h4>
							Shorter summary text
						</div>
					</li>
				</ul>
			</div>
		</body>		
		</html>`;
		return yattViewerHtml;
	}		
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
