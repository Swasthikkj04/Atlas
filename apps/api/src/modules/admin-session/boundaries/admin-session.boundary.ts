import {
  ADMIN_AUTH_POLICY,
  AdminJwtPayload,
} from '../contracts/admin-session.contract';
import {
  AdminJwtInvalidException,
  AdminUserJwtCrossoverException,
} from '../exceptions/admin-session.exception';

/**
 * ADMIN-005: Admin Session & JWT Boundary
 *
 * Hard boundary enforcement preventing User JWT crossover,
 * validating token claims, and preventing secret leakage.
 */
export class AdminSessionBoundary {
  /**
   * Enforces that standard User JWTs cannot cross into the Admin plane.
   */
  static assertNotUserToken(payload: any): void {
    if (!payload || typeof payload !== 'object') {
      throw new AdminJwtInvalidException('Invalid token payload format.');
    }

    // Check for user-plane markers
    if (
      payload.iss === 'nebula-auth' ||
      payload.typ === 'user-access' ||
      payload.userId !== undefined ||
      payload.email !== undefined
    ) {
      throw new AdminUserJwtCrossoverException(
        'User JWT credentials cannot be used to authenticate into the Admin plane.',
      );
    }
  }

  /**
   * Enforces cryptographic claims on incoming Admin JWT.
   */
  static assertAdminJwtClaims(payload: AdminJwtPayload): void {
    if (!payload || typeof payload !== 'object') {
      throw new AdminJwtInvalidException('Invalid Admin JWT payload.');
    }

    if (payload.iss !== ADMIN_AUTH_POLICY.issuer) {
      throw new AdminJwtInvalidException(
        `Invalid token issuer: expected ${ADMIN_AUTH_POLICY.issuer}`,
      );
    }

    if (payload.aud !== ADMIN_AUTH_POLICY.audience) {
      throw new AdminJwtInvalidException(
        `Invalid token audience: expected ${ADMIN_AUTH_POLICY.audience}`,
      );
    }

    if (payload.typ !== ADMIN_AUTH_POLICY.tokenType) {
      throw new AdminJwtInvalidException(
        `Invalid token type: expected ${ADMIN_AUTH_POLICY.tokenType}`,
      );
    }

    if (
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      payload.sub.trim().length === 0
    ) {
      throw new AdminJwtInvalidException(
        'Admin JWT missing sub (adminIdentityId) claim.',
      );
    }

    if (
      !payload.sid ||
      typeof payload.sid !== 'string' ||
      payload.sid.trim().length === 0
    ) {
      throw new AdminJwtInvalidException(
        'Admin JWT missing sid (adminSessionId) claim.',
      );
    }

    if (payload.aal !== 'AAL3') {
      throw new AdminJwtInvalidException(
        'Admin JWT missing required AAL3 assurance level.',
      );
    }
  }

  /**
   * Verifies that sensitive cryptographic secrets or tokens are never leaked into log payloads.
   */
  static assertNoSecretLeakage(data: any): void {
    const forbiddenKeys = [
      'signingKey',
      'privateKey',
      'secret',
      'ADMIN_JWT_SECRET',
      'cookie',
      'cookieSecret',
      'refreshToken',
      'rawAssertion',
    ];

    const stringified = JSON.stringify(data);
    for (const key of forbiddenKeys) {
      if (stringified.includes(key)) {
        throw new Error(
          `SECURITY INVARIANT VIOLATION: Attempted to leak sensitive secret key "${key}" in audit log.`,
        );
      }
    }
  }
}
