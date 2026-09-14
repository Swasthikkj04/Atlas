/**
 * S-06 — Secrets & Cryptographic Security Web Contract
 *
 * Phase: Production Security Hardening
 * Priority: P0 — BLOCKING
 * Type: Security / Cryptography / Secrets / Authentication / Web / Contract
 * Depends on: S-01 🔒, S-02 🔒, S-03 🔒, S-04 🔒, S-05 🔒
 * Blocks: S-07 → S-12 and Production Release
 * Status: CERTIFIED_SECRETS_CRYPTOGRAPHIC_SECURITY
 */

export const S06_TICKET_ID = 'S-06' as const;
export const S06_PHASE = 'Production Security Hardening' as const;
export const S06_PRIORITY = 'P0 — BLOCKING' as const;
export const S06_TYPE = 'Security / Cryptography / Secrets / Authentication / Web / Contract' as const;
export const S06_STATUS = 'CERTIFIED_SECRETS_CRYPTOGRAPHIC_SECURITY' as const;
export const S06_DEPENDS_ON = ['S-01', 'S-02', 'S-03', 'S-04', 'S-05'] as const;
export const S06_BLOCKS = ['S-07', 'S-08', 'S-09', 'S-10', 'S-11', 'S-12', 'Production Release'] as const;

export const S06_CERTIFICATION_STATEMENT =
  'Every secret, cryptographic key, credential, password-derived value, token-signing material, OAuth secret, and security-sensitive cryptographic operation in Nebula is generated, stored, accessed, transmitted, rotated, and destroyed according to an explicit server-side security policy.';

export const S06_SECONDARY_GATE =
  "Nebula's secrets and cryptographic operations are generated using secure randomness, protected throughout their lifecycle, cryptographically separated by security purpose and plane, resistant to downgrade and replay, absent from application exposure surfaces, and fail closed when cryptographic trust cannot be established.";

export const S06_FROZEN_PRINCIPLE = 'Secrets never become application data.';

export const S06_PRINCIPLES = {
  S06_P01_SECRETS_NEVER_APPLICATION_DATA:
    'Secrets never become application data: database business data, frontend state, API response, URL parameter, browser storage, source code, Git history, log entry, error message, telemetry payload.',
  S06_P02_NO_COMPENSATING_ASSUMPTION:
    'No cryptographic layer is permitted to assume that another layer will compensate for weaknesses or shortcuts.',
  S06_P03_GX_WX_ADMIN_CRYPTO_SEPARATION:
    'GX must never obtain WX cryptographic material. WX must never obtain ADMIN signing material. ADMIN must never become a mechanism for bypassing WX ownership controls.',
  S06_P04_FAIL_CLOSED_CRYPTOGRAPHY:
    'Any cryptographic failure (missing key, unapproved algorithm, invalid signature, corrupted ciphertext) must fail closed immediately.',
} as const;

export const S06_INVARIANTS = {
  'S06-I01': {
    id: 'S06-I01',
    title: 'Cryptographically Secure Randomness',
    description: 'All security-sensitive random values must originate from a CSPRNG.',
    failClosedDecision: 'CSPRNG_ENFORCED',
  },
  'S06-I02': {
    id: 'S06-I02',
    title: 'Password Hashing',
    description: 'Passwords must never be encrypted for later recovery. Argon2id hashing canonical posture.',
    failClosedDecision: 'PLAINTEXT_PASSWORD_BLOCKED',
  },
  'S06-I03': {
    id: 'S06-I03',
    title: 'Password Hash Parameters',
    description: 'Password hashing parameters must be explicit, versioned, and centrally controlled.',
    failClosedDecision: 'HASH_DOWNGRADE_BLOCKED',
  },
  'S06-I04': {
    id: 'S06-I04',
    title: 'Refresh Token Storage',
    description: 'Raw refresh tokens must be hashed with SHA-256 before persisting.',
    failClosedDecision: 'PLAINTEXT_TOKEN_BLOCKED',
  },
  'S06-I05': {
    id: 'S06-I05',
    title: 'JWT Signing Key Protection',
    description: 'JWT signing keys must never exist in source code, Git repo, or frontend bundles.',
    failClosedDecision: 'HARDCODED_SECRET_BLOCKED',
  },
  'S06-I06': {
    id: 'S06-I06',
    title: 'Algorithm Allowlist',
    description: 'Nebula explicitly defines permitted cryptographic algorithms (HS256, RS256, ES256, EdDSA, Argon2id, SHA-256, AES-256-GCM).',
    failClosedDecision: 'UNAPPROVED_ALGORITHM_REJECTED',
  },
  'S06-I07': {
    id: 'S06-I07',
    title: 'Cryptographic Key Separation',
    description: 'Different security planes must not share signing keys (User Auth != Admin Auth != Encryption).',
    failClosedDecision: 'KEY_REUSE_BLOCKED',
  },
  'S06-I08': {
    id: 'S06-I08',
    title: 'Secret Rotation',
    description: 'Security-sensitive keys and credentials must support controlled rotation.',
    failClosedDecision: 'ROTATION_REQUIRED',
  },
  'S06-I09': {
    id: 'S06-I09',
    title: 'Secret Exposure Detection',
    description: 'The repository and build process must detect accidental secrets.',
    failClosedDecision: 'SECRET_SCAN_REQUIRED',
  },
  'S06-I10': {
    id: 'S06-I10',
    title: 'Log & Telemetry Redaction',
    description: 'Private keys, signing keys, API keys, passwords, and tokens must be redacted from logs/telemetry.',
    failClosedDecision: 'LOG_SECRET_REDACTED',
  },
  'S06-I11': {
    id: 'S06-I11',
    title: 'Encryption at Rest',
    description: 'Sensitive persisted data must use AES-256-GCM with key isolated from ciphertext.',
    failClosedDecision: 'KEY_COLOCATION_BLOCKED',
  },
  'S06-I12': {
    id: 'S06-I12',
    title: 'Encryption in Transit Dependency',
    description: 'S-06 relies on S-05 for transport protection.',
    failClosedDecision: 'HTTP_PLAINTEXT_REJECTED',
  },
  'S06-I13': {
    id: 'S06-I13',
    title: 'Secret Access Minimization',
    description: 'Only components requiring a secret may access it.',
    failClosedDecision: 'LEAST_PRIVILEGE_ENFORCED',
  },
  'S06-I14': {
    id: 'S06-I14',
    title: 'No Secret in Configuration Committed to Git',
    description: 'Configuration templates in Git must never contain real production secrets.',
    failClosedDecision: 'ENV_FILE_SECRET_BLOCKED',
  },
  'S06-I15': {
    id: 'S06-I15',
    title: 'Cryptographic Failure Is Fail-Closed',
    description: 'Cryptographic operations must fail closed immediately on error or validation failure.',
    failClosedDecision: 'FAIL_CLOSED_CRYPTOGRAPHY',
  },
} as const;

