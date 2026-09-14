import {
  S08_TICKET_ID,
  S08_PHASE,
  S08_PRIORITY,
  S08_TYPE,
  S08_STATUS,
  S08_DEPENDS_ON,
  S08_BLOCKS,
  S08_CERTIFICATION_STATEMENT,
  S08_SECONDARY_GATE,
  S08_FROZEN_PRINCIPLE,
  S08_PRINCIPLES,
  S08_INVARIANTS,
  S08_ATTACK_MATRIX,
  evaluateDataProtectionAttackVector,
  verifyS08Certification,
  DataClassificationEngine,
  DataExposurePolicy,
  RetentionPolicyEngine,
  PrivacyFilter,
  SensitiveFieldPolicy,
  TenantDataBoundary,
  CacheIsolationEngine,
  AccountDeletionEngine,
} from './s-08-data-protection.contract';

describe('S-08 — Data Protection & Privacy Contract Spec (API Common Security)', () => {
  beforeEach(() => {
    CacheIsolationEngine.reset();
  });

  describe('1. Contract Identity, Scope & Frozen Principles', () => {
    it('verifies S-08 contract metadata', () => {
      expect(S08_TICKET_ID).toBe('S-08');
      expect(S08_PHASE).toBe('Production Security Hardening');
      expect(S08_PRIORITY).toBe('P0 — BLOCKING');
      expect(S08_STATUS).toBe('CERTIFIED_DATA_PROTECTION_PRIVACY');
      expect(S08_DEPENDS_ON).toEqual([
        'S-01',
        'S-02',
        'S-03',
        'S-04',
        'S-05',
        'S-06',
        'S-07',
      ]);
      expect(S08_BLOCKS).toContain('Production Release');
    });

    it('verifies frozen principle "Collect what is necessary. Expose what is justified. Retain only what is required."', () => {
      expect(S08_FROZEN_PRINCIPLE).toBe(
        'Collect what is necessary. Expose what is justified. Retain only what is required.',
      );
      expect(S08_PRINCIPLES.DATA_MINIMIZATION).toContain(
        'Nebula does not persist information merely because collectors can obtain it',
      );
      expect(S08_PRINCIPLES.TENANT_DATA_ISOLATION).toContain(
        'All persistent intelligence remains strictly bound to the authenticated tenant',
      );
      expect(S08_PRINCIPLES.GX_EPHEMERALITY).toContain(
        'GX never becomes a shadow database for WX',
      );
      expect(S08_PRINCIPLES.FAIL_CLOSED_PRIVACY).toContain(
        'strictly fails closed and refuses data exposure',
      );
    });

    it('verifies all 15 P0 security invariants (S08-I01 to S08-I15)', () => {
      const keys = Object.keys(S08_INVARIANTS);
      expect(keys.length).toBe(15);
      expect(S08_INVARIANTS['S08-I01'].title).toBe('Data Classification');
      expect(S08_INVARIANTS['S08-I02'].title).toBe('Data Minimization');
      expect(S08_INVARIANTS['S08-I03'].title).toBe('Tenant Data Isolation');
      expect(S08_INVARIANTS['S08-I04'].title).toBe('Guest Data Ephemerality');
      expect(S08_INVARIANTS['S08-I05'].title).toBe('Purpose Limitation');
      expect(S08_INVARIANTS['S08-I06'].title).toBe(
        'Sensitive Data Response Filtering',
      );
      expect(S08_INVARIANTS['S08-I07'].title).toBe('Raw Evidence Containment');
      expect(S08_INVARIANTS['S08-I08'].title).toBe('Cache Isolation');
      expect(S08_INVARIANTS['S08-I09'].title).toBe('No Sensitive Data in URLs');
      expect(S08_INVARIANTS['S08-I10'].title).toBe('Privacy-Safe Logging');
      expect(S08_INVARIANTS['S08-I11'].title).toBe('Retention Enforcement');
      expect(S08_INVARIANTS['S08-I12'].title).toBe(
        'Account Deletion Propagation',
      );
      expect(S08_INVARIANTS['S08-I13'].title).toBe('Backup & Recovery Privacy');
      expect(S08_INVARIANTS['S08-I14'].title).toBe('Export Boundary');
      expect(S08_INVARIANTS['S08-I15'].title).toBe(
        'Privacy Failure Is Fail-Closed',
      );
    });
  });

  describe('2. 50-Vector Attack Matrix Coverage (S08-01 to S08-50)', () => {
    it('contains all 50 required attack vectors in matrix', () => {
      expect(S08_ATTACK_MATRIX.length).toBe(50);
      for (let i = 1; i <= 50; i++) {
        const expectedId = `S08-${i < 10 ? '0' + i : i}`;
        const found = S08_ATTACK_MATRIX.find((v) => v.id === expectedId);
        expect(found).toBeDefined();
        expect(found?.expectedDecision).toBeDefined();
      }
    });

    it('evaluates all 50 attack vectors via universal evaluator engine', () => {
      for (const vector of S08_ATTACK_MATRIX) {
        const res = evaluateDataProtectionAttackVector(vector.id, {});
        expect(res.vectorId).toBe(vector.id);
        expect(res.decision).toBe(vector.expectedDecision);
        expect(res.passed).toBe(true);
      }
    });
  });

  describe('3. Data Classification & Purpose Limitation (S08-I01, S08-I05)', () => {
    it('accurately classifies entity fields across schemas', () => {
      const userPw = DataClassificationEngine.getFieldClassification(
        'User',
        'passwordHash',
      );
      expect(userPw?.tier).toBe('SECURITY_SENSITIVE');
      expect(userPw?.requiresAtRestEncryption).toBe(true);

      const findingSummary = DataClassificationEngine.getFieldClassification(
        'InfrastructureFinding',
        'summary',
      );
      expect(findingSummary?.tier).toBe('PUBLIC');
    });

    it('blocks unclassified or unauthorized fields across planes', () => {
      expect(
        DataClassificationEngine.isFieldAllowedInPlane(
          'User',
          'passwordHash',
          'GX',
        ),
      ).toBe(false);
      expect(
        DataClassificationEngine.isFieldAllowedInPlane(
          'User',
          'passwordHash',
          'WX',
        ),
      ).toBe(false);
      expect(
        DataClassificationEngine.isFieldAllowedInPlane(
          'InfrastructureFinding',
          'rawCollectorPayload',
          'GX',
        ),
      ).toBe(false);
    });

    it('enforces purpose limitation and rejects advertising/unrelated profiling (S08-21, S08-22)', () => {
      const valid = DataClassificationEngine.validatePurposeAlignment(
        'INFRASTRUCTURE_UNDERSTANDING',
      );
      expect(valid.isValid).toBe(true);
      expect(valid.decision).toBe('PURPOSE_AUTHORIZED');

      const invalid = DataClassificationEngine.validatePurposeAlignment(
        'AD_TARGETING_PROFILING',
      );
      expect(invalid.isValid).toBe(false);
      expect(invalid.decision).toBe('UNAUTHORIZED_PURPOSE_BLOCKED');
    });
  });

  describe('4. Sensitive Field Response Stripping & URL Safety (S08-I02, S08-I06, S08-I09)', () => {
    it('strips sensitive database fields from response DTOs (S08-06, S08-18, S08-24, S08-25)', () => {
      const rawDbObject = {
        id: 'usr_123',
        email: 'ceo@enterprise.com',
        name: 'Chief Exec',
        passwordHash: '$argon2id$v=19$m=65536...',
        rawCollectorPayload: { internalSocket: '10.0.0.1:8080' },
        nested: {
          sessionSecret: 'secret_1234567890',
          cleanProp: 'hello',
        },
      };

      const sanitized = SensitiveFieldPolicy.sanitizeResponseDto(rawDbObject);
      expect(sanitized.id).toBe('usr_123');
      expect(sanitized.email).toBe('ceo@enterprise.com');
      expect((sanitized as any).passwordHash).toBeUndefined();
      expect((sanitized as any).rawCollectorPayload).toBeUndefined();
      expect(sanitized.nested?.cleanProp).toBe('hello');
      expect((sanitized.nested as any)?.sessionSecret).toBeUndefined();
    });

    it('detects and blocks sensitive parameters in URLs and fragments (S08-07, S08-08, S08-40)', () => {
      const unsafeUrl = '/api/v1/callback?token=eyJhbGciOi...&userId=123';
      const check = SensitiveFieldPolicy.evaluateUrlSafety(unsafeUrl);
      expect(check.isSafe).toBe(false);
      expect(check.decision).toBe('SENSITIVE_URL_PARAM_BLOCKED');

      const safeUrl = '/api/v1/domains?status=ACTIVE&page=1';
      const safeCheck = SensitiveFieldPolicy.evaluateUrlSafety(safeUrl);
      expect(safeCheck.isSafe).toBe(true);
      expect(safeCheck.decision).toBe('URL_PRIVACY_COMPLIANT');
    });
  });

  describe('5. Progressive Disclosure & Raw Evidence Containment (S08-I07)', () => {
    it('blocks GX from requesting Level 5 deep investigation / raw payloads (S08-04, S08-05)', () => {
      const res = DataExposurePolicy.evaluateProgressiveDisclosure({
        plane: 'GX',
        requestedLevel: 5,
        isOwner: false,
      });

      expect(res.allowed).toBe(false);
      expect(res.includeRawPayload).toBe(false);
      expect(res.decision).toBe('GX_DEEP_INVESTIGATION_BLOCKED');
    });

    it('allows authenticated workspace owners to access Level 5 deep investigation', () => {
      const res = DataExposurePolicy.evaluateProgressiveDisclosure({
        plane: 'WX',
        requestedLevel: 5,
        isOwner: true,
      });

      expect(res.allowed).toBe(true);
      expect(res.effectiveLevel).toBe(5);
      expect(res.includeRawPayload).toBe(true);
      expect(res.decision).toBe('DISCLOSURE_PERMITTED');
    });
  });

  describe('6. Tenant Isolation & Safe Export Pipeline (S08-I03, S08-I14)', () => {
    it('filters tenant records strictly by authenticated user ID (S08-01, S08-50)', () => {
      const records = [
        { id: 'dom_1', userId: 'usr_alpha', domainName: 'alpha.io' },
        { id: 'dom_2', userId: 'usr_beta', domainName: 'beta.io' },
        { id: 'dom_3', userId: 'usr_alpha', domainName: 'alpha-api.io' },
      ];

      const filtered = TenantDataBoundary.filterTenantRecords(
        records,
        'usr_alpha',
      );
      expect(filtered.length).toBe(2);
      expect(filtered.every((r) => r.userId === 'usr_alpha')).toBe(true);
    });

    it('blocks cross-tenant export requests (S08-13, S08-43)', () => {
      const records = [{ id: 'dom_1', userId: 'usr_victim' }];
      const res = TenantDataBoundary.generateTenantExport(
        { requestingUserId: 'usr_attacker', targetUserId: 'usr_victim' },
        records,
      );

      expect(res.success).toBe(false);
      expect(res.decision).toBe('CROSS_TENANT_EXPORT_BLOCKED');
    });

    it('generates sanitized tenant export without secrets', () => {
      const records = [
        {
          id: 'dom_1',
          userId: 'usr_legit',
          domainName: 'corp.io',
          passwordHash: 'secret',
        },
      ];
      const res = TenantDataBoundary.generateTenantExport(
        { requestingUserId: 'usr_legit', targetUserId: 'usr_legit' },
        records,
      );

      expect(res.success).toBe(true);
      expect(res.recordCount).toBe(1);
      expect(res.data?.[0].domainName).toBe('corp.io');
      expect(res.data?.[0].passwordHash).toBeUndefined();
    });
  });

  describe('7. Cache Isolation Engine (S08-I08)', () => {
    it('prevents cross-tenant and cross-plane cache collisions (S08-09, S08-10, S08-42)', () => {
      const ctxUserA = {
        plane: 'WX' as const,
        tenantId: 'usr_a',
        resourceKey: 'domain_summary',
      };
      const ctxUserB = {
        plane: 'WX' as const,
        tenantId: 'usr_b',
        resourceKey: 'domain_summary',
      };
      const ctxGuest = { plane: 'GX' as const, resourceKey: 'domain_summary' };

      CacheIsolationEngine.set(ctxUserA, { data: 'Alpha confidential' });

      // User A gets cache hit
      expect(CacheIsolationEngine.get(ctxUserA).hit).toBe(true);

      // User B gets cache miss (cannot see User A cached data)
      expect(CacheIsolationEngine.get(ctxUserB).hit).toBe(false);

      // Guest gets cache miss (cannot see WX cached data)
      expect(CacheIsolationEngine.get(ctxGuest).hit).toBe(false);
    });
  });

  describe('8. Retention Policy & Ephemerality Engine (S08-I04, S08-I11, S08-I13)', () => {
    it('marks GX guest sessions as expired after 24 hours (S08-15, S08-31)', () => {
      const now = Date.now();
      const freshGuest = {
        id: 'sess_1',
        category: 'GUEST_SESSION' as const,
        createdAt: now - 3600 * 1000, // 1 hour old
      };
      expect(
        RetentionPolicyEngine.evaluateRetention(freshGuest, now).isExpired,
      ).toBe(false);

      const expiredGuest = {
        id: 'sess_2',
        category: 'GUEST_SESSION' as const,
        createdAt: now - 25 * 3600 * 1000, // 25 hours old
      };
      const res = RetentionPolicyEngine.evaluateRetention(expiredGuest, now);
      expect(res.isExpired).toBe(true);
      expect(res.state).toBe('EXPIRED');
      expect(res.decision).toBe('RETENTION_EXPIRED_PENDING_DELETION');
    });

    it('blocks cross-tenant backup restoration (S08-14, S08-35)', () => {
      const res = RetentionPolicyEngine.validateBackupRestoration(
        'usr_source',
        'usr_target',
      );
      expect(res.allowed).toBe(false);
      expect(res.decision).toBe('CROSS_TENANT_RESTORE_BLOCKED');
    });
  });

  describe('9. Account Deletion Propagation (S08-I12)', () => {
    it('cascades deletion across all owned entities with zero remaining orphans (S08-26 to S08-30)', () => {
      const target = {
        userId: 'usr_delete_me',
        domainCount: 3,
        snapshotCount: 12,
        findingCount: 45,
        evidenceCount: 18,
        sessionCount: 2,
      };

      const receipt = AccountDeletionEngine.executeTenantPurge(target);
      expect(receipt.userId).toBe('usr_delete_me');
      expect(receipt.status).toBe('PURGED_AND_VERIFIED');
      expect(receipt.orphanedRecordsRemaining).toBe(0);
      expect(receipt.purgedEntities.domains).toBe(3);
      expect(receipt.purgedEntities.snapshots).toBe(12);
      expect(receipt.purgedEntities.findings).toBe(45);
    });
  });

  describe('10. Privacy-Safe Logging & PII Scrubbing (S08-I10)', () => {
    it('redacts email addresses, passwords, tokens, and raw collector payloads from logs (S08-36, S08-37, S08-38)', () => {
      const logPayload = {
        userEmail: 'alice@enterprise.com',
        userIp: '192.168.1.100',
        authToken: 'eyJhbGciOi...',
        rawPayload: { wire: 'dump' },
        message: 'Failed login for user bob@corp.org from 10.0.0.5',
      };

      const sanitized = PrivacyFilter.sanitizeForTelemetry(logPayload);
      expect(sanitized.userEmail).toBe('[REDACTED_EMAIL]');
      expect(sanitized.authToken).toBe('[REDACTED_SECRET]');
      expect(sanitized.rawPayload).toBe('[REDACTED_RAW_PAYLOAD]');
      expect(sanitized.message).toContain('[REDACTED_EMAIL]');
      expect(sanitized.message).toContain('10.0.0.xxx');
    });
  });

  describe('11. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      expect(verifyS08Certification(S08_CERTIFICATION_STATEMENT)).toBe(true);
      expect(verifyS08Certification(S08_SECONDARY_GATE)).toBe(true);
    });

    it('rejects uncertified statements', () => {
      expect(verifyS08Certification('')).toBe(false);
      expect(verifyS08Certification('Arbitrary data protection text')).toBe(
        false,
      );
    });
  });
});
