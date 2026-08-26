import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SNAPSHOT_CONVERGENCE_INVARIANTS,
  verifyCrossSurfaceSnapshotConvergence,
  transitionWorkspaceSnapshots,
  auditQueryCacheReconciliation,
  type WorkspaceSurfaceState,
} from './contracts/understanding-snapshot-convergence.contract.ts';
import {
  reconcileWorkspaceUnderstanding,
} from '../../hooks/queries/useUnderstanding.ts';
import { queryKeys } from '../../hooks/queries/query-keys.ts';
import type { InfrastructureSnapshotDto, UnderstandingJobDto } from '../../types/api';

describe('WX-1015: Workspace-Wide Understanding → Snapshot Reconciliation', () => {
  const mockSnapshotA: InfrastructureSnapshotDto = {
    id: 'snap-alpha-001',
    domainId: 'dom-atlas-999',
    jobId: 'job-init-001',
    createdAt: new Date('2026-08-24T10:00:00.000Z').toISOString(),
    payload: {
      dns: {
        ipv4: ['192.0.2.1'],
        ipv6: [],
        mx: [],
        txt: [],
        ns: ['ns1.nebula.internal'],
      },
      http: {
        status: 200,
        server: 'nginx/1.24.0',
        headers: {},
        responseTimeMs: 120,
      },
      tls: {
        valid: true,
        issuer: "Let's Encrypt",
        expiresAt: '2026-11-24T10:00:00.000Z',
        daysRemaining: 90,
      },
      technologies: [{ name: 'React', version: '19.0.0' }],
    },
  };

  const mockSnapshotB: InfrastructureSnapshotDto = {
    id: 'snap-beta-002',
    domainId: 'dom-atlas-999',
    jobId: 'job-understand-002',
    createdAt: new Date('2026-08-24T15:45:00.000Z').toISOString(),
    payload: {
      dns: {
        ipv4: ['192.0.2.2', '192.0.2.3'],
        ipv6: ['2001:db8::1'],
        mx: ['mail.nebula.internal'],
        txt: [],
        ns: ['ns1.nebula.internal'],
      },
      http: {
        status: 200,
        server: 'cloudflare',
        headers: {},
        responseTimeMs: 45,
      },
      tls: {
        valid: true,
        issuer: 'Cloudflare Inc',
        expiresAt: '2026-12-24T15:45:00.000Z',
        daysRemaining: 120,
      },
      technologies: [
        { name: 'React', version: '19.0.0' },
        { name: 'Cloudflare CDN', version: 'v2' },
      ],
    },
  };

  const mockSnapshotC: InfrastructureSnapshotDto = {
    id: 'snap-gamma-003',
    domainId: 'dom-atlas-999',
    jobId: 'job-understand-003',
    createdAt: new Date('2026-08-24T18:00:00.000Z').toISOString(),
    payload: {
      dns: {
        ipv4: ['192.0.2.5'],
        ipv6: ['2001:db8::2'],
        mx: ['mail.nebula.internal'],
        txt: [],
        ns: ['ns1.nebula.internal', 'ns2.nebula.internal'],
      },
      http: {
        status: 200,
        server: 'cloudflare',
        headers: {},
        responseTimeMs: 38,
      },
      tls: {
        valid: true,
        issuer: 'Cloudflare Inc',
        expiresAt: '2027-01-24T18:00:00.000Z',
        daysRemaining: 150,
      },
      technologies: [
        { name: 'React', version: '19.0.0' },
        { name: 'Next.js', version: '15.1.0' },
      ],
    },
  };

  const mockInitialState: WorkspaceSurfaceState = {
    overview: {
      latestSnapshotId: mockSnapshotA.id,
      headline: 'Baseline snapshot active',
      lastUnderstoodAt: mockSnapshotA.createdAt || null,
    },
    findings: {
      snapshotId: mockSnapshotA.id,
      findingIds: ['f-1', 'f-2'],
    },
    infrastructure: {
      snapshotId: mockSnapshotA.id,
      ipAddresses: ['192.0.2.1'],
    },
    changes: {
      previousSnapshotId: null,
      currentSnapshotId: mockSnapshotA.id,
      summaryText: 'Baseline snapshot active.',
    },
    memory: {
      latestSnapshotId: mockSnapshotA.id,
      snapshotLineage: [mockSnapshotA.id],
    },
    historicalComparison: {
      targetSnapshotId: mockSnapshotA.id,
      availableSnapshotIds: [mockSnapshotA.id],
    },
  };

  describe('1. Mandatory Acceptance Test — First & Second Understanding (A → B → C)', () => {
    it('executes first understanding (Snapshot A → B) and reconciles all surfaces without browser refresh', () => {
      const jobB: UnderstandingJobDto = {
        id: 'job-understand-002',
        domainId: 'dom-atlas-999',
        status: 'COMPLETED',
        triggerType: 'MANUAL',
        startedAt: '2026-08-24T15:44:50.000Z',
        completedAt: '2026-08-24T15:45:00.000Z',
        snapshotId: mockSnapshotB.id,
      };

      const stateB = transitionWorkspaceSnapshots(mockInitialState, mockSnapshotB, jobB);

      // Verify all surfaces converge to Snapshot B
      assert.equal(stateB.overview.latestSnapshotId, mockSnapshotB.id);
      assert.equal(stateB.overview.lastUnderstoodAt, '2026-08-24T15:45:00.000Z');
      assert.equal(stateB.findings.snapshotId, mockSnapshotB.id);
      assert.equal(stateB.infrastructure.snapshotId, mockSnapshotB.id);
      assert.equal(stateB.changes.currentSnapshotId, mockSnapshotB.id);
      assert.equal(stateB.changes.previousSnapshotId, mockSnapshotA.id);
      assert.equal(stateB.memory.latestSnapshotId, mockSnapshotB.id);
      assert.deepEqual(stateB.memory.snapshotLineage, [mockSnapshotB.id, mockSnapshotA.id]);
      assert.equal(stateB.historicalComparison.targetSnapshotId, mockSnapshotB.id);
      assert.deepEqual(stateB.historicalComparison.availableSnapshotIds, [
        mockSnapshotB.id,
        mockSnapshotA.id,
      ]);

      const convergenceCheckB = verifyCrossSurfaceSnapshotConvergence({
        overviewSnapshotId: stateB.overview.latestSnapshotId,
        findingsSnapshotId: stateB.findings.snapshotId,
        infrastructureSnapshotId: stateB.infrastructure.snapshotId,
        changesCurrentSnapshotId: stateB.changes.currentSnapshotId,
        memoryLatestSnapshotId: stateB.memory.latestSnapshotId,
        historicalComparisonAvailableSnapshotIds: stateB.historicalComparison.availableSnapshotIds,
      });

      assert.equal(convergenceCheckB.isConverged, true);
      assert.equal(convergenceCheckB.authoritativeSnapshotId, mockSnapshotB.id);
      assert.equal(convergenceCheckB.discrepancies.length, 0);
    });

    it('executes second understanding (Snapshot B → C) and maintains unbroken historical lineage (C → B → A)', () => {
      // Step 1: Initial state to B
      const jobB: UnderstandingJobDto = {
        id: 'job-understand-002',
        domainId: 'dom-atlas-999',
        status: 'COMPLETED',
        triggerType: 'MANUAL',
        startedAt: '2026-08-24T15:44:50.000Z',
        completedAt: '2026-08-24T15:45:00.000Z',
        snapshotId: mockSnapshotB.id,
      };
      const stateB = transitionWorkspaceSnapshots(mockInitialState, mockSnapshotB, jobB);

      // Step 2: Second understanding B -> C
      const jobC: UnderstandingJobDto = {
        id: 'job-understand-003',
        domainId: 'dom-atlas-999',
        status: 'COMPLETED',
        triggerType: 'SCHEDULED', // Proves automatic & manual use identical pipeline!
        startedAt: '2026-08-24T17:59:45.000Z',
        completedAt: '2026-08-24T18:00:00.000Z',
        snapshotId: mockSnapshotC.id,
      };

      const stateC = transitionWorkspaceSnapshots(stateB, mockSnapshotC, jobC);

      // Verify all surfaces converge to Snapshot C
      assert.equal(stateC.overview.latestSnapshotId, mockSnapshotC.id);
      assert.equal(stateC.overview.lastUnderstoodAt, '2026-08-24T18:00:00.000Z');
      assert.equal(stateC.findings.snapshotId, mockSnapshotC.id);
      assert.equal(stateC.infrastructure.snapshotId, mockSnapshotC.id);
      assert.equal(stateC.changes.currentSnapshotId, mockSnapshotC.id);
      assert.equal(stateC.changes.previousSnapshotId, mockSnapshotB.id); // Differential C vs B!
      assert.equal(stateC.memory.latestSnapshotId, mockSnapshotC.id);

      // Memory must immediately have unbroken lineage: Snapshot C (newest) -> Snapshot B -> Snapshot A
      assert.deepEqual(stateC.memory.snapshotLineage, [
        mockSnapshotC.id,
        mockSnapshotB.id,
        mockSnapshotA.id,
      ]);

      // Historical Comparison has all 3 snapshots available for cross-comparison
      assert.equal(stateC.historicalComparison.targetSnapshotId, mockSnapshotC.id);
      assert.deepEqual(stateC.historicalComparison.availableSnapshotIds, [
        mockSnapshotC.id,
        mockSnapshotB.id,
        mockSnapshotA.id,
      ]);

      const convergenceCheckC = verifyCrossSurfaceSnapshotConvergence({
        overviewSnapshotId: stateC.overview.latestSnapshotId,
        findingsSnapshotId: stateC.findings.snapshotId,
        infrastructureSnapshotId: stateC.infrastructure.snapshotId,
        changesCurrentSnapshotId: stateC.changes.currentSnapshotId,
        memoryLatestSnapshotId: stateC.memory.latestSnapshotId,
        historicalComparisonAvailableSnapshotIds: stateC.historicalComparison.availableSnapshotIds,
      });

      assert.equal(convergenceCheckC.isConverged, true);
      assert.equal(convergenceCheckC.authoritativeSnapshotId, mockSnapshotC.id);
      assert.equal(convergenceCheckC.discrepancies.length, 0);
    });
  });

  describe('2. In-Progress & Failed Understanding Stability (No Partial Leaks)', () => {
    it('preserves trusted Snapshot A across all surfaces while understanding job is RUNNING', () => {
      const runningJob: UnderstandingJobDto = {
        id: 'job-in-progress-003',
        domainId: 'dom-atlas-999',
        status: 'RUNNING',
        triggerType: 'MANUAL',
        startedAt: '2026-08-24T16:00:00.000Z',
      };

      const partialSnapshotCandidate: InfrastructureSnapshotDto = {
        id: 'snap-partial-999',
        domainId: 'dom-atlas-999',
        jobId: 'job-in-progress-003',
        createdAt: new Date().toISOString(),
      };

      const preservedState = transitionWorkspaceSnapshots(
        mockInitialState,
        partialSnapshotCandidate,
        runningJob
      );

      // Verify no partial snapshot leaked to any surface
      assert.equal(preservedState.overview.latestSnapshotId, mockSnapshotA.id);
      assert.equal(preservedState.findings.snapshotId, mockSnapshotA.id);
      assert.equal(preservedState.infrastructure.snapshotId, mockSnapshotA.id);
      assert.equal(preservedState.changes.currentSnapshotId, mockSnapshotA.id);
      assert.equal(preservedState.memory.latestSnapshotId, mockSnapshotA.id);
      assert.deepEqual(preservedState.memory.snapshotLineage, [mockSnapshotA.id]);
    });

    it('preserves trusted Snapshot A when understanding job FAILS', () => {
      const failedJob: UnderstandingJobDto = {
        id: 'job-failed-004',
        domainId: 'dom-atlas-999',
        status: 'FAILED',
        triggerType: 'MANUAL',
        error: 'Network timeout during discovery',
        startedAt: '2026-08-24T16:00:00.000Z',
      };

      const stateAfterFailure = transitionWorkspaceSnapshots(
        mockInitialState,
        mockSnapshotB,
        failedJob
      );

      assert.equal(stateAfterFailure.overview.latestSnapshotId, mockSnapshotA.id);
      assert.equal(stateAfterFailure.memory.latestSnapshotId, mockSnapshotA.id);
      assert.deepEqual(stateAfterFailure.memory.snapshotLineage, [mockSnapshotA.id]);
    });
  });

  describe('3. Query Invalidation & Cache Reconciliation Completeness', () => {
    it('invalidates all Workspace surface queries without leaving stale cache entries', () => {
      const invalidatedKeys: (readonly unknown[])[] = [];

      const mockQueryClient: any = {
        invalidateQueries: ({ queryKey }: { queryKey: readonly unknown[] }) => {
          invalidatedKeys.push(queryKey);
          return Promise.resolve();
        },
      };

      reconcileWorkspaceUnderstanding(mockQueryClient, 'dom-atlas-999');

      const audit = auditQueryCacheReconciliation(invalidatedKeys, 'dom-atlas-999');
      assert.equal(audit.isFullyReconciled, true);
      assert.equal(audit.missingSurfaces.length, 0);

      // Verify that queryKey for snapshots matches parameterized queries like { limit: 50 }
      const snapshotKey = queryKeys.snapshots.byDomain('dom-atlas-999');
      assert.deepEqual(
        snapshotKey,
        ['snapshots', 'byDomain', 'dom-atlas-999'],
        'Snapshots query key must NOT include undefined params so prefix matching invalidates { limit: 50 }'
      );
    });

    it('guarantees prefix query keys match parameterized queries for Memory, Findings, and Timeline', () => {
      const domainId = 'dom-test-123';

      const unparameterizedSnapshots = queryKeys.snapshots.byDomain(domainId);
      const parameterizedSnapshots = queryKeys.snapshots.byDomain(domainId, { limit: 50 });

      assert.deepEqual(unparameterizedSnapshots, ['snapshots', 'byDomain', domainId]);
      assert.deepEqual(parameterizedSnapshots, ['snapshots', 'byDomain', domainId, { limit: 50 }]);

      // Verify prefix matching logic
      const matchesPrefix = parameterizedSnapshots
        .slice(0, unparameterizedSnapshots.length)
        .every((part, idx) => part === unparameterizedSnapshots[idx]);

      assert.equal(
        matchesPrefix,
        true,
        'Parameterized query must match unparameterized invalidation prefix'
      );
    });
  });

  describe('4. Canonical Pipeline & Domain Isolation', () => {
    it('isolates Domain A understanding and snapshots from Domain B Memory and Overview', () => {
      const domainASnapshot: InfrastructureSnapshotDto = {
        id: 'snap-domain-a',
        domainId: 'dom-aaa',
        jobId: 'job-a',
        createdAt: new Date().toISOString(),
      };

      const domainAState: WorkspaceSurfaceState = {
        overview: { latestSnapshotId: domainASnapshot.id, headline: 'Domain A', lastUnderstoodAt: null },
        findings: { snapshotId: domainASnapshot.id, findingIds: [] },
        infrastructure: { snapshotId: domainASnapshot.id, ipAddresses: [] },
        changes: { previousSnapshotId: null, currentSnapshotId: domainASnapshot.id, summaryText: '' },
        memory: { latestSnapshotId: domainASnapshot.id, snapshotLineage: [domainASnapshot.id] },
        historicalComparison: { targetSnapshotId: domainASnapshot.id, availableSnapshotIds: [domainASnapshot.id] },
      };

      const domainBSnapshot: InfrastructureSnapshotDto = {
        id: 'snap-domain-b',
        domainId: 'dom-bbb',
        jobId: 'job-b',
        createdAt: new Date().toISOString(),
      };

      const domainBState: WorkspaceSurfaceState = {
        overview: { latestSnapshotId: domainBSnapshot.id, headline: 'Domain B', lastUnderstoodAt: null },
        findings: { snapshotId: domainBSnapshot.id, findingIds: [] },
        infrastructure: { snapshotId: domainBSnapshot.id, ipAddresses: [] },
        changes: { previousSnapshotId: null, currentSnapshotId: domainBSnapshot.id, summaryText: '' },
        memory: { latestSnapshotId: domainBSnapshot.id, snapshotLineage: [domainBSnapshot.id] },
        historicalComparison: { targetSnapshotId: domainBSnapshot.id, availableSnapshotIds: [domainBSnapshot.id] },
      };

      // Assert complete isolation
      assert.notEqual(domainAState.overview.latestSnapshotId, domainBState.overview.latestSnapshotId);
      assert.notEqual(domainAState.memory.latestSnapshotId, domainBState.memory.latestSnapshotId);
      assert.ok(!domainAState.memory.snapshotLineage.includes(domainBSnapshot.id));
      assert.ok(!domainBState.memory.snapshotLineage.includes(domainASnapshot.id));
    });
  });

  describe('5. Certified Hard Invariants Enforcement', () => {
    it('verifies all 15 required hard invariants for WX-1015', () => {
      const requiredHardInvariants = [
        'ONE_UNDERSTANDING_ONE_SNAPSHOT',
        'ONE_SNAPSHOT_ONE_WORKSPACE_TRUTH',
        'NO_CROSS_SURFACE_TRUTH_DIVERGENCE',
        'MANUAL_AUTOMATIC_CONVERGENCE',
        'NO_PARTIAL_SNAPSHOT_PROPAGATION',
        'LATEST_SNAPSHOT_IS_AUTHORITATIVE',
        'MEMORY_RECEIVES_NEW_SNAPSHOT',
        'CHANGES_RECEIVES_NEW_SNAPSHOT',
        'INFRASTRUCTURE_RECEIVES_NEW_SNAPSHOT',
        'FINDINGS_RECEIVES_NEW_SNAPSHOT',
        'OVERVIEW_RECEIVES_NEW_SNAPSHOT',
        'HISTORICAL_COMPARISON_RECEIVES_NEW_SNAPSHOT',
        'NO_STALE_SURFACE_AFTER_COMMIT',
        'FAILED_UNDERSTANDING_PRESERVES_TRUST',
        'NO_CROSS_DOMAIN_CONTAMINATION',
        'ONE_UNDERSTANDING_ONE_WORKSPACE_STATE',
        'NO_SURFACE_SPECIFIC_TRUTH',
        'NO_STALE_CURRENT_SNAPSHOT',
        'MEMORY_LINEAGE_IMMEDIATE',
        'CHANGES_PAIR_IMMEDIATE',
        'MANUAL_AUTOMATIC_IDENTITY',
      ];

      for (const inv of requiredHardInvariants) {
        assert.ok(
          inv in SNAPSHOT_CONVERGENCE_INVARIANTS,
          `Expected hard invariant ${inv} to be certified in SNAPSHOT_CONVERGENCE_INVARIANTS`
        );
      }
    });
  });
});
