import { TechnologyChangeAnalyzerService } from './technology-change-analyzer.service';
import {
  TechnologyChangeClassification,
  TechnologyChangeImpact,
} from '../contracts/technology-change.interface';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TechnologyCategory,
  TopologyLayer,
  TechnologyRelationshipType,
} from '../../../infrastructure/discovery/technology/contracts';
import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';

describe('TechnologyChangeAnalyzerService (TECH-006)', () => {
  let analyzer: TechnologyChangeAnalyzerService;

  beforeEach(() => {
    analyzer = new TechnologyChangeAnalyzerService();
  });

  describe('1. Fast-Path Optimization using Fingerprints', () => {
    it('returns empty differences immediately when overall fingerprints match', () => {
      const prev: DiscoverySnapshot = {
        fingerprints: {
          overallFingerprint: 'abc123exacthash',
        },
      };

      const curr: DiscoverySnapshot = {
        fingerprints: {
          overallFingerprint: 'abc123exacthash',
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      expect(diffs).toHaveLength(0);
    });
  });

  describe('2. Technology Lifecycle (Added, Removed, Version Changed)', () => {
    it('detects added technologies with their roles', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
          ],
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
            {
              id: 'tech-nextjs',
              name: 'Next.js',
              category: TechnologyCategory.FRAMEWORK,
              role: 'Application Framework',
            } as any,
          ],
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      const added = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.TECHNOLOGY_ADDED,
      );

      expect(added).toBeDefined();
      expect(added?.technologyName).toBe('Next.js');
      expect(added?.changeType).toBe(ChangeType.ADDED);
      expect(added?.severity).toBe(ChangeSeverity.LOW);
      expect(added?.module).toBe(FindingModule.TECHNOLOGY);
      expect(added?.category).toBe(FindingCategory.TECHNOLOGY);
      expect(added?.title).toBe('Technology added: Next.js');
      expect(added?.description).toContain('Next.js (Application Framework)');
    });

    it('detects removed technologies with conservative anti-overreach wording ("no longer observed")', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
            {
              id: 'tech-sentry',
              name: 'Sentry',
              category: TechnologyCategory.ANALYTICS,
              role: 'Application Observability',
            } as any,
          ],
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-cloudflare',
              name: 'Cloudflare',
              category: TechnologyCategory.CDN_EDGE,
              role: 'Edge CDN',
            } as any,
          ],
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      const removed = diffs.find(
        (d) =>
          d.classification ===
          TechnologyChangeClassification.TECHNOLOGY_REMOVED,
      );

      expect(removed).toBeDefined();
      expect(removed?.technologyName).toBe('Sentry');
      expect(removed?.changeType).toBe(ChangeType.REMOVED);
      expect(removed?.title).toBe('Technology no longer observed: Sentry');
      expect(removed?.description).toBe(
        'Technology Sentry is no longer observable from the current public telemetry.',
      );
      // Hard anti-overreach check: must not say "was removed/uninstalled"
      expect(removed?.description).not.toContain('uninstalled');
      expect(removed?.description).not.toContain(
        'was removed from infrastructure',
      );
    });

    it('detects evidence-backed version changes without guessing unevidenced upgrades', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              version: '1.24.0',
              category: TechnologyCategory.WEB_SERVERS,
            } as any,
          ],
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              version: '1.26.1',
              category: TechnologyCategory.WEB_SERVERS,
            } as any,
          ],
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      const versionChange = diffs.find(
        (d) =>
          d.classification ===
          TechnologyChangeClassification.TECHNOLOGY_CHANGED,
      );

      expect(versionChange).toBeDefined();
      expect(versionChange?.title).toBe('Technology version changed: NGINX');
      expect(versionChange?.description).toBe(
        "NGINX version changed from '1.24.0' to '1.26.1'.",
      );
      expect(versionChange?.changeType).toBe(ChangeType.MODIFIED);
    });
  });

  describe('3. Architecture Drift & Ingress Path Changes', () => {
    it('detects Gateway Migration (e.g. NGINX -> Caddy)', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          technologies: [
            { id: 'tech-cloudflare', name: 'Cloudflare' } as any,
            { id: 'tech-nginx', name: 'NGINX' } as any,
            { id: 'tech-nextjs', name: 'Next.js' } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.EDGE,
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
              },
              {
                hop: 1,
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
              },
              {
                hop: 2,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
              {
                hop: 3,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-nextjs',
                technologyName: 'Next.js',
              },
            ],
          } as any,
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          technologies: [
            { id: 'tech-cloudflare', name: 'Cloudflare' } as any,
            { id: 'tech-caddy', name: 'Caddy' } as any,
            { id: 'tech-nextjs', name: 'Next.js' } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.EDGE,
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
              },
              {
                hop: 1,
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
              },
              {
                hop: 2,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-caddy',
                technologyName: 'Caddy',
              },
              {
                hop: 3,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-nextjs',
                technologyName: 'Next.js',
              },
            ],
          } as any,
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      const gatewayMigration = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.GATEWAY_MIGRATED,
      );

      expect(gatewayMigration).toBeDefined();
      expect(gatewayMigration?.title).toBe('Gateway architecture changed');
      expect(gatewayMigration?.description).toBe(
        'Web gateway migrated from NGINX to Caddy.',
      );
      expect(gatewayMigration?.severity).toBe(ChangeSeverity.MEDIUM);
      expect(gatewayMigration?.impact).toBe(
        TechnologyChangeImpact.ARCHITECTURAL,
      );
    });

    it('detects Edge/CDN Layer Drift (Edge layer no longer observed)', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          technologies: [
            { id: 'tech-cloudflare', name: 'Cloudflare' } as any,
            { id: 'tech-nginx', name: 'NGINX' } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.EDGE,
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
              },
              {
                hop: 1,
                layer: TopologyLayer.EDGE,
                technologyId: 'tech-cloudflare',
                technologyName: 'Cloudflare',
              },
              {
                hop: 2,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
            ],
          } as any,
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          technologies: [{ id: 'tech-nginx', name: 'NGINX' } as any],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
              },
              {
                hop: 1,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
            ],
          } as any,
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      const edgeDrift = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.EDGE_LAYER_DRIFT,
      );

      expect(edgeDrift).toBeDefined();
      expect(edgeDrift?.title).toBe('Edge layer no longer observed');
      expect(edgeDrift?.description).toBe(
        'Cloudflare is no longer observable in the current public request path.',
      );
      // Hard anti-overreach rule: must not claim "intentionally bypassed"
      expect(edgeDrift?.description).not.toContain('bypassed');
    });
  });

  describe('4. External Integrations Changes', () => {
    it('detects added payment and APM integrations', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          technologies: [{ id: 'tech-nextjs', name: 'Next.js' } as any],
          architectureBrief: {
            integrations: [],
          } as any,
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          technologies: [
            { id: 'tech-nextjs', name: 'Next.js' } as any,
            { id: 'tech-stripe', name: 'Stripe' } as any,
          ],
          architectureBrief: {
            integrations: [
              {
                technologyId: 'tech-stripe',
                name: 'Stripe',
                role: 'Payment Processing',
              },
            ],
          } as any,
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      const integrationAdded = diffs.find(
        (d) =>
          d.classification === TechnologyChangeClassification.INTEGRATION_ADDED,
      );

      expect(integrationAdded).toBeDefined();
      expect(integrationAdded?.technologyName).toBe('Stripe');
      expect(integrationAdded?.title).toBe('Integration added: Stripe');
      expect(integrationAdded?.description).toContain(
        'Stripe (Payment Processing)',
      );
      expect(integrationAdded?.impact).toBe(TechnologyChangeImpact.INTEGRATION);
    });
  });

  describe('5. Uncertainty & Unknown-State Transitions', () => {
    it('detects when an unknown or masked dimension becomes observed infrastructure', () => {
      const prev: DiscoverySnapshot = {
        technology: {
          architectureBrief: {
            knownUnknowns: [
              {
                dimension: 'Origin Cloud Provider',
                status: 'MASKED',
                explanation: 'Masked behind edge proxy',
              },
            ],
          } as any,
        },
      };

      const curr: DiscoverySnapshot = {
        technology: {
          architectureBrief: {
            knownUnknowns: [
              {
                dimension: 'Origin Cloud Provider',
                status: 'OBSERVED',
                explanation: 'Observed AWS infrastructure headers',
              },
            ],
          } as any,
        },
      };

      const diffs = analyzer.analyzeDifferences(prev, curr);
      const unknownTransition = diffs.find(
        (d) =>
          d.classification ===
          TechnologyChangeClassification.MASKED_BECAME_OBSERVED,
      );

      expect(unknownTransition).toBeDefined();
      expect(unknownTransition?.title).toBe(
        'Origin Cloud Provider now observable',
      );
      expect(unknownTransition?.description).toContain(
        'transitioned from MASKED to observable infrastructure',
      );
    });
  });
});
