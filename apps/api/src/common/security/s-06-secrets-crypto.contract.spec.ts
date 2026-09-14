import {
  S06_TICKET_ID,
  S06_PHASE,
  S06_PRIORITY,
  S06_TYPE,
  S06_STATUS,
  S06_PRINCIPLES,
  S06_INVARIANTS,
  S06_ATTACK_MATRIX,
  S06_CERTIFICATION_STATEMENT,
  S06_SECONDARY_GATE,
  S06_FROZEN_PRINCIPLE,
  evaluateSecretsCryptoAttackVector,
  verifyS06Certification,
  evaluateJwtAlgorithm,
  evaluatePasswordHashParams,
  SecureRandomProvider,
  PasswordHashingService,
  TokenHashingService,
  SecretRedactor,
  KeyManagementService,
  ScopedSecretProvider,
  CANONICAL_PASSWORD_HASH_CONFIG,
  MINIMUM_ENTROPY_BYTES,
} from './s-06-secrets-crypto.contract';
import { SecuritySecretScanner } from './security-secret-scan';

describe('S-06 — Secrets & Cryptographic Security Contract Spec (API Common Security)', () => {
  describe('1. Contract Identity, Scope & Frozen Principles', () => {
    it('verifies S-06 metadata constants', () => {
      expect(S06_TICKET_ID).toBe('S-06');
      expect(S06_PHASE).toBe('Production Security Hardening');
      expect(S06_PRIORITY).toBe('P0 — BLOCKING');
      expect(S06_TYPE).toContain('Cryptography');
      expect(S06_STATUS).toBe('CERTIFIED_SECRETS_CRYPTOGRAPHIC_SECURITY');
    });

    it('verifies frozen principle "Secrets never become application data"', () => {
      expect(S06_FROZEN_PRINCIPLE).toBe(
        'Secrets never become application data.',
      );
      expect(S06_PRINCIPLES.SECRETS_NEVER_APPLICATION_DATA).toContain(
        'database business data',
      );
      expect(S06_PRINCIPLES.SECRETS_NEVER_APPLICATION_DATA).toContain(
        'frontend state',
      );
      expect(S06_PRINCIPLES.SECRETS_NEVER_APPLICATION_DATA).toContain(
        'API response',
      );
      expect(S06_PRINCIPLES.GX_WX_ADMIN_CRYPTO_SEPARATION).toContain(
        'GX must never obtain WX cryptographic material',
      );
      expect(S06_PRINCIPLES.FAIL_CLOSED_CRYPTOGRAPHY).toContain(
        'fail closed immediately',
      );
    });

    it('verifies all 15 P0 security invariants (S06-I01 to S06-I15)', () => {
      const keys = Object.keys(S06_INVARIANTS);
      expect(keys.length).toBe(15);
      expect(S06_INVARIANTS['S06-I01'].title).toBe(
        'Cryptographically Secure Randomness',
      );
      expect(S06_INVARIANTS['S06-I02'].title).toBe('Password Hashing');
      expect(S06_INVARIANTS['S06-I03'].title).toBe('Password Hash Parameters');
      expect(S06_INVARIANTS['S06-I04'].title).toBe('Refresh Token Storage');
      expect(S06_INVARIANTS['S06-I05'].title).toBe(
        'JWT Signing Key Protection',
      );
      expect(S06_INVARIANTS['S06-I06'].title).toBe('Algorithm Allowlist');
      expect(S06_INVARIANTS['S06-I07'].title).toBe(
        'Cryptographic Key Separation',
      );
      expect(S06_INVARIANTS['S06-I08'].title).toBe('Secret Rotation');
      expect(S06_INVARIANTS['S06-I09'].title).toBe('Secret Exposure Detection');
      expect(S06_INVARIANTS['S06-I10'].title).toBe('Log & Telemetry Redaction');
      expect(S06_INVARIANTS['S06-I11'].title).toBe('Encryption at Rest');
      expect(S06_INVARIANTS['S06-I12'].title).toBe(
        'Encryption in Transit Dependency',
      );
      expect(S06_INVARIANTS['S06-I13'].title).toBe(
        'Secret Access Minimization',
      );
      expect(S06_INVARIANTS['S06-I14'].title).toBe(
        'No Secret in Configuration Committed to Git',
      );
      expect(S06_INVARIANTS['S06-I15'].title).toBe(
        'Cryptographic Failure Is Fail-Closed',
      );
    });
  });

  describe('2. 45-Vector Attack Matrix Coverage (S06-01 to S06-45)', () => {
    it('contains all 45 required attack vectors in matrix', () => {
      expect(S06_ATTACK_MATRIX.length).toBe(45);

      const vectorIds = new Set(S06_ATTACK_MATRIX.map((v) => v.id));
      for (let i = 1; i <= 45; i++) {
        const expectedId = `S06-${i < 10 ? '0' + i : i}`;
        expect(vectorIds.has(expectedId)).toBe(true);
      }
    });

    it('evaluates all 45 attack vectors with expected decisions', () => {
      for (const vector of S06_ATTACK_MATRIX) {
        expect(vector.id).toMatch(/^S06-\d{2}$/);
        expect(vector.description.length).toBeGreaterThan(5);
        expect(vector.expectedDecision.length).toBeGreaterThan(0);
      }
    });
  });

  describe('3. CSPRNG & Secure Randomness Provider (S06-I01)', () => {
    it('generates high-entropy refresh tokens (256-bit)', () => {
      const token = SecureRandomProvider.generateRefreshToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes in hex

      const evalRes = SecureRandomProvider.evaluateTokenEntropy(token);
      expect(evalRes.valid).toBe(true);
      expect(evalRes.decision).toBe('CSPRNG_ENFORCED');
    });

    it('generates high-entropy session IDs, reset tokens, verification tokens, and salts', () => {
      const sid = SecureRandomProvider.generateSessionId();
      const resetToken = SecureRandomProvider.generatePasswordResetToken();
      const verifyToken = SecureRandomProvider.generateVerificationToken();
      const csrf = SecureRandomProvider.generateCsrfToken();
      const salt = SecureRandomProvider.generateSalt();

      expect(sid.length).toBe(64);
      expect(resetToken.length).toBe(64);
      expect(verifyToken.length).toBe(64);
      expect(csrf.length).toBe(64);
      expect(salt.length).toBe(MINIMUM_ENTROPY_BYTES.SALT);
    });

    it('blocks Math.random() and predictable tokens (S06-01, S06-02)', () => {
      const mathRandomToken = '0.8492049182';
      const evalRes =
        SecureRandomProvider.evaluateTokenEntropy(mathRandomToken);
      expect(evalRes.valid).toBe(false);
      expect(evalRes.decision).toBe('INSECURE_RNG_BLOCKED');
    });

    it('rejects weak entropy tokens (S06-03, S06-04)', () => {
      const shortToken = 'abcdef';
      const evalRes = SecureRandomProvider.evaluateTokenEntropy(shortToken, 32);
      expect(evalRes.valid).toBe(false);
      expect(evalRes.decision).toBe('WEAK_ENTROPY_REJECTED');
    });
  });

  describe('4. Password Hashing & Verification Engine (S06-I02, S06-I03)', () => {
    it('hashes passwords with Argon2id and verifies in constant time', async () => {
      const password = 'SuperSecretSecurePassword!2026';
      const hash = await PasswordHashingService.hashPassword(password);

      expect(hash.startsWith('$argon2id$')).toBe(true);
      expect(hash).toContain(`m=${CANONICAL_PASSWORD_HASH_CONFIG.memoryCost}`);
      expect(hash).toContain(`t=${CANONICAL_PASSWORD_HASH_CONFIG.timeCost}`);

      const valid = await PasswordHashingService.verifyPassword(hash, password);
      expect(valid).toBe(true);

      const invalid = await PasswordHashingService.verifyPassword(
        hash,
        'WrongPassword',
      );
      expect(invalid).toBe(false);
    });

    it('blocks plaintext passwords in storage (S06-05)', () => {
      const res = PasswordHashingService.evaluatePasswordStoragePosture(
        'plaintext_password_123',
      );
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('PLAINTEXT_PASSWORD_BLOCKED');
    });

    it('blocks reversible password encryption (S06-06)', () => {
      const res = PasswordHashingService.evaluatePasswordStoragePosture(
        'aes:encrypted_password_blob',
      );
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('REVERSIBLE_PASSWORD_BLOCKED');
    });

    it('rejects weak hashing algorithms like MD5 / SHA-1 (S06-07)', () => {
      const md5Hash = '$md5$827ccb0eea8a706c4c34a16891f84e7b';
      const res =
        PasswordHashingService.evaluatePasswordStoragePosture(md5Hash);
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('WEAK_HASH_ALGO_REJECTED');
    });

    it('detects hash parameter downgrade attempts (S06-08)', () => {
      const weakParams = { memoryCost: 1024, timeCost: 1, parallelism: 1 };
      const res = evaluatePasswordHashParams(weakParams);
      expect(res.valid).toBe(false);
      expect(res.violations.length).toBeGreaterThan(0);
    });
  });

  describe('5. Refresh Token Hashing Engine (S06-I04)', () => {
    it('hashes raw tokens with SHA-256 for secure DB persistence', () => {
      const rawToken = SecureRandomProvider.generateRefreshToken();
      const hash = TokenHashingService.hashToken(rawToken);

      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);

      const verifyTrue = TokenHashingService.verifyTokenHash(rawToken, hash);
      expect(verifyTrue).toBe(true);

      const verifyFalse = TokenHashingService.verifyTokenHash(
        'different-token',
        hash,
      );
      expect(verifyFalse).toBe(false);
    });

    it('blocks plaintext refresh tokens in storage (S06-09)', () => {
      const res = TokenHashingService.evaluateTokenStorage(
        'raw-refresh-token-in-db',
      );
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('PLAINTEXT_TOKEN_BLOCKED');
    });
  });

  describe('6. Cryptographic Key Separation & AES-256-GCM Encryption (S06-I07, S06-I11)', () => {
    it('blocks key reuse between User Auth and Admin Auth (S06-15)', () => {
      const sharedKey = 'shared-secret-key-across-planes';
      const sep = KeyManagementService.evaluateKeySeparation(
        sharedKey,
        sharedKey,
      );
      expect(sep.valid).toBe(false);
      expect(sep.decision).toBe('KEY_REUSE_BLOCKED');
    });

    it('allows cryptographically separated keys across planes', () => {
      const userKey = 'user-signing-secret-key-32-chars-long!';
      const adminKey = 'admin-signing-secret-key-32-chars-long!';
      const encKey = 'data-encryption-key-32-chars-long!';

      const sep = KeyManagementService.evaluateKeySeparation(
        userKey,
        adminKey,
        encKey,
      );
      expect(sep.valid).toBe(true);
      expect(sep.decision).toBe('KEYS_CRYPTOGRAPHICALLY_SEPARATED');
    });

    it('encrypts and decrypts sensitive data at rest with AES-256-GCM', () => {
      const plaintext =
        'Sensitive tenant telemetry and API integration configuration';
      const key = 'secure-256-bit-encryption-key-!!';

      const encrypted = KeyManagementService.encryptAtRest(plaintext, key);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toHaveLength(24); // 12 bytes in hex
      expect(encrypted.tag).toHaveLength(32); // 16 bytes in hex

      const decrypted = KeyManagementService.decryptAtRest(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it('detects tampered ciphertext and fails closed (S06-39)', () => {
      const plaintext = 'Critical security payload';
      const key = 'secure-256-bit-encryption-key-!!';

      const encrypted = KeyManagementService.encryptAtRest(plaintext, key);
      const tampered = {
        ...encrypted,
        ciphertext: '00' + encrypted.ciphertext.slice(2),
      };

      expect(() => KeyManagementService.decryptAtRest(tampered, key)).toThrow(
        'tampered',
      );
    });
  });

  describe('7. Algorithm Allowlist Evaluator (S06-I06)', () => {
    it('allows approved JWT algorithms (HS256, RS256, ES256, EdDSA)', () => {
      expect(evaluateJwtAlgorithm('HS256').valid).toBe(true);
      expect(evaluateJwtAlgorithm('RS256').valid).toBe(true);
      expect(evaluateJwtAlgorithm('ES256').valid).toBe(true);
      expect(evaluateJwtAlgorithm('EdDSA').valid).toBe(true);
    });

    it('blocks algorithm "none" confusion attacks (S06-13)', () => {
      const res = evaluateJwtAlgorithm('none');
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('ALGORITHM_CONFUSION_BLOCKED');
    });

    it('rejects unapproved algorithms (S06-14)', () => {
      const res = evaluateJwtAlgorithm('DES');
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('UNAPPROVED_ALGORITHM_REJECTED');
    });
  });

  describe('8. Secret Redactor & Exposure Prevention (S06-I10)', () => {
    it('redacts private keys, passwords, hashes, and tokens from nested objects (S06-25, S06-26, S06-27)', () => {
      const payload = {
        user: 'admin',
        password: 'password123',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$abc$def',
        apiKey: ['sk', 'live', '12345678901234567890'].join('_'),
        metadata: {
          clientSecret: 'secret_value',
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig',
          rawPayload:
            'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig',
        },
      };

      const redacted = SecretRedactor.redact(payload) as any;
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.passwordHash).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.metadata.clientSecret).toBe('[REDACTED]');
      expect(redacted.metadata.jwt).toBe('[REDACTED]');
      expect(redacted.metadata.rawPayload).toContain('[REDACTED_SECRET]');
    });

    it('redacts database connection strings and raw private keys from strings', () => {
      const rawText =
        'Connection failed: postgres://postgres:SecretPassword123@db.internal:5432/atlas';
      const sanitized = SecretRedactor.redactString(rawText);
      expect(sanitized).toContain('[REDACTED_SECRET]');
      expect(sanitized).not.toContain('SecretPassword123');
    });
  });

  describe('9. Scoped Secret Provider & Least Privilege (S06-I13, S06-I14)', () => {
    it('enforces least-privilege scoping across application components (S06-34, S06-35)', () => {
      const authAccess = ScopedSecretProvider.evaluateSecretAccess(
        'AUTH_SERVICE',
        'JWT_SECRET',
      );
      expect(authAccess.allowed).toBe(true);

      const publicAccess = ScopedSecretProvider.evaluateSecretAccess(
        'PUBLIC_WORKSPACE',
        'ADMIN_JWT_SECRET',
      );
      expect(publicAccess.allowed).toBe(false);
      expect(publicAccess.decision).toBe('LEAST_PRIVILEGE_ENFORCED');
    });

    it('scans configuration objects for hardcoded production secrets in Git/.env (S06-32)', () => {
      const dirtyConfig = {
        DATABASE_URL:
          'postgres://admin:LiveProdSecretPassword123@prod.db.com/prod',
        STRIPE_KEY: ['sk', 'live', '999999999999999999999999'].join('_'),
      };
      const check =
        ScopedSecretProvider.evaluateConfigurationPosture(dirtyConfig);
      expect(check.valid).toBe(false);
      expect(check.decision).toBe('ENV_FILE_SECRET_BLOCKED');
      expect(check.violations.length).toBeGreaterThan(0);
    });
  });

  describe('10. Secret Scanner Utility (security-secret-scan) (S06-I09)', () => {
    it('detects private key blocks and live API keys in code snippets', () => {
      const mockStripeKey = ['sk', 'live', '123456789012345678901234'].join(
        '_',
      );
      const testContent = `
        const key = "-----BEGIN RSA PRIVATE KEY-----
        MIIEowIBAAKCAQEA0";
        const stripe = "${mockStripeKey}";
      `;
      const scanRes = SecuritySecretScanner.scanContent(testContent, 'test.ts');
      expect(scanRes.clean).toBe(false);
      expect(scanRes.violations.length).toBeGreaterThanOrEqual(2);
    });

    it('passes for clean source code without secrets', () => {
      const cleanContent = `
        export const API_BASE = process.env.API_BASE_URL || 'https://api.example.com';
        export function computeTotal(a: number, b: number) { return a + b; }
      `;
      const scanRes = SecuritySecretScanner.scanContent(
        cleanContent,
        'clean.ts',
      );
      expect(scanRes.clean).toBe(true);
      expect(scanRes.violations.length).toBe(0);
    });
  });

  describe('11. Attack Matrix Evaluator Engine & Certification Gate', () => {
    it('evaluates all 45 attack matrix scenarios via evaluator engine', () => {
      for (const vector of S06_ATTACK_MATRIX) {
        const res = evaluateSecretsCryptoAttackVector(vector.id, {});
        expect(res.vectorId).toBe(vector.id);
        expect(res.decision).toBeDefined();
      }
    });

    it('verifies exact canonical certification statement', () => {
      expect(verifyS06Certification(S06_CERTIFICATION_STATEMENT)).toBe(true);
      expect(verifyS06Certification(S06_SECONDARY_GATE)).toBe(true);
    });

    it('rejects invalid or blank statements', () => {
      expect(verifyS06Certification('')).toBe(false);
      expect(verifyS06Certification('Arbitrary statement')).toBe(false);
    });
  });
});
