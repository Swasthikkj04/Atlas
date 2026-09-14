/**
 * S-06 Cryptographic Policy & Algorithm Allowlist
 *
 * Defines canonical server-side cryptographic algorithm allowlists,
 * key size requirements, password hashing parameters, symmetric encryption
 * standards (AES-256-GCM), and fail-closed validation rules.
 */

export const PERMITTED_JWT_ALGORITHMS = [
  'HS256',
  'RS256',
  'ES256',
  'EdDSA',
] as const;
export type PermittedJwtAlgorithm = (typeof PERMITTED_JWT_ALGORITHMS)[number];

export const PROHIBITED_JWT_ALGORITHMS = [
  'none',
  'NONE',
  'None',
  'HS1',
  'HS384', // Disallowed if not explicitly in server allowlist
  'MD5',
  'SHA1',
  'DES',
  'RC4',
] as const;

export const CANONICAL_PASSWORD_HASH_CONFIG = {
  algorithm: 'Argon2id' as const,
  version: '1.3',
  memoryCost: 65536, // 64 MB minimum
  timeCost: 3, // 3 iterations minimum
  parallelism: 4, // 4 threads
  saltLength: 16, // 16 bytes (128 bits)
  hashLength: 32, // 32 bytes (256 bits)
};

export const MINIMUM_ENTROPY_BYTES = {
  REFRESH_TOKEN: 32, // 256 bits
  SESSION_ID: 32, // 256 bits
  PASSWORD_RESET_TOKEN: 32, // 256 bits
  VERIFICATION_TOKEN: 32, // 256 bits
  CSRF_TOKEN: 32, // 256 bits
  NONCE: 16, // 128 bits
  SALT: 16, // 128 bits
  SYMMETRIC_KEY: 32, // 256 bits (AES-256)
  SYMMETRIC_IV: 12, // 96 bits (GCM standard)
  AUTH_TAG: 16, // 128 bits (GCM standard)
};

export const CANONICAL_ENCRYPTION_CONFIG = {
  cipher: 'aes-256-gcm' as const,
  keyLengthBytes: 32, // 256 bits
  ivLengthBytes: 12, // 96 bits
  tagLengthBytes: 16, // 128 bits
  kdf: 'hkdf-sha256' as const,
};

export const CANONICAL_TOKEN_HASH_CONFIG = {
  algorithm: 'sha256' as const,
  digestEncoding: 'hex' as const,
};

export interface CryptoPolicyEvaluationResult {
  valid: boolean;
  algorithm: string;
  decision: string;
  reason?: string;
}

/**
 * Validates whether a requested JWT signing/verification algorithm is permitted.
 * Fails closed if the algorithm is not on the strict server-side allowlist.
 */
export function evaluateJwtAlgorithm(
  alg: string | null | undefined,
): CryptoPolicyEvaluationResult {
  if (!alg || typeof alg !== 'string') {
    return {
      valid: false,
      algorithm: 'UNKNOWN',
      decision: 'MISSING_ALGORITHM_REJECTED',
      reason: 'Algorithm declaration is missing or invalid.',
    };
  }

  const normalized = alg.trim();

  if (normalized.toLowerCase() === 'none') {
    return {
      valid: false,
      algorithm: normalized,
      decision: 'ALGORITHM_CONFUSION_BLOCKED',
      reason: 'Algorithm "none" is strictly prohibited.',
    };
  }

  if ((PERMITTED_JWT_ALGORITHMS as readonly string[]).includes(normalized)) {
    return {
      valid: true,
      algorithm: normalized,
      decision: 'ALGORITHM_PERMITTED',
    };
  }

  return {
    valid: false,
    algorithm: normalized,
    decision: 'UNAPPROVED_ALGORITHM_REJECTED',
    reason: `Algorithm "${normalized}" is not on the server-approved cryptographic allowlist.`,
  };
}

/**
 * Validates password hashing parameters to prevent silent downgrade attacks.
 */
export function evaluatePasswordHashParams(params: {
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (
    params.memoryCost !== undefined &&
    params.memoryCost < CANONICAL_PASSWORD_HASH_CONFIG.memoryCost
  ) {
    violations.push(
      `memoryCost (${params.memoryCost}) is below minimum requirement (${CANONICAL_PASSWORD_HASH_CONFIG.memoryCost})`,
    );
  }

  if (
    params.timeCost !== undefined &&
    params.timeCost < CANONICAL_PASSWORD_HASH_CONFIG.timeCost
  ) {
    violations.push(
      `timeCost (${params.timeCost}) is below minimum requirement (${CANONICAL_PASSWORD_HASH_CONFIG.timeCost})`,
    );
  }

  if (
    params.parallelism !== undefined &&
    params.parallelism < CANONICAL_PASSWORD_HASH_CONFIG.parallelism
  ) {
    violations.push(
      `parallelism (${params.parallelism}) is below minimum requirement (${CANONICAL_PASSWORD_HASH_CONFIG.parallelism})`,
    );
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
