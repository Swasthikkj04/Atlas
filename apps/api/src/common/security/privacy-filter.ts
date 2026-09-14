/**
 * S-08 Privacy-Safe Logging & Telemetry Filter
 *
 * Implements S08-I10:
 * - Redacts personal identifiers (PII), email addresses, credentials, raw collector payloads from logs & telemetry
 * - Deep object scrubbing
 */

export const PII_EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
export const IP_ADDRESS_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export class PrivacyFilter {
  /**
   * Deeply sanitizes an object or string for privacy-safe logging/telemetry.
   */
  static sanitizeForTelemetry<T>(data: T): T {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
      let sanitized = data.replace(PII_EMAIL_REGEX, '[REDACTED_EMAIL]');
      // Mask last octet of IPs for privacy
      sanitized = sanitized.replace(IP_ADDRESS_REGEX, (match) => {
        const parts = match.split('.');
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      });
      return sanitized as unknown as T;
    }

    if (Array.isArray(data)) {
      return data.map((item) =>
        this.sanitizeForTelemetry(item),
      ) as unknown as T;
    }

    if (typeof data === 'object' && !(data instanceof Date)) {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(data)) {
        const normKey = key.toLowerCase();
        if (normKey.includes('email') && typeof val === 'string') {
          result[key] = '[REDACTED_EMAIL]';
        } else if (
          normKey.includes('password') ||
          normKey.includes('secret') ||
          normKey.includes('token')
        ) {
          result[key] = '[REDACTED_SECRET]';
        } else if (
          normKey.includes('rawpayload') ||
          normKey.includes('collectorpayload')
        ) {
          result[key] = '[REDACTED_RAW_PAYLOAD]';
        } else {
          result[key] = this.sanitizeForTelemetry(val);
        }
      }
      return result as unknown as T;
    }

    return data;
  }
}
