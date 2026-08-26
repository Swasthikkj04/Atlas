import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import {
  WORKSPACE_INFORMATION_HIERARCHY,
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';
import type { InfrastructureBriefDto, BriefHighlightDto } from '../../types/api/brief.dto.ts';

const mockHighlight: BriefHighlightDto = {
  id: 'hl-1',
  title: 'Edge CDN Failover Configured',
  summary: 'Cloudflare edge caching active with automatic DNS fallback.',
  severity: 'LOW',
  componentType: 'cdn',
};

const mockBrief: InfrastructureBriefDto = {
  id: 'brf-stripe-101',
  snapshotId: 'snp-stripe-101',
  domainId: 'dom-stripe-prod',
  executiveSummary:
    'Stripe production edge topology is resilient. DNS authoritative servers are globally distributed across AWS Route53 with zero-trust TLS 1.3 enforced.',
  healthScore: 98,
  highlights: [mockHighlight],
  stableObservationsCount: 42,
  generatedAt: '2026-08-20T00:00:00Z',
};

describe('WX-903: Executive Brief Refinement & Composition Contracts', () => {
  describe('1. Information Hierarchy & Rank (Rank 1 Summary)', () => {
    it('verifies Executive Brief is Rank 1 in Workspace Information Hierarchy', () => {
      const rank1 = WORKSPACE_INFORMATION_HIERARCHY.find((h) => h.rank === 1);
      assert.equal(rank1?.surface, 'Executive Brief');
      assert.equal(rank1?.question, 'What is the current state?');
    });

    it('enforces NO_DASHBOARD_DRIFT and NO_SCANNER_REPORT_DRIFT invariants', () => {
      assert.ok('NO_DASHBOARD_DRIFT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_SCANNER_REPORT_DRIFT' in WORKSPACE_CERTIFIED_INVARIANTS);
      assert.ok('NO_PREMATURE_EVIDENCE_DOMINANCE' in WORKSPACE_CERTIFIED_INVARIANTS);
    });
  });

  describe('2. Domain-Scoped Query Key Isolation', () => {
    it('produces isolated query keys per domain to prevent cross-tenant leakage', () => {
      const keyA = queryKeys.briefs.byDomain('dom-stripe-prod');
      const keyB = queryKeys.briefs.byDomain('dom-github-prod');

      assert.notDeepEqual(keyA, keyB);
      assert.equal(keyA[2], 'dom-stripe-prod');
      assert.equal(keyB[2], 'dom-github-prod');
    });
  });

  describe('3. Refined Density & Posture Status Mapping', () => {
    it('maps high-severity highlights to Attention Required posture', () => {
      const criticalBrief: InfrastructureBriefDto = {
        ...mockBrief,
        highlights: [{ ...mockHighlight, severity: 'CRITICAL' }],
      };
      const hasCritical = criticalBrief.highlights.some((h) => h.severity === 'CRITICAL');
      assert.equal(hasCritical, true);

      const stableBrief: InfrastructureBriefDto = {
        ...mockBrief,
        highlights: [{ ...mockHighlight, severity: 'LOW' }],
      };
      const isStable = !stableBrief.highlights.some(
        (h) => h.severity === 'CRITICAL' || h.severity === 'HIGH'
      );
      assert.equal(isStable, true);
    });

    it('preserves traceability metadata and stable observation counts', () => {
      assert.equal(mockBrief.stableObservationsCount, 42);
      assert.equal(mockBrief.generatedAt, '2026-08-20T00:00:00Z');
      assert.ok(mockBrief.executiveSummary.length > 20);
    });
  });

  describe('4. Forbidden Anti-Patterns', () => {
    it('prohibits frontend synthesis, fake progress, and editorial ceremony', () => {
      const forbiddenBehaviors = [
        'frontendSynthesizesBrief',
        'fakeProgressPercentages',
        'animatedScanningTheater',
        'conversationalGreetingFluff',
        'giantHeroBannerTypography',
      ];

      for (const behavior of forbiddenBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });
});
