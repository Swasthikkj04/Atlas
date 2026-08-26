import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainsRepository } from './repositories/domains.repository';
import { DomainReachabilityService } from './services/domain-reachability.service';

describe('DomainsService (WX-812 / WX-813: Domain Creation & Reachability Gate)', () => {
  let service: DomainsService;
  let repository: jest.Mocked<DomainsRepository>;
  let reachabilityService: jest.Mocked<DomainReachabilityService>;

  const mockDomain = {
    id: '33871431-f0cf-411f-91e3-b89362907e9c',
    userId: 'usr-owner-1',
    domainName: 'argonion.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    monitoringEnabled: true,
    understandingCadence: 'HOURLY',
    understandingStatus: 'IDLE',
    lastUnderstoodAt: null,
    nextUnderstandingAt: null,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findByUserAndDomain: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      countActiveByUser: jest.fn(),
    } as any;

    reachabilityService = {
      verifyDomainReachability: jest.fn().mockResolvedValue({
        reachable: true,
        normalizedDomain: 'argonion.com',
      }),
    } as any;

    service = new DomainsService(repository, reachabilityService);
  });

  describe('1. Domain Deletion & Security Boundaries (WX-812)', () => {
    it('deletes domain successfully when owned by authenticated user', async () => {
      repository.findById.mockResolvedValue(mockDomain as any);
      repository.delete.mockResolvedValue(mockDomain as any);

      await service.delete('usr-owner-1', mockDomain.id);

      expect(repository.findById).toHaveBeenCalledWith(mockDomain.id);
      expect(repository.delete).toHaveBeenCalledWith(mockDomain.id);
    });

    it('rejects cross-user domain deletion with NotFoundException (NO_CROSS_USER_DOMAIN_DELETION)', async () => {
      repository.findById.mockResolvedValue(mockDomain as any);

      // Foreign user attempts deletion
      await expect(
        service.delete('usr-foreign-attacker-99', mockDomain.id),
      ).rejects.toThrow(NotFoundException);

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when domain does not exist (NO_FALSE_DELETE_SUCCESS)', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.delete('usr-owner-1', 'non-existent-uuid'),
      ).rejects.toThrow(NotFoundException);

      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('2. Domain Reachability Gate & Registration (WX-813)', () => {
    it('creates domain when reachability check succeeds', async () => {
      repository.findByUser.mockResolvedValue([]);
      repository.findByUserAndDomain.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockDomain as any);

      const result = await service.create({
        userId: 'usr-owner-1',
        domainName: '  https://argonion.com/  ',
      });

      expect(reachabilityService.verifyDomainReachability).toHaveBeenCalledWith(
        '  https://argonion.com/  ',
      );
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'usr-owner-1',
        domainName: 'argonion.com',
      });
      expect(result).toEqual(mockDomain);
    });

    it('rejects unreachable domain with UnprocessableEntityException without creating DB record', async () => {
      repository.findByUser.mockResolvedValue([]);
      reachabilityService.verifyDomainReachability.mockResolvedValue({
        reachable: false,
        normalizedDomain: 'unreachable-site.invalid',
        reason: 'DOMAIN_UNREACHABLE',
      });

      await expect(
        service.create({
          userId: 'usr-owner-1',
          domainName: 'unreachable-site.invalid',
        }),
      ).rejects.toMatchObject({
        response: {
          code: 'DOMAIN_UNREACHABLE',
          message:
            'Unable to reach this domain. Check the address and try again.',
        },
      });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('enforces 4 domains maximum workspace limit before probing reachability', async () => {
      repository.findByUser.mockResolvedValue([
        { id: 'd1' },
        { id: 'd2' },
        { id: 'd3' },
        { id: 'd4' },
      ] as any);

      await expect(
        service.create({
          userId: 'usr-owner-1',
          domainName: 'fifth-domain.com',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(
        reachabilityService.verifyDomainReachability,
      ).not.toHaveBeenCalled();
    });

    it('rejects duplicate domain registration with ConflictException', async () => {
      repository.findByUser.mockResolvedValue([]);
      repository.findByUserAndDomain.mockResolvedValue(mockDomain as any);

      await expect(
        service.create({ userId: 'usr-owner-1', domainName: 'argonion.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
