import { InfrastructureBriefBuilder } from './infrastructure-brief.builder';
import { SnapshotDetailDto } from '../../infrastructure-snapshots/dto/snapshot-detail.dto';
import { FindingDto } from '../../infrastructure-findings/dto/finding.dto';
import { TopologyLayer } from '../../../infrastructure/discovery/technology/contracts';

describe('InfrastructureBriefBuilder (TECH-009)', () => {
  let builder: InfrastructureBriefBuilder;

  beforeEach(() => {
    builder = new InfrastructureBriefBuilder();
  });

  describe('1. Scenario A — Complete SaaS Architecture Convergence', () => {
    it('synthesizes executive summary, highlights, and architecture contract for full stack', () => {
      const mockSnapshot: SnapshotDetailDto = {
        id: 'snp-brief-001',
        domainId: 'dom-brief-001',
        domainName: 'unicorn-app.com',
        createdAt: new Date('2026-08-27T10:00:00Z'),
        responseTimeMs: 30,
        httpStatus: 200,
        payload: {
          http: { reachable: true, protocol: 'https' },
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to be delivered through Cloudflare edge infrastructure before reaching an NGINX gateway and Next.js application. Docker is observed as the runtime environment, while Sentry and Stripe provide application observability and payment integration respectively.',
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
                {
                  hop: 4,
                  layer: TopologyLayer.RUNTIME,
                  technologyId: 'tech-docker',
                  technologyName: 'Docker',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.EDGE,
                  state: 'OBSERVED',
                  technologies: [{ name: 'Cloudflare' }],
                },
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  technologies: [{ name: 'Next.js' }],
                },
              ],
              keyTechnologies: [
                { name: 'Cloudflare', role: 'Edge CDN' },
                { name: 'NGINX', role: 'Web Gateway' },
                { name: 'Next.js', role: 'Application Framework' },
              ],
              integrations: [
                { name: 'Sentry', role: 'Application Observability' },
                { name: 'Stripe', role: 'Payment Gateway' },
              ],
              knownUnknowns: [
                { dimension: 'Origin Cloud Provider', status: 'MASKED' },
                { dimension: 'Database Backend', status: 'UNOBSERVED' },
              ],
              claimBoundaries: [
                {
                  technologyName: 'Cloudflare',
                  boundary: 'Cloudflare does not prove origin hosting provider',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.95 },
            },
          },
        },
      };

      const findings: FindingDto[] = [];
      const brief = builder.build(mockSnapshot, findings);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain(
        'delivered through Cloudflare edge infrastructure',
      );
      expect(brief.summary).toContain('Sentry and Stripe');
      expect(brief.summary).toContain(
        'Origin Cloud Provider and Database Backend remain unobservable',
      );

      // Highlights (Architecture path is presented on Architecture surface, not as Key Development highlight)
      expect(
        brief.highlights.some((h) => h.id === 'hl-architecture-path'),
      ).toBe(false);
      expect(brief.highlights.some((h) => h.id === 'hl-integrations')).toBe(
        true,
      );

      // Enriched Architecture contract
      expect(brief.architecture).toBeDefined();
      expect(brief.architecture?.ingressPath).toHaveLength(5);
      expect(brief.architecture?.integrations).toHaveLength(2);
      expect(brief.architecture?.knownUnknowns).toHaveLength(2);
    });
  });

  describe('2. Scenario B — Architecture Change / Drift Convergence', () => {
    it('surfaces gateway migration change in executive summary and highlights without fabricating rationale', () => {
      const mockSnapshot: SnapshotDetailDto = {
        id: 'snp-brief-002',
        domainId: 'dom-brief-002',
        domainName: 'migrated-gateway.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          changes: [
            {
              id: 'chg-001',
              classification: 'GATEWAY_MIGRATED',
              summary: 'Gateway layer transitioned from NGINX to Caddy',
              description: 'Gateway layer transitioned from NGINX to Caddy',
              impact: 'ARCHITECTURAL',
            },
          ],
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is delivered via Cloudflare edge infrastructure before reaching a Caddy gateway and Next.js.',
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
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [],
            },
          },
        },
      };

      const findings: FindingDto[] = [];
      const brief = builder.build(mockSnapshot, findings);

      expect(brief.summary).toContain(
        'Recent baseline comparison indicates Gateway layer transitioned from NGINX to Caddy.',
      );
      expect(
        brief.highlights.some((h) => h.title.includes('GATEWAY MIGRATED')),
      ).toBe(true);
      expect(brief.changes).toBeDefined();
      expect(brief.changes).toHaveLength(1);
    });
  });

  describe('3. Scenario C — Critical Finding Priority Escalation', () => {
    it('escalates health to Critical and leads with secret credential leakage at the top of summary', () => {
      const mockSnapshot: SnapshotDetailDto = {
        id: 'snp-brief-003',
        domainId: 'dom-brief-003',
        domainName: 'leaked-secret.com',
        createdAt: new Date(),
        responseTimeMs: 20,
        httpStatus: 200,
        payload: {
          http: { reachable: true },
        },
      };

      const findings: FindingDto[] = [
        {
          id: 'fnd-leak-001',
          ruleId: 'tech.client-integration-exposure',
          title:
            'Potential Secret Token Exposed in Client-Side Assets: Stripe Secret Key',
          description:
            'A pattern matching a private Stripe secret API key was observed in public HTML.',
          severity: 'CRITICAL',
          category: 'TECHNOLOGY',
          recommendations: [
            {
              title: 'Revoke and Rotate Exposed Secret Key Immediately',
              description:
                'Immediately revoke the compromised credential in Stripe dashboard.',
            },
          ],
        } as any,
      ];

      const brief = builder.build(mockSnapshot, findings);

      expect(brief.overallHealth).toBe('Critical');
      expect(brief.summary).toContain(
        'Critical security condition observed for leaked-secret.com',
      );
      expect(brief.summary).toContain('Stripe Secret Key');
      expect(brief.highlights[0].severity).toBe('CRITICAL');
      expect(brief.recommendations[0].title).toContain('Revoke and Rotate');
    });
  });

  describe('4. Scenario D — Sparse Infrastructure & Anti-Overreach', () => {
    it('restricts summary to observed Caddy component without inventing unobserved layers', () => {
      const mockSnapshot: SnapshotDetailDto = {
        id: 'snp-brief-004',
        domainId: 'dom-brief-004',
        domainName: 'caddy-only.org',
        createdAt: new Date(),
        responseTimeMs: 15,
        httpStatus: 200,
        payload: {
          http: { reachable: true, headers: { server: 'Caddy' } },
          technology: {
            architectureBrief: {
              summary: 'Routed directly through Caddy as a web gateway.',
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
                  technologyId: 'tech-caddy',
                  technologyName: 'Caddy',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [],
            },
          },
        },
      };

      const brief = builder.build(mockSnapshot, []);

      expect(brief.summary).toBe(
        'Routed directly through Caddy as a web gateway. The current infrastructure configuration appears stable with no critical or high-severity gaps.',
      );
      expect(brief.summary).not.toContain('Docker');
      expect(brief.summary).not.toContain('AWS');
      expect(brief.summary).not.toContain('Linux');
    });
  });

  describe('5. Deterministic Synthesis Verification', () => {
    it('produces identical outputs for identical consecutive snapshot inputs', () => {
      const mockSnapshot: SnapshotDetailDto = {
        id: 'snp-brief-det-001',
        domainId: 'dom-det-001',
        domainName: 'deterministic.io',
        createdAt: new Date('2026-08-27T12:00:00Z'),
        responseTimeMs: 30,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary: 'Protected by Cloudflare edge proxy.',
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
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [],
            },
          },
        },
      };

      const brief1 = builder.build(mockSnapshot, []);
      const brief2 = builder.build(mockSnapshot, []);

      expect(brief1.summary).toBe(brief2.summary);
      expect(brief1.overallHealth).toBe(brief2.overallHealth);
      expect(brief1.highlights).toEqual(brief2.highlights);
    });
  });

  describe('6. TLS Certificate Expiry Horizon (< 30 days)', () => {
    it('surfaces TLS certificate expiring within 30 days in Key Developments highlights even when severity is MEDIUM', () => {
      const mockSnapshot: SnapshotDetailDto = {
        id: 'snp-brief-tls-001',
        domainId: 'dom-tls-001',
        domainName: 'tls-renewal.io',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          http: { reachable: true },
        },
      };

      const findings: FindingDto[] = [
        {
          id: 'fnd-tls-exp-001',
          ruleId: 'ssl.certificate-expiry',
          title: 'SSL Certificate Expiring',
          description: 'The TLS certificate will expire in 22 day(s).',
          severity: 'MEDIUM',
          category: 'CERTIFICATE',
          recommendations: [
            {
              title: 'Schedule certificate renewal',
              description:
                'Plan the TLS certificate renewal before the expiry date.',
            },
          ],
        } as any,
      ];

      const brief = builder.build(mockSnapshot, findings);

      expect(brief.highlights.some((h) => h.id === 'fnd-tls-exp-001')).toBe(
        true,
      );
      const highlight = brief.highlights.find(
        (h) => h.id === 'fnd-tls-exp-001',
      );
      expect(highlight?.title).toBe('SSL Certificate Expiring');
      expect(highlight?.description).toContain('22 day(s)');
      expect(highlight?.severity).toBe('MEDIUM');
    });

    it('surfaces TLS certificate from SSL snapshot payload when expiring within 30 days if finding not yet attached', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const mockSnapshot: SnapshotDetailDto = {
        id: 'snp-brief-tls-002',
        domainId: 'dom-tls-002',
        domainName: 'tls-payload.io',
        createdAt: new Date(),
        responseTimeMs: 20,
        httpStatus: 200,
        payload: {
          http: { reachable: true },
          ssl: {
            certificate: {
              validTo: futureDate.toISOString(),
            },
          },
        },
      };

      const brief = builder.build(mockSnapshot, []);

      expect(
        brief.highlights.some((h) =>
          h.title.includes('SSL Certificate Expiring'),
        ),
      ).toBe(true);
      const highlight = brief.highlights.find((h) =>
        h.title.includes('SSL Certificate Expiring'),
      );
      expect(highlight?.severity).toBe('HIGH'); // 10 days <= 15 days is HIGH
    });
  });
});
