/**
 * S-10 — Dependency & Supply Chain Security Denylist
 *
 * Defines known compromised packages, malicious script signatures, forbidden
 * lifecycle patterns, and blocked typosquat vectors.
 */

export const KNOWN_MALICIOUS_PACKAGES: readonly string[] = [
  'flatmap-stream',
  'event-stream-malicious',
  'colors-corrupted',
  'faker-corrupted',
  'node-ipc-trojan',
  'coa-hijacked',
  'rc-hijacked',
  'ua-parser-js-malicious',
  'ctx-malicious',
  'peacenotwar',
  'trusted_packge',
  'trusted-package2',
  'lodash-fake',
  'express-internal-backdoor',
  'cross-env-typosquat',
] as const;

export const BLOCKED_SCRIPT_PATTERNS: readonly RegExp[] = [
  /curl\s+.*\|\s*(?:bash|sh|zsh)/i,
  /wget\s+.*\|\s*(?:bash|sh|zsh)/i,
  /powershell(?:\.exe)?\s+-nop\s+-w\s+hidden\s+-c/i,
  /eval\(Buffer\.from\(/i,
  /eval\(atob\(/i,
  /process\.env\s*\[\s*["'](?:AWS_|DATABASE_|SECRET_|TOKEN_|JWT_|PRIVATE_)/i,
  /fetch\s*\(\s*["']https?:\/\/[^"']*(?:exfil|pastebin|webhook|discord\.com\/api\/webhooks)/i,
  /nc\s+-e\s+\/bin\/(?:bash|sh)/i,
  /rm\s+-rf\s+\//i,
  /chmod\s+\+x\s+.*&&.*\.\//i,
] as const;

export const BLOCKED_PACKAGE_VERSIONS: Record<string, readonly string[]> = {
  'event-stream': ['3.3.6'],
  'ua-parser-js': ['0.7.29', '0.8.0', '1.0.0'],
  coa: ['2.0.3', '2.0.4'],
  rc: ['1.2.9', '1.3.9'],
  colors: ['1.4.1', '1.4.2'],
};
