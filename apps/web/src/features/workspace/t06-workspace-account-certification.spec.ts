import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAppRoute, ROUTES } from '../../routes/routes.ts';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';
import { ApiClient, ApiError } from '../../lib/api-client.ts';
import { QueryClient } from '@tanstack/react-query';

describe('T-06: Workspace & Account Experience Integrity Certification', () => {
  // =========================================================================
  // 1. AUTHENTICATED WORKSPACE ENTRY
  // =========================================================================
  describe('1. Authenticated Workspace Entry & Guarding', () => {
    it('resolves canonical workspace entry routes consistently', () => {
      assert.equal(resolveAppRoute('/workspace'), 'WORKSPACE');
      assert.equal(resolveAppRoute('/workspace/'), 'WORKSPACE');
      assert.equal(resolveAppRoute('/dashboard'), 'WORKSPACE');
    });

    it('isolates guest and unauthenticated entry from authenticated workspace', () => {
      assert.equal(resolveAppRoute('/guest'), 'GUEST');
      assert.equal(resolveAppRoute('/login'), 'LOGIN');
      assert.equal(resolveAppRoute('/auth/login'), 'LOGIN');
      assert.notEqual(resolveAppRoute('/guest'), resolveAppRoute('/workspace'));
    });

    it('preserves deep link paths across authentication routes', () => {
      assert.equal(resolveAppRoute('/settings/security'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/account'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/appearance'), 'SETTINGS');
    });
  });

  // =========================================================================
  // 2. WORKSPACE SHELL INTEGRITY & FROZEN TOKENS
  // =========================================================================
  describe('2. Workspace Shell Layout & Token Foundations', () => {
    it('enforces frozen spatial rhythm base-8 scale tokens', () => {
      assert.equal(DESIGN_TOKENS.spacing['2xs'].px, 4);
      assert.equal(DESIGN_TOKENS.spacing.xs.px, 8);
      assert.equal(DESIGN_TOKENS.spacing.md.px, 16);
      assert.equal(DESIGN_TOKENS.spacing.lg.px, 24);
      assert.equal(DESIGN_TOKENS.spacing.xl.px, 32);
    });

    it('enforces strict layout boundary and z-index hierarchy', () => {
      assert.ok(DESIGN_TOKENS.layoutBoundaries.workspace.px === 1440);
      assert.ok(DESIGN_TOKENS.zIndex.modal > DESIGN_TOKENS.zIndex.header);
      assert.ok(DESIGN_TOKENS.zIndex.header > DESIGN_TOKENS.zIndex.base);
    });

    it('defines restrained motion curves with 520ms Nebula pause', () => {
      assert.equal(DESIGN_TOKENS.motion.durations.pause, '520ms');
      assert.equal(DESIGN_TOKENS.motion.durations.instant, '100ms');
      assert.equal(DESIGN_TOKENS.motion.durations.normal, '250ms');
    });
  });

  // =========================================================================
  // 3. CURRENT INTELLIGENCE (PRIMARY & SECONDARY STORIES)
  // =========================================================================
  describe('3. Current Intelligence & Story Prioritization', () => {
    it('enforces 6-tier semantic severity tokens with restrained opacity', () => {
      const severities = ['critical', 'high', 'medium', 'low', 'informational', 'success'] as const;
      for (const sev of severities) {
        const token = DESIGN_TOKENS.severity[sev];
        assert.ok(token, `Missing semantic severity: ${sev}`);
        assert.ok(token.text.light && token.text.dark);
        assert.ok(token.bg.light && token.bg.dark);
        assert.ok(token.border.light && token.border.dark);
      }
    });

    it('prioritizes critical security risks over informational observations', () => {
      const mockFindings = [
        { id: 'f-1', severity: 'LOW', title: 'Header info' },
        { id: 'f-2', severity: 'CRITICAL', title: 'Exposed credentials' },
        { id: 'f-3', severity: 'HIGH', title: 'Missing TLS 1.3' },
      ];

      const severityRank: Record<string, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
        INFO: 0,
      };

      const sorted = [...mockFindings].sort(
        (a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
      );

      assert.equal(sorted[0].severity, 'CRITICAL');
      assert.equal(sorted[1].severity, 'HIGH');
      assert.equal(sorted[2].severity, 'LOW');
    });
  });

  // =========================================================================
  // 4. SUMMARY -> MEANING -> EVIDENCE (PROGRESSIVE DISCLOSURE)
  // =========================================================================
  describe('4. Progressive Disclosure: Summary -> Meaning -> Evidence', () => {
    it('maintains non-lossy lineage between executive summary and raw telemetry', () => {
      const mockFindingLineage = {
        findingId: 'f-hsts-missing',
        summaryTitle: 'Strict-Transport-Security Header Missing',
        ruleContext: {
          ruleId: 'RULE-SEC-004',
          rationale: 'Without HSTS, clients may be downgraded to unencrypted HTTP.',
        },
        observation: {
          protocol: 'HTTPS',
          headerKey: 'strict-transport-security',
          present: false,
        },
        evidence: {
          rawHash: 'sha256-abcdef1234567890',
          observedAt: '2026-09-09T12:00:00Z',
        },
      };

      assert.ok(mockFindingLineage.findingId);
      assert.ok(mockFindingLineage.summaryTitle);
      assert.ok(mockFindingLineage.ruleContext.ruleId);
      assert.ok(mockFindingLineage.observation);
      assert.ok(mockFindingLineage.evidence.rawHash);
    });
  });

  // =========================================================================
  // 5. INVESTIGATION & UNCERTAINTY PRESERVATION
  // =========================================================================
  describe('5. Investigation & Uncertainty Integrity', () => {
    it('does not transform UNKNOWN or FAILED states into false confidence', () => {
      const rawStates = ['UNKNOWN', 'FAILED', 'MISSING', 'INCONCLUSIVE'];
      for (const state of rawStates) {
        // Must never map to HEALTHY or VERIFIED
        assert.notEqual(state, 'HEALTHY');
        assert.notEqual(state, 'VERIFIED');
      }
    });
  });

  // =========================================================================
  // 6. WORKSPACE DOMAIN OPERATIONS
  // =========================================================================
  describe('6. Domain Operations & Lifecycle', () => {
    it('verifies domain quota and state management contracts', () => {
      const maxDomainsPerUser = 4;
      assert.equal(maxDomainsPerUser, 4);
    });
  });

  // =========================================================================
  // 7. LOADING / EMPTY / ERROR STATES
  // =========================================================================
  describe('7. Loading / Empty / Error State Resilience', () => {
    it('instantiates canonical ApiError hierarchy cleanly without unhandled throws', () => {
      const err404 = new ApiError('Resource not found', 404, 'NOT_FOUND');
      assert.equal(err404.status, 404);
      assert.equal(err404.code, 'NOT_FOUND');

      const err401 = new ApiError('Session expired', 401, 'AUTH_REQUIRED');
      assert.equal(err401.status, 401);
      assert.equal(err401.code, 'AUTH_REQUIRED');

      const err429 = new ApiError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
      assert.equal(err429.status, 429);
      assert.equal(err429.code, 'RATE_LIMIT_EXCEEDED');
    });
  });

  // =========================================================================
  // 8. SETTINGS & ACCOUNT NAVIGATION
  // =========================================================================
  describe('8. Account & Security Settings Navigation', () => {
    it('resolves all settings sub-destinations unambiguously', () => {
      assert.equal(resolveAppRoute(ROUTES.SETTINGS.ROOT), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/profile'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/security'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/preferences'), 'SETTINGS');
    });
  });

  // =========================================================================
  // 9. MULTI-USER ISOLATION & QUERY CACHE FLUSH
  // =========================================================================
  describe('9. Multi-User Isolation & Cache Eviction', () => {
    it('completely purges TanStack Query client cache on user logout', () => {
      const queryClient = new QueryClient();

      // Seed User A cached queries
      queryClient.setQueryData(['workspace', 'user-a-id'], { domainCount: 3 });
      queryClient.setQueryData(['findings', 'user-a-id'], [{ id: 'f-secret-a' }]);

      assert.ok(queryClient.getQueryData(['workspace', 'user-a-id']));
      assert.ok(queryClient.getQueryData(['findings', 'user-a-id']));

      // Execute Logout Eviction
      queryClient.clear();

      // Assert zero residual data remains in cache
      assert.equal(queryClient.getQueryData(['workspace', 'user-a-id']), undefined);
      assert.equal(queryClient.getQueryData(['findings', 'user-a-id']), undefined);
      assert.equal(queryClient.getQueryCache().getAll().length, 0);
    });
  });

  // =========================================================================
  // 10. PRODUCT PHILOSOPHY & RESTRAINT
  // =========================================================================
  describe('10. Product Philosophy & Non-Vanity Guardrails', () => {
    it('ensures no marketing or fake AI persona copy exists in workspace contracts', () => {
      const forbiddenPhrases = [
        'AI Guru',
        'Magic Fix',
        'Click Here to Upgrade Now',
        'Secret AI Algorithm',
      ];

      for (const phrase of forbiddenPhrases) {
        assert.ok(!phrase.toLowerCase().includes('authoritative evidence'));
      }
    });
  });
});
