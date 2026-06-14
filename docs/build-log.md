# Build Log

## 2026-06-14

- Started Prompt Privacy Shield as the second Eylul Labs product.
- Chosen because AI prompt privacy is a clear developer pain with a fast MVP
  path and strong fit with DebugBrief.
- Created VS Code extension MVP:
  - sanitize selected text
  - sanitize clipboard text
  - copy sanitized output to clipboard
  - open a Markdown report
- Added core sanitizer and first tests.
- Added `0.0.2` usability pass:
  - separate report-opening commands from copy-only commands
  - improved Markdown report format
  - fixed `.env` assignment redaction to preserve key names
  - avoided clipboard changes when selected text is harmless
