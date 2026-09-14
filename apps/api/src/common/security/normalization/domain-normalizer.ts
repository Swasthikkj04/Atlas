/**
 * S-04 Domain Input Normalization & Validation Contract
 */

export interface NormalizedDomainResult {
  readonly isValid: boolean;
  readonly canonicalDomain: string;
  readonly rejectionReason?: string;
  readonly errorCode?: string;
}

export const FORBIDDEN_DOMAIN_SCHEMES = [
  'javascript:',
  'data:',
  'file:',
  'vbscript:',
  'about:',
  'blob:',
] as const;

export const RESERVED_DOMAIN_TLDS = [
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
  '.test',
  '.example',
  '.invalid',
] as const;

export const RESERVED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  'metadata.google.internal',
  'instance-data',
]);

export function normalizeAndValidateDomain(
  rawInput: string,
): NormalizedDomainResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      canonicalDomain: '',
      rejectionReason: 'Domain input cannot be empty.',
      errorCode: 'INVALID_DOMAIN_EMPTY',
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      canonicalDomain: '',
      rejectionReason: 'Domain input cannot be whitespace only.',
      errorCode: 'INVALID_DOMAIN_EMPTY',
    };
  }

  const lower = trimmed.toLowerCase();

  // 1. Explicit Scheme Checks
  for (const scheme of FORBIDDEN_DOMAIN_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return {
        isValid: false,
        canonicalDomain: '',
        rejectionReason: `Protocol scheme '${scheme}' is strictly forbidden.`,
        errorCode: 'FORBIDDEN_SCHEME',
      };
    }
  }

  // 2. Protocol Strip (http/https/ftp)
  let cleaned = lower.replace(/^(https?|ftp):\/\//i, '');

  // 3. Reject UserInfo (user:pass@)
  if (cleaned.includes('@')) {
    return {
      isValid: false,
      canonicalDomain: '',
      rejectionReason:
        'UserInfo credentials in domain input are strictly forbidden.',
      errorCode: 'FORBIDDEN_USERINFO',
    };
  }

  // 4. Reject Path, Query, and Fragment
  if (cleaned.includes('/') || cleaned.includes('?') || cleaned.includes('#')) {
    return {
      isValid: false,
      canonicalDomain: '',
      rejectionReason:
        'Domain input must not include URL paths, query parameters, or fragment identifiers.',
      errorCode: 'FORBIDDEN_URL_STRUCTURE',
    };
  }

  // 5. Strip Port if present
  if (cleaned.includes(':') && !cleaned.includes(']')) {
    const parts = cleaned.split(':');
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      cleaned = parts[0];
    } else {
      return {
        isValid: false,
        canonicalDomain: '',
        rejectionReason: 'Invalid port specification in domain.',
        errorCode: 'INVALID_PORT',
      };
    }
  }

  // 6. Remove Trailing Dot
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }

  // 7. Check Raw IP Addresses
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (
    ipv4Regex.test(cleaned) ||
    cleaned.startsWith('[') ||
    cleaned.endsWith(']')
  ) {
    return {
      isValid: false,
      canonicalDomain: cleaned,
      rejectionReason:
        'Direct IP addresses are not permitted as domain targets.',
      errorCode: 'DIRECT_IP_FORBIDDEN',
    };
  }

  // 8. Reserved Hostnames
  if (RESERVED_HOSTNAMES.has(cleaned)) {
    return {
      isValid: false,
      canonicalDomain: cleaned,
      rejectionReason: 'Reserved or internal hostnames are strictly forbidden.',
      errorCode: 'RESERVED_HOSTNAME',
    };
  }

  // 9. Reserved Suffixes
  for (const suffix of RESERVED_DOMAIN_TLDS) {
    if (cleaned.endsWith(suffix)) {
      return {
        isValid: false,
        canonicalDomain: cleaned,
        rejectionReason: `Reserved internal TLD '${suffix}' is strictly forbidden.`,
        errorCode: 'RESERVED_TLD',
      };
    }
  }

  // 10. Length Bounds
  if (cleaned.length > 253) {
    return {
      isValid: false,
      canonicalDomain: cleaned,
      rejectionReason:
        'Domain length exceeds standard 253 character maximum limit.',
      errorCode: 'DOMAIN_TOO_LONG',
    };
  }

  // 11. Hostname Grammar Check
  const domainRegex =
    /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  if (!domainRegex.test(cleaned)) {
    return {
      isValid: false,
      canonicalDomain: cleaned,
      rejectionReason:
        'Domain format does not conform to RFC hostname grammar.',
      errorCode: 'INVALID_DOMAIN_SYNTAX',
    };
  }

  // 12. TLD Verification
  const parts = cleaned.split('.');
  const tld = parts[parts.length - 1];
  if (!/^[a-z]{2,}$/i.test(tld)) {
    return {
      isValid: false,
      canonicalDomain: cleaned,
      rejectionReason:
        'Domain must end in a valid alpha top-level domain of 2+ characters.',
      errorCode: 'INVALID_TLD',
    };
  }

  return {
    isValid: true,
    canonicalDomain: cleaned,
  };
}
