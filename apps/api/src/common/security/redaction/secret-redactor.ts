/**
 * S-04 Sensitive Field Redaction & Information Disclosure Protection
 */

export const REDACTED_FIELD_NAMES = new Set([
  'password',
  'passwordconfirmation',
  'newpassword',
  'oldpassword',
  'currentpassword',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'set-cookie',
  'clientsecret',
  'sessionsecret',
  'token',
  'secret',
  'apikey',
  'code',
  'credentials',
]);

export function isSensitiveField(fieldName: string): boolean {
  if (!fieldName || typeof fieldName !== 'string') return false;
  const normalized = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return REDACTED_FIELD_NAMES.has(normalized);
}

export function redactSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 10 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj as Record<string, any>)) {
    if (isSensitiveField(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      result[key] = redactSensitiveData(val, depth + 1);
    } else {
      result[key] = val;
    }
  }

  return result;
}
