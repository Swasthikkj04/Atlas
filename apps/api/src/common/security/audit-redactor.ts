/**
 * S-09 Mandatory Redaction Boundary for Observability & Audit
 *
 * Implements S09-I08:
 * - Redacts passwords, tokens, secrets, encryption keys, and raw payloads from audit records and logs
 * - Enforces zero secret leakage in audit streams
 */

export const AUDIT_FORBIDDEN_FIELDS = new Set([
  'password',
  'confirmpassword',
  'accesstoken',
  'refreshtoken',
  'rawrefreshtoken',
  'authorization',
  'clientsecret',
  'oauthsecret',
  'privatekey',
  'signingkey',
  'encryptionkey',
  'passwordhash',
  'salt',
  'nonce',
  'dbconnectionstring',
  'databaseurl',
  'apikey',
  'rawcollectorpayload',
  'rawpayload',
  'requestbody',
]);

export class AuditRedactor {
  /**
   * Deeply cleans metadata and properties for audit record safety.
   */
  static redactAuditMetadata(
    metadata?: Record<string, any>,
  ): Record<string, any> | undefined {
    if (!metadata || typeof metadata !== 'object') return metadata;

    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (AUDIT_FORBIDDEN_FIELDS.has(normKey)) {
        cleaned[key] = '[REDACTED_SECRET]';
        continue;
      }

      if (value && typeof value === 'object' && !(value instanceof Date)) {
        if (Array.isArray(value)) {
          cleaned[key] = value.map((item) =>
            typeof item === 'object' ? this.redactAuditMetadata(item) : item,
          );
        } else {
          cleaned[key] = this.redactAuditMetadata(value);
        }
      } else if (typeof value === 'string') {
        // Redact potential jwt or bearer token strings
        if (
          /^Bearer\s+[A-Za-z0-9\-_.]+/i.test(value) ||
          /eyJ[A-Za-z0-9\-_]+\.eyJ/i.test(value)
        ) {
          cleaned[key] = '[REDACTED_BEARER_TOKEN]';
        } else if (normKey.includes('email')) {
          cleaned[key] = '[REDACTED_EMAIL]';
        } else {
          cleaned[key] = value;
        }
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }
}
