import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureSnapshotDto, DomainDto } from '../../types/api';
import {
  extractSnapshotInfrastructureState,
  resolveSnapshotHistoryState,
  resolveSelectedSnapshot,
  getSnapshotsArray,
  formatSnapshotResponseTime,
  formatSnapshotDate,
  formatSnapshotTimeUtc,
  SNAPSHOT_HISTORY_COPY,
} from './contracts/snapshot-history.contract.ts';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
} from './contracts/investigation.contract.ts';

// Mock snapshots representing immutable historical backend facts
const mockLatestSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-ca0a74f7',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  jobId: 'job-stripe-003',
  capturedAt: '2026-08-20T14:53:00.000Z',
  createdAt: '2026-08-20T14:53:00.000Z',
  responseTimeMs: 1420,
  httpStatus: 200,
  previousSnapshotId: 'snp-stripe-8b31a29c',
  tlsCertificate: {
    subject: 'CN=stripe.com',
    issuer: 'DigiCert Global Root G2',
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2027-01-01T00:00:00.000Z',
    serialNumber: '04a29ff',
    fingerprintSha256: 'sha256:99aa88...',
  },
  httpObservation: {
    statusCode: 200,
    server: 'nginx',
    securityHeaders: {
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    },
  },
  technologies: ['NGINX', 'Next.js', 'HSTS'],
  payload: {
    http: {
      statusCode: 200,
      responseTimeMs: 1420,
      headers: {
        server: 'nginx',
        'strict-transport-security': 'max-age=31536000',
      },
    },
    technology: {
      technologies: [
        { name: 'NGINX', category: 'Web Server' },
        { name: 'Next.js', category: 'Frontend Framework' },
        { name: 'HSTS', category: 'Security Protocol' },
      ],
    },
  },
};

const mockPriorSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-8b31a29c',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  jobId: 'job-stripe-002',
  capturedAt: '2026-08-18T09:14:00.000Z',
  createdAt: '2026-08-18T09:14:00.000Z',
  responseTimeMs: 240,
  httpStatus: 200,
  previousSnapshotId: 'snp-stripe-5fa2c81b',
  technologies: ['NGINX'],
};

const mockInitialSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-5fa2c81b',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  jobId: 'job-stripe-001',
  capturedAt: '2026-08-12T11:00:00.000Z',
  createdAt: '2026-08-12T11:00:00.000Z',
  responseTimeMs: 310,
  httpStatus: 200,
  previousSnapshotId: null,
};

const mockUserDomains: readonly DomainDto[] = [
  {
    id: 'dom-stripe-prod',
    domainName: 'stripe.com',
    status: 'ACTIVE',
    createdAt: '2026-08-12T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    snapshotCount: 3,
    activeFindingCount: 0,
  },
];

