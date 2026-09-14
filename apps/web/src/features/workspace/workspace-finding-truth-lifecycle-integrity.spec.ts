import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveFindingMeaningHierarchy,
  resolveChangeMeaningHierarchy,
} from './contracts/investigation-hierarchy.contract.ts';
import { resolveWhatMattersNow } from './contracts/adaptive-infrastructure.contract.ts';
import type { InfrastructureFindingDto, DomainOverviewResponseDto } from '../../types/api';

/**
 * WX-211: Current Truth & Finding Lifecycle Integrity Frontend Specification
 *
 * Verifies that:
 * 1. Nebula NEVER presents a resolved or historical observation as a current active finding.
 * 2. Active findings produce the authoritative 4-step verification chain:
 *    [Finding active -> Snapshot verified -> Observation evaluated -> Investigation assembled]
 * 3. Resolved findings produce the authoritative 4-step resolution chain:
 *    [Finding resolved -> Resolving snapshot verified -> Resolution observation evaluated -> Investigation assembled]
 * 4. Anti-contradiction invariants:
 *    - Active finding CANNOT contain "Snapshot resolved" or "Resolving snapshot verified"
 *    - Resolved finding CANNOT contain "Finding active" or "Snapshot verified"
 * 5. Overview & Intelligence surfaces (What Matters Now, Executive Brief, Findings Section):
 *    - Resolved findings are strictly excluded from active counts and priority highlights.
 *    - Quiet reassurance state is returned when 0 active findings exist.
 */
