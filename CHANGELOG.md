# Changelog

All notable changes to JSONL Formatter will be documented here.

## [0.1.0] — 2026-05-04

### Added
- Initial release
- Side-by-side read-only preview for `.jsonl` and `.ndjson` files
- Per-row pretty-printing with JSONC syntax highlighting
- Configurable default row limit via `jsonlFormatter.defaultPreviewRows`
- Custom row count prompt (`JSONL: Preview JSONL (custom rows)` command)
- Editor toolbar and context menu shortcuts
- Live preview refresh when the source file changes on disk
- Inline parse error display for malformed rows
