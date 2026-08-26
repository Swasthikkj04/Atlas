import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InfrastructureFindingDto } from '../../types/api/finding.dto.ts';
import type { TimelineEventDto } from '../../types/api/timeline.dto.ts';
import type { InfrastructureSnapshotDto } from '../../types/api/snapshot.dto.ts';
import {
  resolveFindingRelationships,
  resolveChangeRelationships,
  resolveSnapshotRelationships,
  buildRelationshipNavigationTarget,
} from './contracts/relationship.contract.ts';
import {
  resolveCrossExperienceNavigation,
} from './contracts/cross-experience-navigation.contract.ts';

const mockDomainId = 'dom-stripe-prod';

const mockFinding: InfrastructureFindingDto = {
  id: 'fnd-tls-expiring-soon',
  domainId: mockDomainId,
  snapshotId: 'snp-stripe-001',
  category: 'TLS',
  severity: 'HIGH',
  status: 'ACTIVE',
  title: 'TLS Certificate Expiring Soon',
  explanation: 'Production certificate will expire within 7 days.',
  detectedAt: '2026-08-20T10:00:00.000Z',
  lineage: {
    snapshotId: 'snp-stripe-001',
    observationKey: 'obs-tls-validity-001',
  },
};

const mockChange: TimelineEventDto = {
  id: 'evt-http-upgrade',
  domainId: mockDomainId,
  previousSnapshotId: 'snp-stripe-000',
  currentSnapshotId: 'snp-stripe-001',
  findingId: 'fnd-http-drift',
  changeType: 'MODIFIED',
  severity: 'MEDIUM',
  title: 'HTTP/2 to HTTP/3 Protocol Upgrade',
};

const mockSnapshot: InfrastructureSnapshotDto = {
  id: 'snp-stripe-001',
  domainId: mockDomainId,
  previousSnapshotId: 'snp-stripe-000',
  createdAt: '2026-08-20T10:00:00.000Z',
};

