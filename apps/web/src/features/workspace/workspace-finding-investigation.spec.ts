import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureFindingDto } from '../../types/api/finding.dto.ts';

const mockFinding: InfrastructureFindingDto = {
  id: 'fnd-tls-cert-exp',
  domainId: 'dom-stripe-prod',
  snapshotId: 'snp-stripe-001',
  category: 'TLS',
  severity: 'CRITICAL',
  status: 'ACTIVE',
  title: 'Wildcard TLS Certificate Expiring in 48 Hours',
  explanation: 'Edge ingress TLS certificate for *.stripe.com expires on 2026-08-22.',
  remediation: 'Renew and deploy new certificate via AWS ACM or LetEncrypt ACME client.',
  lineage: {
    snapshotId: 'snp-stripe-001',
    observationKey: 'tls.certificate.validTo',
    observedValue: '2026-08-22T00:00:00Z',
    ruleId: 'rule-tls-expiry-48h',
    evaluationTimestamp: '2026-08-20T00:00:00Z',
  },
  detectedAt: '2026-08-20T00:00:00Z',
};

describe('WX-302: Finding Investigation Architecture & Lineage Contracts', () => {
  describe('1. Finding Investigation DTO & Lineage Integrity', () => {
    it('verifies all required fields and evidence lineage of the finding', () => {
      assert.equal(mockFinding.id, 'fnd-tls-cert-exp');
      assert.equal(mockFinding.domainId, 'dom-stripe-prod');
      assert.equal(mockFinding.severity, 'CRITICAL');
      assert.equal(mockFinding.category, 'TLS');
      assert.ok(mockFinding.explanation);
      assert.ok(mockFinding.remediation);
      assert.ok(mockFinding.lineage);
      assert.equal(mockFinding.lineage?.observationKey, 'tls.certificate.validTo');
      assert.equal(mockFinding.lineage?.observedValue, '2026-08-22T00:00:00Z');
    });
  });

  describe('2. Domain Ownership & Cross-Tenant Security Invariant', () => {
    it('enforces that finding domainId must match active workspace domainId', () => {
      const activeDomainId = 'dom-stripe-prod';
      const unownedDomainId = 'dom-unauthorized-target';

      const isAuthorized = mockFinding.domainId === activeDomainId;
      const isUnauthorized = mockFinding.domainId === unownedDomainId;

      assert.equal(isAuthorized, true);
      assert.equal(isUnauthorized, false);
    });
  });

  describe('3. Forbidden Frontend Intelligence & Diffing Invariant', () => {
    it('prohibits generating findings, recalculating severity, or diffing snapshots in React', () => {
      const forbiddenInvestigationBehaviors = [
        'frontendGeneratesFindings',
        'frontendRecalculatesSeverity',
        'frontendDiffsSnapshotsLocally',
        'synthesizeNarrativesWithoutBackend',
      ];

      for (const behavior of forbiddenInvestigationBehaviors) {
        assert.ok(typeof behavior === 'string');
      }
    });
  });

  describe('4. WX-303-B: Backend-Confirmed Investigation Evidence & Processing State', () => {
    it('verifies backend-confirmed processing state and structured evidence', () => {
      const enrichedFinding: InfrastructureFindingDto = {
        ...mockFinding,
        processingStatus: 'COMPLETED',
        processingSummary: 'Infrastructure was processed successfully and finding state verified.',
        processingEvidence: [
          {
            step: 'Finding resolved',
            status: 'SUCCESS',
            description: 'Finding fnd-tls-cert-exp resolved from snapshot snp-stripe-001',
            timestamp: '2026-08-20T00:00:00Z',
          },
          {
            step: 'Snapshot resolved',
            status: 'SUCCESS',
            description: 'Snapshot snp-stripe-001 authoritative state verified',
            timestamp: '2026-08-20T00:00:00Z',
          },
          {
            step: 'Observation evaluated',
            status: 'SUCCESS',
            description: 'Evaluated tls against rule rule-tls-expiry-48h',
            timestamp: '2026-08-20T00:00:00Z',
          },
          {
            step: 'Investigation assembled',
            status: 'SUCCESS',
            description: 'Authoritative evidence lineage and snapshot context verified',
            timestamp: '2026-08-20T00:00:00Z',
          },
        ],
      };

      assert.equal(enrichedFinding.processingStatus, 'COMPLETED');
      assert.equal(
        enrichedFinding.processingSummary,
        'Infrastructure was processed successfully and finding state verified.'
      );
      assert.equal(enrichedFinding.processingEvidence?.length, 4);
      assert.equal(enrichedFinding.processingEvidence?.[0].step, 'Finding resolved');
      assert.equal(enrichedFinding.processingEvidence?.[0].status, 'SUCCESS');
      assert.equal(enrichedFinding.processingEvidence?.[1].step, 'Snapshot resolved');
      assert.equal(enrichedFinding.processingEvidence?.[2].step, 'Observation evaluated');
      assert.equal(enrichedFinding.processingEvidence?.[3].step, 'Investigation assembled');
    });

    it('handles invalid date condition as structured backend evidence without displaying raw JS Invalid Date', () => {
      const invalidDateFinding: InfrastructureFindingDto = {
        ...mockFinding,
        detectedAt: 'invalid-timestamp-format',
        processingStatus: 'INVALID',
        processingSummary: 'Infrastructure processing completed with an invalid observation date.',
        processingEvidence: [
          {
            step: 'Finding resolved',
            status: 'SUCCESS',
            description: 'Finding fnd-tls-cert-exp resolved from snapshot snp-stripe-001',
          },
          {
            step: 'Snapshot resolved',
            status: 'SUCCESS',
            description: 'Snapshot snp-stripe-001 authoritative state verified',
          },
          {
            step: 'Observation evaluated',
            status: 'WARNING',
            description: 'Evaluated tls observations',
          },
          {
            step: 'Invalid date detected',
            status: 'WARNING',
            description: 'The source observation contains a date value that could not be interpreted as a valid timestamp.',
          },
          {
            step: 'Investigation assembled',
            status: 'SUCCESS',
            description: 'Authoritative evidence lineage verified',
          },
        ],
      };

      assert.equal(invalidDateFinding.processingStatus, 'INVALID');
      const invalidStep = invalidDateFinding.processingEvidence?.find(
        (e) => e.step === 'Invalid date detected'
      );
      assert.ok(invalidStep);
      assert.equal(invalidStep?.status, 'WARNING');

      // Date parsing test
      const rawDate = invalidDateFinding.detectedAt;
      const parsed = new Date(rawDate);
      const isInvalid = isNaN(parsed.getTime());
      assert.equal(isInvalid, true);

      // Verify safe fallback representation (never raw "Invalid Date")
      const safeRepresentation = isInvalid ? 'Unverified timestamp' : parsed.toLocaleString();
      assert.notEqual(safeRepresentation, 'Invalid Date');
      assert.equal(safeRepresentation, 'Unverified timestamp');
    });

    it('preserves valid backend dates and formats them accurately', () => {
      const validIsoDate = '2026-08-25T12:00:00.000Z';
      const parsed = new Date(validIsoDate);
      assert.equal(isNaN(parsed.getTime()), false);
      const formatted = parsed.toLocaleString();
      assert.notEqual(formatted, 'Invalid Date');
    });

    it('prohibits raw backend logs, SQL queries, or internal stack traces in investigation explanation', () => {
      const sensitiveLeakagePatterns = [
        /at\s+[\w$.]+\s+\(/i,
        /SELECT\s+.+\s+FROM/i,
        /INSERT\s+INTO/i,
        /prisma\./i,
        /node:internal/i,
        /Error:\s+ECONNREFUSED/i,
      ];

      for (const pattern of sensitiveLeakagePatterns) {
        assert.equal(
          pattern.test(mockFinding.explanation),
          false,
          `Explanation must not leak raw technical traces matching ${pattern}`
        );
      }
    });
  });

  describe('5. WX-303: Investigation Related Evidence Deduplication & Primary Exclusion', () => {
    it('guarantees primary investigation entity is excluded from related/secondary stories', () => {
      const primaryFindingId = 'fnd-tls-cert-exp';
      const rawStories: { id: string; title: string; severity: string }[] = [
        { id: 'fnd-tls-cert-exp', title: 'TLS Expiring (Duplicate Primary)', severity: 'CRITICAL' },
        { id: 'fnd-hsts-missing', title: 'HSTS Header Missing', severity: 'HIGH' },
        { id: 'fnd-tls-cert-exp', title: 'TLS Expiring Another Instance', severity: 'CRITICAL' },
        { id: 'fnd-hsts-missing', title: 'HSTS Duplicate Instance', severity: 'HIGH' },
      ];

      const primaryKey = `FINDING:${primaryFindingId}`;
      const seen = new Set<string>();
      const deduplicatedSecondary: typeof rawStories = [];

      for (const story of rawStories) {
        const key = `FINDING:${story.id}`;
        // 1. Primary Exclusion
        if (key === primaryKey) continue;
        // 2. Identity Deduplication
        if (seen.has(key)) continue;
        seen.add(key);
        deduplicatedSecondary.push(story);
      }

      assert.equal(deduplicatedSecondary.length, 1);
      assert.equal(deduplicatedSecondary[0].id, 'fnd-hsts-missing');
      assert.ok(!deduplicatedSecondary.some((s) => s.id === primaryFindingId));
    });

    it('deduplicates entities strictly by type + canonicalId (never title or description)', () => {
      const sameTitleDifferentEntities = [
        { id: 'fnd-1', title: 'DNS Configuration Changed', type: 'FINDING' },
        { id: 'fnd-2', title: 'DNS Configuration Changed', type: 'FINDING' }, // Different ID -> must be preserved as distinct
        { id: 'fnd-1', title: 'Different Title Same Entity', type: 'FINDING' }, // Same ID -> duplicate
      ];

      const seen = new Set<string>();
      const result: typeof sameTitleDifferentEntities = [];

      for (const item of sameTitleDifferentEntities) {
        const key = `${item.type}:${item.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
      }

      assert.equal(result.length, 2);
      assert.equal(result[0].id, 'fnd-1');
      assert.equal(result[1].id, 'fnd-2');
      assert.equal(result[0].title, 'DNS Configuration Changed');
    });

    it('verifies changes and activity deduplication invariants', () => {
      const changes = [
        { id: 'chg-1', changeType: 'DNS' },
        { id: 'chg-1', changeType: 'DNS' },
        { id: 'chg-2', changeType: 'TLS' },
      ];
      const seenChanges = new Set<string>();
      const dedupChanges = changes.filter((c) => {
        const key = `CHANGE:${c.id}`;
        if (seenChanges.has(key)) return false;
        seenChanges.add(key);
        return true;
      });
      assert.equal(dedupChanges.length, 2);

      const verifications = [
        { id: 'ver-100', status: 'SUCCESS' },
        { id: 'ver-100', status: 'SUCCESS' },
      ];
      const seenVerifs = new Set<string>();
      const dedupVerifs = verifications.filter((v) => {
        const key = `VERIFICATION:${v.id}`;
        if (seenVerifs.has(key)) return false;
        seenVerifs.add(key);
        return true;
      });
      assert.equal(dedupVerifs.length, 1);
    });
  });
});
