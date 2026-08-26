import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
} from '../../types/api';
import {
  resolveVerifiedSnapshotPair,
  integrateAuthoritativeChanges,
  resolveHistoricalSnapshotComparison,
} from './contracts/snapshot-comparison.contract.ts';
import {
  resolveChangesState,
  CHANGES_COPY,
  CHANGES_CERTIFIED_INVARIANTS,
} from './contracts/changes.contract.ts';
import {
  resolveMemoryState,
  resolveMemoryBaseline,
  MEMORY_BASELINE_COPY,
} from './contracts/memory.contract.ts';
import {
  resolveSelectedSnapshot,
  resolveSnapshotHistoryState,
} from './contracts/snapshot-history.contract.ts';
import {
  buildInvestigationLink,
} from './contracts/investigation.contract.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';

describe('WX-1010: Verified Snapshot Lineage & Historical Comparison Discoverability', () => {
  const mockDomainId = 'dom-ding-001';
  const mockDomainName = 'ding.com';
  const foreignDomainId = 'dom-other-999';

  // Verified Snapshots representing immutable historical understandings
  const snapshotA: InfrastructureSnapshotDto = {
    id: 'snp-baseline-aaa',
    domainId: mockDomainId,
    domainName: mockDomainName,
    jobId: 'job-run-1',
    createdAt: '2026-08-22T10:00:00Z',
    capturedAt: '2026-08-22T10:00:00Z',
    httpStatus: 200,
    responseTimeMs: 95,
    httpObservation: {
      statusCode: 200,
      server: 'nginx/1.24.0',
      securityHeaders: {
        'x-frame-options': 'DENY',
        'strict-transport-security': 'max-age=31536000',
      },
    },
    tlsCertificate: {
      subject: 'ding.com',
      issuer: "Let's Encrypt",
      validFrom: '2026-05-01T00:00:00Z',
      validTo: '2026-08-01T00:00:00Z',
    },
    technologies: ['NGINX', 'PHP'],
  };

  const snapshotB: InfrastructureSnapshotDto = {
    id: 'snp-second-bbb',
    domainId: mockDomainId,
    domainName: mockDomainName,
    jobId: 'job-run-2',
    createdAt: '2026-08-23T14:30:00Z',
    capturedAt: '2026-08-23T14:30:00Z',
    httpStatus: 200,
    responseTimeMs: 88,
    httpObservation: {
      statusCode: 200,
      server: 'nginx/1.24.0',
      securityHeaders: {
        'x-frame-options': 'SAMEORIGIN',
        'strict-transport-security': 'max-age=31536000',
      },
    },
    tlsCertificate: {
      subject: 'ding.com',
      issuer: "Let's Encrypt",
      validFrom: '2026-05-01T00:00:00Z',
      validTo: '2026-11-01T00:00:00Z',
    },
    technologies: ['NGINX', 'Next.js'],
  };

  const foreignSnapshot: InfrastructureSnapshotDto = {
    id: 'snp-foreign-999',
    domainId: foreignDomainId,
    domainName: 'evilcorp.com',
    createdAt: '2026-08-23T12:00:00Z',
    capturedAt: '2026-08-23T12:00:00Z',
  };

  const changeEventBtoA: TimelineEventDto = {
    id: 'evt-xframe-001',
    domainId: mockDomainId,
    domainName: mockDomainName,
    snapshotId: snapshotB.id,
    currentSnapshotId: snapshotB.id,
    previousSnapshotId: snapshotA.id,
    changeType: 'MODIFIED',
    category: 'SECURITY_HEADER',
    severity: 'MEDIUM',
    title: 'X-Frame-Options changed',
    description: "X-Frame-Options response header changed from 'DENY' to 'SAMEORIGIN'.",
    explanation: 'X-Frame-Options controls whether browsers can render this domain in frames, protecting against clickjacking attacks.',
    previousValue: 'DENY',
    currentValue: 'SAMEORIGIN',
    detectedAt: '2026-08-23T14:30:05Z',
    evidenceCount: 1,
  };

  describe('1. Snapshot Authority & Domain Isolation', () => {
    it('ensures every completed understanding creates an immutable snapshot with domain isolation', () => {
      const pair = resolveVerifiedSnapshotPair([snapshotB, snapshotA, foreignSnapshot], mockDomainId);

      assert.equal(pair.totalVerifiedSnapshots, 2);
      assert.equal(pair.currentSnapshot?.id, snapshotB.id);
      assert.equal(pair.previousSnapshot?.id, snapshotA.id);
      assert.equal(pair.hasComparisonPair, true);
      assert.equal(pair.isFirstUnderstanding, false);
    });

    it('rejects snapshots from incomplete or failed runs (missing id or timestamp)', () => {
      const incompleteSnapshot = { id: '', createdAt: '' } as InfrastructureSnapshotDto;
      const pair = resolveVerifiedSnapshotPair([incompleteSnapshot], mockDomainId);

      assert.equal(pair.totalVerifiedSnapshots, 0);
      assert.equal(pair.hasComparisonPair, false);
      assert.equal(pair.currentSnapshot, null);
    });
  });

  describe('2. Memory Real Lineage Resolution', () => {
    it('0 snapshots -> "No infrastructure history available."', () => {
      const state = resolveMemoryState({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      const baseline = resolveMemoryBaseline({
        snapshots: [],
        timelineEvents: [],
      });

      assert.equal(state, 'EMPTY');
      assert.equal(baseline.isInitialBaseline, false);
      assert.equal(baseline.totalSnapshots, 0);
      assert.equal(baseline.baselineHeadline, MEMORY_BASELINE_COPY.EMPTY_HEADLINE);
      assert.equal(baseline.baselineHeadline, 'No infrastructure history available.');
    });

    it('1 snapshot -> "Initial baseline established." with Baseline Snapshot ID', () => {
      const state = resolveMemoryState({
        snapshots: [snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      const baseline = resolveMemoryBaseline({
        snapshots: [snapshotA],
        timelineEvents: [],
      });

      assert.equal(state, 'EMPTY'); // Empty comparisons
      assert.equal(baseline.isInitialBaseline, true);
      assert.equal(baseline.totalSnapshots, 1);
      assert.equal(baseline.currentSnapshotId, snapshotA.id);
      assert.equal(baseline.previousSnapshotId, null);
      assert.equal(baseline.baselineHeadline, MEMORY_BASELINE_COPY.INITIAL_BASELINE_HEADLINE);
      assert.equal(baseline.baselineHeadline, 'Initial baseline established.');
    });

    it('2+ snapshots -> Exposes actual historical lineage (Snapshot B -> Snapshot A)', () => {
      const historyResolution = resolveSelectedSnapshot({
        snapshots: [snapshotB, snapshotA],
        requestedSnapshotId: snapshotB.id,
      });

      assert.equal(historyResolution.selectedSnapshot?.id, snapshotB.id);
      assert.equal(historyResolution.isCurrent, true);
      assert.equal(historyResolution.isInitialBaseline, false);

      const historyState = resolveSnapshotHistoryState({
        snapshots: [snapshotB, snapshotA],
        selectedSnapshot: historyResolution.selectedSnapshot,
        isLoading: false,
        isError: false,
        isDomainMismatch: false,
      });

      assert.equal(historyState, 'READY');
    });
  });

  describe('3. Changes Snapshot Pair Comparison & State Rules', () => {
    it('0 snapshots, 0 changes -> "No infrastructure changes recorded."', () => {
      const state = resolveChangesState({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(state, 'EMPTY');
      assert.equal(CHANGES_COPY.EMPTY_HEADLINE, 'No infrastructure changes recorded.');
    });

    it('1 snapshot, 0 changes -> "No changes yet. This is the baseline understanding for ding.com."', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'FIRST_UNDERSTANDING');
      assert.equal(integration.headline, 'No changes yet.');
      assert.equal(integration.explanation, 'This is the baseline understanding for ding.com.');
      assert.equal(integration.snapshotPair.hasComparisonPair, false);
      assert.equal(integration.snapshotPair.totalVerifiedSnapshots, 1);
    });

    it('2+ snapshots, 0 changes -> "No meaningful changes detected."', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'QUIET');
      assert.equal(integration.headline, 'No meaningful changes detected.');
      assert.equal(
        integration.explanation,
        "Nebula's recent understandings remain consistent across observed infrastructure components."
      );
      assert.equal(integration.snapshotPair.hasComparisonPair, true);
      assert.equal(integration.snapshotPair.totalVerifiedSnapshots, 2);
    });

    it('2+ snapshots, >0 changes -> Renders authoritative change stories with comparison pair', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [changeEventBtoA],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'READY');
      assert.equal(integration.changes.length, 1);
      assert.equal(integration.changes[0].title, 'X-Frame-Options changed');
      assert.equal(integration.changes[0].previousValue, 'DENY');
      assert.equal(integration.changes[0].currentValue, 'SAMEORIGIN');
      assert.equal(integration.snapshotPair.hasComparisonPair, true);
      assert.equal(integration.snapshotPair.currentSnapshot?.id, snapshotB.id);
      assert.equal(integration.snapshotPair.previousSnapshot?.id, snapshotA.id);
    });
  });

  describe('4. Historical Comparison Entry Point & Surface Discoverability', () => {
    it('exposes "Compare understandings →" only when ≥2 verified snapshots exist', () => {
      // 1 snapshot -> hasComparisonPair is false
      const singlePair = resolveVerifiedSnapshotPair([snapshotA], mockDomainId);
      assert.equal(singlePair.hasComparisonPair, false);

      // 2 snapshots -> hasComparisonPair is true
      const multiPair = resolveVerifiedSnapshotPair([snapshotB, snapshotA], mockDomainId);
      assert.equal(multiPair.hasComparisonPair, true);
      assert.equal(multiPair.currentSnapshot?.id, snapshotB.id);
      assert.equal(multiPair.previousSnapshot?.id, snapshotA.id);
    });

    it('constructs authoritative comparison link preserving domain, base, and target IDs', () => {
      const link = buildInvestigationLink(
        mockDomainId,
        'historical_comparison',
        snapshotB.id,
        '/workspace/changes',
        snapshotA.id
      );

      assert.ok(link.includes('sourceType=historical_comparison'));
      assert.ok(link.includes(`sourceId=${snapshotB.id}`));
      assert.ok(link.includes(`baseSnapshotId=${snapshotA.id}`));
      assert.ok(link.includes(`domainId=${mockDomainId}`));
    });

    it('resolves historical snapshot comparison between Snapshot B (target) and Snapshot A (base)', () => {
      const result = resolveHistoricalSnapshotComparison({
        domainId: mockDomainId,
        domainName: mockDomainName,
        baseSnapshotId: snapshotA.id,
        targetSnapshotId: snapshotB.id,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [changeEventBtoA],
      });

      assert.equal(result.status, 'READY');
      assert.equal(result.baseSnapshot?.id, snapshotA.id);
      assert.equal(result.targetSnapshot?.id, snapshotB.id);
      assert.equal(result.changes.length, 1);
      assert.equal(result.changes[0].title, 'X-Frame-Options changed');
      assert.ok(result.unchangedComponents.length > 0);
      assert.ok(result.unchangedComponents.some((c) => c.includes('Web Server')));
    });

    it('strictly isolates comparisons to verified snapshots belonging to the active domain', () => {
      const crossDomainAttempt = resolveHistoricalSnapshotComparison({
        domainId: mockDomainId,
        domainName: mockDomainName,
        baseSnapshotId: foreignSnapshot.id,
        targetSnapshotId: snapshotB.id,
        snapshots: [snapshotB, snapshotA, foreignSnapshot],
        timelineEvents: [],
      });

      assert.equal(crossDomainAttempt.status, 'INVALID_PAIR');
      assert.equal(crossDomainAttempt.headline, 'Historical comparison unavailable');
    });
  });

  describe('5. Critical 13-Step Convergence Workflow Test', () => {
    it('executes full convergence workflow: First run -> Second run -> Memory -> Changes -> Compare', () => {
      // Step 1-3: First understanding completes -> Snapshot A verified
      const firstPair = resolveVerifiedSnapshotPair([snapshotA], mockDomainId);
      assert.equal(firstPair.totalVerifiedSnapshots, 1);
      assert.equal(firstPair.isFirstUnderstanding, true);
      assert.equal(firstPair.hasComparisonPair, false);

      // Step 4-6: Second understanding completes -> Snapshot B verified
      const secondPair = resolveVerifiedSnapshotPair([snapshotB, snapshotA], mockDomainId);
      assert.equal(secondPair.totalVerifiedSnapshots, 2);
      assert.equal(secondPair.hasComparisonPair, true);

      // Step 7-8: Open Memory -> A + B visible in lineage
      const memoryResolution = resolveMemoryBaseline({
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [changeEventBtoA],
      });
      assert.equal(memoryResolution.totalSnapshots, 2);
      assert.equal(memoryResolution.currentSnapshotId, snapshotB.id);
      assert.equal(memoryResolution.previousSnapshotId, snapshotA.id);

      // Step 9-11: Open Changes -> B compared against A, "Compare understandings →" appears
      const changesIntegration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [changeEventBtoA],
        isLoading: false,
        isError: false,
      });
      assert.equal(changesIntegration.state, 'READY');
      assert.equal(changesIntegration.snapshotPair.hasComparisonPair, true);
      assert.equal(changesIntegration.snapshotPair.currentSnapshot?.id, snapshotB.id);
      assert.equal(changesIntegration.snapshotPair.previousSnapshot?.id, snapshotA.id);

      // Step 12-13: Open comparison -> Selectors contain correct A/B snapshots
      const comparisonResult = resolveHistoricalSnapshotComparison({
        domainId: mockDomainId,
        domainName: mockDomainName,
        baseSnapshotId: snapshotA.id,
        targetSnapshotId: snapshotB.id,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [changeEventBtoA],
      });
      assert.equal(comparisonResult.status, 'READY');
      assert.equal(comparisonResult.targetSnapshot?.id, snapshotB.id);
      assert.equal(comparisonResult.baseSnapshot?.id, snapshotA.id);
      assert.equal(comparisonResult.changes[0].title, 'X-Frame-Options changed');
    });
  });

  describe('6. Certified Cross-Surface Invariants Audit', () => {
    it('verifies all 10 required WX-1010 cross-surface invariants are registered and certified', () => {
      const requiredInvariants = [
        'VERIFIED_SNAPSHOT_CREATES_LINEAGE',
        'NO_INCOMPLETE_SNAPSHOT',
        'NO_DUPLICATE_SNAPSHOT',
        'NO_CROSS_DOMAIN_SNAPSHOT',
        'MEMORY_REFLECTS_SNAPSHOT_LINEAGE',
        'CHANGES_USES_LATEST_PAIR',
        'HISTORICAL_COMPARISON_REQUIRES_TWO_SNAPSHOTS',
        'NO_FAKE_COMPARISON_ENTRY',
        'COMPARISON_PRESERVES_DOMAIN_CONTEXT',
        'COMPARISON_PRESERVES_SNAPSHOT_IDENTITY',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in CHANGES_CERTIFIED_INVARIANTS,
          `Missing in CHANGES_CERTIFIED_INVARIANTS: ${inv}`
        );
        assert.ok(
          inv in WORKSPACE_CERTIFIED_INVARIANTS,
          `Missing in WORKSPACE_CERTIFIED_INVARIANTS: ${inv}`
        );
      }
    });
  });
});
