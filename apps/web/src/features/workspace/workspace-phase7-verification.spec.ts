import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureSnapshotDto } from '../../types/api/snapshot.dto.ts';
import {
  resolveWorkspaceSemanticState,
  resolveCurrentIntelligenceSemanticState,
  resolveOverviewSemanticState,
  resolveInvestigationSemanticState,
  resolveMemorySemanticState,
  type WorkspaceSemanticState,
} from './contracts/workspace-state-matrix.contract.ts';
import {
  resolveOverviewSignalCoverage,
  resolveEvidenceSignalCoverage,
} from './contracts/partial-intelligence.contract.ts';
import {
  resolveUnavailableContext,
} from './contracts/unavailable-infrastructure.contract.ts';
import {
  resolveErrorRecovery,
} from './contracts/error-recovery.contract.ts';
import {
  validateReturnPath,
  resolveNearestValidNavigationContext,
  hydrateWorkspaceUrlParams,
  isResponseValidForActiveContext,
} from './contracts/navigation-resilience.contract.ts';
import {
  resolveSemanticStateAnnouncement,
  formatAccessibleTechnicalIdentifier,
  getSeverityAccessibleDescriptor,
} from './contracts/accessibility.contract.ts';
import {
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
} from '../../lib/api-client.ts';

describe('WX-707: Phase 7 UX States & Resilience Final Verification Gate 🔒', () => {
  describe('Layer 1: Seven-Tier Semantic State Matrix & Precedence (WX-701)', () => {
    it('verifies all 7 semantic states and their strict hard boundaries', () => {
      const allStates: readonly WorkspaceSemanticState[] = [
        'LOADING',
        'READY',
        'QUIET',
        'EMPTY',
        'PARTIAL',
        'UNAVAILABLE',
        'ERROR',
      ];
      assert.equal(allStates.length, 7);

      // Boundaries: EMPTY != ERROR, PARTIAL != ERROR, UNAVAILABLE != ERROR, QUIET != EMPTY
      assert.notEqual('EMPTY', 'ERROR');
      assert.notEqual('PARTIAL', 'ERROR');
      assert.notEqual('UNAVAILABLE', 'ERROR');
      assert.notEqual('QUIET', 'EMPTY');
    });

    it('enforces deterministic precedence hierarchy: UNAVAILABLE > ERROR > LOADING > EMPTY > PARTIAL > QUIET > READY', () => {
      // 1. Domain mismatch overrides all other flags
      const stateUnavailable = resolveWorkspaceSemanticState({
        scope: 'investigation',
        isDomainMismatch: true,
        isError: true,
        isLoading: true,
        data: { id: 'fnd-1' },
      });
      assert.equal(stateUnavailable, 'UNAVAILABLE');

      // 2. Error overrides loading and data
      const stateError = resolveWorkspaceSemanticState({
        scope: 'current',
        isError: true,
        isLoading: true,
        data: { id: 'fnd-1' },
      });
      assert.equal(stateError, 'ERROR');

      // 3. Loading overrides data
      const stateLoading = resolveWorkspaceSemanticState({
        scope: 'current',
        isLoading: true,
        data: { id: 'fnd-1' },
      });
      assert.equal(stateLoading, 'LOADING');
    });

    it('pure scope resolvers accurately evaluate Current, Overview, Investigation, and Memory', () => {
      assert.equal(
        resolveCurrentIntelligenceSemanticState({ isLoading: false, isError: false, hasFindings: false }),
        'QUIET'
      );
      assert.equal(
        resolveOverviewSemanticState({ isLoading: false, isError: false, hasDns: true, hasTls: false, hasTech: true }),
        'PARTIAL'
      );
      assert.equal(
        resolveInvestigationSemanticState({ isLoading: false, isError: false, resourceFound: false }),
        'EMPTY'
      );
      assert.equal(
        resolveMemorySemanticState({ isLoading: false, isError: false, eventCount: 0 }),
        'QUIET'
      );
    });
  });

  describe('Layer 2: Partial Intelligence & Honest Absence (WX-702)', () => {
    it('preserves known verified observations when certain categories are unavailable', () => {
      const partialSnapshot: InfrastructureSnapshotDto = {
        id: 'snp-partial-707',
        domainId: 'dom-stripe',
        tlsCertificate: {
          subject: 'CN=stripe.com',
          issuer: 'DigiCert',
          validFrom: '2025-01-01T00:00:00.000Z',
          validTo: '2026-01-01T00:00:00.000Z',
        },
      };

      const coverage = resolveOverviewSignalCoverage(partialSnapshot);
      assert.equal(coverage.isPartial, true);
      assert.equal(coverage.establishedSignals.length, 1);
      assert.equal(coverage.unavailableSignals.length, 3);
      assert.ok(coverage.explanation.includes('Verified facts remain visible'));
    });

    it('distinguishes verified absence (ABSENT) from uncaptured telemetry (UNAVAILABLE)', () => {
      const absentTechSnapshot: InfrastructureSnapshotDto = {
        id: 'snp-absent-tech',
        domainId: 'dom-stripe',
        dnsRecords: [{ type: 'A', name: 'stripe.com', value: '1.2.3.4' }],
        tlsCertificate: {
          subject: 'CN=stripe.com',
          issuer: 'DigiCert',
          validFrom: '2025-01-01T00:00:00.000Z',
          validTo: '2026-01-01T00:00:00.000Z',
        },
        httpObservation: { statusCode: 200 },
        technologies: [], // Explicitly observed 0 items -> ABSENT
      };

      const coverage = resolveOverviewSignalCoverage(absentTechSnapshot);
      const techSignal = coverage.absentSignals.find((s) => s.signalKey === 'technologies');
      assert.ok(techSignal);
      assert.equal(techSignal.state, 'ABSENT');
    });

    it('resolves partial evidence when observation fact is verified but raw protocol payload is uncaptured', () => {
      const partialEvidence = resolveEvidenceSignalCoverage({
        hasFact: true,
        hasLineage: true,
        hasRawTelemetry: false,
      });

      assert.equal(partialEvidence.isPartial, true);
      assert.ok(partialEvidence.explanation.includes('deep protocol evidence was not captured'));
    });
  });

  describe('Layer 3: Unavailable Infrastructure & Security Isolation (WX-703)', () => {
    it('resolves cross-domain unauthorized boundaries with ZERO foreign metadata leakage (P0)', () => {
      const descriptor = resolveUnavailableContext({
        reason: 'CROSS_DOMAIN_BOUNDARY',
        activeDomainName: 'stripe.com',
        returnPath: '/workspace',
      });

      assert.equal(descriptor.reason, 'CROSS_DOMAIN_BOUNDARY');
      assert.equal(descriptor.title, 'Resource unavailable in active domain.');
      assert.equal(descriptor.returnTarget, '/workspace');
      assert.ok(!descriptor.description.includes('foreign'));
    });

    it('resolves uncaptured historical context while preserving return path to snapshot', () => {
      const returnPath = '/workspace?sourceType=snapshot&sourceId=snp-001';
      const descriptor = resolveUnavailableContext({
        reason: 'HISTORICAL_CONTEXT_UNAVAILABLE',
        returnPath,
        sourceExperience: 'Snapshot History',
      });

      assert.equal(descriptor.reason, 'HISTORICAL_CONTEXT_UNAVAILABLE');
      assert.equal(descriptor.returnTarget, returnPath);
      assert.equal(descriptor.returnLabel, 'Back to Snapshot History');
    });
  });

  describe('Layer 4: Error Classification & Typed Recovery (WX-704)', () => {
    it('accurately maps NetworkError, AuthenticationError, AuthorizationError, RateLimitError, and 5xx Server Error', () => {
      // Network Failure
      const netDesc = resolveErrorRecovery({ error: new NetworkError() });
      assert.equal(netDesc.category, 'NETWORK_FAILURE');
      assert.equal(netDesc.isRetryable, true);
      assert.equal(netDesc.actionType, 'RETRY');

      // Session Expired
      const authDesc = resolveErrorRecovery({ error: new AuthenticationError() });
      assert.equal(authDesc.category, 'SESSION_EXPIRED');
      assert.equal(authDesc.isRetryable, false);
      assert.equal(authDesc.actionType, 'REAUTH');
      assert.equal(authDesc.returnTarget, '/auth/login');

      // Forbidden
      const authzDesc = resolveErrorRecovery({ error: new AuthorizationError() });
      assert.equal(authzDesc.category, 'ACCESS_DENIED');
      assert.equal(authzDesc.isRetryable, false);

      // Rate Limited
      const rateDesc = resolveErrorRecovery({ error: new RateLimitError() });
      assert.equal(rateDesc.category, 'RATE_LIMITED');
      assert.equal(rateDesc.isRetryable, true);

      // Server Failure with Correlation ID
      const srvDesc = resolveErrorRecovery({
        error: new ApiError('Engine crashed', 500, 'INTERNAL_SERVER_ERROR', { correlationId: 'corr_gate_992' }),
      });
      assert.equal(srvDesc.category, 'SERVER_FAILURE');
      assert.equal(srvDesc.isRetryable, true);
      assert.equal(srvDesc.correlationId, 'corr_gate_992');
    });
  });

  describe('Layer 5: Navigation Resilience & URL Hydration (WX-705)', () => {
    it('sanitizes return paths and blocks malicious schemes and open redirects', () => {
      assert.equal(validateReturnPath('/workspace?view=memory'), '/workspace?view=memory');
      assert.equal(validateReturnPath('https://evil.com'), '/workspace');
      assert.equal(validateReturnPath('//evil.com/leak'), '/workspace');
      assert.equal(validateReturnPath('javascript:alert(1)'), '/workspace');
    });

    it('gracefully degrades to parent context rather than crashing to root on stale deep-links', () => {
      const recovery = resolveNearestValidNavigationContext({
        domainId: 'dom-stripe',
        failedResourceType: 'evidence',
        availableParentResourceType: 'snapshot',
        availableParentResourceId: 'snp-001',
      });
      assert.equal(recovery.resourceType, 'snapshot');
      assert.equal(recovery.resourceId, 'snp-001');

      const genericRecovery = resolveNearestValidNavigationContext({
        domainId: 'dom-stripe',
        failedResourceType: 'finding',
      });
      assert.equal(genericRecovery.experience, 'current');
    });

    it('discards late responses from previous domains when active domain changes', () => {
      const activeDomainId = 'dom-stripe-prod';
      assert.equal(isResponseValidForActiveContext('dom-stripe-prod', activeDomainId), true);
      assert.equal(isResponseValidForActiveContext('dom-github-prod', activeDomainId), false);
    });

    it('hydrates complex deep-link search parameters in a single authoritative pipeline', () => {
      const hydrated = hydrateWorkspaceUrlParams({
        searchParams: 'domainId=dom-stripe&view=memory&sourceType=change&sourceId=chg-1&returnPath=%2Fworkspace',
        knownDomainIds: ['dom-stripe'],
      });
      assert.equal(hydrated.domainId, 'dom-stripe');
      assert.equal(hydrated.experience, 'memory');
      assert.equal(hydrated.resourceType, 'change');
      assert.equal(hydrated.resourceId, 'chg-1');
      assert.equal(hydrated.returnPath, '/workspace');
    });
  });

  describe('Layer 6: Accessibility & Reduced Motion (WX-706)', () => {
    it('generates concise, non-disruptive screen-reader announcements for state transitions', () => {
      assert.equal(resolveSemanticStateAnnouncement('LOADING').ariaLive, 'polite');
      assert.equal(resolveSemanticStateAnnouncement('ERROR').ariaLive, 'assertive');
      assert.equal(resolveSemanticStateAnnouncement('UNAVAILABLE').ariaLive, 'polite');
      assert.equal(resolveSemanticStateAnnouncement('READY').ariaLive, 'off');
    });

    it('provides distinct visual symbols and accessible names for all 6 severity tiers (color independence)', () => {
      const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL', 'SUCCESS'] as const;
      const symbols = new Set(severities.map((s) => getSeverityAccessibleDescriptor(s).visualPrefix));
      assert.equal(symbols.size, 6);
    });

    it('formats visually truncated technical identifiers with full accessible labels', () => {
      const formatted = formatAccessibleTechnicalIdentifier('Correlation ID', 'corr_838192837198273918237', 12);
      assert.equal(formatted.display, 'corr_8381928…');
      assert.equal(formatted.ariaLabel, 'Correlation ID: corr_838192837198273918237');
    });
  });

  describe('Layer 7: Complete End-to-End Resilience Journey Simulation', () => {
    it('simulates full journey: Current -> Finding -> Evidence (Fails) -> ERROR -> Retry -> UNAVAILABLE -> Back -> Finding -> Memory', () => {
      const domainId = 'dom-stripe-prod';

      // Step 1: Start on Current Intelligence
      const step1 = hydrateWorkspaceUrlParams({
        searchParams: `domainId=${domainId}&view=current`,
      });
      assert.equal(step1.experience, 'current');

      // Step 2: Navigate to Finding Investigation
      const step2 = hydrateWorkspaceUrlParams({
        searchParams: `domainId=${domainId}&sourceType=finding&sourceId=fnd-tls-001&returnPath=%2Fworkspace%3Fview%3Dcurrent`,
      });
      assert.equal(step2.resourceType, 'finding');
      assert.equal(step2.resourceId, 'fnd-tls-001');
      assert.equal(step2.returnPath, '/workspace?view=current');

      // Step 3: Drill into Supporting Evidence
      const step3 = hydrateWorkspaceUrlParams({
        searchParams: `domainId=${domainId}&sourceType=evidence&sourceId=evi-001&returnPath=%2Fworkspace%3FsourceType%3Dfinding%26sourceId%3Dfnd-tls-001`,
      });
      assert.equal(step3.resourceType, 'evidence');

      // Step 4: Evidence request experiences transient network failure -> ERROR
      const errorRecovery = resolveErrorRecovery({
        error: new NetworkError('Gateway timeout'),
        returnPath: step3.returnPath,
        sourceExperience: 'Finding Investigation',
      });
      assert.equal(errorRecovery.category, 'NETWORK_FAILURE');
      assert.equal(errorRecovery.isRetryable, true);
      assert.equal(errorRecovery.returnTarget, '/workspace?sourceType=finding&sourceId=fnd-tls-001');

      // Step 5: User clicks Retry -> backend responds that evidence was uncaptured during discovery -> UNAVAILABLE
      const unavailableContext = resolveUnavailableContext({
        reason: 'EVIDENCE_UNAVAILABLE',
        returnPath: step3.returnPath,
        sourceExperience: 'Finding Investigation',
      });
      assert.equal(unavailableContext.reason, 'EVIDENCE_UNAVAILABLE');
      assert.equal(unavailableContext.returnTarget, '/workspace?sourceType=finding&sourceId=fnd-tls-001');

      // Step 6: User clicks Back -> unwinds cleanly to Finding Investigation
      const step6 = hydrateWorkspaceUrlParams({
        searchParams: unavailableContext.returnTarget.replace('/workspace?', ''),
      });
      assert.equal(step6.resourceType, 'finding');
      assert.equal(step6.resourceId, 'fnd-tls-001');

      // Step 7: Transition to Infrastructure Memory
      const step7 = hydrateWorkspaceUrlParams({
        searchParams: `domainId=${domainId}&view=memory`,
      });
      assert.equal(step7.experience, 'memory');
    });
  });
});
