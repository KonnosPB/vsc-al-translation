import * as vscode from 'vscode';
import { Disposable, disposeAll } from './dispose';
import { getNonce } from './util';

class PawDrawDocument extends Disposable implements vscode.CustomDocument {