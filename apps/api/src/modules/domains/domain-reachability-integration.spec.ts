import { PrismaClient, UserAccountStatus } from '@prisma/client';
import { DomainsService } from './domains.service';
import { DomainsRepository } from './repositories/domains.repository';
import { DomainReachabilityService } from './services/domain-reachability.service';
import { DomainSecurityValidator } from './services/domain-security.validator';
import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('WX-813: Domain Reachability & Validation on Add Integration Suite', () => {
  jest.setTimeout(15000);
  let app: INestApplication;
  let prisma: PrismaClient;
  let domainsRepository: DomainsRepository;
  let securityValidator: DomainSecurityValidator;
  let reachabilityService: DomainReachabilityService;
  let domainsService: DomainsService;

  const testUserId = `usr-reach-test-${Date.now()}`;
  const createdDomainIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    domainsRepository = new DomainsRepository(prisma);
    securityValidator = new DomainSecurityValidator();
    reachabilityService = new DomainReachabilityService(securityValidator);
    domainsService = new DomainsService(domainsRepository, reachabilityService);

    await prisma.user.create({
      data: {
        id: testUserId,
        email: `reachability.${Date.now()}@example.com`,
        fullName: 'Reachability Test User',
        status: UserAccountStatus.ACTIVE,
      },
    });
  });

  afterAll(async () => {
    if (createdDomainIds.length > 0) {
      await prisma.domain
        .deleteMany({ where: { id: { in: createdDomainIds } } })
        .catch(() => null);
    }
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => null);
    await prisma.$disconnect();
  });

  describe('1. SSRF & Security Boundaries', () => {
    const ssrfTargets = [
      'localhost',
      '127.0.0.1',
      '169.254.169.254',
      'http://169.254.169.254/latest/meta-data/',
      'service.local',
      'node.internal',
      'metadata.google.internal',
    ];

    for (const target of ssrfTargets) {
      it(`blocks SSRF target: ${target} without writing to database`, async () => {
        const countBefore = await prisma.domain.count({
          where: { userId: testUserId },
        });

        await expect(
          domainsService.create({ userId: testUserId, domainName: target }),
        ).rejects.toThrow(UnprocessableEntityException);

        const countAfter = await prisma.domain.count({
          where: { userId: testUserId },
        });
        expect(countAfter).toBe(countBefore);
      });
    }
  });

  describe('2. Unreachable & Non-Existent Domains', () => {
    it('rejects nonexistent domain with concise DOMAIN_UNREACHABLE code and no leaked stack trace', async () => {
      const nonExistent = `nonexistent-nebula-domain-${Date.now()}.xyz`;
      const countBefore = await prisma.domain.count({
        where: { userId: testUserId },
      });

      let error: any;
      try {
        await domainsService.create({
          userId: testUserId,
          domainName: nonExistent,
        });
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.getResponse()).toEqual({
        code: 'DOMAIN_UNREACHABLE',
        message:
          'Unable to reach this domain. Check the address and try again.',
      });

      const countAfter = await prisma.domain.count({
        where: { userId: testUserId },
      });
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('3. Reachable Domains & Persistence Gate', () => {
    it('normalizes, validates, and creates domain when reachability succeeds', async () => {
      // Mock reachability to succeed for test domain
      jest
        .spyOn(reachabilityService, 'verifyDomainReachability')
        .mockResolvedValueOnce({
          reachable: true,
          normalizedDomain: 'stripe.com',
          statusCode: 200,
        });

      const domain = await domainsService.create({
        userId: testUserId,
        domainName: '  https://STRIPE.COM/dashboard/  ',
      });

      expect(domain).not.toBeNull();
      expect(domain.domainName).toBe('stripe.com');
      expect(domain.userId).toBe(testUserId);
      createdDomainIds.push(domain.id);

      // Verify domain is in PostgreSQL
      const persisted = await prisma.domain.findUnique({
        where: { id: domain.id },
      });
      expect(persisted).not.toBeNull();
      expect(persisted?.domainName).toBe('stripe.com');
    });

    it('rejects duplicate domain with ConflictException', async () => {
      jest
        .spyOn(reachabilityService, 'verifyDomainReachability')
        .mockResolvedValueOnce({
          reachable: true,
          normalizedDomain: 'stripe.com',
          statusCode: 200,
        });

      await expect(
        domainsService.create({
          userId: testUserId,
          domainName: 'stripe.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