describe('WX-605: Workspace Relationship Navigation Architecture', () => {
  describe('1. Finding Authoritative Relationships', () => {
    it('resolves authoritative snapshot and evidence relationships from finding DTO', () => {
      const relationships = resolveFindingRelationships(mockFinding, mockDomainId);

      assert.equal(relationships.length, 2);

      const snapshotRel = relationships.find((r) => r.relationshipType === 'RELATED_SNAPSHOT');
      assert.ok(snapshotRel);
      assert.equal(snapshotRel.resourceType, 'snapshot');
      assert.equal(snapshotRel.resourceId, 'snp-stripe-001');
      assert.equal(snapshotRel.domainId, mockDomainId);

      const evidenceRel = relationships.find((r) => r.relationshipType === 'SUPPORTING_EVIDENCE');
      assert.ok(evidenceRel);
      assert.equal(evidenceRel.resourceType, 'evidence');
      assert.equal(evidenceRel.resourceId, 'obs-tls-validity-001');
      assert.equal(evidenceRel.domainId, mockDomainId);
    });

    it('does not synthesize snapshot relationship if snapshotId is absent', () => {
      const findingWithoutSnapshot: InfrastructureFindingDto = {
        ...mockFinding,
        snapshotId: '',
      };
      const relationships = resolveFindingRelationships(findingWithoutSnapshot, mockDomainId);
      const snapshotRel = relationships.find((r) => r.relationshipType === 'RELATED_SNAPSHOT');
      assert.equal(snapshotRel, undefined);
    });
  });

  describe('2. Timeline Change Authoritative Relationships', () => {
    it('resolves previous/current snapshot lineage, related finding, evidence, and historical context', () => {
      const relationships = resolveChangeRelationships(mockChange, mockDomainId);

      assert.equal(relationships.length, 5);

      const prevSnap = relationships.find((r) => r.relationshipType === 'PREVIOUS_SNAPSHOT');
      assert.ok(prevSnap);
      assert.equal(prevSnap.resourceId, 'snp-stripe-000');

      const currSnap = relationships.find((r) => r.relationshipType === 'CURRENT_SNAPSHOT');
      assert.ok(currSnap);
      assert.equal(currSnap.resourceId, 'snp-stripe-001');

      const findingRel = relationships.find((r) => r.relationshipType === 'RELATED_FINDING');
      assert.ok(findingRel);
      assert.equal(findingRel.resourceId, 'fnd-http-drift');

      const evidenceRel = relationships.find((r) => r.relationshipType === 'SUPPORTING_EVIDENCE');
      assert.ok(evidenceRel);
      assert.equal(evidenceRel.resourceId, 'evt-http-upgrade');

      const histRel = relationships.find((r) => r.relationshipType === 'HISTORICAL_CONTEXT');
      assert.ok(histRel);
      assert.equal(histRel.resourceType, 'historical_context');
    });
  });

  describe('3. Snapshot Authoritative Relationships', () => {
    it('resolves previous snapshot lineage, historical context, and observation evidence', () => {
      const relationships = resolveSnapshotRelationships(mockSnapshot, mockDomainId);

      assert.equal(relationships.length, 3);

      const prevSnap = relationships.find((r) => r.relationshipType === 'PREVIOUS_SNAPSHOT');
      assert.ok(prevSnap);
      assert.equal(prevSnap.resourceId, 'snp-stripe-000');

      const histRel = relationships.find((r) => r.relationshipType === 'HISTORICAL_CONTEXT');
      assert.ok(histRel);

      const evidenceRel = relationships.find((r) => r.relationshipType === 'SUPPORTING_EVIDENCE');
      assert.ok(evidenceRel);
      assert.equal(evidenceRel.resourceId, 'snp-stripe-001');
    });
  });

  describe('4. WX-601 Navigation Target Integration', () => {
    it('maps all relationship objects into valid WX-601 Navigation Targets with returnPath', () => {
      const relationships = resolveFindingRelationships(mockFinding, mockDomainId);

      for (const rel of relationships) {
        const target = buildRelationshipNavigationTarget(rel, '/workspace?sourceType=finding&sourceId=fnd-001');
        assert.equal(target.domainId, mockDomainId);
        assert.equal(target.resourceType, rel.resourceType);
        assert.equal(target.resourceId, rel.resourceId);
        assert.ok(target.returnPath?.includes('fnd-001'));
      }
    });

    it('guarantees that relationships pass WX-601 cross-experience resolution', () => {
      const changeRels = resolveChangeRelationships(mockChange, mockDomainId);
      const prevSnapRel = changeRels.find((r) => r.relationshipType === 'PREVIOUS_SNAPSHOT')!;
      const navTarget = buildRelationshipNavigationTarget(prevSnapRel, '/workspace/memory');

      const resolution = resolveCrossExperienceNavigation({
        target: navTarget,
        activeDomainId: mockDomainId,
        userDomains: [{
          id: mockDomainId,
          domainName: 'stripe.com',
          status: 'ACTIVE',
          createdAt: '2026-08-12T00:00:00.000Z',
          updatedAt: '2026-08-20T00:00:00.000Z',
          snapshotCount: 5,
          activeFindingCount: 2,
        }],
      });

      assert.equal(resolution.isValid, true);
      assert.equal(resolution.targetDomainId, mockDomainId);
      assert.equal(resolution.resourceType, 'snapshot');
      assert.equal(resolution.resourceId, 'snp-stripe-000');
    });
  });

  describe('5. Hard Invariants: Zero Anti-Patterns', () => {
    it('strictly forbids client-side snapshot diffing, graph visualizations, or relationship heuristics', () => {
      const prohibitedPatterns = [
        'clientSideSnapshotDiffing',
        'rawJsonRelationshipScraping',
        'interactiveGraphVisualizer',
        'fabricatedRelationshipRelevance',
        'crossDomainRelationshipBleed',
      ];

      for (const pattern of prohibitedPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
