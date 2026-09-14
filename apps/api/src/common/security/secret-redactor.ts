/**
 * S-06 Comprehensive Secret Redactor & Sensitive Field Protection
 *
 * Recursively redacts secrets, keys, credentials, hashes, and tokens
 * from logs, errors, responses, and telemetry.
 */

export const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /jwt/i,
  /apikey/i,
  /api_key/i,
  /privatekey/i,
  /private_key/i,
  /signingkey/i,
  /signing_key/i,
  /encryptionkey/i,
  /encryption_key/i,
  /clientsecret/i,
  /client_secret/i,
  /oauthsecret/i,
  /oauth_secret/i,
  /authorization/i,
  /cookie/i,
  /set-cookie/i,
  /sessionid/i,
  /session_id/i,
  /refreshtoken/i,
  /refresh_token/i,
  /accesstoken/i,
  /access_token/i,
  /passhash/i,
  /passwordhash/i,
  /password_hash/i,
  /salt/i,
  /nonce/i,
  /database_url/i,
  /databaseurl/i,
  /dsn/i,
];

export const SENSITIVE_VALUE_PATTERNS: RegExp[] = [
  /-----BEGIN\s+[A-Z0-9_-]+\s+PRIVATE KEY-----[\s\S]*?-----END\s+[A-Z0-9_-]+\s+PRIVATE KEY-----/g,
  /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g, // JWT
  /(?:postgres|postgresql|mysql|mongodb):\/\/[^\s:]+:[^\s@]+@[^\s\/]+/gi, // DB Connection URI
  /(?:sk|pk|api|key)_[a-zA-Z0-9_-]{20,}/g, // Standard API Key patterns
  /\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+/g, // Argon2id hash
];

export class SecretRedactor {
  /**
   * Checks whether a field name corresponds to a security-sensitive credential or secret.
   */
  static isSensitiveKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }

  /**
   * Recursively redacts sensitive keys and values from an arbitrary data structure.
   */
  static redact(data: unknown, depth = 0): unknown {
    if (depth > 12 || data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.redactString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redact(item, depth + 1));
    }

    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(data as Record<string, any>)) {
        if (this.isSensitiveKey(key)) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.redact(value, depth + 1);
        } else if (typeof value === 'string') {
          result[key] = this.redactString(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return data;
  }

  /**
   * Redacts sensitive token patterns, private keys, and connection strings from raw string text.
   */
  static redactString(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let sanitized = text;
    for (const pattern of SENSITIVE_VALUE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    }

    return sanitized;
  }

  /**
   * Evaluates an object or string to ensure no secrets leaked into it.
   */
  static evaluateRedaction(data: unknown): {
    safe: boolean;
    decision: string;
    leakedFields: string[];
  } {
    const leakedFields: string[] = [];

    const check = (item: unknown, path = '') => {
      if (!item || typeof item !== 'object') {
        if (typeof item === 'string') {
          for (const pattern of SENSITIVE_VALUE_PATTERNS) {
            if (pattern.test(item)) {
              leakedFields.push(path || 'string_value');
            }
          }
        }
        return;
      }

      if (Array.isArray(item)) {
        item.forEach((elem, idx) => check(elem, `${path}[${idx}]`));
        return;
      }

      for (const [k, v] of Object.entries(item as Record<string, any>)) {
        const currentPath = path ? `${path}.${k}` : k;
        if (
          this.isSensitiveKey(k) &&
          v !== '[REDACTED]' &&
          v !== '[REDACTED_SECRET]'
        ) {
          leakedFields.push(currentPath);
        } else {
          check(v, currentPath);
        }
      }
    };

    check(data);

    if (leakedFields.length > 0) {
      return {
        safe: false,
        decision: 'SECRET_LEAK_DETECTED',
        leakedFields,
      };
    }

    return {
      safe: true,
      decision: 'LOG_SECRET_REDACTED',
      leakedFields: [],
    };
  }
}
