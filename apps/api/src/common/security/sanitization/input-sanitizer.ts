/**
 * S-04 Input Sanitization, Injection Detection & Neutralization Contract
 */

export const INJECTION_PATTERNS = {
  SQL_INJECTION:
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|DECLARE)\b|--|\/\*|\*\/|;|\bOR\b\s+['"\d\w]+\s*=\s*['"\d\w]+|\bAND\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
  RAW_SQL:
    /(\bUNION\s+ALL\s+SELECT\b|\bSELECT\s+.*\s+FROM\b|;\s*DROP\s+TABLE\b)/i,
  SHELL_INJECTION: /(;|\||&&|\|\||`|\$\(|\$\{)/,
  COMMAND_ARGS: /(-{1,2}[a-zA-Z0-9_-]+(\s*=\s*|\s+).*)/,
  PATH_TRAVERSAL: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i,
  ABSOLUTE_PATH: /^(\/|[a-zA-Z]:\\|\/\/)/,
  CRLF_INJECTION: /(\r|\n|%0d|%0a)/i,
  TEMPLATE_INJECTION: /(\{\{|\}\}|\$\{.*\}|<%.*%>|#\{.*\})/i,
  PROTOTYPE_POLLUTION_KEYS: ['__proto__', 'constructor', 'prototype'],
  REDOS_DANGEROUS:
    /(\([a-zA-Z0-9_.*+]+\+?\)\+|(\w+\+)+\w+|([a-zA-Z0-9_.*+]+)\*\1\*)/,
} as const;

/**
 * Neutralizes HTML special characters to prevent reflected and stored XSS.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes input intended for headers or logs to block CRLF and log injection.
 */
export function sanitizeLogAndHeaderString(str: string): string {
  if (typeof str !== 'string') return '';
  // Remove CRLF, control characters, replace newlines with escaped representations
  return str.replace(/[\r\n]/g, ' ').replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Deeply scans an object for prototype pollution keys and deletes them or detects pollution attempt.
 */
export function detectPrototypePollution(payload: unknown): boolean {
  if (payload === null || typeof payload !== 'object') {
    return false;
  }

  if (Array.isArray(payload)) {
    return payload.some(detectPrototypePollution);
  }

  const obj = payload as Record<string, any>;
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (INJECTION_PATTERNS.PROTOTYPE_POLLUTION_KEYS.includes(key as any)) {
      return true;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (detectPrototypePollution(obj[key])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects presence of SQL injection, shell injection, path traversal, or template injection in strings.
 */
export function detectInjectionPayload(input: string): {
  hasInjection: boolean;
  injectionType?:
    'SQL' | 'SHELL' | 'PATH_TRAVERSAL' | 'CRLF' | 'TEMPLATE' | 'REDOS';
  matchedPattern?: string;
} {
  if (typeof input !== 'string') {
    return { hasInjection: false };
  }

  if (INJECTION_PATTERNS.PATH_TRAVERSAL.test(input)) {
    return {
      hasInjection: true,
      injectionType: 'PATH_TRAVERSAL',
      matchedPattern: 'PATH_TRAVERSAL',
    };
  }

  if (INJECTION_PATTERNS.CRLF_INJECTION.test(input)) {
    return {
      hasInjection: true,
      injectionType: 'CRLF',
      matchedPattern: 'CRLF',
    };
  }

  if (INJECTION_PATTERNS.TEMPLATE_INJECTION.test(input)) {
    return {
      hasInjection: true,
      injectionType: 'TEMPLATE',
      matchedPattern: 'TEMPLATE',
    };
  }

  if (INJECTION_PATTERNS.SHELL_INJECTION.test(input)) {
    return {
      hasInjection: true,
      injectionType: 'SHELL',
      matchedPattern: 'SHELL',
    };
  }

  if (INJECTION_PATTERNS.SQL_INJECTION.test(input)) {
    return { hasInjection: true, injectionType: 'SQL', matchedPattern: 'SQL' };
  }

  return { hasInjection: false };
}
