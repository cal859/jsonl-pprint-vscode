import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const PREVIEW_SCHEME = 'jsonl-preview';

function buildPreviewUri(sourcePath: string, rows: number): vscode.Uri {
  const filename = path.basename(sourcePath);
  return vscode.Uri.parse(
    `${PREVIEW_SCHEME}://preview/${encodeURIComponent(filename)}?source=${encodeURIComponent(sourcePath)}&rows=${rows}`
  );
}

function formatPreviewContent(sourcePath: string, rows: number): string {
  let raw: string;
  try {
    raw = fs.readFileSync(sourcePath, 'utf8');
  } catch (err) {
    return `// Could not read file: ${sourcePath}\n// ${err}`;
  }

  const lines = raw.split('\n').filter(l => l.trim() !== '');
  const total = lines.length;
  const limited = lines.slice(0, rows);

  const header = `// JSONL Preview — showing ${limited.length} of ${total} rows\n// Source: ${sourcePath}\n`;

  const blocks = limited.map((line, i) => {
    try {
      const obj = JSON.parse(line);
      return `// ─── Row ${i + 1} ───\n${JSON.stringify(obj, null, 2)}`;
    } catch {
      return `// ─── Row ${i + 1} (parse error) ───\n${line}`;
    }
  });

  return header + '\n' + blocks.join('\n\n');
}

class JsonlPreviewProvider implements vscode.TextDocumentContentProvider {
  private readonly _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  private _watchers = new Map<string, vscode.FileSystemWatcher>();
  private _urisBySource = new Map<string, vscode.Uri>();

  provideTextDocumentContent(uri: vscode.Uri): string {
    const params = new URLSearchParams(uri.query);
    const sourcePath = decodeURIComponent(params.get('source') ?? '');
    const rows = parseInt(params.get('rows') ?? '10', 10);
    return formatPreviewContent(sourcePath, rows);
  }

  watchSource(sourcePath: string, previewUri: vscode.Uri): void {
    if (this._watchers.has(sourcePath)) {
      return;
    }
    const pattern = new vscode.RelativePattern(
      vscode.Uri.file(path.dirname(sourcePath)),
      path.basename(sourcePath)
    );
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    const refresh = () => this._onDidChange.fire(previewUri);
    watcher.onDidChange(refresh);
    watcher.onDidCreate(refresh);
    this._watchers.set(sourcePath, watcher);
    this._urisBySource.set(sourcePath, previewUri);
  }

  disposeWatcher(sourcePath: string): void {
    this._watchers.get(sourcePath)?.dispose();
    this._watchers.delete(sourcePath);
    this._urisBySource.delete(sourcePath);
  }

  dispose(): void {
    for (const w of this._watchers.values()) {
      w.dispose();
    }
    this._watchers.clear();
    this._onDidChange.dispose();
  }
}

async function openPreview(
  provider: JsonlPreviewProvider,
  sourceUri: vscode.Uri,
  rows: number
): Promise<void> {
  const previewUri = buildPreviewUri(sourceUri.fsPath, rows);
  provider.watchSource(sourceUri.fsPath, previewUri);

  const doc = await vscode.workspace.openTextDocument(previewUri);
  const editor = await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.Beside,
    preview: false,
    preserveFocus: true,
  });

  // Set language to jsonc so // comments and JSON objects get highlighting.
  await vscode.languages.setTextDocumentLanguage(editor.document, 'jsonc');
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new JsonlPreviewProvider();

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(PREVIEW_SCHEME, provider),
    provider
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jsonl-pprint.preview', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a JSONL file first.');
        return;
      }
      const rows = vscode.workspace
        .getConfiguration('jsonlPprint')
        .get<number>('defaultPreviewRows', 10);
      await openPreview(provider, editor.document.uri, rows);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jsonl-pprint.previewWithRows', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a JSONL file first.');
        return;
      }
      const input = await vscode.window.showInputBox({
        prompt: 'How many rows to preview?',
        value: String(
          vscode.workspace
            .getConfiguration('jsonlPprint')
            .get<number>('defaultPreviewRows', 10)
        ),
        validateInput: v =>
          /^\d+$/.test(v) && parseInt(v, 10) > 0 ? null : 'Enter a positive integer',
      });
      if (input === undefined) {
        return;
      }
      await openPreview(provider, editor.document.uri, parseInt(input, 10));
    })
  );

  // Clean up watchers when preview tabs are closed.
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(doc => {
      if (doc.uri.scheme === PREVIEW_SCHEME) {
        const params = new URLSearchParams(doc.uri.query);
        const sourcePath = decodeURIComponent(params.get('source') ?? '');
        if (sourcePath) {
          provider.disposeWatcher(sourcePath);
        }
      }
    })
  );
}

export function deactivate(): void {}
