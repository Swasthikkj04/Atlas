import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { CANONICAL_TOKEN_HASH_CONFIG } from './crypto-policy';

/**
 * S-06 Token Hashing Engine
 *
 * Implements deterministic SHA-256 token hashing, constant-time comparison,
 * and fail-closed defense against plaintext token persistence.
 */

export class TokenHashingService {
  /**
   * Hashes a raw token using SHA-256 for secure database storage.
   * Plaintext refresh tokens and claim tokens must never be persisted.
   */
  static hashToken(rawToken: string): string {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new Error('[S06-I04] Raw token is missing or invalid for hashing.');
    }

    return createHash(CANONICAL_TOKEN_HASH_CONFIG.algorithm)
      .update(rawToken, 'utf8')
      .digest(CANONICAL_TOKEN_HASH_CONFIG.digestEncoding);
  }

  /**
   * Computes keyed HMAC-SHA256 of a token using a server-side secret key.
   */
  static hmacToken(rawToken: string, secretKey: string): string {
    if (!rawToken || !secretKey) {
      throw new Error(
        '[S06-I04] Token or secret key missing for HMAC computation.',
      );
    }

    return createHmac(CANONICAL_TOKEN_HASH_CONFIG.algorithm, secretKey)
      .update(rawToken, 'utf8')
      .digest(CANONICAL_TOKEN_HASH_CONFIG.digestEncoding);
  }

  /**
   * Constant-time verification of a candidate token hash against the stored hash.
   */
  static verifyTokenHash(
    candidateRawToken: string,
    storedHash: string,
  ): boolean {
    if (!candidateRawToken || !storedHash) {
      return false;
    }

    try {
      const candidateHash = this.hashToken(candidateRawToken);
      const a = Buffer.from(candidateHash, 'hex');
      const b = Buffer.from(storedHash, 'hex');

      if (a.length !== b.length) {
        return false;
      }

      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  /**
   * Evaluates whether a database token field contains a plaintext token vs a secure hash.
   */
  static evaluateTokenStorage(storedTokenValue: string | null | undefined): {
    valid: boolean;
    decision: string;
    reason?: string;
  } {
    if (!storedTokenValue || typeof storedTokenValue !== 'string') {
      return {
        valid: false,
        decision: 'PLAINTEXT_TOKEN_BLOCKED',
        reason: 'Stored token value is empty or invalid.',
      };
    }

    const val = storedTokenValue.trim();

    // Plaintext indicators: raw UUIDs, non-hex strings, short strings, raw JWTs
    if (
      val.startsWith('ey') || // Raw JWT
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val,
      ) || // UUID
      val.length < 64 ||
      !/^[0-9a-fA-F]{64}$/.test(val) // Not a 64-char SHA-256 hex string
    ) {
      return {
        valid: false,
        decision: 'PLAINTEXT_TOKEN_BLOCKED',
        reason:
          'Token in storage appears to be plaintext rather than a SHA-256 hash.',
      };
    }

    return {
      valid: true,
      decision: 'HASHED_TOKEN_VERIFIED',
    };
  }
}
