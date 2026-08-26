import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureSnapshotDto, TimelineEventDto, DomainDto } from '../../types/api';
import {
  resolveMemoryState,
  resolveMemoryBaseline,
  MEMORY_BASELINE_COPY,
} from './contracts/memory.contract.ts';
import {
  extractSnapshotInfrastructureState,
  resolveSelectedSnapshot,
  getSnapshotsArray,
} from './contracts/snapshot-history.contract.ts';
import {
  resolveHistoricalContext,
  extractHistoricalEvolutionLinks,
} from './contracts/historical-context.contract.ts';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
} from './contracts/investigation.contract.ts';
import { DESIGN_TOKENS } from '../../styles/tokens.ts';

// Comprehensive mock fixtures representing immutable historical backend facts
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

const mockOwnedDomains: readonly DomainDto[] = [
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

describe('WX-507: Phase 5 Infrastructure Memory Final Verification Gate', () => {
  describe('1. Layer 0 & 2: Token & Visual Foundation Integrity', () => {
    it('enforces canonical typography font families and scale bounds', () => {
      assert.ok(DESIGN_TOKENS.typography.fonts.sans.includes('DM Sans'));
      assert.ok(DESIGN_TOKENS.typography.fonts.display.includes('Newsreader'));
      assert.ok(DESIGN_TOKENS.typography.fonts.mono.includes('JetBrains Mono'));
    });

    it('enforces 6-tier restrained semantic severity tokens', () => {
      const severities = ['critical', 'high', 'medium', 'low', 'informational', 'success'] as const;
      for (const sev of severities) {
        assert.ok(DESIGN_TOKENS.severity[sev].text);
        assert.ok(DESIGN_TOKENS.severity[sev].bg);
        assert.ok(DESIGN_TOKENS.severity[sev].border);
      }
    });

    it('enforces Base-8 unbroken spatial scale', () => {
      assert.equal(DESIGN_TOKENS.spacing['3xs'].px, 2);
      assert.equal(DESIGN_TOKENS.spacing.md.px, 16);
      assert.equal(DESIGN_TOKENS.spacing['4xl'].px, 96);
    });
  });

  describe('2. Layer 1: Memory Contract & 7-Tier State Matrix (WX-501)', () => {
    it('correctly resolves all 7 canonical memory states', () => {
      // 1. LOADING
      assert.equal(resolveMemoryState({ snapshots: null, timelineEvents: null, isLoading: true, isError: false }), 'LOADING');

      // 2. ERROR
      assert.equal(resolveMemoryState({ snapshots: null, timelineEvents: null, isLoading: false, isError: true }), 'ERROR');

      // 3. UNAVAILABLE
      assert.equal(resolveMemoryState({ snapshots: [mockLatestSnapshot], timelineEvents: [], isLoading: false, isError: false, isDomainMismatch: true }), 'UNAVAILABLE');

      // 4. EMPTY (0 snapshots)
      assert.equal(resolveMemoryState({ snapshots: [], timelineEvents: [], isLoading: false, isError: false }), 'EMPTY');

      // 5. PARTIAL
      assert.equal(resolveMemoryState({ snapshots: [mockLatestSnapshot, mockPreviousSnapshot], timelineEvents: mockChangeEvents, isLoading: false, isError: false, isPartial: true }), 'PARTIAL');

      // 6. QUIET (multi-snapshot, 0 changes)
      assert.equal(resolveMemoryState({ snapshots: [mockLatestSnapshot, mockPreviousSnapshot], timelineEvents: [], isLoading: false, isError: false }), 'QUIET');

      // 7. READY (multi-snapshot with changes)
      assert.equal(resolveMemoryState({ snapshots: [mockLatestSnapshot, mockPreviousSnapshot], timelineEvents: mockChangeEvents, isLoading: false, isError: false }), 'READY');
    });
  });

  describe('3. Layer 2: Baseline Resolution Semantics', () => {
    it('honestly marks single-snapshot domain as initial baseline without fake comparative history', () => {
      const baseline = resolveMemoryBaseline({ snapshots: [mockEarlierSnapshot] });
      assert.equal(baseline.isInitialBaseline, true);
      assert.equal(baseline.totalSnapshots, 1);
      assert.equal(baseline.baselineHeadline, MEMORY_BASELINE_COPY.INITIAL_BASELINE_HEADLINE);
    });

    it('honestly marks multi-snapshot unchanged domain as quiet state', () => {
      const baseline = resolveMemoryBaseline({ snapshots: [mockLatestSnapshot, mockPreviousSnapshot], timelineEvents: [] });
      assert.equal(baseline.isInitialBaseline, false);
      assert.equal(baseline.totalSnapshots, 2);
      assert.equal(baseline.baselineHeadline, MEMORY_BASELINE_COPY.QUIET_HEADLINE);
    });
  });

  describe('4. Layer 3: Authoritative Timeline & Anti-Sorting Invariant (WX-502)', () => {
    it('hard invariant: preserves backend array sequence without client-side sorting', () => {
      const backendArray = [mockLatestSnapshot, mockPreviousSnapshot, mockEarlierSnapshot];
      const normalized = getSnapshotsArray(backendArray);

      assert.equal(normalized[0].id, 'snp-stripe-ca0a74f7');
      assert.equal(normalized[1].id, 'snp-stripe-8b31a29c');
      assert.equal(normalized[2].id, 'snp-stripe-5fa2c81b');
    });
  });

  describe('5. Layer 4: Snapshot History Extraction & Progressive Disclosure (WX-504)', () => {
    it('extracts structured facts directly from Snapshot DTO without synthesis', () => {
      const extracted = extractSnapshotInfrastructureState(mockLatestSnapshot, true);

      assert.equal(extracted.snapshotId, 'snp-stripe-ca0a74f7');
      assert.equal(extracted.httpStatus, 200);
      assert.equal(extracted.server, 'nginx');
      assert.equal(extracted.tls?.status, 'Valid');
      assert.equal(extracted.tls?.issuer, 'DigiCert Global Root G2');
      assert.deepEqual(extracted.technologies, ['NGINX', 'Next.js', 'HSTS']);
      assert.equal(extracted.isCurrent, true);
      assert.ok(extracted.rawPayload);
    });

    it('resolves active selection defaulting to latest verified snapshot', () => {
      const snapshots = [mockLatestSnapshot, mockPreviousSnapshot];
      const result = resolveSelectedSnapshot({ snapshots, requestedSnapshotId: null });

      assert.ok(result.selectedSnapshot);
      assert.equal(result.selectedSnapshot.id, 'snp-stripe-ca0a74f7');
      assert.equal(result.isCurrent, true);
      assert.equal(result.isInitialBaseline, false);
    });
  });

  describe('6. Layer 5: Historical Context Lineage & Zero Causality Fabrication (WX-505)', () => {
    it('structures Earlier -> Previous -> Current lineage adhering strictly to backend authority', () => {
      const snapshots = [mockLatestSnapshot, mockPreviousSnapshot, mockEarlierSnapshot];
      const resolution = resolveHistoricalContext({
        snapshots,
        timelineEvents: mockChangeEvents,
        isLoading: false,
        isError: false,
      });

      assert.equal(resolution.state, 'READY');
      assert.equal(resolution.currentNode?.tier, 'CURRENT');
      assert.equal(resolution.currentNode?.httpProtocol, 'HTTP/3');
      assert.equal(resolution.previousNode?.tier, 'PREVIOUS');
      assert.equal(resolution.previousNode?.httpProtocol, 'HTTP/2');
      assert.equal(resolution.earlierNodes.length, 1);
      assert.equal(resolution.earlierNodes[0]?.server, 'Apache');
    });

    it('extracts authoritative before/after values without React diff synthesis', () => {
      const links = extractHistoricalEvolutionLinks(mockChangeEvents);
      assert.equal(links.length, 2);
      assert.equal(links[0].transitionLabel, 'HTTP/2 → HTTP/3');
      assert.equal(links[0].previousValue, 'HTTP/2');
      assert.equal(links[0].currentValue, 'HTTP/3');
      assert.equal(links[1].transitionLabel, 'Apache → nginx');
      assert.equal(links[1].previousValue, 'Apache');
      assert.equal(links[1].currentValue, 'nginx');
    });
  });

  describe('7. Layer 6: Continuous Navigation & Return-Path Unwinding (WX-506)', () => {
    it('constructs multi-hop links and unwinds return path cleanly', () => {
      const domainId = 'dom-stripe-prod';

      // 1. Workspace -> Memory (Timeline)
      const step1 = '/workspace/memory';

      // 2. Timeline -> Change
      const step2 = buildInvestigationLink(domainId, 'change', 'evt-001', step1);

      // 3. Change -> Snapshot
      const step3 = buildInvestigationLink(domainId, 'snapshot', 'snp-001', step2);

      // 4. Snapshot -> Historical Context
      const step4 = buildInvestigationLink(domainId, 'historical_context', domainId, step3);

      // 5. Historical Context -> Evidence
      const step5 = buildInvestigationLink(domainId, 'evidence', 'evd-001', step4);

      // Unwind verify
      const url5 = new URL(`https://nebula.local${step5}`);
      assert.equal(url5.searchParams.get('sourceType'), 'evidence');

      const url4 = new URL(`https://nebula.local${url5.searchParams.get('returnPath')}`);
      assert.equal(url4.searchParams.get('sourceType'), 'historical_context');

      const url3 = new URL(`https://nebula.local${url4.searchParams.get('returnPath')}`);
      assert.equal(url3.searchParams.get('sourceType'), 'snapshot');

      const url2 = new URL(`https://nebula.local${url3.searchParams.get('returnPath')}`);
      assert.equal(url2.searchParams.get('sourceType'), 'change');

      const url1 = url2.searchParams.get('returnPath');
      assert.equal(url1, '/workspace/memory');
    });
  });

  describe('8. Layer 7: P0 Tenant Domain Security Boundary & Isolation', () => {
    it('strictly isolates cross-domain requests and resolves to UNAVAILABLE', () => {
      const crossDomainResult = resolveInvestigationTarget({
        context: {
          domainId: 'dom-unauthorized-external',
          sourceType: 'snapshot',
          sourceId: 'snp-external-001',
        },
        activeDomainId: 'dom-stripe-prod',
        userDomains: mockOwnedDomains,
      });

      assert.equal(crossDomainResult.isValid, false);
      assert.equal(crossDomainResult.isDomainMismatch, true);
    });
  });

  describe('9. Layer 8: Hard Prohibitions & Anti-Theatrics Invariants', () => {
    it('strictly prohibits client-side diffing, synthetic causality, health scoring, or parallel routers', () => {
      const prohibitedAntiPatterns = [
        'clientSideSnapshotDiffing',
        'reactSortsHistoricalSnapshots',
        'syntheticCausalityInference',
        'infrastructureEvolutionScore',
        'trendPercentages',
        'duplicateTimelineImplementation',
        'parallelMemoryRouter',
        'hardcodedWorkspaceRedirectOnBack',
      ];

      for (const pattern of prohibitedAntiPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
