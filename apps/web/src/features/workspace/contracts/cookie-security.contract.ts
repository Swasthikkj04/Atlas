/**
 * S1 — Cookie & Session Security Intelligence Contracts (Web Frontend)
 *
 * Invariants:
 * 1. Observed cookie behavior -> Security interpretation -> Finding -> Evidence-backed remediation
 * 2. Never expose raw cookie tokens or passwords in the UI (always redacted in evidence drawers)
 * 3. Never claim active XSS or CSRF exploitation from cookie attributes alone
 */

export const S1_FRONTEND_CERTIFIED_INVARIANTS = {
  S1_OBSERVED_COOKIE_BEHAVIOR_INTEGRITY: true,
  S1_CLASSIFICATION_CONSERVATIVE: true,
  S1_HTTPONLY_EVIDENCE_GROUNDED: true,
  S1_SECURE_TRANSPORT_ALIGNED: true,
  S1_SAMESITE_CONTROL_SEPARATED: true,
  S1_COOKIE_ATTRIBUTE_CORRELATED: true,
  S1_SENSITIVE_VALUE_REDACTION: true,
  S1_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION: true,
  S1_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S1_ANTI_OVERREACH_ENFORCEMENT: true,
  S1_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type CookieClassification =
  | 'CONFIRMED_SESSION'
  | 'STRONGLY_INDICATIVE_AUTH'
  | 'POTENTIAL_SESSION'
  | 'ORDINARY_NON_SENSITIVE';

export type CookieClassificationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type SameSitePolicy = 'Strict' | 'Lax' | 'None' | 'Missing';

export interface NormalizedCookieObservation {
  readonly name: string;
  readonly valueRedacted: string;
  readonly rawSetCookieRedacted: string;
  readonly isSecure: boolean;
  readonly isHttpOnly: boolean;
  readonly sameSite: SameSitePolicy;
  readonly sameSiteRaw?: string;
  readonly domain?: string;
  readonly path?: string;
  readonly maxAge?: number;
  readonly expires?: string;
  readonly isPartitioned: boolean;
  readonly classification: CookieClassification;
  readonly classificationConfidence: CookieClassificationConfidence;
  readonly whatThisDoesNotProve: string;
  readonly observationTimestamp: string;
  readonly snapshotId?: string;
}

export interface CookieSecurityAssessment {
  readonly totalCookies: number;
  readonly cookies: NormalizedCookieObservation[];
  readonly sessionCookies: NormalizedCookieObservation[];
  readonly missingHttpOnly: NormalizedCookieObservation[];
  readonly missingSecure: NormalizedCookieObservation[];
  readonly missingSameSite: NormalizedCookieObservation[];
  readonly sameSiteNoneWithoutSecure: NormalizedCookieObservation[];
  readonly fullySecuredCookies: NormalizedCookieObservation[];
  readonly securityGapsCount: number;
  readonly summary: string;
}

const KNOWN_CONFIRMED_SESSION_PATTERNS = [
  /^connect\.sid$/i,
  /^sails\.sid$/i,
  /^jsessionid$/i,
  /^phpsessid$/i,
  /^asp\.net_sessionid$/i,
  /^\.aspnetcore\.session$/i,
  /^\.aspnetcore\.cookies$/i,
  /^_session_id$/i,
  /^laravel_session$/i,
  /^__session$/i,
];

const KNOWN_INDICATIVE_AUTH_PATTERNS = [
  /session/i,
  /sessionid/i,
  /auth/i,
  /token/i,
  /jwt/i,
  /access_token/i,
  /refresh_token/i,
  /id_token/i,
  /remember_token/i,
  /user_session/i,
  /secure_session/i,
];

const KNOWN_ORDINARY_NON_SENSITIVE_PATTERNS = [
  /^theme$/i,
  /^lang$/i,
  /^locale$/i,
  /^mode$/i,
  /^view_mode$/i,
  /^cookie_consent$/i,
  /^cookies_accepted$/i,
  /^_ga$/i,
  /^_gid$/i,
  /^_gat/i,
  /^cart_id$/i,
  /^ui_pref/i,
];

export function classifyFrontendCookie(cookieName: string): {
  classification: CookieClassification;
  confidence: CookieClassificationConfidence;
} {
  for (const pattern of KNOWN_CONFIRMED_SESSION_PATTERNS) {
    if (pattern.test(cookieName)) {
      return { classification: 'CONFIRMED_SESSION', confidence: 'HIGH' };
    }
  }

  for (const pattern of KNOWN_ORDINARY_NON_SENSITIVE_PATTERNS) {
    if (pattern.test(cookieName)) {
      return { classification: 'ORDINARY_NON_SENSITIVE', confidence: 'HIGH' };
    }
  }

  for (const pattern of KNOWN_INDICATIVE_AUTH_PATTERNS) {
    if (pattern.test(cookieName)) {
      return { classification: 'STRONGLY_INDICATIVE_AUTH', confidence: 'MEDIUM' };
    }
  }

  return { classification: 'ORDINARY_NON_SENSITIVE', confidence: 'LOW' };
}

export function parseFrontendCookieString(
  rawCookie: string,
  snapshotId?: string,
  timestamp?: string,
): NormalizedCookieObservation | null {
  if (!rawCookie || typeof rawCookie !== 'string') {
    return null;
  }

  const parts = rawCookie.split(';').map((p) => p.trim());
  if (parts.length === 0 || !parts[0]) {
    return null;
  }

  const nameValuePart = parts[0];
  const eqIdx = nameValuePart.indexOf('=');
  if (eqIdx === -1) {
    return null;
  }

  const name = nameValuePart.substring(0, eqIdx).trim();
  if (!name) {
    return null;
  }

  let isSecure = false;
  let isHttpOnly = false;
  let sameSite: SameSitePolicy = 'Missing';
  let sameSiteRaw: string | undefined = undefined;
  let domain: string | undefined = undefined;
  let path: string | undefined = undefined;
  let maxAge: number | undefined = undefined;
  let expires: string | undefined = undefined;
  let isPartitioned = false;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lower = part.toLowerCase();

    if (lower === 'secure') {
      isSecure = true;
    } else if (lower === 'httponly') {
      isHttpOnly = true;
    } else if (lower === 'partitioned') {
      isPartitioned = true;
    } else if (lower.startsWith('samesite=')) {
      const val = part.substring('samesite='.length).trim();
      sameSiteRaw = val;
      const valLower = val.toLowerCase();
      if (valLower === 'strict') {
        sameSite = 'Strict';
      } else if (valLower === 'lax') {
        sameSite = 'Lax';
      } else if (valLower === 'none') {
        sameSite = 'None';
      } else {
        sameSite = 'Missing';
      }
    } else if (lower.startsWith('domain=')) {
      domain = part.substring('domain='.length).trim();
    } else if (lower.startsWith('path=')) {
      path = part.substring('path='.length).trim();
    } else if (lower.startsWith('max-age=')) {
      const parsedAge = parseInt(part.substring('max-age='.length).trim(), 10);
      if (!isNaN(parsedAge)) {
        maxAge = parsedAge;
      }
    } else if (lower.startsWith('expires=')) {
      expires = part.substring('expires='.length).trim();
    }
  }

  const valueRedacted = '[REDACTED]';
  const otherAttributes = parts.slice(1).join('; ');
  const rawSetCookieRedacted = otherAttributes
    ? `${name}=${valueRedacted}; ${otherAttributes}`
    : `${name}=${valueRedacted}`;

  const { classification, confidence } = classifyFrontendCookie(name);

  return {
    name,
    valueRedacted,
    rawSetCookieRedacted,
    isSecure,
    isHttpOnly,
    sameSite,
    sameSiteRaw,
    domain,
    path,
    maxAge,
    expires,
    isPartitioned,
    classification,
    classificationConfidence: confidence,
    whatThisDoesNotProve:
      'This cookie appears session-related based on its observable naming and attributes. This does not prove that it authenticates users or grants authorization.',
    observationTimestamp: timestamp || new Date().toISOString(),
    snapshotId,
  };
}