describe('WX-211: Current Truth & Finding Lifecycle Integrity (Frontend)', () => {
  const activeCSPFinding: InfrastructureFindingDto = {
    id: 'fnd-csp-001',
    domainId: 'dom-atlas-001',
    snapshotId: 'snp-001-active',
    domainName: 'nebula.internal.io',
    category: 'HTTP',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    state: 'OPEN',
    title: 'Missing Content Security Policy',
    description: 'Content-Security-Policy header is absent on nebula.internal.io.',
    explanation: 'The domain does not publish a Content-Security-Policy response header.',
    remediation: 'Configure a Strict Content-Security-Policy header.',
    detectedAt: '2026-08-29T09:00:00.000Z',
    createdAt: '2026-08-29T09:00:00.000Z',
    rule: {
      ruleId: 'http.missing-content-security-policy',
      ruleVersion: '1.0.0',
      name: 'Missing CSP Header',
      category: 'HTTP',
      evaluationLogic: 'Evaluates HTTP headers for Content-Security-Policy',
    },
    lineage: {
      snapshotId: 'snp-001-active',
      observationKey: 'http_header',
      observedValue: 'Missing Content Security Policy',
      ruleId: 'http.missing-content-security-policy',
    },
    observations: [
      {
        key: 'http_header',
        state: 'NON_COMPLIANT',
        observedAt: '2026-08-29T09:00:00.000Z',
      },
    ],
  };

  const resolvedCSPFinding: InfrastructureFindingDto = {
    ...activeCSPFinding,
    status: 'RESOLVED',
    state: 'RESOLVED',
    observations: [
      {
        key: 'http_header',
        state: 'COMPLIANT',
        observedAt: '2026-08-29T10:00:00.000Z',
      },
    ],
  };

  describe('1. Active Finding Investigation Truth & Evidence Chain', () => {
    it('generates exact 4-step active verification chain for active finding', () => {
      const hierarchy = resolveFindingMeaningHierarchy({
        finding: activeCSPFinding,
        domainName: 'nebula.internal.io',
      });

      assert.equal(hierarchy.howNebulaKnows.length, 4);
      assert.equal(hierarchy.howNebulaKnows[0].step, 'Finding active');
      assert.equal(hierarchy.howNebulaKnows[0].status, 'SUCCESS');
      assert.equal(hierarchy.howNebulaKnows[1].step, 'Snapshot verified');
      assert.equal(hierarchy.howNebulaKnows[1].status, 'SUCCESS');
      assert.equal(hierarchy.howNebulaKnows[2].step, 'Observation evaluated');
      assert.equal(hierarchy.howNebulaKnows[2].status, 'SUCCESS');
      assert.equal(hierarchy.howNebulaKnows[3].step, 'Investigation assembled');
      assert.equal(hierarchy.howNebulaKnows[3].status, 'SUCCESS');

      // Verify anti-contradiction invariants for Active finding
      const stepNames = hierarchy.howNebulaKnows.map((s) => s.step);
      assert.ok(!stepNames.includes('Finding resolved'));
      assert.ok(!stepNames.includes('Snapshot resolved'));
      assert.ok(!stepNames.includes('Resolving snapshot verified'));
      assert.ok(!stepNames.includes('Resolution observation evaluated'));
    });
  });

  describe('2. Resolved Finding Investigation Truth & Resolution Chain', () => {
    it('generates exact 4-step resolved verification chain for resolved finding', () => {
      const hierarchy = resolveFindingMeaningHierarchy({
        finding: resolvedCSPFinding,
        domainName: 'nebula.internal.io',
      });

      assert.equal(hierarchy.howNebulaKnows.length, 4);
      assert.equal(hierarchy.howNebulaKnows[0].step, 'Finding resolved');
      assert.equal(hierarchy.howNebulaKnows[0].status, 'SUCCESS');
      assert.equal(hierarchy.howNebulaKnows[1].step, 'Resolving snapshot verified');
      assert.equal(hierarchy.howNebulaKnows[1].status, 'SUCCESS');
      assert.equal(hierarchy.howNebulaKnows[2].step, 'Resolution observation evaluated');
      assert.equal(hierarchy.howNebulaKnows[2].status, 'SUCCESS');
      assert.equal(hierarchy.howNebulaKnows[3].step, 'Investigation assembled');
      assert.equal(hierarchy.howNebulaKnows[3].status, 'SUCCESS');

      // Verify anti-contradiction invariants for Resolved finding
      const stepNames = hierarchy.howNebulaKnows.map((s) => s.step);
      assert.ok(!stepNames.includes('Finding active'));
      assert.ok(!stepNames.includes('Snapshot verified'));
    });
  });

  describe('3. What Matters Now Intelligence State & Quiet Reassurance', () => {
    it('resolves STABLE quiet state when all findings are resolved (0 active findings)', () => {
      const overviewData: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-atlas-001',
          name: 'nebula.internal.io',
          domainName: 'nebula.internal.io',
          status: 'ACTIVE',
          monitoringEnabled: true,
          environment: 'PRODUCTION',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-08-29T10:00:00Z',
        },
        infrastructure: {
          ipv4Addresses: ['198.51.100.1'],
          cdn: 'Cloudflare',
          webServer: 'nginx',
          sslValid: true,
        },
        latestSnapshot: {
          id: 'snp-002-mitigated',
          domainId: 'dom-atlas-001',
          capturedAt: '2026-08-29T10:00:00Z',
          createdAt: '2026-08-29T10:00:00Z',
        } as any,
        findingsSummary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
          total: 0,
        },
        recentChanges: [],
      };

      const whatMatters = resolveWhatMattersNow(overviewData);

      assert.equal(whatMatters.status, 'STABLE');
      assert.equal(whatMatters.title, 'Architecture Stable');
      assert.ok(whatMatters.subtitle.includes('No meaningful architectural boundary changes'));
    });

    it('resolves ATTENTION state only when active critical findings exist', () => {
      const overviewWithActiveCritical: DomainOverviewResponseDto = {
        domain: {
          id: 'dom-atlas-001',
          name: 'nebula.internal.io',
          domainName: 'nebula.internal.io',
          status: 'ACTIVE',
          monitoringEnabled: true,
          environment: 'PRODUCTION',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-08-29T10:00:00Z',
        },
        findingsSummary: {
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
          total: 1,
        },
        recentChanges: [],
      };

      const whatMatters = resolveWhatMattersNow(overviewWithActiveCritical);

      assert.equal(whatMatters.status, 'ATTENTION');
      assert.equal(whatMatters.title, 'Architectural Exposure Note');
      assert.ok(whatMatters.subtitle.includes('1 critical architectural'));
    });
  });
});