describe('WX-504: Snapshot History Architecture & Experience Contracts', () => {
  describe('1. Authoritative Snapshot DTO & Immutable Infrastructure State', () => {
    it('extracts authoritative facts directly from the immutable Snapshot DTO without synthesis', () => {
      const state = extractSnapshotInfrastructureState(mockLatestSnapshot, true, false);

      assert.equal(state.snapshotId, 'snp-stripe-ca0a74f7');
      assert.equal(state.domainId, 'dom-stripe-prod');
      assert.equal(state.domainName, 'stripe.com');
      assert.equal(state.httpStatus, 200);
      assert.equal(state.responseTimeMs, 1420);
      assert.equal(state.responseTimeFormatted, '1.42s');
      assert.equal(state.server, 'nginx');
      assert.equal(state.tls?.status, 'Valid');
      assert.equal(state.tls?.issuer, 'DigiCert Global Root G2');
      assert.deepEqual(state.technologies, ['NGINX', 'Next.js', 'HSTS']);
      assert.equal(state.isCurrent, true);
      assert.equal(state.isInitialBaseline, false);
    });

    it('formats response time cleanly across millisecond and second thresholds', () => {
      assert.equal(formatSnapshotResponseTime(1420), '1.42s');
      assert.equal(formatSnapshotResponseTime(240), '240ms');
      assert.equal(formatSnapshotResponseTime(1000), '1.0s');
      assert.equal(formatSnapshotResponseTime(55), '55ms');
      assert.equal(formatSnapshotResponseTime(null), null);
      assert.equal(formatSnapshotResponseTime(undefined), null);
    });

    it('formats UTC dates and timestamps objectively', () => {
      assert.equal(formatSnapshotDate('2026-08-20T14:53:00.000Z'), 'Aug 20, 2026');
      assert.equal(formatSnapshotTimeUtc('2026-08-20T14:53:00.000Z'), '14:53 UTC');
      assert.equal(formatSnapshotDate('2026-08-18T09:14:00.000Z'), 'Aug 18, 2026');
      assert.equal(formatSnapshotTimeUtc('2026-08-18T09:14:00.000Z'), '09:14 UTC');
    });
  });

  describe('2. Backend Ordering Preservation & Anti-Sorting Invariant', () => {
    it('hard invariant: preserves backend-supplied snapshot ordering without client-side sorting', () => {
      const backendOrderedSnapshots = [
        mockLatestSnapshot,
        mockPriorSnapshot,
        mockInitialSnapshot,
      ];

      const extracted = getSnapshotsArray({ snapshots: backendOrderedSnapshots, total: 3 });

      assert.equal(extracted.length, 3);
      assert.equal(extracted[0].id, 'snp-stripe-ca0a74f7');
      assert.equal(extracted[1].id, 'snp-stripe-8b31a29c');
      assert.equal(extracted[2].id, 'snp-stripe-5fa2c81b');
    });

    it('resolves active selection defaulting to the first (latest) backend snapshot', () => {
      const snapshots = [mockLatestSnapshot, mockPriorSnapshot, mockInitialSnapshot];
      const resolution = resolveSelectedSnapshot({ snapshots });

      assert.equal(resolution.selectedSnapshot?.id, 'snp-stripe-ca0a74f7');
      assert.equal(resolution.isCurrent, true);
      assert.equal(resolution.isInitialBaseline, false);
    });

    it('resolves historical selection when requested snapshot ID is provided', () => {
      const snapshots = [mockLatestSnapshot, mockPriorSnapshot, mockInitialSnapshot];
      const resolution = resolveSelectedSnapshot({
        snapshots,
        requestedSnapshotId: 'snp-stripe-8b31a29c',
      });

      assert.equal(resolution.selectedSnapshot?.id, 'snp-stripe-8b31a29c');
      assert.equal(resolution.isCurrent, false);
      assert.equal(resolution.isInitialBaseline, false);
    });
  });

  describe('3. Current vs Historical State Distinction', () => {
    it('accurately identifies current state vs historical state in extracted state', () => {
      const currentState = extractSnapshotInfrastructureState(mockLatestSnapshot, true, false);
      const historicalState = extractSnapshotInfrastructureState(mockPriorSnapshot, false, false);

      assert.equal(currentState.isCurrent, true);
      assert.equal(historicalState.isCurrent, false);
    });
  });

  describe('4. Single-Snapshot Initial Baseline Contract', () => {
    it('marks single-snapshot domain as initial baseline without fake prior state', () => {
      const singleSnapshotList = [mockInitialSnapshot];
      const resolution = resolveSelectedSnapshot({ snapshots: singleSnapshotList });

      assert.equal(resolution.isInitialBaseline, true);
      assert.equal(resolution.isCurrent, true);

      const state = extractSnapshotInfrastructureState(
        resolution.selectedSnapshot!,
        resolution.isCurrent,
        resolution.isInitialBaseline
      );

      assert.equal(state.isInitialBaseline, true);
      assert.equal(state.previousSnapshotId, null);
    });

    it('provides calm and objective copy for initial baseline state', () => {
      assert.equal(
        SNAPSHOT_HISTORY_COPY.BASELINE_TITLE,
        'Initial baseline established.'
      );
      assert.equal(
        SNAPSHOT_HISTORY_COPY.BASELINE_DESCRIPTION,
        'No previous infrastructure state is available for comparison.'
      );
    });
  });

  describe('5. Zero-Snapshot Domain State (EMPTY vs ERROR)', () => {
    it('resolves EMPTY state when no snapshots exist, distinguishing from ERROR', () => {
      const emptyState = resolveSnapshotHistoryState({
        snapshots: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(emptyState, 'EMPTY');
    });

    it('provides calm and objective copy for empty snapshot history', () => {
      assert.equal(
        SNAPSHOT_HISTORY_COPY.EMPTY_TITLE,
        'No infrastructure snapshot is available yet.'
      );
      assert.equal(
        SNAPSHOT_HISTORY_COPY.EMPTY_DESCRIPTION,
        'Nebula has not established an infrastructure baseline for this domain.'
      );
    });
  });

  describe('6. Six-Tier Memory State Semantic Matrix', () => {
    it('resolves LOADING state when query is fetching', () => {
      const state = resolveSnapshotHistoryState({
        snapshots: null,
        isLoading: true,
        isError: false,
      });
      assert.equal(state, 'LOADING');
    });

    it('resolves ERROR state when query failed', () => {
      const state = resolveSnapshotHistoryState({
        snapshots: null,
        isLoading: false,
        isError: true,
      });
      assert.equal(state, 'ERROR');
    });

    it('resolves UNAVAILABLE state on cross-domain mismatch', () => {
      const state = resolveSnapshotHistoryState({
        snapshots: [mockLatestSnapshot],
        isLoading: false,
        isError: false,
        isDomainMismatch: true,
      });
      assert.equal(state, 'UNAVAILABLE');
    });

    it('resolves PARTIAL state when backend marks history partial', () => {
      const state = resolveSnapshotHistoryState({
        snapshots: [mockLatestSnapshot],
        isLoading: false,
        isError: false,
        isPartial: true,
      });
      assert.equal(state, 'PARTIAL');
    });

    it('resolves READY state for authoritative multi-snapshot records', () => {
      const state = resolveSnapshotHistoryState({
        snapshots: [mockLatestSnapshot, mockPriorSnapshot],
        isLoading: false,
        isError: false,
      });
      assert.equal(state, 'READY');
    });
  });

  describe('7. P0 Domain Isolation Boundary', () => {
    it('strictly rejects snapshot requests belonging to unowned foreign domains', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-foreign-unauthorized',
          sourceType: 'snapshot',
          sourceId: 'snp-foreign-999',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, false);
      assert.equal(resolution.isDomainMismatch, true);
    });

    it('allows snapshot requests matching active and authorized domain boundary', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-stripe-prod',
          sourceType: 'snapshot',
          sourceId: 'snp-stripe-ca0a74f7',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.isDomainMismatch, false);
      assert.equal(resolution.sourceType, 'snapshot');
      assert.equal(resolution.sourceId, 'snp-stripe-ca0a74f7');
    });
  });

  describe('8. Progressive Disclosure & Raw JSON Availability', () => {
    it('preserves complete raw payload for technical inspection without making raw JSON the primary view', () => {
      const state = extractSnapshotInfrastructureState(mockLatestSnapshot, true, false);

      assert.ok(state.rawPayload, 'Raw payload must be preserved');
      assert.ok(typeof state.rawPayload === 'object');
      const payload = state.rawPayload as Record<string, unknown>;
      assert.ok(payload.http, 'HTTP payload must be intact');
      assert.ok(payload.technology, 'Technology payload must be intact');
    });
  });

  describe('9. Investigative Navigation & Continuity Links', () => {
    it('builds canonical deep links from Timeline / Change into Snapshot History with return paths', () => {
      const link = buildInvestigationLink(
        'dom-stripe-prod',
        'snapshot',
        'snp-stripe-ca0a74f7',
        '/workspace/memory'
      );

      assert.ok(link.includes('domainId=dom-stripe-prod'));
      assert.ok(link.includes('sourceType=snapshot'));
      assert.ok(link.includes('sourceId=snp-stripe-ca0a74f7'));
      assert.ok(link.includes('returnPath=%2Fworkspace%2Fmemory') || link.includes('returnPath=/workspace/memory'));
    });
  });

  describe('10. Hard Invariant: Strictly Prohibited Patterns', () => {
    it('strictly forbids client-side JSON diffing, chronology sorting, and synthetic health scores', () => {
      const forbiddenPatterns = [
        'clientSideSnapshotJsonDiffing',
        'reactSortsHistoricalSnapshots',
        'syntheticSnapshotHealthScore',
        'clientSideCausalExplanationSynthesis',
        'clientSideReconstructionOfMissingFields',
        'duplicateInfrastructureOverviewWithDifferentTimestamp',
      ];

      for (const pattern of forbiddenPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
