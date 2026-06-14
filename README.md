# Prompt Privacy Shield

Sanitize code, logs, and prompts before sending them to AI tools.

## Why

AI coding tools are useful, but developers often paste logs, stack traces,
configuration snippets, and source code that may contain private context.

Prompt Privacy Shield helps remove common sensitive patterns before that text
leaves your editor.

## Features

VS Code commands:

```text
Prompt Privacy Shield: Sanitize Selection
Prompt Privacy Shield: Sanitize Clipboard
Prompt Privacy Shield: Copy Sanitized Selection
Prompt Privacy Shield: Copy Sanitized Clipboard
```

Current detection includes:

- API keys and bearer tokens
- GitHub tokens
- JWT values
- database URLs
- private key blocks
- secret-looking `.env` assignments
- email addresses
- private/local IP addresses
- local machine paths
- URL query secrets such as `token=...` or `api_key=...`

The report commands copy the sanitized result to your clipboard and open a
Markdown report. The copy commands only copy the sanitized result.

If no sensitive patterns are found in a selection, the clipboard is left
unchanged.

## Example

Input:

```text
OPENAI_API_KEY=demo-key-value-for-docs
Authorization: Bearer demo-token-value-for-docs
Local path: /home/user/private/project
```

Output:

```text
OPENAI_API_KEY=[REDACTED]
Authorization: Bearer [REDACTED_TOKEN]
Local path: [REDACTED_LOCAL_PATH]
```

## Local VS Code Test

1. Open this folder in VS Code.
2. Press `F5` and choose the extension launch config.
3. In the extension development window, open:

   ```text
   samples/sensitive-prompt.txt
   ```

4. Select the sample text.
5. Run `Prompt Privacy Shield: Sanitize Selection and Open Report`.
6. Confirm the sanitized text is copied to your clipboard.

## Development

```bash
npm install
npm test
npm run package
```

`npm run package` creates a versioned VSIX, for example:

```text
prompt-privacy-shield-0.0.2.vsix
```

## License

MIT
