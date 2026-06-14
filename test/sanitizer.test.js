const assert = require('node:assert/strict');
const test = require('node:test');

const { buildMarkdownReport, buildReport, sanitizeText } = require('../dist/src/sanitizer');

test('redacts common secrets and private context', () => {
  const input = [
    `OPENAI_API_KEY=${'sk-' + 'abcdefghijklmnopqrstuvwxyz123456'}`,
    `Authorization: Bearer ${'abcdefghijklmnopqrstuvwxyz123456'}`,
    'Contact user@example.com from /home/alice/project',
    'Server 192.168.1.10',
  ].join('\n');

  const result = sanitizeText(input);

  assert.equal(result.changed, true);
  assert.match(result.sanitized, /OPENAI_API_KEY=\[REDACTED\]/);
  assert.match(result.sanitized, /Bearer \[REDACTED_TOKEN\]/);
  assert.match(result.sanitized, /\[REDACTED_EMAIL\]/);
  assert.match(result.sanitized, /\[REDACTED_LOCAL_PATH\]/);
  assert.match(result.sanitized, /\[REDACTED_IP\]/);
});

test('redacts github tokens, jwt values, and database urls', () => {
  const input = [
    `GitHub token: ${'ghp_' + 'abcdefghijklmnopqrstuvwxyz1234567890'}`,
    `jwt=${'eyJ' + 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbb'}`,
    'DATABASE_URL=postgres://user:pass@localhost:5432/app',
  ].join('\n');

  const result = sanitizeText(input);

  assert.doesNotMatch(result.sanitized, /ghp_/);
  assert.doesNotMatch(result.sanitized, /eyJ/);
  assert.doesNotMatch(result.sanitized, /postgres:\/\//);
  assert.ok(result.findings.some((finding) => finding.type === 'github-token'));
  assert.ok(result.findings.some((finding) => finding.type === 'jwt'));
  assert.ok(result.findings.some((finding) => finding.type === 'database-url'));
});

test('keeps harmless text unchanged', () => {
  const input = 'Explain this TypeScript error and suggest a minimal fix.';
  const result = sanitizeText(input);

  assert.equal(result.changed, false);
  assert.equal(result.sanitized, input);
  assert.deepEqual(result.findings, []);
});

test('builds a readable report', () => {
  const result = sanitizeText('email=user@example.com');
  const report = buildReport(result);

  assert.match(report, /email: 1/);
});

test('builds a markdown report with sanitized text', () => {
  const result = sanitizeText('email=user@example.com');
  const report = buildMarkdownReport(result, 'selection');

  assert.match(report, /# Prompt Privacy Shield Report/);
  assert.match(report, /Source: selection/);
  assert.match(report, /Email: 1/);
  assert.match(report, /\[REDACTED_EMAIL\]/);
});
