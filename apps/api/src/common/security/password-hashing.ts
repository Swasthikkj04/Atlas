import * as argon2 from 'argon2';
import { CANONICAL_PASSWORD_HASH_CONFIG } from './crypto-policy';

/**
 * S-06 Password Hashing & Verification Engine
 *
 * Enforces high-assurance Argon2id password hashing, constant-time verification,
 * and fail-closed defense against plaintext persistence and weak algorithms.
 */

export class PasswordHashingService {
  /**
   * Hashes a plaintext password using Argon2id with canonical security parameters.
   * Plaintext passwords must never be persisted or logged.
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new Error('[S06-I02] Password cannot be empty.');
    }

    return argon2.hash(password, {
      type: argon2.argon2id,
      version: 0x13, // 1.3
      memoryCost: CANONICAL_PASSWORD_HASH_CONFIG.memoryCost,
      timeCost: CANONICAL_PASSWORD_HASH_CONFIG.timeCost,
      parallelism: CANONICAL_PASSWORD_HASH_CONFIG.parallelism,
    });
  }

  /**
   * Verifies a plaintext password candidate against an Argon2id hash.
   * Operates in constant time and fails closed on malformed or invalid hashes.
   */
  static async verifyPassword(
    hash: string,
    candidate: string,
  ): Promise<boolean> {
    if (
      !hash ||
      typeof hash !== 'string' ||
      !candidate ||
      typeof candidate !== 'string'
    ) {
      return false;
    }

    // Fail closed if hash format does not match argon2
    if (!hash.startsWith('$argon2id$') && !hash.startsWith('$argon2i$')) {
      return false;
    }

    try {
      return await argon2.verify(hash, candidate);
    } catch {
      return false;
    }
  }

  /**
   * Evaluates if a stored password hash requires parameter upgrade/migration.
   */
  static needsMigration(hash: string): boolean {
    if (!hash || typeof hash !== 'string') return true;
    if (!hash.startsWith('$argon2id$')) return true;

    // Check memory cost param in hash: e.g. $argon2id$v=19$m=65536,t=3,p=4$...
    const memoryMatch = hash.match(/m=(\d+)/);
    if (
      memoryMatch &&
      parseInt(memoryMatch[1], 10) < CANONICAL_PASSWORD_HASH_CONFIG.memoryCost
    ) {
      return true;
    }

    const timeMatch = hash.match(/t=(\d+)/);
    if (
      timeMatch &&
      parseInt(timeMatch[1], 10) < CANONICAL_PASSWORD_HASH_CONFIG.timeCost
    ) {
      return true;
    }

    return false;
  }

  /**
   * Evaluates a password storage entry against S-06 invariants.
   * Rejects plaintext, reversible ciphers, and weak hashing algorithms (MD5, SHA-1, DES).
   */
  static evaluatePasswordStoragePosture(
    storedValue: string | null | undefined,
  ): {
    valid: boolean;
    decision: string;
    reason?: string;
  } {
    if (!storedValue || typeof storedValue !== 'string') {
      return {
        valid: false,
        decision: 'PLAINTEXT_PASSWORD_BLOCKED',
        reason: 'Password record is empty or invalid.',
      };
    }

    const val = storedValue.trim();

    // Check for reversible symmetric encryption (e.g. aes-encrypted prefixes or base64 without hash identifier)
    if (
      val.startsWith('aes:') ||
      val.startsWith('enc:') ||
      val.startsWith('cipher:')
    ) {
      return {
        valid: false,
        decision: 'REVERSIBLE_PASSWORD_BLOCKED',
        reason: 'Reversible password encryption is strictly prohibited.',
      };
    }

    // Check for obvious plaintext passwords
    if (!val.startsWith('$') && val.length < 32) {
      return {
        valid: false,
        decision: 'PLAINTEXT_PASSWORD_BLOCKED',
        reason: 'Password appears to be stored in plaintext.',
      };
    }

    // Check for legacy/weak hashing algorithms
    if (
      val.startsWith('$1$') || // MD5
      val.startsWith('$2$') || // early bcrypt
      val.startsWith('$md5$') ||
      val.startsWith('$sha1$') ||
      /^[0-9a-f]{32}$/i.test(val) || // raw MD5
      /^[0-9a-f]{40}$/i.test(val) // raw SHA-1
    ) {
      return {
        valid: false,
        decision: 'WEAK_HASH_ALGO_REJECTED',
        reason: 'Weak password hashing algorithm detected (MD5/SHA-1/Legacy).',
      };
    }

    // Canonical Argon2id
    if (val.startsWith('$argon2id$')) {
      if (this.needsMigration(val)) {
        return {
          valid: true,
          decision: 'MIGRATION_RECOMMENDED',
        };
      }
      return {
        valid: true,
        decision: 'CANONICAL_ARGON2ID_VERIFIED',
      };
    }

    return {
      valid: false,
      decision: 'WEAK_HASH_ALGO_REJECTED',
      reason: 'Stored hash format is unrecognized or unapproved.',
    };
  }
}
