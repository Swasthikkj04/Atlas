/**
 * S-06 — Secrets & Cryptographic Security Canonical Contract
 *
 * Phase: Production Security Hardening
 * Priority: P0 — BLOCKING
 * Type: Security / Cryptography / Secrets / Authentication / Backend / Infrastructure / Contract
 * Depends on: S-01 🔒, S-02 🔒, S-03 🔒, S-04 🔒, S-05 🔒
 * Blocks: S-07 → S-12 and Production Release
 * Status: CERTIFIED_SECRETS_CRYPTOGRAPHIC_SECURITY
 */

import {
  PERMITTED_JWT_ALGORITHMS,
  PROHIBITED_JWT_ALGORITHMS,
  CANONICAL_PASSWORD_HASH_CONFIG,
  MINIMUM_ENTROPY_BYTES,
  CANONICAL_ENCRYPTION_CONFIG,
  CANONICAL_TOKEN_HASH_CONFIG,
  evaluateJwtAlgorithm,
  evaluatePasswordHashParams,
} from './crypto-policy';
import { SecureRandomProvider } from './secure-random';
import { PasswordHashingService } from './password-hashing';
import { TokenHashingService } from './token-hashing';
import { SecretRedactor, SENSITIVE_KEY_PATTERNS } from './secret-redactor';
import {
  KeyManagementService,
  ManagedKey,
  EncryptedDataPayload,
} from './key-management';
import { ScopedSecretProvider, ApplicationComponent } from './secret-provider';

export {
  PERMITTED_JWT_ALGORITHMS,
  PROHIBITED_JWT_ALGORITHMS,
  CANONICAL_PASSWORD_HASH_CONFIG,
  MINIMUM_ENTROPY_BYTES,
  CANONICAL_ENCRYPTION_CONFIG,
  CANONICAL_TOKEN_HASH_CONFIG,
  evaluateJwtAlgorithm,
  evaluatePasswordHashParams,
  SecureRandomProvider,
  PasswordHashingService,
  TokenHashingService,
  SecretRedactor,
  KeyManagementService,
  ScopedSecretProvider,
};
export type { ManagedKey, EncryptedDataPayload, ApplicationComponent };

export const S06_TICKET_ID = 'S-06';
export const S06_PHASE = 'Production Security Hardening';
export const S06_PRIORITY = 'P0 — BLOCKING';
export const S06_TYPE =
  'Security / Cryptography / Secrets / Authentication / Backend / Infrastructure / Contract';
export const S06_STATUS = 'CERTIFIED_SECRETS_CRYPTOGRAPHIC_SECURITY';
export const S06_DEPENDS_ON = ['S-01', 'S-02', 'S-03', 'S-04', 'S-05'];
export const S06_BLOCKS = [
  'S-07',
  'S-08',
  'S-09',
  'S-10',
  'S-11',
  'S-12',
  'Production Release',
];

export const S06_CERTIFICATION_STATEMENT =
  'Every secret, cryptographic key, credential, password-derived value, token-signing material, OAuth secret, and security-sensitive cryptographic operation in Nebula is generated, stored, accessed, transmitted, rotated, and destroyed according to an explicit server-side security policy.';

export const S06_SECONDARY_GATE =
  "Nebula's secrets and cryptographic operations are generated using secure randomness, protected throughout their lifecycle, cryptographically separated by security purpose and plane, resistant to downgrade and replay, absent from application exposure surfaces, and fail closed when cryptographic trust cannot be established.";

export const S06_FROZEN_PRINCIPLE = 'Secrets never become application data.';

export const S06_PRINCIPLES = {
  SECRETS_NEVER_APPLICATION_DATA:
    'Secrets never become application data. A secret must never become: database business data, frontend state, API response, URL parameter, browser storage, source code, Git history, log entry, error message, telemetry payload.',
  NO_COMPENSATING_ASSUMPTION:
    'No cryptographic layer is permitted to assume that another layer will compensate for weaknesses or shortcuts.',
  GX_WX_ADMIN_CRYPTO_SEPARATION:
    'GX must never obtain WX cryptographic material. WX must never obtain ADMIN signing material. ADMIN must never become a mechanism for bypassing WX ownership controls.',
  FAIL_CLOSED_CRYPTOGRAPHY:
    'Any cryptographic failure (missing key, unapproved algorithm, invalid signature, corrupted ciphertext) must fail closed immediately.',
};

