import { UnifiedInfrastructureNarrativeEngine } from './services/unified-infrastructure-narrative.engine';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TopologyLayer,
  TechnologyConfidenceLevel,
} from '../../infrastructure/discovery/technology/contracts';
import { ForensicChangeEvent } from './contracts/temporal-delta.interface';
import { FindingDto } from '../infrastructure-findings/dto/finding.dto';

describe('H5: Unified Infrastructure Narrative Engine', () => {
  let engine: UnifiedInfrastructureNarrativeEngine;

  beforeEach(() => {
    engine = new UnifiedInfrastructureNarrativeEngine();
  });

  // ---------------------------------------------------------------------------
  // 1. T1-T30 Multi-Tier Architecture Synthesis
  // ---------------------------------------------------------------------------
  describe('1. T1-T30 Multi-Tier Architecture Synthesis', () => {
    it('synthesizes multi-tier ingress architecture from Cloudflare, NGINX, and Go', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
              layer: TopologyLayer.EDGE,
              confidence: 'HIGH',
              evidence: [
                { source: 'HTTP Header', pattern: 'server: cloudflare' },
              ],
            },
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              layer: TopologyLayer.GATEWAY,
              confidence: 'HIGH',
              evidence: [{ source: 'HTTP Header', pattern: 'server: nginx' }],
            },
            {
              id: 'tech-go',
              name: 'Go',
              category: 'Programming Languages',
              layer: TopologyLayer.RUNTIME,
              confidence: 'HIGH',
              evidence: [
                { source: 'HTTP Header', pattern: 'x-powered-by: Go' },
              ],
            },
          ],
        } as any,
        dns: { a: ['104.21.55.10', '172.67.180.20'] } as any,
        ssl: {
          valid: true,
          protocol: 'TLS 1.3',
          issuer: 'Cloudflare Inc',
        } as any,
      };

      const narrative = engine.synthesizeNarrative({
        domainName: 'enterprise-app.io',
        currentSnapshot: snapshot,
      });

      expect(narrative.architecture.headline).toBe(
        'Multi-Tier Ingress Architecture',
      );
      expect(narrative.architecture.narrative).toBe(
        'The domain is served through a Cloudflare edge, followed by an NGINX gateway and a Go application runtime.',
      );
      expect(narrative.architecture.observedLayers).toHaveLength(3);
      expect(narrative.architecture.observedLayers[0].layer).toBe('EDGE');
      expect(narrative.architecture.observedLayers[1].layer).toBe('GATEWAY');
      expect(narrative.architecture.observedLayers[2].layer).toBe('RUNTIME');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. H1 Topology & Missing Gateway Explanation
  // ---------------------------------------------------------------------------
  describe('2. H1 Ingress Journey & Missing Hop Explanation', () => {
    it('explains missing intermediate gateway honestly without inventing layers', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
              layer: TopologyLayer.EDGE,
              confidence: 'HIGH',
            },
            {
              id: 'tech-go',
              name: 'Go',
              category: 'Programming Languages',
              layer: TopologyLayer.RUNTIME,
              confidence: 'HIGH',
            },
          ],
        } as any,
        dns: { a: ['104.21.55.10'] } as any,
      };

      const narrative = engine.synthesizeNarrative({
        domainName: 'direct-edge-origin.com',
        currentSnapshot: snapshot,
      });

      expect(narrative.architecture.headline).toBe(
        'Buffered Ingress Architecture',
      );
      expect(narrative.requestJourney.missingHopsExplanation).toBe(
        'The observed evidence does not establish an intermediate gateway between the edge and application runtime.',
      );
      expect(
        narrative.requestJourney.hops.some((h) => h.layer === 'GATEWAY'),
      ).toBe(false);
      expect(
        narrative.requestJourney.hops.some((h) => h.layer === 'SEALED'),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. H2 Behavioral Evidence Integration
  // ---------------------------------------------------------------------------
  describe('3. H2 Deep Wire & Behavioral Evidence Integration', () => {
    it('integrates wire behavioral signatures into narrative lineage', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              layer: TopologyLayer.GATEWAY,
              confidence: 'MEDIUM',
            },
          ],
        } as any,
      };

      const behavioralSignals = [
        {
          signatureId: 'sig-nginx-404-framing',
          signatureName: 'NGINX HTML Error Page Framing',
          layer: 'GATEWAY',
          explanation: 'HTML 404 contains exact NGINX center-aligned styling',
        },
      ];

      const narrative = engine.synthesizeNarrative({
        domainName: 'behavioral-test.io',
        currentSnapshot: snapshot,
        behavioralSignals,
      });

      const behaviorEvidence = narrative.evidenceLineage.items.find(
        (i) => i.source === 'Wire Behavior',
      );
      expect(behaviorEvidence).toBeDefined();
      expect(behaviorEvidence?.claim).toContain(
        'NGINX HTML Error Page Framing',
      );
      expect(behaviorEvidence?.confidence).toBe('MEDIUM');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. H3 Change Forensics & H4 Posture Correlation
  // ---------------------------------------------------------------------------
  describe('4. H3 Change Forensics & H4 Posture Correlation', () => {
    it('generates evolution narrative without security regression on benign gateway migration', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-envoy',
              name: 'Envoy',
              category: 'Web / Server',
              layer: TopologyLayer.GATEWAY,
              confidence: 'HIGH',
            },
          ],
        } as any,
      };

      const changes: ForensicChangeEvent[] = [
        {
          id: 'chg-gateway-migration',
          domainId: 'dom-1',
          currentSnapshotId: 'snap-2',
          previousSnapshotId: 'snap-1',
          title: 'Gateway migrated from NGINX to Envoy',
          summary: 'Reverse proxy changed to Envoy',
          state: 'MODIFIED',
          significance: 'IMPORTANT',
          category: 'technology',
          module: 'HTTP',
          findingCategory: 'ARCHITECTURE' as any,
          changeType: 'MODIFIED',
        },
      ];

      const narrative = engine.synthesizeNarrative({
        domainName: 'migrated-arch.io',
        currentSnapshot: snapshot,
        changes,
      });

      expect(narrative.evolution.hasChanges).toBe(true);
      expect(narrative.evolution.evolutionNarrative).toContain(
        'Gateway migrated from NGINX to Envoy. This change represents an architectural evolution in the observed gateway layer. No security regression was identified.',
      );
    });

    it('correlates gateway migration with HSTS removal when security regression coincides', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-envoy',
              name: 'Envoy',
              category: 'Web / Server',
              layer: TopologyLayer.GATEWAY,
              confidence: 'HIGH',
            },
          ],
        } as any,
      };

      const changes: ForensicChangeEvent[] = [
        {
          id: 'chg-gateway-migration',
          domainId: 'dom-1',
          currentSnapshotId: 'snap-2',
          previousSnapshotId: 'snap-1',
          title: 'Gateway migrated from NGINX to Envoy',
          summary: 'Reverse proxy changed to Envoy',
          state: 'MODIFIED',
          significance: 'IMPORTANT',
          category: 'technology',
          module: 'HTTP',
          findingCategory: 'ARCHITECTURE' as any,
          changeType: 'MODIFIED',
        },
        {
          id: 'chg-hsts-removed',
          domainId: 'dom-1',
          currentSnapshotId: 'snap-2',
          previousSnapshotId: 'snap-1',
          title: 'HSTS protection was removed',
          summary:
            'Strict-Transport-Security header is absent in current snapshot',
          state: 'REMOVED',
          significance: 'CRITICAL',
          category: 'security_headers',
          module: 'HTTP',
          findingCategory: 'SECURITY' as any,
          changeType: 'REMOVED',
        },
      ];

      const narrative = engine.synthesizeNarrative({
        domainName: 'regressed-arch.io',
        currentSnapshot: snapshot,
        changes,
      });

      expect(narrative.evolution.evolutionNarrative).toContain(
        'The gateway migration coincided with removal of HSTS protection. This change requires attention.',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. WX-211 Finding Lifecycle & Current Truth
  // ---------------------------------------------------------------------------
  describe('5. WX-211 Finding Lifecycle & Current Truth', () => {
    it('narrates active security finding with ATTENTION status', () => {
      const activeFindings: FindingDto[] = [
        {
          id: 'find-hsts-missing',
          title: 'Missing HSTS Security Header',
          description: 'HSTS protection is absent from response',
          severity: 'HIGH',
          module: 'HTTP',
          category: 'SECURITY',
          status: 'ACTIVE',
        } as any,
      ];

      const narrative = engine.synthesizeNarrative({
        domainName: 'unprotected.com',
        currentSnapshot: {},
        activeFindings,
      });

      expect(narrative.currentTruth.lifecycleState).toBe('ACTIVE');
      expect(narrative.currentTruth.headline).toBe('HSTS Protection Removed');
      expect(narrative.currentTruth.narrative).toBe(
        'One active infrastructure issue currently requires attention: HSTS protection is absent.',
      );
    });

    it('narrates resolved finding with RESOLVED status without fear-based UI', () => {
      const resolvedFindings: FindingDto[] = [
        {
          id: 'find-hsts-restored',
          title: 'HSTS Protection Restored',
          description: 'Strict-Transport-Security verified active',
          severity: 'HIGH',
          module: 'HTTP',
          category: 'SECURITY',
          status: 'RESOLVED',
        } as any,
      ];

      const narrative = engine.synthesizeNarrative({
        domainName: 'restored.com',
        currentSnapshot: {},
        activeFindings: [],
        resolvedFindings,
      });

      expect(narrative.currentTruth.lifecycleState).toBe('RESOLVED');
      expect(narrative.currentTruth.headline).toBe('HSTS Protection Restored');
      expect(narrative.currentTruth.narrative).toBe(
        'HSTS protection was restored in the latest verified snapshot.',
      );
    });

    it('narrates calm STABLE state when clean', () => {
      const narrative = engine.synthesizeNarrative({
        domainName: 'clean-production.com',
        currentSnapshot: {},
        activeFindings: [],
        resolvedFindings: [],
      });

      expect(narrative.currentTruth.lifecycleState).toBe('STABLE');
      expect(narrative.currentTruth.headline).toBe('Architecture Stable');
      expect(narrative.currentTruth.narrative).toBe(
        'Architecture Stable. No active infrastructure issues currently require attention.',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Known Unknowns & Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('6. Known Unknowns & Anti-Overreach Guarantees', () => {
    it('explicitly separates observed ingress from unobserved database & cluster boundaries', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-go',
              name: 'Go',
              category: 'Programming Languages',
              layer: TopologyLayer.RUNTIME,
              confidence: 'HIGH',
            },
          ],
        } as any,
      };

      const narrative = engine.synthesizeNarrative({
        domainName: 'go-api.io',
        currentSnapshot: snapshot,
      });

      // Anti-overreach: Ensure Go doesn't invent PostgreSQL or Kubernetes
      expect(narrative.architecture.narrative).not.toContain('PostgreSQL');
      expect(narrative.architecture.narrative).not.toContain('Kubernetes');
      expect(narrative.architecture.narrative).not.toContain('Linux');

      // Known unknowns preserved
      expect(
        narrative.knownUnknowns.explicitStatements.some((s) =>
          s.includes(
            'backend database and orchestration layer are not observable',
          ),
        ),
      ).toBe(true);
      expect(narrative.knownUnknowns.integrityNote).toContain(
        'Unobserved layers do not constitute security risks',
      );
      expect(narrative.antiOverreachCertified).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Progressive Disclosure & Executive Brief
  // ---------------------------------------------------------------------------
  describe('7. Progressive Disclosure & Executive Brief', () => {
    it('synthesizes multi-level progressive disclosure and cohesive executive brief', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
              layer: TopologyLayer.EDGE,
              confidence: 'HIGH',
              evidence: [
                { source: 'HTTP Header', pattern: 'server: cloudflare' },
              ],
            },
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              layer: TopologyLayer.GATEWAY,
              confidence: 'HIGH',
              evidence: [{ source: 'HTTP Header', pattern: 'server: nginx' }],
            },
          ],
        } as any,
        ssl: {
          valid: true,
          protocol: 'TLS 1.3',
          issuer: 'Let’s Encrypt',
        } as any,
        dns: { a: ['104.21.1.1', '104.21.1.2'] } as any,
      };

      const narrative = engine.synthesizeNarrative({
        domainName: 'executive-summary.io',
        currentSnapshot: snapshot,
      });

      // Level 1: Understanding
      expect(narrative.progressiveDisclosure.level1Understanding.headline).toBe(
        'Buffered Ingress Architecture',
      );
      expect(
        narrative.progressiveDisclosure.level1Understanding.pathSummary,
      ).toContain('Client Ingress');

      // Level 2: Context
      expect(
        narrative.progressiveDisclosure.level2Context.architectureMeaning,
      ).toContain('2 independently observable tier(s)');
      expect(
        narrative.progressiveDisclosure.level2Context.unobservedDimensions
          .length,
      ).toBeGreaterThan(0);

      // Level 3: Evidence
      expect(
        narrative.progressiveDisclosure.level3Evidence.evidenceLineage.length,
      ).toBeGreaterThanOrEqual(3);

      // Executive Brief
      expect(narrative.executiveBrief).toContain(
        'Cloudflare at the edge boundary',
      );
      expect(narrative.executiveBrief).toContain(
        'NGINX at the gateway boundary',
      );
      expect(narrative.executiveBrief).toContain(
        'internal database, orchestration, and origin infrastructure remain unobservable',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Determinism Requirement
  // ---------------------------------------------------------------------------
  describe('8. Determinism Requirement', () => {
    it('produces identical deterministic narrative outputs given identical snapshot inputs', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: 'CDN / Edge',
              layer: TopologyLayer.EDGE,
              confidence: 'HIGH',
            },
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              layer: TopologyLayer.GATEWAY,
              confidence: 'HIGH',
            },
          ],
        } as any,
      };

      const run1 = engine.synthesizeNarrative({
        domainName: 'determinist-test.io',
        currentSnapshot: snapshot,
        timestamp: '2026-08-29T16:00:00.000Z',
      });

      const run2 = engine.synthesizeNarrative({
        domainName: 'determinist-test.io',
        currentSnapshot: snapshot,
        timestamp: '2026-08-29T16:00:00.000Z',
      });

      expect(run1).toEqual(run2);
    });
  });
});
