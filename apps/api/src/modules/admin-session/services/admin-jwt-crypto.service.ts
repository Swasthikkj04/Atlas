import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ADMIN_AUTH_POLICY,
  AdminJwtPayload,
} from '../contracts/admin-session.contract';
import {
  AdminJwtExpiredException,
  AdminJwtInvalidException,
  AdminTokenTamperedException,
} from '../exceptions/admin-session.exception';
import { AdminSessionBoundary } from '../boundaries/admin-session.boundary';

/**
 * ADMIN-005: Admin JWT Crypto Service
 *
 * Dedicated cryptographic service for signing and verifying Admin access JWTs.
 * Completely isolated from normal User JWT signing keys.
 * Supports key rotation via Key Identifier (kid).
 */
@Injectable()
export class AdminJwtCryptoService {
  private readonly logger = new Logger(AdminJwtCryptoService.name);

  // Dedicated Admin secret boundary (isolated from User JWT_SECRET)
  private readonly primarySecret: string;
  private readonly keyRing: Map<string, string> = new Map();

  constructor() {
    this.primarySecret =
      process.env.ADMIN_JWT_SECRET ||
      process.env.ADMIN_SIGNING_SECRET ||
      'atlas-admin-isolated-cryptographic-signing-secret-2026-production-key-boundary!';

    // Primary active key
    this.keyRing.set(ADMIN_AUTH_POLICY.activeKeyId, this.primarySecret);

    // Support previous rotation keys if configured
    if (process.env.ADMIN_JWT_PREVIOUS_SECRETS) {
      try {
        const previous = JSON.parse(process.env.ADMIN_JWT_PREVIOUS_SECRETS);
        for (const [kid, secret] of Object.entries(previous)) {
          this.keyRing.set(kid, secret as string);
        }
      } catch (err: any) {
        this.logger.warn(
          `Failed to parse ADMIN_JWT_PREVIOUS_SECRETS: ${err?.message}`,
        );
      }
    }
  }

  /**
   * Signs an Admin JWT access token with the active key.
   */
  signAdminToken(params: {
    adminIdentityId: string;
    sessionId: string;
    identifier: string;
    assuranceLevel?: 'AAL3';
  }): { accessToken: string; expiresIn: number } {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = ADMIN_AUTH_POLICY.jwtTtlSeconds; // 900s (15m)
    const exp = now + expiresIn;

    const header = {
      alg: 'HS256',
      typ: 'JWT',
      kid: ADMIN_AUTH_POLICY.activeKeyId,
    };

    const payload: AdminJwtPayload = {
      iss: ADMIN_AUTH_POLICY.issuer,
      aud: ADMIN_AUTH_POLICY.audience,
      typ: 'admin-access',
      sub: params.adminIdentityId,
      sid: params.sessionId,
      identifier: params.identifier,
      aal: params.assuranceLevel || 'AAL3',
      kid: ADMIN_AUTH_POLICY.activeKeyId,
      iat: now,
      exp,
    };

    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.createSignature(
      `${headerB64}.${payloadB64}`,
      this.primarySecret,
    );

    return {
      accessToken: `${headerB64}.${payloadB64}.${signature}`,
      expiresIn,
    };
  }

  /**
   * Cryptographically verifies an Admin JWT token against the key ring.
   */
  verifyAdminToken(token: string): AdminJwtPayload {
    if (!token || typeof token !== 'string') {
      throw new AdminJwtInvalidException('Admin JWT token missing or empty.');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AdminJwtInvalidException('Admin JWT structure malformed.');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // 1. Decode Header
    let header: any;
    try {
      header = JSON.parse(this.base64UrlDecode(headerB64));
    } catch {
      throw new AdminJwtInvalidException('Admin JWT header cannot be decoded.');
    }

    if (header.alg !== 'HS256') {
      throw new AdminJwtInvalidException(
        `Unsupported signing algorithm: ${header.alg}`,
      );
    }

    // 2. Select Secret by Key ID (kid) for Key Rotation Support
    const kid = header.kid || ADMIN_AUTH_POLICY.activeKeyId;
    const secret = this.keyRing.get(kid);

    if (!secret) {
      throw new AdminJwtInvalidException(
        `Unknown or retired key identifier: ${kid}`,
      );
    }

    // 3. Verify Signature with Constant-Time Comparison
    const expectedSignature = this.createSignature(
      `${headerB64}.${payloadB64}`,
      secret,
    );
    const sigBuffer = Buffer.from(signatureB64);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedSigBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)
    ) {
      throw new AdminTokenTamperedException(
        'Admin JWT signature verification failed.',
      );
    }

    // 4. Decode and Validate Payload
    let payload: AdminJwtPayload;
    try {
      payload = JSON.parse(this.base64UrlDecode(payloadB64));
    } catch {
      throw new AdminJwtInvalidException(
        'Admin JWT payload cannot be decoded.',
      );
    }

    // 5. Assert Boundary Invariants
    AdminSessionBoundary.assertNotUserToken(payload);
    AdminSessionBoundary.assertAdminJwtClaims(payload);

    // 6. Check Expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new AdminJwtExpiredException('Admin access JWT token has expired.');
    }

    return payload;
  }

  private createSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('base64url');
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str, 'utf8').toString('base64url');
  }

  private base64UrlDecode(str: string): string {
    return Buffer.from(str, 'base64url').toString('utf8');
  }
}
