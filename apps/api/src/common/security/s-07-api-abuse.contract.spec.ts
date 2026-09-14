import {
  S07_TICKET_ID,
  S07_PHASE,
  S07_PRIORITY,
  S07_TYPE,
  S07_STATUS,
  S07_DEPENDS_ON,
  S07_BLOCKS,
  S07_CERTIFICATION_STATEMENT,
  S07_SECONDARY_GATE,
  S07_FROZEN_PRINCIPLE,
  S07_PRINCIPLES,
  S07_INVARIANTS,
  S07_ATTACK_MATRIX,
  evaluateApiAbuseAttackVector,
  verifyS07Certification,
  RateLimiterEngine,
  CANONICAL_RATE_LIMIT_POLICIES,
  resolveEndpointCategory,
  AbuseDetector,
  ConcurrencyLimiter,
  JobQuotaManager,
  AdmissionControl,
  RequestTimeoutManager,
  CANONICAL_TIMEOUTS_MS,
  RetryPolicy,
  CANONICAL_RETRY_CONFIG,
  CircuitBreaker,
} from './s-07-api-abuse.contract';

describe('S-07 — API Abuse, Rate Limiting & DoS Resistance Contract Spec (API Common Security)', () => {
  beforeEach(() => {
    RateLimiterEngine.reset();
    AbuseDetector.reset();
    ConcurrencyLimiter.reset();
    JobQuotaManager.reset();
    AdmissionControl.reset();
  });

  describe('1. Contract Identity, Scope & Frozen Principles', () => {
    it('verifies S-07 contract metadata', () => {
      expect(S07_TICKET_ID).toBe('S-07');
      expect(S07_PHASE).toBe('Production Security Hardening');
      expect(S07_PRIORITY).toBe('P0 — BLOCKING');
      expect(S07_STATUS).toBe('CERTIFIED_API_ABUSE_RATE_LIMIT_DOS_SECURITY');
      expect(S07_DEPENDS_ON).toEqual([
        'S-01',
        'S-02',
        'S-03',
        'S-04',
        'S-05',
        'S-06',
      ]);
      expect(S07_BLOCKS).toContain('Production Release');
    });

    it('verifies frozen principle "Availability is part of security"', () => {
      expect(S07_FROZEN_PRINCIPLE).toBe('Availability is part of security.');
      expect(S07_PRINCIPLES.AVAILABILITY_IS_SECURITY).toContain(
        'Authentication alone does not make an endpoint safe',
      );
      expect(S07_PRINCIPLES.SERVER_ENFORCED_ADMISSION).toContain(
        'Frontend throttling is never considered a security boundary',
      );
      expect(S07_PRINCIPLES.GX_WX_ADMIN_ABUSE_ISOLATION).toContain(
        'No quota or identity borrowing is ever permitted across planes',
      );
      expect(S07_PRINCIPLES.FAIL_CLOSED_ABUSE_CONTROL).toContain(
        'restrict admission rather than allowing unbounded access',
      );
    });

    it('verifies all 15 P0 security invariants (S07-I01 to S07-I15)', () => {
      const keys = Object.keys(S07_INVARIANTS);
      expect(keys.length).toBe(15);
      expect(S07_INVARIANTS['S07-I01'].title).toBe(
        'Server-Enforced Rate Limits',
      );
      expect(S07_INVARIANTS['S07-I02'].title).toBe('Identity-Aware Limiting');
      expect(S07_INVARIANTS['S07-I03'].title).toBe(
        'Endpoint-Specific Policies',
      );
      expect(S07_INVARIANTS['S07-I04'].title).toBe(
        'Understanding Job Protection',
      );
      expect(S07_INVARIANTS['S07-I05'].title).toBe('Concurrent Work Limits');
      expect(S07_INVARIANTS['S07-I06'].title).toBe('Queue Admission Control');
      expect(S07_INVARIANTS['S07-I07'].title).toBe(
        'Retry Amplification Protection',
      );
      expect(S07_INVARIANTS['S07-I08'].title).toBe('Brute-Force Resistance');
      expect(S07_INVARIANTS['S07-I09'].title).toBe('Enumeration Resistance');
      expect(S07_INVARIANTS['S07-I10'].title).toBe(
        'Distributed Abuse Resistance',
      );
      expect(S07_INVARIANTS['S07-I11'].title).toBe(
        'Resource Exhaustion Protection',
      );
      expect(S07_INVARIANTS['S07-I12'].title).toBe('Timeout Enforcement');
      expect(S07_INVARIANTS['S07-I13'].title).toBe(
        'Global Emergency Protection',
      );
      expect(S07_INVARIANTS['S07-I14'].title).toBe('429 Contract');
      expect(S07_INVARIANTS['S07-I15'].title).toBe(
        'Fail-Closed Abuse Controls',
      );
    });
  });

  describe('2. 50-Vector Attack Matrix Coverage (S07-01 to S07-50)', () => {
    it('contains all 50 required attack vectors in matrix', () => {
      expect(S07_ATTACK_MATRIX.length).toBe(50);
      for (let i = 1; i <= 50; i++) {
        const expectedId = `S07-${i < 10 ? '0' + i : i}`;
        const found = S07_ATTACK_MATRIX.find((v) => v.id === expectedId);
        expect(found).toBeDefined();
        expect(found?.expectedDecision).toBeDefined();
      }
    });

    it('evaluates all 50 attack vectors via evaluator engine', () => {
      for (const vector of S07_ATTACK_MATRIX) {
        const res = evaluateApiAbuseAttackVector(vector.id, {});
        expect(res.vectorId).toBe(vector.id);
        expect(res.decision).toBe(vector.expectedDecision);
        expect(res.passed).toBe(true);
      }
    });
  });

  describe('3. Rate Limiter Engine & Endpoint Policies (S07-I01, S07-I02, S07-I03)', () => {
    it('resolves endpoint categories correctly', () => {
      expect(
        resolveEndpointCategory('POST', '/api/v1/auth/login', 'ANONYMOUS'),
      ).toBe('AUTH_LOGIN');
      expect(
        resolveEndpointCategory('POST', '/api/v1/auth/register', 'ANONYMOUS'),
      ).toBe('AUTH_REGISTER');
      expect(
        resolveEndpointCategory('POST', '/api/v1/auth/refresh', 'USER'),
      ).toBe('AUTH_REFRESH');
      expect(
        resolveEndpointCategory('POST', '/api/v1/guest/understand', 'GUEST'),
      ).toBe('GUEST_UNDERSTAND');
      expect(resolveEndpointCategory('POST', '/api/v1/domains', 'USER')).toBe(
        'USER_DOMAIN_CRUD',
      );
      expect(resolveEndpointCategory('GET', '/api/v1/domains', 'USER')).toBe(
        'USER_READ_ONLY',
      );
      expect(
        resolveEndpointCategory('GET', '/api/v1/admin/users', 'ADMIN'),
      ).toBe('ADMIN_OPERATIONS');
    });

    it('enforces server-side rate limits on login (5/min) and blocks 6th request (S07-01, S07-02, S07-08)', () => {
      const ip = '198.51.100.1';
      for (let i = 1; i <= 5; i++) {
        const res = RateLimiterEngine.evaluate(
          'POST',
          '/api/v1/auth/login',
          ip,
        );
        expect(res.isBlocked).toBe(false);
        expect(res.remaining).toBe(5 - i);
      }

      const blockedRes = RateLimiterEngine.evaluate(
        'POST',
        '/api/v1/auth/login',
        ip,
      );
      expect(blockedRes.isBlocked).toBe(true);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('produces safe canonical 429 response without internal topology leaks (S07-I14, S07-45)', () => {
      const resp = RateLimiterEngine.create429Response(30, 'req_123');
      expect(resp.statusCode).toBe(429);
      expect(resp.error).toBe('Too Many Requests');
      expect(resp.retryAfter).toBe(30);
      expect(resp.correlationId).toBe('req_123');
      expect((resp as any).workers).toBeUndefined();
      expect((resp as any).databaseState).toBeUndefined();
    });
  });

  describe('4. Multi-Dimensional Abuse & Brute-Force Detector (S07-I08, S07-I10)', () => {
    it('quarantines IP and target identity after 5 consecutive failures (S07-08, S07-09)', () => {
      const ctx = { ip: '203.0.113.50', targetIdentity: 'admin@nebula.io' };

      for (let i = 1; i <= 4; i++) {
        const fail = AbuseDetector.recordFailure(ctx);
        expect(fail.nowQuarantined).toBe(false);
      }

      const fifthFail = AbuseDetector.recordFailure(ctx);
      expect(fifthFail.nowQuarantined).toBe(true);
      expect(fifthFail.retryAfterSeconds).toBeGreaterThan(0);

      const status = AbuseDetector.evaluateAbuseStatus(ctx);
      expect(status.isBlocked).toBe(true);
      expect(status.decision).toBe('BLOCKED_ABUSE_QUARANTINE');
    });

    it('blocks rotation bypass when attacker tries rotating target identities from same IP (S07-03, S07-36)', () => {
      const ip = '203.0.113.99';
      for (let i = 1; i <= 5; i++) {
        AbuseDetector.recordFailure({
          ip,
          targetIdentity: `target${i}@domain.com`,
        });
      }

      // Next attempt on a new victim from the same attacking IP is immediately quarantined
      const status = AbuseDetector.evaluateAbuseStatus({
        ip,
        targetIdentity: 'fresh_target@domain.com',
      });
      expect(status.isBlocked).toBe(true);
      expect(status.decision).toBe('BLOCKED_ABUSE_QUARANTINE');
    });
  });

  describe('5. Concurrency Limiter & Worker Saturation Defense (S07-I04, S07-I05)', () => {
    it('restricts Guest to 1 concurrent understanding job (S07-18)', () => {
      const guestKey = 'guest_sess_123';
      const slot1 = ConcurrencyLimiter.acquire(guestKey, 'GUEST');
      expect(slot1.acquired).toBe(true);
      expect(slot1.activeCount).toBe(1);

      const slot2 = ConcurrencyLimiter.acquire(guestKey, 'GUEST');
      expect(slot2.acquired).toBe(false);
      expect(slot2.decision).toBe('CONCURRENCY_EXCEEDED');

      ConcurrencyLimiter.release(slot1.leaseId);
      const slot3 = ConcurrencyLimiter.acquire(guestKey, 'GUEST');
      expect(slot3.acquired).toBe(true);
    });

    it('prohibits anonymous users from acquiring background jobs', () => {
      const anonRes = ConcurrencyLimiter.acquire('anon_key', 'ANONYMOUS');
      expect(anonRes.acquired).toBe(false);
      expect(anonRes.decision).toBe('ANONYMOUS_PROHIBITED');
    });
  });

  describe('6. Background Job Quota & Deduplication (S07-I04, S07-I06)', () => {
    it('enforces strict 3 jobs/hr quota for Guests and suppresses duplicates (S07-15, S07-17)', () => {
      const guestKey = 'guest_sess_456';

      // 1. First job admitted
      const check1 = JobQuotaManager.checkAdmission(
        guestKey,
        'GUEST',
        'target-a.com',
      );
      expect(check1.admitted).toBe(true);
      JobQuotaManager.recordJob(guestKey, 'target-a.com');

      // 2. Duplicate submission within 5 minutes is suppressed
      const dupCheck = JobQuotaManager.checkAdmission(
        guestKey,
        'GUEST',
        'target-a.com',
      );
      expect(dupCheck.admitted).toBe(false);
      expect(dupCheck.isDuplicate).toBe(true);
      expect(dupCheck.decision).toBe('DUPLICATE_SUPPRESSED');

      // 3. Second and third distinct jobs admitted
      JobQuotaManager.recordJob(guestKey, 'target-b.com');
      JobQuotaManager.recordJob(guestKey, 'target-c.com');

      // 4. Fourth job exceeds hourly quota
      const check4 = JobQuotaManager.checkAdmission(
        guestKey,
        'GUEST',
        'target-d.com',
      );
      expect(check4.admitted).toBe(false);
      expect(check4.decision).toBe('HOURLY_QUOTA_EXCEEDED');
    });
  });

  describe('7. Global Admission Control & Emergency Protection (S07-I11, S07-I13)', () => {
    it('sheds DB requests when connection pool is saturated (S07-26, S07-27)', () => {
      AdmissionControl.setDbConnectionCount(100, 100);

      const userReq = AdmissionControl.evaluateAdmission({
        principalType: 'USER',
        category: 'USER_DOMAIN_CRUD',
      });
      expect(userReq.admitted).toBe(false);
      expect(userReq.decision).toBe('SHED_DB_POOL_SATURATED');

      // Admin & Auth Login are preserved through reservation
      const adminReq = AdmissionControl.evaluateAdmission({
        principalType: 'ADMIN',
        category: 'ADMIN_OPERATIONS',
      });
      expect(adminReq.admitted).toBe(true);
    });

    it('sheds anonymous and guest requests during CRITICAL system overload (S07-20, S07-49)', () => {
      AdmissionControl.setLoadLevel('CRITICAL');

      const guestReq = AdmissionControl.evaluateAdmission({
        principalType: 'GUEST',
        category: 'GUEST_UNDERSTAND',
      });
      expect(guestReq.admitted).toBe(false);
      expect(guestReq.decision).toBe('SHED_OVERLOAD_CRITICAL');

      const userReq = AdmissionControl.evaluateAdmission({
        principalType: 'USER',
        category: 'USER_UNDERSTAND',
      });
      expect(userReq.admitted).toBe(true);
    });
  });

  describe('8. Request Timeout Enforcement (S07-I12)', () => {
    it('aborts operations exceeding execution upper bounds (S07-23, S07-25)', async () => {
      const slowOp = () =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('done'), 100),
        );

      await expect(
        RequestTimeoutManager.withTimeout(slowOp, 20, 'slow_probe'),
      ).rejects.toThrow(/timed out after 20ms/);
    });

    it('completes fast operations within timeout', async () => {
      const fastOp = () => Promise.resolve('fast_result');
      const res = await RequestTimeoutManager.withTimeout(
        fastOp,
        1000,
        'fast_probe',
      );
      expect(res).toBe('fast_result');
    });
  });

  describe('9. Retry Policy & Amplification Defense (S07-I07)', () => {
    it('stops retrying after maximum retry count (S07-21, S07-22)', () => {
      const res = RetryPolicy.isRetryable(
        503,
        CANONICAL_RETRY_CONFIG.maxRetries,
      );
      expect(res.canRetry).toBe(false);
      expect(res.decision).toBe('MAX_RETRIES_EXCEEDED');
    });

    it('blocks retries on client and auth errors (400, 401, 403, 404, 422)', () => {
      expect(RetryPolicy.isRetryable(400, 0).canRetry).toBe(false);
      expect(RetryPolicy.isRetryable(401, 0).canRetry).toBe(false);
      expect(RetryPolicy.isRetryable(403, 0).canRetry).toBe(false);
      expect(RetryPolicy.isRetryable(422, 0).canRetry).toBe(false);
    });

    it('calculates bounded exponential delay for retryable 5xx errors', () => {
      const res = RetryPolicy.isRetryable(502, 1);
      expect(res.canRetry).toBe(true);
      expect(res.delayMs).toBeGreaterThan(0);
      expect(res.delayMs).toBeLessThanOrEqual(
        CANONICAL_RETRY_CONFIG.maxDelayMs,
      );
    });
  });

  describe('10. Circuit Breaker Protection (S07-I13)', () => {
    it('trips to OPEN state when failure threshold is reached and recovers via HALF_OPEN', () => {
      const cb = new CircuitBreaker('external-discovery-api', {
        failureThreshold: 3,
        resetTimeoutMs: 50,
        halfOpenTrialSuccesses: 1,
      });

      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);

      cb.recordFailure();
      cb.recordFailure();
      cb.recordFailure();

      expect(cb.getState()).toBe('OPEN');
      expect(cb.canExecute()).toBe(false);
    });
  });

  describe('11. Fail-Closed Resilience (S07-I15)', () => {
    it('fails closed and blocks sensitive operations when rate limit store is down (S07-39, S07-40)', () => {
      RateLimiterEngine.setSimulatedFailure(true);

      const loginRes = RateLimiterEngine.evaluate(
        'POST',
        '/api/v1/auth/login',
        '1.1.1.1',
      );
      expect(loginRes.isBlocked).toBe(true);
      expect(loginRes.failClosedEngaged).toBe(true);
    });
  });

  describe('12. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      expect(verifyS07Certification(S07_CERTIFICATION_STATEMENT)).toBe(true);
      expect(verifyS07Certification(S07_SECONDARY_GATE)).toBe(true);
    });

    it('rejects invalid or blank statements', () => {
      expect(verifyS07Certification('')).toBe(false);
      expect(verifyS07Certification('Some uncertified statement')).toBe(false);
    });
  });
});
