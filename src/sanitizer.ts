export type FindingType =
  | 'api-key'
  | 'aws-access-key'
  | 'bearer-token'
  | 'database-url'
  | 'email'
  | 'env-secret'
  | 'github-token'
  | 'ip-address'
  | 'jwt'
  | 'local-path'
  | 'private-key'
  | 'url-secret';

export interface Finding {
  type: FindingType;
  count: number;
  placeholder: string;
}

export interface SanitizeResult {
  sanitized: string;
  findings: Finding[];
  changed: boolean;
}

interface Rule {
  type: FindingType;
  placeholder: string;
  pattern: RegExp;
  replacement?: (match: string) => string;
}

const RULES: Rule[] = [
  {
    type: 'private-key',
    placeholder: '[REDACTED_PRIVATE_KEY]',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    type: 'env-secret',
    placeholder: '$1[REDACTED]',
    pattern: /^(\s*[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASS|API_KEY|PRIVATE_KEY)[A-Z0-9_]*\s*=\s*).+$/gim,
    replacement: (match: string) => match.replace(/^(\s*[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASS|API_KEY|PRIVATE_KEY)[A-Z0-9_]*\s*=\s*).+$/i, '$1[REDACTED]'),
  },
  {
    type: 'github-token',
    placeholder: '[REDACTED_GITHUB_TOKEN]',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b|github_pat_[A-Za-z0-9_]{40,}/g,
  },
  {
    type: 'aws-access-key',
    placeholder: '[REDACTED_AWS_ACCESS_KEY]',
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    type: 'bearer-token',
    placeholder: 'Bearer [REDACTED_TOKEN]',
    pattern: /Bearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
  },
  {
    type: 'jwt',
    placeholder: '[REDACTED_JWT]',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    type: 'database-url',
    placeholder: '[REDACTED_DATABASE_URL]',
    pattern: /\b(?:postgres|postgresql|mysql|mongodb|redis):\/\/[^\s"'`<>]+/gi,
  },
  {
    type: 'api-key',
    placeholder: '[REDACTED_API_KEY]',
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b|\b(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?[^"'\s]{12,}/gi,
  },
  {
    type: 'url-secret',
    placeholder: '$1=[REDACTED]',
    pattern: /([?&](?:token|key|secret|password|apikey|api_key)=)[^&\s"'`<>]+/gi,
    replacement: (match: string) => match.replace(/=.+$/, '=[REDACTED]'),
  },
  {
    type: 'email',
    placeholder: '[REDACTED_EMAIL]',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    type: 'ip-address',
    placeholder: '[REDACTED_IP]',
    pattern: /\b(?:(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/g,
  },
  {
    type: 'local-path',
    placeholder: '[REDACTED_LOCAL_PATH]',
    pattern: /(?:\/Users\/[^\s"'`<>]+|\/home\/[^\s"'`<>]+|[A-Z]:\\Users\\[^\s"'`<>]+)/g,
  },
];

export function sanitizeText(input: string): SanitizeResult {
  const counts = new Map<FindingType, { count: number; placeholder: string }>();
  let sanitized = input;

  for (const rule of RULES) {
    sanitized = sanitized.replace(rule.pattern, (match) => {
      const current = counts.get(rule.type);
      counts.set(rule.type, {
        count: (current?.count ?? 0) + 1,
        placeholder: rule.placeholder,
      });
      return rule.replacement ? rule.replacement(match) : rule.placeholder;
    });
  }

  const findings = Array.from(counts.entries()).map(([type, value]) => ({
    type,
    count: value.count,
    placeholder: value.placeholder,
  }));

  return {
    sanitized,
    findings,
    changed: sanitized !== input,
  };
}

export function buildReport(result: SanitizeResult): string {
  if (!result.findings.length) {
    return 'Prompt Privacy Shield: no sensitive patterns detected.';
  }

  const lines = ['Prompt Privacy Shield sanitized the following patterns:'];
  for (const finding of result.findings) {
    lines.push(`- ${finding.type}: ${finding.count}`);
  }
  return lines.join('\n');
}

export function buildMarkdownReport(result: SanitizeResult, source: string): string {
  const lines = [
    '# Prompt Privacy Shield Report',
    '',
    `Source: ${source}`,
    `Changed: ${result.changed ? 'yes' : 'no'}`,
    `Finding categories: ${result.findings.length}`,
    '',
  ];

  if (!result.findings.length) {
    lines.push('No sensitive patterns were detected.');
    return lines.join('\n');
  }

  lines.push('## Findings', '');
  for (const finding of result.findings) {
    lines.push(`- ${humanizeFindingType(finding.type)}: ${finding.count}`);
  }

  lines.push('', '## Sanitized Text', '', '```text', result.sanitized, '```');
  return lines.join('\n');
}

function humanizeFindingType(type: FindingType): string {
  return type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
