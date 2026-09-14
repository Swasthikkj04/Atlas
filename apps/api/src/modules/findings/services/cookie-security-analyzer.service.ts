import { Injectable, Logger } from '@nestjs/common';
import {
  CookieClassification,
  CookieClassificationConfidence,
  CookieSecurityAssessment,
  NormalizedCookieObservation,
  SameSitePolicy,
} from '../contracts/cookie-security.interface';

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

@Injectable()
export class CookieSecurityAnalyzerService {
  private readonly logger = new Logger(CookieSecurityAnalyzerService.name);

  /**
   * Parses raw Set-Cookie headers into sanitized, normalized cookie observations.
   */
  parseSetCookieHeaders(
    rawHeaders: Record<string, any> | undefined | null,
    snapshotId?: string,
    observationTimestamp?: string,
  ): NormalizedCookieObservation[] {
    if (!rawHeaders) {
      return [];
    }

    const setCookieValue =
      rawHeaders['set-cookie'] ||
      rawHeaders['Set-Cookie'] ||
      rawHeaders['SET-COOKIE'];

    if (!setCookieValue) {
      return [];
    }

    const rawCookies: string[] = [];

    if (Array.isArray(setCookieValue)) {
      for (const item of setCookieValue) {
        if (typeof item === 'string' && item.trim()) {
          rawCookies.push(item.trim());
        }
      }
    } else if (typeof setCookieValue === 'string' && setCookieValue.trim()) {
      // Handle comma-separated multiple Set-Cookie headers without splitting on Expires dates (e.g. 'Expires=Wed, 21 Oct ...')
      const cookies = this.splitSetCookieHeader(setCookieValue);
      rawCookies.push(...cookies);
    }

    const timestamp = observationTimestamp || new Date().toISOString();
    const parsed: NormalizedCookieObservation[] = [];

    for (const raw of rawCookies) {
      const observation = this.parseSingleSetCookie(raw, snapshotId, timestamp);
      if (observation) {
        parsed.push(observation);
      }
    }

    return parsed;
  }

  /**
   * Safely splits multiple Set-Cookie header strings that might be joined with commas.
   */
  private splitSetCookieHeader(headerStr: string): string[] {
    if (!headerStr.includes(',')) {
      return [headerStr.trim()];
    }

    // Split on commas that precede a new cookie assignment (e.g., ", other_cookie="),
    // avoiding commas in Expires dates (e.g., "Expires=Wed, 21 Oct 2026")
    return headerStr
      .split(/,\s*(?=[a-zA-Z0-9_\-\.]+=)/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Parses a single Set-Cookie string.
   */
  parseSingleSetCookie(
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
        const parsedAge = parseInt(
          part.substring('max-age='.length).trim(),
          10,
        );
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

    const { classification, confidence } = this.classifyCookie(name);

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

  /**
   * Conservatively classifies a cookie based on structural naming patterns.
   */
  classifyCookie(cookieName: string): {
    classification: CookieClassification;
    confidence: CookieClassificationConfidence;
  } {
    for (const pattern of KNOWN_CONFIRMED_SESSION_PATTERNS) {
      if (pattern.test(cookieName)) {
        return {
          classification: 'CONFIRMED_SESSION',
          confidence: 'HIGH',
        };
      }
    }

    for (const pattern of KNOWN_ORDINARY_NON_SENSITIVE_PATTERNS) {
      if (pattern.test(cookieName)) {
        return {
          classification: 'ORDINARY_NON_SENSITIVE',
          confidence: 'HIGH',
        };
      }
    }

    for (const pattern of KNOWN_INDICATIVE_AUTH_PATTERNS) {
      if (pattern.test(cookieName)) {
        return {
          classification: 'STRONGLY_INDICATIVE_AUTH',
          confidence: 'MEDIUM',
        };
      }
    }

    return {
      classification: 'ORDINARY_NON_SENSITIVE',
      confidence: 'LOW',
    };
  }

  /**
   * Assesses the complete security posture of observed cookies.
   */
  assessCookieSecurity(
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
    const missingSameSite = sessionCookies.filter(
      (c) => c.sameSite === 'Missing',
    );
    const sameSiteNoneWithoutSecure = sessionCookies.filter(
      (c) => c.sameSite === 'None' && !c.isSecure,
    );

    const fullySecuredCookies = cookies.filter(
      (c) =>
        c.isSecure &&
        c.isHttpOnly &&
        (c.sameSite === 'Strict' || c.sameSite === 'Lax'),
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
}
