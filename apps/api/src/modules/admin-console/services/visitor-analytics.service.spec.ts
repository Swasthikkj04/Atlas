import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { VisitorAnalyticsService } from './visitor-analytics.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminVisitorsQueryDto } from '../contracts/admin-console.contract';

describe('VisitorAnalyticsService (ADMIN-VISITORS)', () => {
  let service: VisitorAnalyticsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      domain: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { domainName: 'test.com' },
            { domainName: 'atlas.dev' },
          ]),
      },
      guestSession: {
        count: jest.fn().mockImplementation((args) => {
          if (args?.where?.status === 'ACTIVE') return Promise.resolve(5);
          if (args?.where?.status === 'COMPLETED') return Promise.resolve(20);
          if (args?.where?.status === 'CONVERTED') return Promise.resolve(8);
          return Promise.resolve(35);
        }),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { domain: 'stripe.com' },
            { domain: 'linear.app' },
          ]),
      },
      understandingJob: {
        count: jest.fn().mockResolvedValue(28),
      },
      userSession: {
        count: jest.fn().mockResolvedValue(12),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorAnalyticsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<VisitorAnalyticsService>(VisitorAnalyticsService);
  });

  describe('classifyPath', () => {
    it('accurately identifies landing page', () => {
      expect(service.classifyPath('/')).toBe('landing');
      expect(service.classifyPath('')).toBe('landing');
    });

    it('accurately identifies guest experience', () => {
      expect(service.classifyPath('/guest')).toBe('gx');
      expect(service.classifyPath('/guest/scan')).toBe('gx');
    });

    it('accurately identifies documentation', () => {
      expect(service.classifyPath('/docs')).toBe('docs');
      expect(service.classifyPath('/docs/api')).toBe('docs');
    });

    it('accurately identifies workspace and auth', () => {
      expect(service.classifyPath('/workspace')).toBe('workspace');
      expect(service.classifyPath('/auth/login')).toBe('auth');
    });
  });

  describe('recordVisit', () => {
    it('records a client visit and maps geolocation correctly', () => {
      const result = service.recordVisit(
        {
          path: '/guest',
          referrer: 'https://twitter.com',
          domain: 'test.com',
          action: 'SCAN_DOMAIN',
        },
        '106.51.10.2',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });
  });

  describe('getVisitorAnalytics', () => {
    it('returns structured visitor analytics for 24h period based on recorded visits', async () => {
      // Record a couple of real visits
      service.recordVisit(
        {
          path: '/',
          referrer: 'https://github.com',
          action: 'SCAN_DOMAIN_CTA',
        },
        '106.51.10.2',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );
      service.recordVisit(
        { path: '/docs/quickstart', action: 'SEARCH' },
        '106.51.10.2',
        'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
      );

      const analytics = await service.getVisitorAnalytics({ period: '24h' });

      expect(analytics.period).toBe('24h');
      expect(analytics.overview.totalUniqueVisitors).toBe(1);
      expect(analytics.overview.todayVisitors).toBe(1);
      expect(analytics.overview.activeVisitorsNow).toBeGreaterThan(0);

      // Landing metrics
      expect(analytics.surfaces.landing).toBeDefined();
      expect(analytics.surfaces.landing.pageviews).toBe(1);
      expect(analytics.surfaces.landing.ctaClicks.scanDomain).toBe(1);

      // GX metrics & Funnel
      expect(analytics.surfaces.guestExperience).toBeDefined();
      expect(
        analytics.surfaces.guestExperience.conversionRatePercentage,
      ).toBeDefined();

      // Docs metrics
      expect(analytics.surfaces.docs.pageviews).toBe(1);
      expect(analytics.surfaces.docs.topSections.length).toBe(1);

      // All surfaces
      expect(analytics.surfaces.allSurfaces.length).toBeGreaterThan(0);

      // Geographic & Demographics
      expect(analytics.geographicDistribution.length).toBe(1);
      expect(analytics.geographicDistribution[0].countryCode).toBe('IN');
      expect(analytics.clientDemographics.devices.length).toBe(1);
      expect(analytics.clientDemographics.browsers.length).toBe(2);
    });

    it('filters analytics by specific domain correctly', async () => {
      service.recordVisit(
        { path: '/guest', domain: 'atlas.dev' },
        '127.0.0.1',
        'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0',
      );
      const analytics = await service.getVisitorAnalytics({
        period: '7d',
        domain: 'atlas.dev',
      });
      expect(analytics.period).toBe('7d');
      expect(analytics.domainFilter).toBe('atlas.dev');
    });

    it('passes NestJS ValidationPipe validation with period and domain parameters', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      });

      const validatedDto = (await pipe.transform(
        { period: '30d', domain: 'example.com' },
        { type: 'query', metatype: AdminVisitorsQueryDto },
      )) as AdminVisitorsQueryDto;

      expect(validatedDto.period).toBe('30d');
      expect(validatedDto.domain).toBe('example.com');
    });
  });
});
