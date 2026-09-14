import { InfrastructureOverviewMapper } from './infrastructure-overview.mapper';
import { InfrastructureSnapshot } from '@prisma/client';
import { TopologyLayer } from '../../../infrastructure/discovery/technology/contracts';

describe('InfrastructureOverviewMapper (TECH-008)', () => {
  describe('1. Complete Production Stack Mapping', () => {
    it('accurately maps full technology architecture overview from discovery payload', () => {
      const mockSnapshot: InfrastructureSnapshot = {
        id: 'snp-prod-001',
        domainId: 'dom-prod-001',
        jobId: 'job-001',
        responseTimeMs: 35,
        httpStatus: 200,
        createdAt: new Date('2026-08-27T10:00:00Z'),
        payload: {
          dns: {
            a: ['104.21.1.1'],
            aaaa: ['2606:4700::1'],
            ns: ['ns1.cloudflare.com'],
          },
          http: {
            statusCode: 200,
            headers: {
              server: 'cloudflare',
              'cf-ray': '89a123-iad',
              'x-powered-by': 'Next.js',
            },
          },
          ssl: { authorized: true, certificate: { validTo: '2027-01-01' } },
          technology: {
            technologies: [
              {
                id: 'tech-cloudflare',
                name: 'Cloudflare',
                category: 'CDN / Edge',
                role: 'Edge CDN',
                infrastructureMeaning: 'Edge proxy network',
                whyDetected: 'Observed cf-ray',
                whatThisDoesNotProve: 'Does not prove origin cloud provider',
                confidence: 0.99,
                confidenceLevel: 'HIGH',
                evidence: [
                  { indicator: 'cf-ray', evidenceType: 'HTTP_HEADER' },
                ],
              },
              {
                id: 'tech-nextjs',
                name: 'Next.js',
                category: 'Frameworks',
                version: '14.2.0',
                role: 'Application Framework',
                infrastructureMeaning: 'SSR Web Application',
                whyDetected: 'Observed Next.js headers',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                evidence: [
                  { indicator: 'x-powered-by', evidenceType: 'HTTP_HEADER' },
                ],
              },
              {
                id: 'tech-sentry',
                name: 'Sentry',
                category: 'Analytics',
                role: 'Application Observability',
                infrastructureMeaning: 'Error APM Telemetry',
                whyDetected: 'Observed Sentry trace',
                confidence: 0.92,
                confidenceLevel: 'HIGH',
                evidence: [
                  { indicator: 'sentry-trace', evidenceType: 'HTTP_HEADER' },
                ],
              },
            ],
            architectureBrief: {
              summary:
                'The public endpoint appears to be delivered through Cloudflare edge infrastructure before requests reach Next.js.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                  role: 'Ingress',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'tech-cloudflare',
                  technologyName: 'Cloudflare',
                  role: 'Edge CDN',
                  relationshipType: 'FORWARDS_TO',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.APPLICATION,
                  technologyId: 'tech-nextjs',
                  technologyName: 'Next.js',
                  role: 'Application Framework',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-cloudflare',
                      name: 'Cloudflare',
                      category: 'CDN / Edge',
                      layer: TopologyLayer.EDGE,
                      role: 'Edge CDN',
                      infrastructureMeaning: 'Edge proxy',
                      whyDetected: 'Observed cf-ray',
                      confidence: 0.99,
                      confidenceLevel: 'HIGH',
                      evidence: [],
                    },
                  ],
                },
                {
                  layer: TopologyLayer.GATEWAY,
                  state: 'UNOBSERVED',
                  confidenceLevel: 'LOW',
                  technologies: [],
                },
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-nextjs',
                      name: 'Next.js',
                      category: 'Frameworks',
                      version: '14.2.0',
                      layer: TopologyLayer.APPLICATION,
                      role: 'App Framework',
                      infrastructureMeaning: 'SSR App',
                      whyDetected: 'Observed Next.js headers',
                      confidence: 0.95,
                      confidenceLevel: 'HIGH',
                      evidence: [],
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-cloudflare',
                  name: 'Cloudflare',
                  category: 'CDN / Edge',
                  layer: TopologyLayer.EDGE,
                  role: 'Edge CDN',
                  infrastructureMeaning: 'Edge proxy',
                  whyDetected: 'Observed cf-ray',
                  confidence: 0.99,
                  confidenceLevel: 'HIGH',
                  evidence: [],
                },
                {
                  technologyId: 'tech-nextjs',
                  name: 'Next.js',
                  category: 'Frameworks',
                  version: '14.2.0',
                  layer: TopologyLayer.APPLICATION,
                  role: 'App Framework',
                  infrastructureMeaning: 'SSR App',
                  whyDetected: 'Observed Next.js headers',
                  confidence: 0.95,
                  confidenceLevel: 'HIGH',
                  evidence: [],
                },
              ],
              integrations: [
                {
                  technologyId: 'tech-sentry',
                  name: 'Sentry',
                  category: 'Analytics',
                  layer: TopologyLayer.INTEGRATION,
                  role: 'Application Observability',
                  infrastructureMeaning: 'Error APM',
                  whyDetected: 'Observed sentry trace',
                  confidence: 0.92,
                  confidenceLevel: 'HIGH',
                  evidence: [],
                },
              ],
              knownUnknowns: [
                {
                  dimension: 'Origin Cloud Provider',
                  status: 'MASKED',
                  explanation: 'Masked behind Cloudflare edge',
                  whyUnknown: 'Anycast proxy terminates public connections',
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-cloudflare',
                  technologyName: 'Cloudflare',
                  boundary:
                    'Cloudflare edge presence does not confirm origin hosting provider',
                },
              ],
              confidence: {
                overallLevel: 'HIGH',
                overallScore: 0.95,
                layerConfidence: { EDGE: 'HIGH', APPLICATION: 'HIGH' },
                rationale: 'Authoritative HTTP and DNS signals',
                confirmedRelationshipsCount: 1,
                supportedRelationshipsCount: 1,
                inferredRelationshipsCount: 0,
              },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);

      expect(overview.technologyArchitecture).toBeDefined();
      const arch = overview.technologyArchitecture!;

      // 1. Architecture Summary
      expect(arch.architectureSummary).toBe(
        'The public endpoint appears to be delivered through Cloudflare edge infrastructure before requests reach Next.js.',
      );

      // 2. Ingress Path
      expect(arch.ingressPath).toHaveLength(3);
      expect(arch.ingressPath[1].technologyName).toBe('Cloudflare');
      expect(arch.ingressPath[1].relationshipType).toBe('FORWARDS_TO');
      expect(arch.ingressPath[2].technologyName).toBe('Next.js');

      // 3. Layers Breakdown
      expect(arch.layers).toHaveLength(3);
      const edgeLayer = arch.layers.find((l) => l.layer === TopologyLayer.EDGE);
      expect(edgeLayer?.state).toBe('OBSERVED');
      const gatewayLayer = arch.layers.find(
        (l) => l.layer === TopologyLayer.GATEWAY,
      );
      expect(gatewayLayer?.state).toBe('UNOBSERVED');

      // 4. Integrations Segregation
      expect(arch.integrations).toHaveLength(1);
      expect(arch.integrations[0].name).toBe('Sentry');
      expect(arch.integrations[0].role).toBe('Application Observability');

      // 5. Known Unknowns
      expect(arch.knownUnknowns).toHaveLength(1);
      expect(arch.knownUnknowns[0].dimension).toBe('Origin Cloud Provider');
      expect(arch.knownUnknowns[0].status).toBe('MASKED');

      // 6. Claim Boundaries
      expect(arch.claimBoundaries).toHaveLength(1);
      expect(arch.claimBoundaries[0].boundary).toContain(
        'does not confirm origin hosting provider',
      );

      // 7. Confidence
      expect(arch.confidence.overallLevel).toBe('HIGH');
      expect(arch.confidence.overallScore).toBe(0.95);
    });
  });

  describe('2. Sparse Stack Mapping', () => {
    it('maps minimal single-gateway stack without hallucinating downstream components', () => {
      const mockSnapshot: InfrastructureSnapshot = {
        id: 'snp-sparse-001',
        domainId: 'dom-sparse-001',
        jobId: 'job-002',
        responseTimeMs: 15,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          http: { headers: { server: 'Caddy' } },
          technology: {
            technologies: [{ id: 'tech-caddy', name: 'Caddy' }],
            architectureBrief: {
              summary: 'Routed through Caddy as a web gateway.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                  role: 'Ingress',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-caddy',
                  technologyName: 'Caddy',
                  role: 'Web Gateway',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.GATEWAY,
                  state: 'OBSERVED',
                  confidenceLevel: 'MEDIUM',
                  technologies: [{ name: 'Caddy' }],
                },
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'UNOBSERVED',
                  confidenceLevel: 'LOW',
                  technologies: [],
                },
              ],
              keyTechnologies: [{ name: 'Caddy' }],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [],
              confidence: { overallLevel: 'MEDIUM', overallScore: 0.7 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);
      const arch = overview.technologyArchitecture!;

      expect(arch.ingressPath).toHaveLength(2);
      expect(arch.ingressPath[1].technologyName).toBe('Caddy');
      expect(arch.integrations).toHaveLength(0);

      // Verify no synthetic hallucinations
      const appLayer = arch.layers.find(
        (l) => l.layer === TopologyLayer.APPLICATION,
      );
      expect(appLayer?.state).toBe('UNOBSERVED');
    });
  });

  describe('3. Null Snapshot Handling', () => {
    it('returns empty overview with technologyArchitecture as null', () => {
      const overview = InfrastructureOverviewMapper.fromSnapshot(null);
      expect(overview.technologyArchitecture).toBeNull();
      expect(overview.technologies).toHaveLength(0);
      expect(overview.webServer).toBeNull();
    });
  });
});
