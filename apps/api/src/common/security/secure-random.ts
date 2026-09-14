import { randomBytes, randomUUID } from 'crypto';
import { MINIMUM_ENTROPY_BYTES } from './crypto-policy';

/**
 * S-06 Secure Randomness Provider (CSPRNG)
 *
 * Enforces that all security-sensitive tokens, keys, salts, and identifiers
 * originate from a cryptographically secure pseudo-random number generator (CSPRNG).
 * Strictly forbids Math.random(), timestamp secrets, and predictable UUIDs.
 */

export class SecureRandomProvider {
  /**
   * Generates cryptographically secure random bytes.
   * Fails closed if the entropy source is unavailable or length is invalid.
   */
  static generateRandomBytes(lengthBytes: number): Buffer {
    if (
      !lengthBytes ||
      lengthBytes < 1 ||
      typeof lengthBytes !== 'number' ||
      isNaN(lengthBytes)
    ) {
      throw new Error(
        `[S06-I01] Invalid byte length requested for CSPRNG: ${lengthBytes}`,
      );
    }
    try {
      return randomBytes(lengthBytes);
    } catch (err: any) {
      throw new Error(
        `[S06-I01] Cryptographic random number generator unavailable: ${err?.message}`,
      );
    }
  }

  /**
   * Generates a secure hex-encoded random string.
   */
  static generateHex(
    lengthBytes: number = MINIMUM_ENTROPY_BYTES.REFRESH_TOKEN,
  ): string {
    return this.generateRandomBytes(lengthBytes).toString('hex');
  }

  /**
   * Generates a secure base64url-encoded random string.
   */
  static generateBase64Url(
    lengthBytes: number = MINIMUM_ENTROPY_BYTES.REFRESH_TOKEN,
  ): string {
    return this.generateRandomBytes(lengthBytes).toString('base64url');
  }

  /**
   * Generates a cryptographically secure Refresh Token (256 bits).
   */
  static generateRefreshToken(): string {
    return this.generateHex(MINIMUM_ENTROPY_BYTES.REFRESH_TOKEN);
  }

  /**
   * Generates a cryptographically secure Session Identifier (256 bits).
   */
  static generateSessionId(): string {
    return this.generateHex(MINIMUM_ENTROPY_BYTES.SESSION_ID);
  }

  /**
   * Generates a cryptographically secure Password Reset Token (256 bits).
   */
  static generatePasswordResetToken(): string {
    return this.generateHex(MINIMUM_ENTROPY_BYTES.PASSWORD_RESET_TOKEN);
  }

  /**
   * Generates a cryptographically secure Email Verification Token (256 bits).
   */
  static generateVerificationToken(): string {
    return this.generateHex(MINIMUM_ENTROPY_BYTES.VERIFICATION_TOKEN);
  }

  /**
   * Generates a cryptographically secure CSRF Token (256 bits).
   */
  static generateCsrfToken(): string {
    return this.generateHex(MINIMUM_ENTROPY_BYTES.CSRF_TOKEN);
  }

  /**
   * Generates a cryptographically secure Cryptographic Nonce (128 bits minimum).
   */
  static generateNonce(
    lengthBytes: number = MINIMUM_ENTROPY_BYTES.NONCE,
  ): string {
    return this.generateHex(lengthBytes);
  }

  /**
   * Generates a cryptographically secure Salt (128 bits minimum).
   */
  static generateSalt(
    lengthBytes: number = MINIMUM_ENTROPY_BYTES.SALT,
  ): Buffer {
    return this.generateRandomBytes(lengthBytes);
  }

  /**
   * Generates a secure v4 UUID using crypto.randomUUID (CSPRNG-backed).
   */
  static generateUuid(): string {
    return randomUUID();
  }

  /**
   * Evaluates the entropy and source validity of a generated token.
   * Fails closed if token is predictable, weak, or Math.random derived.
   */
  static evaluateTokenEntropy(
    token: string | null | undefined,
    minimumBytes: number = MINIMUM_ENTROPY_BYTES.REFRESH_TOKEN,
  ): { valid: boolean; decision: string; reason?: string } {
    if (!token || typeof token !== 'string') {
      return {
        valid: false,
        decision: 'MISSING_RANDOMNESS_REJECTED',
        reason: 'Token is null, undefined, or not a string.',
      };
    }

    const trimmed = token.trim();

    // Check for obvious Math.random / predictable patterns
    if (
      /^0\.\d+$/.test(trimmed) ||
      /^(test|token|1234|admin|mock|dummy|predictable)/i.test(trimmed)
    ) {
      return {
        valid: false,
        decision: 'INSECURE_RNG_BLOCKED',
        reason: 'Token matches predictable or insecure random pattern.',
      };
    }

    // Check minimum byte length (for hex: 2 chars per byte; for base64: ~1.33 chars per byte)
    const isHex = /^[0-9a-fA-F]+$/.test(trimmed);
    const estimatedBytes = isHex
      ? trimmed.length / 2
      : Buffer.from(trimmed, 'base64url').length;

    if (estimatedBytes < minimumBytes) {
      return {
        valid: false,
        decision: 'WEAK_ENTROPY_REJECTED',
        reason: `Token entropy (${estimatedBytes} bytes) is below the required minimum (${minimumBytes} bytes).`,
      };
    }

    return {
      valid: true,
      decision: 'CSPRNG_ENFORCED',
    };
  }
}