export interface AttackVectorDefinition {
  id: string;
  description: string;
  expectedDecision: string;
  category: 'RNG' | 'PASSWORD' | 'TOKEN' | 'JWT' | 'KEY_MGMT' | 'ENCRYPTION' | 'SECRETS_SCAN' | 'REDACTION' | 'LIFECYCLE';
}

export const S06_ATTACK_MATRIX: AttackVectorDefinition[] = [
  { id: 'S06-01', description: 'Predictable token generation', expectedDecision: 'CSPRNG_ENFORCED', category: 'RNG' },
  { id: 'S06-02', description: 'Math.random() security token', expectedDecision: 'INSECURE_RNG_BLOCKED', category: 'RNG' },
  { id: 'S06-03', description: 'Weak session entropy', expectedDecision: 'WEAK_ENTROPY_REJECTED', category: 'RNG' },
  { id: 'S06-04', description: 'Weak refresh-token entropy', expectedDecision: 'WEAK_ENTROPY_REJECTED', category: 'RNG' },
  { id: 'S06-05', description: 'Plaintext password persistence', expectedDecision: 'PLAINTEXT_PASSWORD_BLOCKED', category: 'PASSWORD' },
  { id: 'S06-06', description: 'Password reversible encryption', expectedDecision: 'REVERSIBLE_PASSWORD_BLOCKED', category: 'PASSWORD' },
  { id: 'S06-07', description: 'Weak password hashing algorithm', expectedDecision: 'WEAK_HASH_ALGO_REJECTED', category: 'PASSWORD' },
  { id: 'S06-08', description: 'Hash parameter downgrade', expectedDecision: 'HASH_DOWNGRADE_BLOCKED', category: 'PASSWORD' },
  { id: 'S06-09', description: 'Plaintext refresh token in DB', expectedDecision: 'PLAINTEXT_TOKEN_BLOCKED', category: 'TOKEN' },
  { id: 'S06-10', description: 'JWT signing secret in source', expectedDecision: 'HARDCODED_SECRET_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-11', description: 'JWT signing secret in Git', expectedDecision: 'GIT_SECRET_EXPOSURE_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-12', description: 'JWT signing secret in frontend', expectedDecision: 'FRONTEND_SECRET_LEAK_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-13', description: 'JWT algorithm confusion', expectedDecision: 'ALGORITHM_CONFUSION_BLOCKED', category: 'JWT' },
  { id: 'S06-14', description: 'Unapproved JWT algorithm', expectedDecision: 'UNAPPROVED_ALGORITHM_REJECTED', category: 'JWT' },
  { id: 'S06-15', description: 'User/admin signing-key reuse', expectedDecision: 'KEY_REUSE_BLOCKED', category: 'KEY_MGMT' },
  { id: 'S06-16', description: 'Missing key rotation mechanism', expectedDecision: 'ROTATION_REQUIRED', category: 'KEY_MGMT' },
  { id: 'S06-17', description: 'Revoked key accepted', expectedDecision: 'REVOKED_KEY_REJECTED', category: 'KEY_MGMT' },
  { id: 'S06-18', description: 'Expired key accepted', expectedDecision: 'EXPIRED_KEY_REJECTED', category: 'KEY_MGMT' },
  { id: 'S06-19', description: 'Invalid signing key fallback', expectedDecision: 'INVALID_KEY_FAIL_CLOSED', category: 'KEY_MGMT' },
  { id: 'S06-20', description: 'Encryption key stored with ciphertext', expectedDecision: 'KEY_COLOCATION_BLOCKED', category: 'ENCRYPTION' },
  { id: 'S06-21', description: 'Encryption downgrade', expectedDecision: 'ENCRYPTION_DOWNGRADE_BLOCKED', category: 'ENCRYPTION' },
  { id: 'S06-22', description: 'Hardcoded database credential', expectedDecision: 'HARDCODED_CREDENTIAL_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-23', description: 'Hardcoded OAuth secret', expectedDecision: 'HARDCODED_OAUTH_SECRET_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-24', description: 'Hardcoded API key', expectedDecision: 'HARDCODED_API_KEY_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-25', description: 'Private key exposed in logs', expectedDecision: 'LOG_SECRET_REDACTED', category: 'REDACTION' },
  { id: 'S06-26', description: 'Secret exposed through exception', expectedDecision: 'EXCEPTION_SECRET_REDACTED', category: 'REDACTION' },
  { id: 'S06-27', description: 'Secret exposed through telemetry', expectedDecision: 'TELEMETRY_SECRET_REDACTED', category: 'REDACTION' },
  { id: 'S06-28', description: 'Secret exposed through analytics', expectedDecision: 'ANALYTICS_SECRET_BLOCKED', category: 'REDACTION' },
  { id: 'S06-29', description: 'Secret exposed through URL', expectedDecision: 'URL_SECRET_BLOCKED', category: 'REDACTION' },
  { id: 'S06-30', description: 'Secret exposed through response body', expectedDecision: 'RESPONSE_SECRET_BLOCKED', category: 'REDACTION' },
  { id: 'S06-31', description: 'Secret exposed in source map', expectedDecision: 'SOURCE_MAP_SECRET_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-32', description: 'Production secret in .env committed to Git', expectedDecision: 'ENV_FILE_SECRET_BLOCKED', category: 'SECRETS_SCAN' },
  { id: 'S06-33', description: 'Secret scan bypass', expectedDecision: 'SECRET_SCAN_REQUIRED', category: 'SECRETS_SCAN' },
  { id: 'S06-34', description: 'Secret available to unrelated module', expectedDecision: 'LEAST_PRIVILEGE_ENFORCED', category: 'KEY_MGMT' },
  { id: 'S06-35', description: 'Excessive secret privileges', expectedDecision: 'EXCESSIVE_PRIVILEGES_REJECTED', category: 'KEY_MGMT' },
  { id: 'S06-36', description: 'Missing cryptographic randomness', expectedDecision: 'MISSING_RANDOMNESS_REJECTED', category: 'RNG' },
  { id: 'S06-37', description: 'Reused nonce where prohibited', expectedDecision: 'NONCE_REUSE_BLOCKED', category: 'ENCRYPTION' },
  { id: 'S06-38', description: 'Invalid signature accepted', expectedDecision: 'INVALID_SIGNATURE_BLOCKED', category: 'JWT' },
  { id: 'S06-39', description: 'Tampered ciphertext accepted', expectedDecision: 'TAMPERED_CIPHERTEXT_BLOCKED', category: 'ENCRYPTION' },
  { id: 'S06-40', description: 'Unsupported crypto provider fallback', expectedDecision: 'UNSUPPORTED_PROVIDER_FAIL_CLOSED', category: 'KEY_MGMT' },
  { id: 'S06-41', description: 'Missing key material', expectedDecision: 'MISSING_KEY_FAIL_CLOSED', category: 'KEY_MGMT' },
  { id: 'S06-42', description: 'Key rotation breaks active validation unexpectedly', expectedDecision: 'CONTROLLED_ROTATION_PRESERVED', category: 'LIFECYCLE' },
  { id: 'S06-43', description: 'Revoked credential remains accepted', expectedDecision: 'REVOKED_CREDENTIAL_REJECTED', category: 'LIFECYCLE' },
  { id: 'S06-44', description: 'Secret appears in structured logs', expectedDecision: 'STRUCTURED_LOG_REDACTED', category: 'REDACTION' },
  { id: 'S06-45', description: 'Direct API attempt to bypass crypto boundary', expectedDecision: 'CRYPTO_BOUNDARY_ENFORCED', category: 'JWT' },
];

export const FORBIDDEN_FRONTEND_KEYS = new Set([
  'jwt_secret',
  'admin_jwt_secret',
  'signing_key',
  'private_key',
  'database_url',
  'google_client_secret',
  'github_client_secret',
  'smtp_password',
  'resend_api_key',
  'encryption_key',
]);

/**
 * Audits frontend state, bundles, or localStorage for accidental secret leakage.
 */
export function auditFrontendSecrets(state: Record<string, any>): {
  secure: boolean;
  leakedKeys: string[];
} {
  const leakedKeys: string[] = [];

  for (const key of Object.keys(state)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (FORBIDDEN_FRONTEND_KEYS.has(normalized)) {
      leakedKeys.push(key);
    }
  }

  return {
    secure: leakedKeys.length === 0,
    leakedKeys,
  };
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
