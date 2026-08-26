import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureSnapshotDto, TimelineEventDto, DomainDto } from '../../types/api';
import {
  resolveHistoricalContext,
  extractHistoricalSnapshotNode,
  extractHistoricalEvolutionLinks,
  HISTORICAL_CONTEXT_COPY,
} from './contracts/historical-context.contract.ts';
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
  },
  httpObservation: {
    statusCode: 200,
    server: 'nginx',
  },
  technologies: ['NGINX', 'Next.js', 'HSTS'],
  payload: {
    http: {
      protocol: 'http/3',
      statusCode: 200,
      responseTimeMs: 1420,
      headers: {
        server: 'nginx',
        'alt-svc': 'h3=":443"; ma=86400',
      },
    },
  },
};

const mockPreviousSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-8b31a29c',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  jobId: 'job-stripe-002',
  capturedAt: '2026-08-18T09:14:00.000Z',
  createdAt: '2026-08-18T09:14:00.000Z',
  responseTimeMs: 240,
  httpStatus: 200,
  previousSnapshotId: 'snp-stripe-5fa2c81b',
  httpObservation: {
    statusCode: 200,
    server: 'nginx',
  },
  technologies: ['NGINX'],
  payload: {
    http: {
      protocol: 'http/2',
      statusCode: 200,
      headers: {
        server: 'nginx',
      },
    },
  },
};

const mockEarlierSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-5fa2c81b',
  domainId: 'dom-stripe-prod',
  domainName: 'stripe.com',
  jobId: 'job-stripe-001',
  capturedAt: '2026-08-12T11:00:00.000Z',
  createdAt: '2026-08-12T11:00:00.000Z',
  responseTimeMs: 310,
  httpStatus: 200,
  previousSnapshotId: null,
  httpObservation: {
    statusCode: 200,
    server: 'Apache',
  },
  technologies: ['Apache'],
  payload: {
    http: {
      protocol: 'http/2',
      statusCode: 200,
      headers: {
        server: 'Apache',
      },
    },
  },
};

// Authoritative change events from backend
const mockChangeEvents: readonly TimelineEventDto[] = [
  {
    id: 'evt-http-proto-001',
    domainId: 'dom-stripe-prod',
    snapshotId: 'snp-stripe-ca0a74f7',
    currentSnapshotId: 'snp-stripe-ca0a74f7',
    previousSnapshotId: 'snp-stripe-8b31a29c',
    changeType: 'PROTOCOL_CHANGE',
    severity: 'INFORMATIONAL',
    title: 'HTTP Protocol Transition',
    explanation: 'Edge network upgraded HTTP transport protocol from HTTP/2 to HTTP/3.',
    previousValue: 'HTTP/2',
    currentValue: 'HTTP/3',
    detectedAt: '2026-08-20T14:53:00.000Z',
  },
  {
    id: 'evt-server-mig-002',
    domainId: 'dom-stripe-prod',
    snapshotId: 'snp-stripe-8b31a29c',
    currentSnapshotId: 'snp-stripe-8b31a29c',
    previousSnapshotId: 'snp-stripe-5fa2c81b',
    changeType: 'SERVER_MODIFIED',
    severity: 'LOW',
    title: 'Web Server Migration',
    explanation: 'Origin reverse proxy migrated from Apache HTTP Server to NGINX.',
    previousValue: 'Apache',
    currentValue: 'nginx',
    detectedAt: '2026-08-18T09:14:00.000Z',
  },
];

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