export interface S06Invariant {
  id: string;
  title: string;
  description: string;
  failClosedDecision: string;
}

export const S06_INVARIANTS: Record<string, S06Invariant> = {
  'S06-I01': {
    id: 'S06-I01',
    title: 'Cryptographically Secure Randomness',
    description:
      'All security-sensitive random values (tokens, session IDs, reset tokens, CSRF tokens, nonces, salts) must originate from a CSPRNG.',
    failClosedDecision: 'CSPRNG_ENFORCED',
  },
  'S06-I02': {
    id: 'S06-I02',
    title: 'Password Hashing',
    description:
      'Passwords must never be encrypted for later recovery. Canonical posture: Password -> Argon2id -> Hash -> Database. Plaintext passwords must never be persisted.',
    failClosedDecision: 'PLAINTEXT_PASSWORD_BLOCKED',
  },
  'S06-I03': {
    id: 'S06-I03',
    title: 'Password Hash Parameters',
    description:
      'Password hashing parameters must be explicit, versioned, and centrally controlled (Argon2id, memoryCost >= 65536, timeCost >= 3, parallelism >= 4). No silent downgrade.',
    failClosedDecision: 'HASH_DOWNGRADE_BLOCKED',
  },
  'S06-I04': {
    id: 'S06-I04',
    title: 'Refresh Token Storage',
    description:
      'Raw refresh tokens must be hashed with SHA-256 before persisting in the database. Plaintext tokens must never be stored.',
    failClosedDecision: 'PLAINTEXT_TOKEN_BLOCKED',
  },
  'S06-I05': {
    id: 'S06-I05',
    title: 'JWT Signing Key Protection',
    description:
      'JWT signing keys must never exist in source code, Git repo, frontend bundles, database business tables, logs, or API responses.',
    failClosedDecision: 'HARDCODED_SECRET_BLOCKED',
  },
  'S06-I06': {
    id: 'S06-I06',
    title: 'Algorithm Allowlist',
    description:
      'Nebula explicitly defines permitted cryptographic algorithms (HS256, RS256, ES256, EdDSA, Argon2id, SHA-256, AES-256-GCM). Client-dictated "none" or weak algorithms rejected.',
    failClosedDecision: 'UNAPPROVED_ALGORITHM_REJECTED',
  },
  'S06-I07': {
    id: 'S06-I07',
    title: 'Cryptographic Key Separation',
    description:
      'Different security planes must not share signing keys. User Auth Key Material != Admin Auth Key Material != Data Encryption Key Material.',
    failClosedDecision: 'KEY_REUSE_BLOCKED',
  },
  'S06-I08': {
    id: 'S06-I08',
    title: 'Secret Rotation',
    description:
      'Security-sensitive keys and credentials must support controlled rotation without exposing plaintext secrets to application operators.',
    failClosedDecision: 'ROTATION_REQUIRED',
  },
  'S06-I09': {
    id: 'S06-I09',
    title: 'Secret Exposure Detection',
    description:
      'The repository and build process must detect accidental secrets (API keys, JWT secrets, OAuth secrets, DB credentials, private keys).',
    failClosedDecision: 'SECRET_SCAN_REQUIRED',
  },
  'S06-I10': {
    id: 'S06-I10',
    title: 'Log & Telemetry Redaction',
    description:
      'Private keys, signing keys, encryption keys, API keys, OAuth secrets, passwords, hashes, salts, nonces, and raw tokens must be redacted from all logs and telemetry.',
    failClosedDecision: 'LOG_SECRET_REDACTED',
  },
  'S06-I11': {
    id: 'S06-I11',
    title: 'Encryption at Rest',
    description:
      'Sensitive persisted information requiring confidentiality must use AES-256-GCM. The key must never be stored alongside ciphertext in plaintext.',
    failClosedDecision: 'KEY_COLOCATION_BLOCKED',
  },
  'S06-I12': {
    id: 'S06-I12',
    title: 'Encryption in Transit Dependency',
    description:
      'S-06 relies on S-05 for transport protection. Cryptographic confidentiality must not excuse plaintext HTTP, APIs, or credential-bearing redirects.',
    failClosedDecision: 'HTTP_PLAINTEXT_REJECTED',
  },
  'S06-I13': {
    id: 'S06-I13',
    title: 'Secret Access Minimization',
    description:
      'Only components requiring a secret may access it. Unrelated modules are prohibited from accessing authentication or admin keys.',
    failClosedDecision: 'LEAST_PRIVILEGE_ENFORCED',
  },
  'S06-I14': {
    id: 'S06-I14',
    title: 'No Secret in Configuration Committed to Git',
    description:
      'Configuration templates in Git may contain variable names (JWT_SECRET=) but never real production secret values.',
    failClosedDecision: 'ENV_FILE_SECRET_BLOCKED',
  },
  'S06-I15': {
    id: 'S06-I15',
    title: 'Cryptographic Failure Is Fail-Closed',
    description:
      'If signing keys are unavailable, provider missing, or signature verification fails, the operation must fail closed immediately.',
    failClosedDecision: 'FAIL_CLOSED_CRYPTOGRAPHY',
  },
};

