import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type {
  InfrastructureSnapshotDto,
} from '../../types/api';
import {
  integrateAuthoritativeChanges,
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
  WORKSPACE_CERTIFIED_INVARIANTS,
} from './contracts/workspace-redesign-truth-contract.ts';

describe('WX-1011: Changes Quiet-State Experience & Premium Stability Surface', () => {
  const mockDomainId = 'dom-pestrust-001';
  const mockDomainName = 'pestrust.edu.in';

  // Snapshot A: Baseline snapshot captured on Aug 22
  const snapshotA: InfrastructureSnapshotDto = {
    id: 'snp-baseline-111',
    domainId: mockDomainId,
    domainName: mockDomainName,
    jobId: 'job-run-001',
    createdAt: '2026-08-22T18:12:00Z',
    capturedAt: '2026-08-22T18:12:00Z',
    httpStatus: 200,
    responseTimeMs: 84,
    httpObservation: {
      statusCode: 200,
      server: 'Apache/2.4.52 (Ubuntu)',
      securityHeaders: {
        'x-frame-options': 'SAMEORIGIN',
        'x-content-type-options': 'nosniff',
      },
    },
    tlsCertificate: {
      subject: 'pestrust.edu.in',
      issuer: "Let's Encrypt Authority X3",
      validFrom: '2026-06-01T00:00:00Z',
      validTo: '2026-09-01T00:00:00Z',
    },
    technologies: ['Apache', 'PHP', 'WordPress'],
  };

  // Snapshot B: Subsequent understanding captured on Aug 23 with zero differences
  const snapshotB: InfrastructureSnapshotDto = {
    id: 'snp-second-222',
    domainId: mockDomainId,
    domainName: mockDomainName,
    jobId: 'job-run-002',
    createdAt: '2026-08-23T20:41:00Z',
    capturedAt: '2026-08-23T20:41:00Z',
    httpStatus: 200,
    responseTimeMs: 86,
    httpObservation: {
      statusCode: 200,
      server: 'Apache/2.4.52 (Ubuntu)',
      securityHeaders: {
        'x-frame-options': 'SAMEORIGIN',
        'x-content-type-options': 'nosniff',
      },
    },
    tlsCertificate: {
      subject: 'pestrust.edu.in',
      issuer: "Let's Encrypt Authority X3",
      validFrom: '2026-06-01T00:00:00Z',
      validTo: '2026-09-01T00:00:00Z',
    },
    technologies: ['Apache', 'PHP', 'WordPress'],
  };

  describe('1. Product Intent & Semantic State Differentiation', () => {
    it('distinguishes FIRST_UNDERSTANDING from QUIET and EMPTY states', () => {
      // 0 snapshots -> EMPTY
      const emptyState = resolveChangesState({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(emptyState, 'EMPTY');

      // 1 snapshot -> FIRST_UNDERSTANDING
      const firstState = resolveChangesState({
        snapshots: [snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(firstState, 'FIRST_UNDERSTANDING');

      // 2 snapshots with 0 diffs -> QUIET
      const quietState = resolveChangesState({
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(quietState, 'QUIET');
    });

    it('prohibits confusing empty state copy for domains with verified understandings', () => {
      const integration1 = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.notEqual(integration1.headline, CHANGES_COPY.EMPTY_HEADLINE);
      assert.notEqual(integration1.headline, 'No infrastructure changes recorded.');

      const integration2 = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.notEqual(integration2.headline, CHANGES_COPY.EMPTY_HEADLINE);
      assert.notEqual(integration2.headline, 'No infrastructure changes recorded.');
    });
  });

  describe('2. FIRST_UNDERSTANDING — Baseline Established Specification', () => {
    it('provides clear narrative that initial baseline is established without prior comparison', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'FIRST_UNDERSTANDING');
      assert.equal(integration.headline, CHANGES_COPY.FIRST_UNDERSTANDING_HEADLINE);
      assert.equal(CHANGES_COPY.FIRST_UNDERSTANDING_HEADING, 'Infrastructure understood');
      assert.equal(
        CHANGES_COPY.FIRST_UNDERSTANDING_NARRATIVE,
        'Nebula has established the first verified understanding of this domain. There is no previous infrastructure state to compare against yet.'
      );

      // Snapshot metadata is intact
      assert.equal(integration.snapshotPair.currentSnapshot?.id, snapshotA.id);
      assert.equal(integration.snapshotPair.previousSnapshot, null);
      assert.equal(integration.snapshotPair.totalVerifiedSnapshots, 1);
      assert.equal(integration.snapshotPair.hasComparisonPair, false);
    });
  });

  describe('3. QUIET — Multi-Understanding Stability Specification', () => {
    it('communicates verified stability backed by explicit snapshot comparison', () => {
      const integration = integrateAuthoritativeChanges({
        domainId: mockDomainId,
        domainName: mockDomainName,
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(integration.state, 'QUIET');
      assert.equal(integration.headline, CHANGES_COPY.QUIET_HEADLINE);
      assert.equal(CHANGES_COPY.QUIET_HEADING, 'Infrastructure remains stable');
      assert.equal(
        CHANGES_COPY.QUIET_NARRATIVE,
        'Nebula compared the latest verified understanding with the previous infrastructure state and found no meaningful changes.'
      );

      // Comparison pair is explicitly available
      assert.equal(integration.snapshotPair.currentSnapshot?.id, snapshotB.id);
      assert.equal(integration.snapshotPair.previousSnapshot?.id, snapshotA.id);
      assert.equal(integration.snapshotPair.totalVerifiedSnapshots, 2);
      assert.equal(integration.snapshotPair.hasComparisonPair, true);
    });
  });

  describe('4. Cross-Surface Language Alignment', () => {
    it('verifies cohesive vocabulary across Overview, Infrastructure, Changes, and Memory', () => {
      // Memory state for baseline
      const memoryBaseline = resolveMemoryBaseline({
        snapshots: [snapshotA],
        timelineEvents: [],
      });
      assert.equal(memoryBaseline.isInitialBaseline, true);
      assert.equal(memoryBaseline.baselineHeadline, MEMORY_BASELINE_COPY.INITIAL_BASELINE_HEADLINE);
      assert.equal(memoryBaseline.baselineHeadline, 'Initial baseline established.');

      // Memory state for quiet
      const memoryQuiet = resolveMemoryState({
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(memoryQuiet, 'QUIET');

      // Changes state for quiet
      const changesQuiet = resolveChangesState({
        snapshots: [snapshotB, snapshotA],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });
      assert.equal(changesQuiet, 'QUIET');
    });
  });

  describe('5. Certified WX-1011 Invariants Audit', () => {
    it('verifies all 12 WX-1011 certified invariants are strictly registered in contracts', () => {
      const requiredInvariants = [
        'PREMIUM_QUIET_STATE',
        'UNDERSTANDING_COMPLETION_IS_VISIBLE',
        'FIRST_BASELINE_IS_DISTINCT',
        'QUIET_STATE_PROVES_COMPARISON',
        'NO_AMBIGUOUS_EMPTY_STATE',
        'NO_FALSE_STABILITY_CLAIM',
        'VERIFIED_STATUS_REQUIRES_VERIFIED_SNAPSHOT',
        'NO_FAKE_VERIFICATION_METADATA',
        'NO_DECORATIVE_SUCCESS_THEATER',
        'NO_REPORT_STYLE_DRIFT',
        'NO_EMPTY_DASHBOARD_DRIFT',
        'CROSS_SURFACE_UNDERSTANDING_CONVERGENCE',
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