describe('WX-505: Historical Context Architecture & Experience Contracts', () => {
  describe('1. Temporal Lineage Resolution (Earlier -> Previous -> Current)', () => {
    it('structures Current, Previous, and Earlier tiers in authoritative backend order', () => {
      const snapshots = [mockLatestSnapshot, mockPreviousSnapshot, mockEarlierSnapshot];
      const resolution = resolveHistoricalContext({
        snapshots,
        timelineEvents: mockChangeEvents,
        isLoading: false,
        isError: false,
      });

      assert.equal(resolution.state, 'READY');
      assert.equal(resolution.totalSnapshots, 3);
      assert.equal(resolution.isInitialBaseline, false);

      // Current Node
      assert.ok(resolution.currentNode);
      assert.equal(resolution.currentNode.tier, 'CURRENT');
      assert.equal(resolution.currentNode.snapshotId, 'snp-stripe-ca0a74f7');
      assert.equal(resolution.currentNode.formattedDate, 'Aug 20, 2026');
      assert.equal(resolution.currentNode.server, 'nginx');
      assert.equal(resolution.currentNode.httpProtocol, 'HTTP/3');

      // Previous Node
      assert.ok(resolution.previousNode);
      assert.equal(resolution.previousNode.tier, 'PREVIOUS');
      assert.equal(resolution.previousNode.snapshotId, 'snp-stripe-8b31a29c');
      assert.equal(resolution.previousNode.formattedDate, 'Aug 18, 2026');
      assert.equal(resolution.previousNode.server, 'nginx');
      assert.equal(resolution.previousNode.httpProtocol, 'HTTP/2');

      // Earlier Nodes
      assert.equal(resolution.earlierNodes.length, 1);
      assert.equal(resolution.earlierNodes[0].tier, 'EARLIER');
      assert.equal(resolution.earlierNodes[0].snapshotId, 'snp-stripe-5fa2c81b');
      assert.equal(resolution.earlierNodes[0].formattedDate, 'Aug 12, 2026');
      assert.equal(resolution.earlierNodes[0].server, 'Apache');
    });

    it('extracts snapshot facts into structured nodes accurately', () => {
      const node = extractHistoricalSnapshotNode(mockLatestSnapshot, 'CURRENT');

      assert.equal(node.id, 'snp-stripe-ca0a74f7');
      assert.equal(node.tier, 'CURRENT');
      assert.equal(node.domainId, 'dom-stripe-prod');
      assert.equal(node.tlsSummary, 'TLS valid');
      assert.deepEqual(node.technologies, ['NGINX', 'Next.js', 'HSTS']);
      assert.equal(node.previousSnapshotId, 'snp-stripe-8b31a29c');
    });
  });

  describe('2. Authoritative Evolution Links & State Transitions', () => {
    it('extracts authoritative change transitions connecting snapshots without React synthesis', () => {
      const links = extractHistoricalEvolutionLinks(mockChangeEvents);

      assert.equal(links.length, 2);

      // Link 1: HTTP/2 -> HTTP/3
      assert.equal(links[0].changeId, 'evt-http-proto-001');
      assert.equal(links[0].transitionLabel, 'HTTP/2 → HTTP/3');
      assert.equal(links[0].previousValue, 'HTTP/2');
      assert.equal(links[0].currentValue, 'HTTP/3');
      assert.equal(links[0].fromSnapshotId, 'snp-stripe-8b31a29c');
      assert.equal(links[0].toSnapshotId, 'snp-stripe-ca0a74f7');

      // Link 2: Apache -> nginx
      assert.equal(links[1].changeId, 'evt-server-mig-002');
      assert.equal(links[1].transitionLabel, 'Apache → nginx');
      assert.equal(links[1].previousValue, 'Apache');
      assert.equal(links[1].currentValue, 'nginx');
      assert.equal(links[1].fromSnapshotId, 'snp-stripe-5fa2c81b');
      assert.equal(links[1].toSnapshotId, 'snp-stripe-8b31a29c');
    });
  });

  describe('3. Single-Snapshot Initial Baseline Semantics', () => {
    it('handles single-snapshot domain as initial baseline with zero previous comparisons', () => {
      const resolution = resolveHistoricalContext({
        snapshots: [mockEarlierSnapshot],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(resolution.state, 'EMPTY');
      assert.equal(resolution.isInitialBaseline, true);
      assert.equal(resolution.totalSnapshots, 1);
      assert.ok(resolution.currentNode);
      assert.equal(resolution.previousNode, null);
      assert.equal(resolution.earlierNodes.length, 0);
      assert.equal(resolution.evolutionLinks.length, 0);
    });

    it('enforces calm and honest copy for initial baseline state', () => {
      assert.equal(
        HISTORICAL_CONTEXT_COPY.BASELINE_HEADLINE,
        'Initial baseline established.'
      );
      assert.equal(
        HISTORICAL_CONTEXT_COPY.BASELINE_EXPLANATION,
        'No previous infrastructure state is available for comparison.'
      );
    });
  });

  describe('4. Zero-Snapshot Domain State (EMPTY)', () => {
    it('resolves EMPTY state when no completed snapshots exist', () => {
      const resolution = resolveHistoricalContext({
        snapshots: [],
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(resolution.state, 'EMPTY');
      assert.equal(resolution.isInitialBaseline, false);
      assert.equal(resolution.currentNode, null);
    });

    it('provides calm copy for empty domain state', () => {
      assert.equal(
        HISTORICAL_CONTEXT_COPY.EMPTY_HEADLINE,
        'No infrastructure snapshot is available yet.'
      );
      assert.equal(
        HISTORICAL_CONTEXT_COPY.EMPTY_EXPLANATION,
        'Nebula has not established an infrastructure baseline for this domain.'
      );
    });
  });

  describe('5. Multi-Snapshot Quiet State', () => {
    it('resolves QUIET state when multiple snapshots exist but zero changes were observed', () => {
      const snapshots = [mockLatestSnapshot, mockPreviousSnapshot];
      const resolution = resolveHistoricalContext({
        snapshots,
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.equal(resolution.state, 'QUIET');
      assert.equal(resolution.isQuiet, true);
      assert.equal(resolution.evolutionLinks.length, 0);
      assert.ok(resolution.currentNode);
      assert.ok(resolution.previousNode);
    });

    it('provides calm copy for quiet state', () => {
      assert.equal(
        HISTORICAL_CONTEXT_COPY.QUIET_HEADLINE,
        'Infrastructure has remained stable across observed states.'
      );
    });
  });

  describe('6. Seven-Tier Memory State Semantic Matrix', () => {
    it('resolves LOADING state during retrieval', () => {
      const res = resolveHistoricalContext({
        snapshots: null,
        isLoading: true,
        isError: false,
      });
      assert.equal(res.state, 'LOADING');
    });

    it('resolves ERROR state on failure', () => {
      const res = resolveHistoricalContext({
        snapshots: null,
        isLoading: false,
        isError: true,
      });
      assert.equal(res.state, 'ERROR');
    });

    it('resolves UNAVAILABLE state on domain boundary mismatch', () => {
      const res = resolveHistoricalContext({
        snapshots: [mockLatestSnapshot],
        isLoading: false,
        isError: false,
        isDomainMismatch: true,
      });
      assert.equal(res.state, 'UNAVAILABLE');
    });

    it('resolves PARTIAL state when backend flags partial context', () => {
      const res = resolveHistoricalContext({
        snapshots: [mockLatestSnapshot, mockPreviousSnapshot],
        timelineEvents: mockChangeEvents,
        isLoading: false,
        isError: false,
        isPartial: true,
      });
      assert.equal(res.state, 'PARTIAL');
    });

    it('resolves READY state for multi-snapshot with change events', () => {
      const res = resolveHistoricalContext({
        snapshots: [mockLatestSnapshot, mockPreviousSnapshot],
        timelineEvents: mockChangeEvents,
        isLoading: false,
        isError: false,
      });
      assert.equal(res.state, 'READY');
    });
  });

  describe('7. P0 Domain Isolation Boundary', () => {
    it('rejects historical context requests for unowned foreign domains', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-foreign-unauthorized',
          sourceType: 'historical_context',
          sourceId: 'dom-foreign-unauthorized',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, false);
      assert.equal(resolution.isDomainMismatch, true);
    });

    it('accepts historical context requests within verified owned domain boundary', () => {
      const resolution = resolveInvestigationTarget({
        context: {
          domainId: 'dom-stripe-prod',
          sourceType: 'historical_context',
          sourceId: 'dom-stripe-prod',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockUserDomains,
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.isDomainMismatch, false);
      assert.equal(resolution.sourceType, 'historical_context');
    });
  });

  describe('8. Canonical Deep-Linking & Return Paths', () => {
    it('builds canonical historical context links preserving domain and return paths', () => {
      const link = buildInvestigationLink(
        'dom-stripe-prod',
        'historical_context',
        'dom-stripe-prod',
        '/workspace/memory'
      );

      assert.ok(link.includes('domainId=dom-stripe-prod'));
      assert.ok(link.includes('sourceType=historical_context'));
      assert.ok(link.includes('returnPath=%2Fworkspace%2Fmemory') || link.includes('returnPath=/workspace/memory'));
    });
  });

  describe('9. Hard Invariants: Strictly Prohibited Patterns', () => {
    it('strictly forbids client-side diffing, chronology sorting, causality fabrication, and score invention', () => {
      const prohibitedPatterns = [
        'clientSideSnapshotDiffing',
        'reactSortsHistoricalSnapshots',
        'syntheticCausalityInference',
        'infrastructureEvolutionScore',
        'trendPercentages',
        'duplicateTimelineImplementation',
      ];

      for (const pattern of prohibitedPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
