import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAuthoritativeEvidence,
} from './contracts/canonical-evidence-resolver.contract.ts';
import {
  WORKSPACE_CERTIFIED_INVARIANTS,
  WORKSPACE_TRUTH_MATRIX,
} from './contracts/workspace-redesign-truth-contract.ts';
import { timelineService } from '../../services/timeline.service.ts';
import { findingService } from '../../services/finding.service.ts';
import type { TimelineEventDto } from '../../types/api';

describe('WX-1021: Change Evidence Retrieval Integrity', () => {
  const domainId = 'dom-amazon-001';
  const otherDomainId = 'dom-attacker-999';
  const currentSnapshotId = 'snp-cur-001';
  const previousSnapshotId = 'snp-prev-000';

  const mockChangeWithEvidence: TimelineEventDto = {
    id: 'chg-tech-removed-1',
    domainId,
    domainName: 'amazon.com',
    snapshotId: currentSnapshotId,
    currentSnapshotId,
    previousSnapshotId,
    changeType: 'REMOVED',
    severity: 'HIGH',
    category: 'TECHNOLOGY',
    title: 'Technology Removed',
    description: 'Apache HTTP Server was removed (previously 2.4.41).',
    evidenceCount: 1,
    observationCount: 2,
    findingCount: 1,
    detectedAt: '2026-08-25T17:40:00.000Z',
  };

  const mockTimelineEvidencePayload = {
    findingId: 'chg-tech-removed-1',
    domainId,
    domainName: 'amazon.com',
    snapshotId: currentSnapshotId,
    previousSnapshotId,
    currentSnapshotId,
    rule: {
      ruleId: 'rule.technology.change',
      ruleVersion: '1.0.0',
      name: 'Technology Change Detection Rule',
      category: 'TECHNOLOGY',
      evaluationLogic: 'Detects technology removals between consecutive snapshots.',
    },
    observations: [
      {
        key: 'technology',
        state: 'OBSERVED',
        observedAt: '2026-08-25T17:40:00.000Z',
        evidenceRef: 'ev-chg-tech-removed-1',
        value: 'Apache HTTP Server',
      },
    ],
    evidence: [
      {
        evidenceId: 'ev-chg-tech-removed-1',
        collector: 'technology-collector',
        collectionTime: '2026-08-25T17:40:00.000Z',
        category: 'SNAPSHOT_DIFF',
        integrityStatus: 'VERIFIED',
        rawUrl: '/api/v1/evidence/ev-chg-tech-removed-1',
        payload: '{"technologies":{"removed":["Apache HTTP Server"]}}',
      },
    ],
  };

  describe('1. Authoritative Change Evidence Resolution', () => {
    it('Change with evidenceCount > 0 retrieves authentic evidence without error', async () => {
      assert.equal(mockChangeWithEvidence.evidenceCount, 1);
      // Mock timelineService.getTimelineEventEvidence
      const origTimelineEv = timelineService.getTimelineEventEvidence;
      (timelineService as any).getTimelineEventEvidence = async (id: string) => {
        if (id === 'chg-tech-removed-1') {
          return mockTimelineEvidencePayload;
        }
        throw new Error('Not found');
      };

      try {
        const result = await resolveAuthoritativeEvidence({
          targetId: 'chg-tech-removed-1',
          domainId,
        });

        assert.equal(result.findingId, 'chg-tech-removed-1');
        assert.equal(result.domainId, domainId);
        assert.equal(result.snapshotId, currentSnapshotId);
        assert.equal(result.evidence.length, 1);
        assert.equal(result.evidence[0].evidenceId, 'ev-chg-tech-removed-1');
        assert.equal(result.targetType, 'change');
      } finally {
        (timelineService as any).getTimelineEventEvidence = origTimelineEv;
      }
    });

    it('Preserves Change -> finding -> observation -> evidence lineage chain', async () => {
      const origFindingEv = findingService.getFindingEvidence;
      (findingService as any).getFindingEvidence = async (id: string) => {
        if (id === 'find-dns-spf-1') {
          return {
            findingId: 'find-dns-spf-1',
            domainId,
            domainName: 'amazon.com',
            snapshotId: currentSnapshotId,
            rule: {
              ruleId: 'dns.missing-spf',
              ruleVersion: '1.0.0',
              name: 'Missing SPF Record',
              category: 'DNS_RECORD',
              evaluationLogic: 'Checks TXT records for v=spf1.',
            },
            observations: [
              {
                key: 'dns_record',
                state: 'NON_COMPLIANT',
                observedAt: '2026-08-25T17:40:00.000Z',
                evidenceRef: 'ev-dns-01',
                value: 'SPF Record Not Found',
              },
            ],
            evidence: [
              {
                evidenceId: 'ev-dns-01',
                collector: 'dns-collector',
                collectionTime: '2026-08-25T17:40:00.000Z',
                category: 'DNS_QUERY',
                integrityStatus: 'VERIFIED',
                rawUrl: '/api/v1/evidence/ev-dns-01',
              },
            ],
          };
        }
        throw new Error('Finding not found');
      };

      try {
        const result = await resolveAuthoritativeEvidence({
          targetId: 'find-dns-spf-1',
          domainId,
        });

        assert.equal(result.findingId, 'find-dns-spf-1');
        assert.equal(result.observations[0].key, 'dns_record');
        assert.equal(result.evidence[0].evidenceId, 'ev-dns-01');
        assert.equal(result.targetType, 'finding');
      } finally {
        (findingService as any).getFindingEvidence = origFindingEv;
      }
    });
  });

  describe('2. Security Boundary & Error Handling', () => {
    it('Wrong-domain change cannot retrieve evidence (cross-domain boundary)', async () => {
      const origTimelineEv = timelineService.getTimelineEventEvidence;
      (timelineService as any).getTimelineEventEvidence = async () => ({
        ...mockTimelineEvidencePayload,
        domainId: otherDomainId,
      });

      try {
        await assert.rejects(
          async () => {
            await resolveAuthoritativeEvidence({
              targetId: 'chg-tech-removed-1',
              domainId, // requesting domain differs from payload domain
            });
          },
          (err: Error) => {
            return (
              err.message.includes('isolation') ||
              err.message.includes('cross-domain') ||
              err.message.includes('not belong')
            );
          }
        );
      } finally {
        (timelineService as any).getTimelineEventEvidence = origTimelineEv;
      }
    });

    it('Invalid target ID throws a controlled descriptive error', async () => {
      await assert.rejects(
        async () => {
          await resolveAuthoritativeEvidence({
            targetId: '',
            domainId,
          });
        },
        /Invalid evidence target identifier/
      );
    });

    it('Missing evidence returns honest absence / error rejection without synthetic fallback', async () => {
      const origTimelineEv = timelineService.getTimelineEventEvidence;
      (timelineService as any).getTimelineEventEvidence = async () => {
        throw new Error('Evidence artifact not found');
      };

      try {
        await assert.rejects(async () => {
          await resolveAuthoritativeEvidence({
            targetId: 'chg-nonexistent-999',
            domainId,
          });
        });
      } finally {
        (timelineService as any).getTimelineEventEvidence = origTimelineEv;
      }
    });
  });

  describe('3. Historical Snapshot Lineage Preservation', () => {
    it('Historical change preserves previous and current snapshot lineage', async () => {
      const origTimelineEv = timelineService.getTimelineEventEvidence;
      (timelineService as any).getTimelineEventEvidence = async () => ({
        ...mockTimelineEvidencePayload,
        snapshotId: 'snp-historical-target-123',
        previousSnapshotId: 'snp-historical-base-000',
        currentSnapshotId: 'snp-historical-target-123',
      });

      try {
        const result = await resolveAuthoritativeEvidence({
          targetId: 'chg-historical-01',
          domainId,
        });

        assert.equal(result.previousSnapshotId, 'snp-historical-base-000');
        assert.equal(result.currentSnapshotId, 'snp-historical-target-123');
        assert.equal(result.snapshotId, 'snp-historical-target-123');
      } finally {
        (timelineService as any).getTimelineEventEvidence = origTimelineEv;
      }
    });
  });

  describe('4. Truth Contract Certification (WX-1021)', () => {
    it('Contains WX-1021 in WORKSPACE_TRUTH_MATRIX', () => {
      const entry = WORKSPACE_TRUTH_MATRIX.find(
        (t) =>
          t.capability.includes('WX-1021') ||
          t.capability.includes('Change Evidence Retrieval')
      );
      assert.ok(entry);
      assert.equal(entry?.status, 'PRODUCTION_READY');
    });

    it('Certifies CHANGE_EVIDENCE_CLAIM_MUST_BE_RETRIEVABLE invariant', () => {
      assert.ok(WORKSPACE_CERTIFIED_INVARIANTS.CHANGE_EVIDENCE_CLAIM_MUST_BE_RETRIEVABLE);
      assert.ok(
        WORKSPACE_CERTIFIED_INVARIANTS.CHANGE_EVIDENCE_CLAIM_MUST_BE_RETRIEVABLE.includes(
          'evidenceCount > 0'
        )
      );
    });
  });
});
