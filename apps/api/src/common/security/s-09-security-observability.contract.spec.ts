import {
  S09_TICKET_ID,
  S09_PHASE,
  S09_PRIORITY,
  S09_TYPE,
  S09_STATUS,
  S09_DEPENDS_ON,
  S09_BLOCKS,
  S09_CERTIFICATION_STATEMENT,
  S09_SECONDARY_GATE,
  S09_FROZEN_PRINCIPLE,
  S09_PRINCIPLES,
  S09_INVARIANTS,
  S09_ATTACK_MATRIX,
  evaluateObservabilityAttackVector,
  verifyS09Certification,
  AuditRedactor,
  AuditIntegrityEngine,
  SecurityDetector,
  SecurityAuditWriter,
  SecurityEvent,
} from './s-09-security-observability.contract';

describe('S-09 — Security Observability & Audit Contract Spec (API Common Security)', () => {
  beforeEach(() => {
    SecurityDetector.reset();
    SecurityAuditWriter.reset();
  });

  describe('1. Contract Identity, Scope & Frozen Principles', () => {
    it('verifies S-09 contract metadata', () => {
      expect(S09_TICKET_ID).toBe('S-09');
      expect(S09_PHASE).toBe('Production Security Hardening');
      expect(S09_PRIORITY).toBe('P0 — BLOCKING');
      expect(S09_STATUS).toBe('CERTIFIED_SECURITY_OBSERVABILITY_AUDIT');
      expect(S09_DEPENDS_ON).toEqual([
        'S-01',
        'S-02',
        'S-03',
        'S-04',
        'S-05',
        'S-06',
        'S-07',
        'S-08',
      ]);
      expect(S09_BLOCKS).toContain('Production Release');
    });

    it('verifies frozen principle "If Nebula cannot reliably observe a security decision, Nebula cannot reliably defend or investigate it."', () => {
      expect(S09_FROZEN_PRINCIPLE).toBe(
        'If Nebula cannot reliably observe a security decision, Nebula cannot reliably defend or investigate it.',
      );
      expect(S09_PRINCIPLES.OBSERVATION_NOT_AUTHORIZATION).toContain(
        'The observation layer must never become an authorization mechanism',
      );
      expect(S09_PRINCIPLES.SERVER_ENFORCED_INTEGRITY).toContain(
        'Audit events are server-generated, server-timestamped',
      );
      expect(S09_PRINCIPLES.ZERO_SECRET_LEAKAGE).toContain(
        'Mandatory redaction boundary guarantees secrets',
      );
      expect(S09_PRINCIPLES.ISOLATED_AUDIT_ACCESS).toContain(
        'Audit information is partitioned by plane and tenant',
      );
    });

    it('verifies all 15 P0 security invariants (S09-I01 to S09-I15)', () => {
      const keys = Object.keys(S09_INVARIANTS);
      expect(keys.length).toBe(15);
      expect(S09_INVARIANTS['S09-I01'].title).toBe('Tenant Attribution');
      expect(S09_INVARIANTS['S09-I02'].title).toBe('Plane Attribution');
      expect(S09_INVARIANTS['S09-I03'].title).toBe(
        'No Cross-Tenant Audit Leakage',
      );
      expect(S09_INVARIANTS['S09-I04'].title).toBe('GX Isolation');
      expect(S09_INVARIANTS['S09-I05'].title).toBe('Admin Isolation');
      expect(S09_INVARIANTS['S09-I06'].title).toBe(
        'Audit Integrity & Non-Repudiation',
      );
      expect(S09_INVARIANTS['S09-I07'].title).toBe('Log vs Audit Separation');
      expect(S09_INVARIANTS['S09-I08'].title).toBe(
        'Mandatory Redaction Boundary',
      );
      expect(S09_INVARIANTS['S09-I09'].title).toBe('Security Detection Model');
      expect(S09_INVARIANTS['S09-I10'].title).toBe('Security Event Severity');
      expect(S09_INVARIANTS['S09-I11'].title).toBe('Request Correlation');
      expect(S09_INVARIANTS['S09-I12'].title).toBe('Audit Access Boundary');
      expect(S09_INVARIANTS['S09-I13'].title).toBe(
        'Audit Retention & Immutability',
      );
      expect(S09_INVARIANTS['S09-I14'].title).toBe(
        'Fail-Closed Audit Pipeline',
      );
      expect(S09_INVARIANTS['S09-I15'].title).toBe('Direct API Protection');
    });
  });

  describe('2. 50-Vector Attack Matrix Coverage (S09-01 to S09-50)', () => {
    it('contains all 50 required attack vectors in matrix', () => {
      expect(S09_ATTACK_MATRIX.length).toBe(50);
      for (let i = 1; i <= 50; i++) {
        const expectedId = `S09-${i < 10 ? '0' + i : i}`;
        const found = S09_ATTACK_MATRIX.find((v) => v.id === expectedId);
        expect(found).toBeDefined();
        expect(found?.expectedDecision).toBeDefined();
      }
    });

    it('evaluates all 50 attack vectors via universal evaluator engine', () => {
      for (const vector of S09_ATTACK_MATRIX) {
        const res = evaluateObservabilityAttackVector(vector.id, {});
        expect(res.vectorId).toBe(vector.id);
        expect(res.decision).toBe(vector.expectedDecision);
        expect(res.passed).toBe(true);
      }
    });
  });

  describe('3. Audit Integrity & Anti-Forgery (S09-I06, S09-I10)', () => {
    it('generates server-enforced event ID, timestamp, and severity', () => {
      const event = AuditIntegrityEngine.createEvent({
        eventType: 'LOGIN_SUCCESS',
        principal: { identityType: 'USER', userId: 'usr_100' },
        plane: 'WX',
        action: 'auth.login',
        decision: 'ALLOWED',
        request: {
          requestId: 'req_123',
          method: 'POST',
          route: '/api/v1/auth/login',
        },
      });

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeLessThanOrEqual(Date.now());
      expect(event.severity).toBe('INFO');
      expect(event.plane).toBe('WX');
    });

    it('blocks client attempts to forge or spoof server audit metadata (S09-01, S09-03, S09-19, S09-33, S09-35, S09-38)', () => {
      const forgedClientPayload = {
        eventId: 'client-fake-id',
        occurredAt: 100000000,
        severity: 'INFO',
        decision: 'ALLOWED',
      };

      const check =
        AuditIntegrityEngine.validateUntrustedClientPayload(
          forgedClientPayload,
        );
      expect(check.isForged).toBe(true);
      expect(check.decision).toBe('CLIENT_AUDIT_FORGERY_BLOCKED');
    });
  });

  describe('4. Mandatory Redaction Boundary (S09-I08)', () => {
    it('redacts credentials, tokens, secrets, encryption keys, and raw payloads from audit records (S09-21 to S09-30)', () => {
      const sensitiveMetadata = {
        password: 'PlainTextPassword123!',
        accessToken: 'eyJhbGciOi...',
        refreshToken: 'rt_mock_12345',
        authorization: 'Bearer secret_token_xyz',
        clientSecret: 'oauth_secret_abc',
        privateKey: '-----BEGIN PRIVATE KEY-----',
        encryptionKey: '0123456789abcdef0123456789abcdef',
        rawCollectorPayload: { socketDump: '192.168.1.1:443' },
        userEmail: 'alice@enterprise.com',
        safeProperty: 'legit_data',
      };

      const redacted = AuditRedactor.redactAuditMetadata(sensitiveMetadata);
      expect(redacted?.password).toBe('[REDACTED_SECRET]');
      expect(redacted?.accessToken).toBe('[REDACTED_SECRET]');
      expect(redacted?.refreshToken).toBe('[REDACTED_SECRET]');
      expect(redacted?.authorization).toBe('[REDACTED_SECRET]');
      expect(redacted?.clientSecret).toBe('[REDACTED_SECRET]');
      expect(redacted?.privateKey).toBe('[REDACTED_SECRET]');
      expect(redacted?.encryptionKey).toBe('[REDACTED_SECRET]');
      expect(redacted?.rawCollectorPayload).toBe('[REDACTED_SECRET]');
      expect(redacted?.userEmail).toBe('[REDACTED_EMAIL]');
      expect(redacted?.safeProperty).toBe('legit_data');
    });
  });

  describe('5. Security Detection Engine (S09-I09)', () => {
    it('detects login failure burst (S09-41)', () => {
      const req = {
        requestId: 'req_1',
        method: 'POST',
        route: '/api/v1/auth/login',
      };
      const source = { ip: '198.51.100.44' };

      for (let i = 0; i < 4; i++) {
        const { alert } = SecurityEvent.emit({
          eventType: 'LOGIN_FAILURE',
          principal: { identityType: 'ANONYMOUS' },
          plane: 'WX',
          action: 'auth.login',
          decision: 'DENIED',
          request: req,
          source,
        });
        expect(alert).toBeNull();
      }

      // 5th failed login triggers alert
      const { alert } = SecurityEvent.emit({
        eventType: 'LOGIN_FAILURE',
        principal: { identityType: 'ANONYMOUS' },
        plane: 'WX',
        action: 'auth.login',
        decision: 'DENIED',
        request: req,
        source,
      });

      expect(alert).not.toBeNull();
      expect(alert?.pattern).toBe('AUTH_FAILURE_BURST');
      expect(alert?.severity).toBe('CRITICAL');
    });

    it('detects refresh reuse pattern (S09-42)', () => {
      const { alert } = SecurityEvent.emit({
        eventType: 'REFRESH_REUSE_DETECTED',
        principal: { identityType: 'USER', userId: 'usr_victim' },
        plane: 'WX',
        action: 'auth.refresh',
        decision: 'DENIED',
        request: {
          requestId: 'req_2',
          method: 'POST',
          route: '/api/v1/auth/refresh',
        },
      });

      expect(alert).not.toBeNull();
      expect(alert?.pattern).toBe('REFRESH_REUSE_PATTERN');
      expect(alert?.severity).toBe('CRITICAL');
    });

    it('detects cross-plane GX -> WX violation pattern (S09-44)', () => {
      const { alert } = SecurityEvent.emit({
        eventType: 'GX_WX_BOUNDARY_VIOLATION',
        principal: { identityType: 'GUEST', sessionId: 'gx_sess_123' },
        plane: 'GX',
        action: 'guest.access_workspace',
        decision: 'DENIED',
        request: {
          requestId: 'req_3',
          method: 'GET',
          route: '/api/v1/workspaces/ws-1',
        },
      });

      expect(alert).not.toBeNull();
      expect(alert?.pattern).toBe('CROSS_PLANE_ATTACK_PATTERN');
      expect(alert?.severity).toBe('CRITICAL');
    });
  });

  describe('6. Audit Store Plane & Tenant Isolation (S09-I03, S09-I04, S09-I05, S09-I12)', () => {
    it('blocks GX from accessing audit records (S09-14, S09-49)', () => {
      const query = SecurityAuditWriter.query({ plane: 'GX' });
      expect(query.allowed).toBe(false);
      expect(query.decision).toBe('GX_AUDIT_ACCESS_BLOCKED');
    });

    it('prevents User A from retrieving User B audit records (S09-14)', () => {
      const query = SecurityAuditWriter.query({
        plane: 'WX',
        requestingUserId: 'usr_alice',
        targetUserId: 'usr_bob',
      });
      expect(query.allowed).toBe(false);
      expect(query.decision).toBe('CROSS_TENANT_AUDIT_BLOCKED');
    });

    it('allows WX user to query only their own audit records', () => {
      SecurityEvent.emit({
        eventType: 'LOGIN_SUCCESS',
        principal: { identityType: 'USER', userId: 'usr_alice' },
        plane: 'WX',
        action: 'auth.login',
        decision: 'ALLOWED',
        request: { requestId: 'req_a', method: 'POST', route: '/auth/login' },
      });

      SecurityEvent.emit({
        eventType: 'LOGIN_SUCCESS',
        principal: { identityType: 'USER', userId: 'usr_bob' },
        plane: 'WX',
        action: 'auth.login',
        decision: 'ALLOWED',
        request: { requestId: 'req_b', method: 'POST', route: '/auth/login' },
      });

      const query = SecurityAuditWriter.query({
        plane: 'WX',
        requestingUserId: 'usr_alice',
        targetUserId: 'usr_alice',
      });

      expect(query.allowed).toBe(true);
      expect(query.events?.length).toBe(1);
      expect(query.events?.[0].principal.userId).toBe('usr_alice');
    });
  });

  describe('7. Audit Retention & Storage Resiliency (S09-I13, S09-I14)', () => {
    it('purges audit records exceeding 90 days retention (S09-31, S09-32)', () => {
      const now = Date.now();
      const oldEvent = AuditIntegrityEngine.createEvent({
        eventType: 'LOGIN_SUCCESS',
        principal: { identityType: 'USER', userId: 'usr_old' },
        plane: 'WX',
        action: 'auth.login',
        decision: 'ALLOWED',
        request: { requestId: 'req_old', method: 'POST', route: '/auth/login' },
        occurredAt: now - 95 * 24 * 60 * 60 * 1000, // 95 days old
      });

      SecurityAuditWriter.record(oldEvent);

      const purged = SecurityAuditWriter.purgeExpiredRecords(now);
      expect(purged).toBe(1);
    });

    it('fails closed when audit storage is down during CRITICAL security events (S09-40, S09-47)', () => {
      SecurityAuditWriter.setStorageAvailable(false);

      const criticalEvent = AuditIntegrityEngine.createEvent({
        eventType: 'INJECTION_ATTEMPT',
        principal: { identityType: 'ANONYMOUS' },
        plane: 'WX',
        action: 'input.validate',
        decision: 'DENIED',
        request: {
          requestId: 'req_bad',
          method: 'POST',
          route: '/api/v1/domains',
        },
      });

      expect(() => SecurityAuditWriter.record(criticalEvent)).toThrow(
        /CRITICAL_AUDIT_STORAGE_FAILURE/,
      );
    });
  });

  describe('8. Canonical Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      expect(verifyS09Certification(S09_CERTIFICATION_STATEMENT)).toBe(true);
      expect(verifyS09Certification(S09_SECONDARY_GATE)).toBe(true);
    });

    it('rejects uncertified statements', () => {
      expect(verifyS09Certification('')).toBe(false);
      expect(
        verifyS09Certification('Arbitrary security observability text'),
      ).toBe(false);
    });
  });
});
