import * as vscode from 'vscode';
import { buildMarkdownReport, sanitizeText } from './sanitizer';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('promptPrivacyShield.sanitizeSelection', () => sanitizeSelection(true)),
    vscode.commands.registerCommand('promptPrivacyShield.sanitizeClipboard', () => sanitizeClipboard(true)),
    vscode.commands.registerCommand('promptPrivacyShield.copySanitizedSelection', () => sanitizeSelection(false)),
    vscode.commands.registerCommand('promptPrivacyShield.copySanitizedClipboard', () => sanitizeClipboard(false)),
  );
}

export function deactivate() {
  // No persistent resources.
}

async function sanitizeSelection(openReport: boolean) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Open a file and select text to sanitize.');
    return;
  }

  const selection = editor.selection;
  const input = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
  await sanitizeAndCopy(input, 'selection', openReport);
}

async function sanitizeClipboard(openReport: boolean) {
  const input = await vscode.env.clipboard.readText();
  if (!input.trim()) {
    vscode.window.showWarningMessage('Clipboard is empty.');
    return;
  }

  await sanitizeAndCopy(input, 'clipboard', openReport);
}

async function sanitizeAndCopy(input: string, source: 'selection' | 'clipboard', openReport: boolean) {
  const result = sanitizeText(input);

  if (result.changed || source === 'clipboard') {
    await vscode.env.clipboard.writeText(result.sanitized);
  }

  if (openReport) {
    const document = await vscode.workspace.openTextDocument({
      content: buildMarkdownReport(result, source),
      language: 'markdown',
    });
    await vscode.window.showTextDocument(document, { preview: false });
  }

  if (result.changed) {
    vscode.window.showInformationMessage(`Prompt Privacy Shield copied sanitized ${source} to clipboard.`);
  } else if (source === 'selection') {
    vscode.window.showInformationMessage(`Prompt Privacy Shield found no sensitive patterns in ${source}; clipboard was not changed.`);
  } else {
    vscode.window.showInformationMessage(`Prompt Privacy Shield found no sensitive patterns in ${source}.`);
  }
}