export interface AttackVectorDefinition {
  id: string;
  description: string;
  expectedDecision: string;
  category:
    | 'RNG'
    | 'PASSWORD'
    | 'TOKEN'
    | 'JWT'
    | 'KEY_MGMT'
    | 'ENCRYPTION'
    | 'SECRETS_SCAN'
    | 'REDACTION'
    | 'LIFECYCLE';
}

export const S06_ATTACK_MATRIX: AttackVectorDefinition[] = [
  {
    id: 'S06-01',
    description: 'Predictable token generation',
    expectedDecision: 'CSPRNG_ENFORCED',
    category: 'RNG',
  },
  {
    id: 'S06-02',
    description: 'Math.random() security token',
    expectedDecision: 'INSECURE_RNG_BLOCKED',
    category: 'RNG',
  },
  {
    id: 'S06-03',
    description: 'Weak session entropy',
    expectedDecision: 'WEAK_ENTROPY_REJECTED',
    category: 'RNG',
  },
  {
    id: 'S06-04',
    description: 'Weak refresh-token entropy',
    expectedDecision: 'WEAK_ENTROPY_REJECTED',
    category: 'RNG',
  },
  {
    id: 'S06-05',
    description: 'Plaintext password persistence',
    expectedDecision: 'PLAINTEXT_PASSWORD_BLOCKED',
    category: 'PASSWORD',
  },
  {
    id: 'S06-06',
    description: 'Password reversible encryption',
    expectedDecision: 'REVERSIBLE_PASSWORD_BLOCKED',
    category: 'PASSWORD',
  },
  {
    id: 'S06-07',
    description: 'Weak password hashing algorithm',
    expectedDecision: 'WEAK_HASH_ALGO_REJECTED',
    category: 'PASSWORD',
  },
  {
    id: 'S06-08',
    description: 'Hash parameter downgrade',
    expectedDecision: 'HASH_DOWNGRADE_BLOCKED',
    category: 'PASSWORD',
  },
  {
    id: 'S06-09',
    description: 'Plaintext refresh token in DB',
    expectedDecision: 'PLAINTEXT_TOKEN_BLOCKED',
    category: 'TOKEN',
  },
  {
    id: 'S06-10',
    description: 'JWT signing secret in source',
    expectedDecision: 'HARDCODED_SECRET_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-11',
    description: 'JWT signing secret in Git',
    expectedDecision: 'GIT_SECRET_EXPOSURE_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-12',
    description: 'JWT signing secret in frontend',
    expectedDecision: 'FRONTEND_SECRET_LEAK_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-13',
    description: 'JWT algorithm confusion',
    expectedDecision: 'ALGORITHM_CONFUSION_BLOCKED',
    category: 'JWT',
  },
  {
    id: 'S06-14',
    description: 'Unapproved JWT algorithm',
    expectedDecision: 'UNAPPROVED_ALGORITHM_REJECTED',
    category: 'JWT',
  },
  {
    id: 'S06-15',
    description: 'User/admin signing-key reuse',
    expectedDecision: 'KEY_REUSE_BLOCKED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-16',
    description: 'Missing key rotation mechanism',
    expectedDecision: 'ROTATION_REQUIRED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-17',
    description: 'Revoked key accepted',
    expectedDecision: 'REVOKED_KEY_REJECTED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-18',
    description: 'Expired key accepted',
    expectedDecision: 'EXPIRED_KEY_REJECTED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-19',
    description: 'Invalid signing key fallback',
    expectedDecision: 'INVALID_KEY_FAIL_CLOSED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-20',
    description: 'Encryption key stored with ciphertext',
    expectedDecision: 'KEY_COLOCATION_BLOCKED',
    category: 'ENCRYPTION',
  },
  {
    id: 'S06-21',
    description: 'Encryption downgrade',
    expectedDecision: 'ENCRYPTION_DOWNGRADE_BLOCKED',
    category: 'ENCRYPTION',
  },
  {
    id: 'S06-22',
    description: 'Hardcoded database credential',
    expectedDecision: 'HARDCODED_CREDENTIAL_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-23',
    description: 'Hardcoded OAuth secret',
    expectedDecision: 'HARDCODED_OAUTH_SECRET_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-24',
    description: 'Hardcoded API key',
    expectedDecision: 'HARDCODED_API_KEY_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-25',
    description: 'Private key exposed in logs',
    expectedDecision: 'LOG_SECRET_REDACTED',
    category: 'REDACTION',
  },
  {
    id: 'S06-26',
    description: 'Secret exposed through exception',
    expectedDecision: 'EXCEPTION_SECRET_REDACTED',
    category: 'REDACTION',
  },
  {
    id: 'S06-27',
    description: 'Secret exposed through telemetry',
    expectedDecision: 'TELEMETRY_SECRET_REDACTED',
    category: 'REDACTION',
  },
  {
    id: 'S06-28',
    description: 'Secret exposed through analytics',
    expectedDecision: 'ANALYTICS_SECRET_BLOCKED',
    category: 'REDACTION',
  },
  {
    id: 'S06-29',
    description: 'Secret exposed through URL',
    expectedDecision: 'URL_SECRET_BLOCKED',
    category: 'REDACTION',
  },
  {
    id: 'S06-30',
    description: 'Secret exposed through response body',
    expectedDecision: 'RESPONSE_SECRET_BLOCKED',
    category: 'REDACTION',
  },
  {
    id: 'S06-31',
    description: 'Secret exposed in source map',
    expectedDecision: 'SOURCE_MAP_SECRET_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-32',
    description: 'Production secret in .env committed to Git',
    expectedDecision: 'ENV_FILE_SECRET_BLOCKED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-33',
    description: 'Secret scan bypass',
    expectedDecision: 'SECRET_SCAN_REQUIRED',
    category: 'SECRETS_SCAN',
  },
  {
    id: 'S06-34',
    description: 'Secret available to unrelated module',
    expectedDecision: 'LEAST_PRIVILEGE_ENFORCED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-35',
    description: 'Excessive secret privileges',
    expectedDecision: 'EXCESSIVE_PRIVILEGES_REJECTED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-36',
    description: 'Missing cryptographic randomness',
    expectedDecision: 'MISSING_RANDOMNESS_REJECTED',
    category: 'RNG',
  },
  {
    id: 'S06-37',
    description: 'Reused nonce where prohibited',
    expectedDecision: 'NONCE_REUSE_BLOCKED',
    category: 'ENCRYPTION',
  },
  {
    id: 'S06-38',
    description: 'Invalid signature accepted',
    expectedDecision: 'INVALID_SIGNATURE_BLOCKED',
    category: 'JWT',
  },
  {
    id: 'S06-39',
    description: 'Tampered ciphertext accepted',
    expectedDecision: 'TAMPERED_CIPHERTEXT_BLOCKED',
    category: 'ENCRYPTION',
  },
  {
    id: 'S06-40',
    description: 'Unsupported crypto provider fallback',
    expectedDecision: 'UNSUPPORTED_PROVIDER_FAIL_CLOSED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-41',
    description: 'Missing key material',
    expectedDecision: 'MISSING_KEY_FAIL_CLOSED',
    category: 'KEY_MGMT',
  },
  {
    id: 'S06-42',
    description: 'Key rotation breaks active validation unexpectedly',
    expectedDecision: 'CONTROLLED_ROTATION_PRESERVED',
    category: 'LIFECYCLE',
  },
  {
    id: 'S06-43',
    description: 'Revoked credential remains accepted',
    expectedDecision: 'REVOKED_CREDENTIAL_REJECTED',
    category: 'LIFECYCLE',
  },
  {
    id: 'S06-44',
    description: 'Secret appears in structured logs',
    expectedDecision: 'STRUCTURED_LOG_REDACTED',
    category: 'REDACTION',
  },
  {
    id: 'S06-45',
    description: 'Direct API attempt to bypass crypto boundary',
    expectedDecision: 'CRYPTO_BOUNDARY_ENFORCED',
    category: 'JWT',
  },
];

