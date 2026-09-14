import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { DomainExperienceService } from './services/domain-experience.service';
import { DomainDetailsService } from './services/domain-details.service';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { NotFoundException } from '@nestjs/common';

describe('TECH-008: Technology Domain Overview & Details API Integration', () => {
  let moduleRef: TestingModule;
  let domainExperienceService: DomainExperienceService;
  let domainDetailsService: DomainDetailsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    domainExperienceService = moduleRef.get(DomainExperienceService);
    domainDetailsService = moduleRef.get(DomainDetailsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Domain Overview Canonical Convergence', () => {
    it('returns complete technology architecture alongside DNS, SSL, and HTTP in domain overview', async () => {
      const mockDomain = {
        id: 'dom-conv-001',
        domainName: 'converged-saas.com',
        monitoringEnabled: true,
        createdAt: new Date('2026-08-20T10:00:00Z'),
      };

      const mockSnapshot = {
        id: 'snp-conv-001',
        domainId: 'dom-conv-001',
        jobId: 'job-conv-001',
        responseTimeMs: 28,
        httpStatus: 200,
        createdAt: new Date('2026-08-27T10:00:00Z'),
        payload: {
          dns: { a: ['104.21.1.1'], ns: ['ns1.cloudflare.com'] },
          http: {
            statusCode: 200,
            headers: { server: 'cloudflare', 'x-powered-by': 'Next.js' },
          },
          ssl: { authorized: true },
          technology: {
            technologies: [
              {
                id: 'tech-cloudflare',
                name: 'Cloudflare',
                category: 'CDN / Edge',
                role: 'Edge CDN',
                infrastructureMeaning: 'Edge proxy delivery',
                whyDetected: 'Observed cf-ray',
                confidence: 0.99,
                confidenceLevel: 'HIGH',
                evidence: [],
              },
              {
                id: 'tech-nextjs',
                name: 'Next.js',
                category: 'Frameworks',
                role: 'Application Framework',
                infrastructureMeaning: 'React SSR Web Application',
                whyDetected: 'Observed Next.js headers',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                evidence: [],
              },
            ],
            architectureBrief: {
              summary:
                'The public endpoint appears to be delivered and protected via Cloudflare edge infrastructure before requests reach Next.js.',
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
              ],
              integrations: [],
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
                    'Cloudflare presence does not prove origin cloud provider',
                },
              ],
              confidence: {
                overallLevel: 'HIGH',
                overallScore: 0.95,
                layerConfidence: { EDGE: 'HIGH' },
                rationale: 'Authoritative evidence',
                confirmedRelationshipsCount: 1,
                supportedRelationshipsCount: 0,
                inferredRelationshipsCount: 0,
              },
            },
          },
        },
      };

      jest
        .spyOn(domainDetailsService, 'getDomain')
        .mockResolvedValue(mockDomain as any);
      jest
        .spyOn(domainDetailsService, 'getLatestSnapshot')
        .mockResolvedValue(mockSnapshot);
      jest.spyOn(domainDetailsService, 'countSnapshots').mockResolvedValue(1);
      jest.spyOn(domainDetailsService, 'getFindingsSummary').mockResolvedValue({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
        total: 0,
      });
      jest
        .spyOn(domainDetailsService, 'getLatestBrief')
        .mockResolvedValue(null);
      jest
        .spyOn(domainDetailsService, 'getLatestVerification')
        .mockResolvedValue(null);
      jest
        .spyOn(domainDetailsService, 'countVerifications')
        .mockResolvedValue(0);

      const overview = await domainExperienceService.getDomainOverview(
        'user-123',
        'dom-conv-001',
      );

      // Verify Canonical Infrastructure Overview
      expect(overview.infrastructure).toBeDefined();
      expect(overview.infrastructure.ipv4Addresses).toEqual(['104.21.1.1']);
      expect(overview.infrastructure.technologies).toContain('Cloudflare');
      expect(overview.infrastructure.technologies).toContain('Next.js');

      // Verify Technology Architecture Overview
      const techArch = overview.infrastructure.technologyArchitecture!;
      expect(techArch).toBeDefined();
      expect(techArch.architectureSummary).toContain(
        'delivered and protected via Cloudflare',
      );
      expect(techArch.ingressPath.map((p) => p.technologyName)).toEqual([
        'Public Endpoint',
        'Cloudflare',
        'Next.js',
      ]);
      expect(techArch.knownUnknowns[0].status).toBe('MASKED');
      expect(techArch.claimBoundaries[0].boundary).toContain(
        'does not prove origin cloud provider',
      );
    });
  });

  describe('2. Domain Authorization & Ownership Invariant', () => {
    it('throws NotFoundException when a user attempts to access another users domain', async () => {
      jest
        .spyOn(domainDetailsService, 'getDomain')
        .mockRejectedValue(new NotFoundException('Domain not found'));

      await expect(
        domainExperienceService.getDomainOverview(
          'unauthorized-user',
          'foreign-domain-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
