# JSONL PPrint

Pretty-print **JSONL** and **NDJSON** files in a side-by-side read-only preview — no source file modifications. Each row is expanded into indented JSON with full syntax highlighting, and the preview updates live as the file changes on disk.

## Features

- Side-by-side read-only preview — source file is never modified
- Each row pretty-printed with 2-space indentation and JSONC syntax highlighting
- Configurable row limit — preview as many or as few rows as you need
- Custom row count prompt for one-off inspections without changing your default
- Live refresh — preview updates automatically whenever the source file changes on disk
- Works with `.jsonl` and `.ndjson` files and the `application/x-ndjson` / `application/jsonl` MIME types
- Parse errors are surfaced inline so malformed rows are easy to spot

## What it does

Opening a `.jsonl` or `.ndjson` file gives you a compact, hard-to-read wall of JSON objects. JSONL PPrint opens a read-only preview panel beside your source file where each row is pretty-printed with indentation and syntax highlighting — so you can inspect the data without ever touching the original file.

## How to launch

With a `.jsonl` or `.ndjson` file open in the editor, you have three options:

- **Editor toolbar** — click the preview icon in the top-right of the editor to open a preview using the default row limit.
- **Context menu** — right-click anywhere in the file and choose **JSONL: Preview JSONL** or **JSONL: Preview JSONL (custom rows)**.
- **Command Palette** — open the palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run **JSONL: Preview JSONL** or **JSONL: Preview JSONL (custom rows)**.

The "custom rows" variant prompts you for a row count before opening.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `jsonlPprint.defaultPreviewRows` | `10` | Number of rows shown when using the standard preview command. |

To change the default, open **Settings** (`Cmd+,` / `Ctrl+,`) and search for `jsonlPprint`, or add it directly to your `settings.json`:

```json
"jsonlPprint.defaultPreviewRows": 25
```