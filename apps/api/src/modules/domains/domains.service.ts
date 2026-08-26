import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { DomainsRepository } from './repositories/domains.repository';
import { DomainReachabilityService } from './services/domain-reachability.service';

interface CreateDomainData {
  userId: string;
  domainName: string;
}

@Injectable()
export class DomainsService {
  constructor(
    private readonly domainsRepository: DomainsRepository,
    private readonly reachabilityService: DomainReachabilityService,
  ) {}

  async create(data: CreateDomainData) {
    const userDomains = await this.domainsRepository.findByUser(data.userId);

    if (userDomains.length >= 4) {
      throw new BadRequestException(
        'Maximum limit of 4 domains reached for this workspace.',
      );
    }

    // Authoritative Reachability & SSRF Validation Gate (WX-813)
    const reachability =
      await this.reachabilityService.verifyDomainReachability(data.domainName);

    if (!reachability.reachable) {
      throw new UnprocessableEntityException({
        code: 'DOMAIN_UNREACHABLE',
        message:
          'Unable to reach this domain. Check the address and try again.',
      });
    }

    const normalizedDomain = reachability.normalizedDomain;

    const existingDomain = await this.domainsRepository.findByUserAndDomain(
      data.userId,
      normalizedDomain,
    );

    if (existingDomain) {
      throw new ConflictException('Domain already exists in this workspace.');
    }

    return this.domainsRepository.create({
      userId: data.userId,
      domainName: normalizedDomain,
    });
  }

  async findByUser(userId: string) {
    return this.domainsRepository.findByUser(userId);
  }

  async findById(userId: string, domainId: string) {
    const domain = await this.domainsRepository.findById(domainId);

    if (!domain || domain.userId !== userId) {
      throw new NotFoundException('Domain not found.');
    }

    return domain;
  }

  async delete(userId: string, id: string): Promise<void> {
    const domain = await this.domainsRepository.findById(id);

    if (!domain || domain.userId !== userId) {
      throw new NotFoundException('Domain not found.');
    }

    await this.domainsRepository.delete(id);
  }

  async countByUser(userId: string): Promise<number> {
    const domains = await this.domainsRepository.findByUser(userId);

    return domains.length;
  }

  async countActiveByUser(userId: string): Promise<number> {
    return this.domainsRepository.countActiveByUser(userId);
  }
}