export function evaluateFrontendCookieSecurity(
  cookies: NormalizedCookieObservation[],
  isHttps = true,
): CookieSecurityAssessment {
  const sessionCookies = cookies.filter(
    (c) =>
      c.classification === 'CONFIRMED_SESSION' ||
      c.classification === 'STRONGLY_INDICATIVE_AUTH',
  );

  const missingHttpOnly = sessionCookies.filter((c) => !c.isHttpOnly);
  const missingSecure = isHttps
    ? sessionCookies.filter((c) => !c.isSecure)
    : [];
  const missingSameSite = sessionCookies.filter((c) => c.sameSite === 'Missing');
  const sameSiteNoneWithoutSecure = sessionCookies.filter(
    (c) => c.sameSite === 'None' && !c.isSecure,
  );

  const fullySecuredCookies = cookies.filter(
    (c) => c.isSecure && c.isHttpOnly && (c.sameSite === 'Strict' || c.sameSite === 'Lax'),
  );

  const securityGapsCount =
    missingHttpOnly.length +
    missingSecure.length +
    missingSameSite.length +
    sameSiteNoneWithoutSecure.length;

  let summary = 'No cookies observed';
  if (cookies.length > 0) {
    if (securityGapsCount === 0) {
      summary = `${cookies.length} cookie(s) observed with complete security attribute protection.`;
    } else {
      summary = `${cookies.length} cookie(s) observed: ${securityGapsCount} security configuration gap(s) identified.`;
    }
  }

  return {
    totalCookies: cookies.length,
    cookies,
    sessionCookies,
    missingHttpOnly,
    missingSecure,
    missingSameSite,
    sameSiteNoneWithoutSecure,
    fullySecuredCookies,
    securityGapsCount,
    summary,
  };
}

export function verifyCookieRedactionSafety(
  cookies: NormalizedCookieObservation[],
): boolean {
  for (const cookie of cookies) {
    if (cookie.valueRedacted !== '[REDACTED]') {
      return false;
    }
    if (!cookie.rawSetCookieRedacted.includes('[REDACTED]')) {
      return false;
    }
  }
  return true;
}