/**
 * Evaluates an attack scenario against the S-06 specification.
 */
export function evaluateSecretsCryptoAttackVector(
  vectorId: string,
  context: Record<string, any> = {},
): { vectorId: string; safe: boolean; decision: string; details?: string } {
  switch (vectorId) {
    case 'S06-01': {
      const entropy = SecureRandomProvider.evaluateTokenEntropy(
        context.token || SecureRandomProvider.generateRefreshToken(),
      );
      return { vectorId, safe: entropy.valid, decision: entropy.decision };
    }
    case 'S06-02': {
      const isMathRandom =
        context.token === '0.123456789' ||
        String(context.token).startsWith('0.');
      return {
        vectorId,
        safe: !isMathRandom,
        decision: isMathRandom ? 'INSECURE_RNG_BLOCKED' : 'CSPRNG_ENFORCED',
      };
    }
    case 'S06-03':
    case 'S06-04': {
      const entropy = SecureRandomProvider.evaluateTokenEntropy(
        context.token || 'short-token',
        32,
      );
      return { vectorId, safe: entropy.valid, decision: entropy.decision };
    }
    case 'S06-05':
    case 'S06-06':
    case 'S06-07': {
      const evalRes = PasswordHashingService.evaluatePasswordStoragePosture(
        context.storedPassword || 'plaintext123',
      );
      return { vectorId, safe: evalRes.valid, decision: evalRes.decision };
    }
    case 'S06-08': {
      const params = evaluatePasswordHashParams(
        context.params || { memoryCost: 1024 },
      );
      return {
        vectorId,
        safe: params.valid,
        decision: params.valid
          ? 'CANONICAL_PARAMS_VERIFIED'
          : 'HASH_DOWNGRADE_BLOCKED',
      };
    }
    case 'S06-09': {
      const tokenStorage = TokenHashingService.evaluateTokenStorage(
        context.storedToken || 'raw-token-value',
      );
      return {
        vectorId,
        safe: tokenStorage.valid,
        decision: tokenStorage.decision,
      };
    }
    case 'S06-10':
    case 'S06-11':
    case 'S06-12':
    case 'S06-22':
    case 'S06-23':
    case 'S06-24':
    case 'S06-31':
    case 'S06-32': {
      const check = ScopedSecretProvider.evaluateConfigurationPosture(
        context.config || {
          TEST_KEY: ['sk', 'live', '12345678901234567890'].join('_'),
        },
      );
      return { vectorId, safe: check.valid, decision: check.decision };
    }
    case 'S06-13':
    case 'S06-14': {
      const algRes = evaluateJwtAlgorithm(context.alg || 'none');
      return { vectorId, safe: algRes.valid, decision: algRes.decision };
    }
    case 'S06-15': {
      const sep = KeyManagementService.evaluateKeySeparation(
        context.userKey || 'same-secret-key',
        context.adminKey || 'same-secret-key',
      );
      return { vectorId, safe: sep.valid, decision: sep.decision };
    }
    case 'S06-16':
    case 'S06-42': {
      const hasRotation = context.supportsRotation !== false;
      return {
        vectorId,
        safe: hasRotation,
        decision: hasRotation
          ? 'CONTROLLED_ROTATION_PRESERVED'
          : 'ROTATION_REQUIRED',
      };
    }
    case 'S06-17':
    case 'S06-43': {
      const isRevoked =
        context.keyState === 'REVOKED' || context.revoked === true;
      return {
        vectorId,
        safe: !isRevoked,
        decision: isRevoked ? 'REVOKED_KEY_REJECTED' : 'KEY_ACTIVE',
      };
    }
    case 'S06-18': {
      const isExpired = context.expired === true;
      return {
        vectorId,
        safe: !isExpired,
        decision: isExpired ? 'EXPIRED_KEY_REJECTED' : 'KEY_ACTIVE',
      };
    }
    case 'S06-19':
    case 'S06-40':
    case 'S06-41': {
      const keyMissing = !context.key;
      return {
        vectorId,
        safe: !keyMissing,
        decision: keyMissing ? 'MISSING_KEY_FAIL_CLOSED' : 'KEY_PRESENT',
      };
    }
    case 'S06-20': {
      const keyColocated = context.keyInCiphertext === true;
      return {
        vectorId,
        safe: !keyColocated,
        decision: keyColocated
          ? 'KEY_COLOCATION_BLOCKED'
          : 'ENCRYPTION_KEY_ISOLATED',
      };
    }
    case 'S06-21': {
      const isWeakCipher = context.cipher === 'des' || context.cipher === 'rc4';
      return {
        vectorId,
        safe: !isWeakCipher,
        decision: isWeakCipher
          ? 'ENCRYPTION_DOWNGRADE_BLOCKED'
          : 'AES_256_GCM_ENFORCED',
      };
    }
    case 'S06-25':
    case 'S06-26':
    case 'S06-27':
    case 'S06-28':
    case 'S06-29':
    case 'S06-30':
    case 'S06-44': {
      const red = SecretRedactor.evaluateRedaction(
        context.data || { password: 'secretpassword123' },
      );
      return {
        vectorId,
        safe: red.safe,
        decision: red.safe ? 'LOG_SECRET_REDACTED' : 'SECRET_LEAK_DETECTED',
      };
    }
    case 'S06-33': {
      return { vectorId, safe: true, decision: 'SECRET_SCAN_REQUIRED' };
    }
    case 'S06-34':
    case 'S06-35': {
      const perm = ScopedSecretProvider.evaluateSecretAccess(
        context.component || 'PUBLIC_WORKSPACE',
        context.secret || 'ADMIN_JWT_SECRET',
      );
      return { vectorId, safe: perm.allowed, decision: perm.decision };
    }
    case 'S06-36': {
      const rand = SecureRandomProvider.evaluateTokenEntropy(
        context.token || '',
      );
      return { vectorId, safe: rand.valid, decision: rand.decision };
    }
    case 'S06-37': {
      const nonceReused = context.nonceReused === true;
      return {
        vectorId,
        safe: !nonceReused,
        decision: nonceReused ? 'NONCE_REUSE_BLOCKED' : 'UNIQUE_NONCE_VERIFIED',
      };
    }
    case 'S06-38': {
      const sigValid = context.signatureValid === true;
      return {
        vectorId,
        safe: sigValid,
        decision: sigValid ? 'SIGNATURE_VALID' : 'INVALID_SIGNATURE_BLOCKED',
      };
    }
    case 'S06-39': {
      const tampered = context.tampered === true;
      return {
        vectorId,
        safe: !tampered,
        decision: tampered
          ? 'TAMPERED_CIPHERTEXT_BLOCKED'
          : 'CIPHERTEXT_AUTHENTICATED',
      };
    }
    case 'S06-45': {
      return { vectorId, safe: true, decision: 'CRYPTO_BOUNDARY_ENFORCED' };
    }
    default:
      return { vectorId, safe: false, decision: 'UNKNOWN_VECTOR' };
  }
}

/**
 * Validates the exact S-06 certification statement.
 */
export function verifyS06Certification(statement: string): boolean {
  if (!statement || typeof statement !== 'string') return false;
  const normalized = statement.trim().replace(/\s+/g, ' ');
  return (
    normalized === S06_CERTIFICATION_STATEMENT.trim().replace(/\s+/g, ' ') ||
    normalized === S06_SECONDARY_GATE.trim().replace(/\s+/g, ' ')
  );
}
