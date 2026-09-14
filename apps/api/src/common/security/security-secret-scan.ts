/**
 * S-06 Secret Scanner & Pipeline Verification Tool (security-secret-scan)
 *
 * Scans code, configurations, source maps, bundles, and assets for accidental
 * secret leaks (API keys, private keys, database credentials, OAuth secrets, JWT signing keys).
 */

export interface SecretScanViolation {
  file?: string;
  line?: number;
  patternName: string;
  snippet: string;
}

export interface SecretScanResult {
  clean: boolean;
  violations: SecretScanViolation[];
  totalFilesScanned?: number;
}

export const SECRET_SCAN_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'Private Key Block',
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH)?\s*PRIVATE KEY-----/,
  },
  {
    name: 'Live Stripe / Generic API Key',
    regex: /\b(?:sk|pk)_live_[0-9a-zA-Z]{24,}\b/,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36,}\b/,
  },
  {
    name: 'Slack Token',
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/,
  },
  {
    name: 'Hardcoded Production Database URL',
    regex:
      /postgres(?:ql)?:\/\/[a-zA-Z0-9_-]+:(?!(?:password|postgres|test|dummy|mock|\$\{))[^@\s\/]{8,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  },
  {
    name: 'AWS Access Key ID',
    regex: /\b(?:AKIA|ASIA|AROA)[0-9A-Z]{16}\b/,
  },
  {
    name: 'Google OAuth Client Secret',
    regex: /\bGOCSPX-[a-zA-Z0-9_-]{28}\b/,
  },
];

export class SecuritySecretScanner {
  /**
   * Scans a string content buffer for any matching secret patterns.
   */
  static scanContent(content: string, filename = 'content'): SecretScanResult {
    if (!content || typeof content !== 'string') {
      return { clean: true, violations: [] };
    }

    const violations: SecretScanViolation[] = [];
    const lines = content.split('\n');

    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      const line = lines[lineNum - 1];

      for (const pattern of SECRET_SCAN_PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push({
            file: filename,
            line: lineNum,
            patternName: pattern.name,
            snippet: line.trim().slice(0, 80),
          });
        }
      }
    }

    return {
      clean: violations.length === 0,
      violations,
    };
  }
}
