"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class ALExendedCop {
    constructor(ctx) {
        this.ctx = ctx;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('al');
        this.ctx.subscriptions.push(this.diagnosticCollection);
        this.diagnosticMap = new Map();
    }
}
//# sourceMappingURL=ALExtendedCop.js.map