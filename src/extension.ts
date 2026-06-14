import * as vscode from 'vscode';
import { buildReport, sanitizeText } from './sanitizer';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('promptPrivacyShield.sanitizeSelection', sanitizeSelection),
    vscode.commands.registerCommand('promptPrivacyShield.sanitizeClipboard', sanitizeClipboard),
  );
}

export function deactivate() {
  // No persistent resources.
}

async function sanitizeSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Open a file and select text to sanitize.');
    return;
  }

  const selection = editor.selection;
  const input = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
  await sanitizeAndCopy(input, 'selection');
}

async function sanitizeClipboard() {
  const input = await vscode.env.clipboard.readText();
  if (!input.trim()) {
    vscode.window.showWarningMessage('Clipboard is empty.');
    return;
  }

  await sanitizeAndCopy(input, 'clipboard');
}

async function sanitizeAndCopy(input: string, source: 'selection' | 'clipboard') {
  const result = sanitizeText(input);
  await vscode.env.clipboard.writeText(result.sanitized);

  const report = buildReport(result);
  const document = await vscode.workspace.openTextDocument({
    content: `${report}\n\n--- Sanitized ${source} ---\n\n${result.sanitized}`,
    language: 'markdown',
  });
  await vscode.window.showTextDocument(document, { preview: false });

  if (result.changed) {
    vscode.window.showInformationMessage(`Prompt Privacy Shield copied sanitized ${source} to clipboard.`);
  } else {
    vscode.window.showInformationMessage(`Prompt Privacy Shield found no sensitive patterns in ${source}.`);
  }
}
