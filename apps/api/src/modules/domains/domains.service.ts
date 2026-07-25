import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DomainsRepository } from './repositories/domains.repository';

interface CreateDomainData {
  userId: string;
  domainName: string;
}

@Injectable()
export class DomainsService {
  constructor(
    private readonly domainsRepository: DomainsRepository,
  ) {}

  async create(data: CreateDomainData) {
    const existingDomain =
      await this.domainsRepository.findByUserAndDomain(
        data.userId,
        data.domainName,
      );

    if (existingDomain) {
      throw new ConflictException(
        'Domain already exists.',
      );
    }

    return this.domainsRepository.create(data);
  }

  async findByUser(userId: string) {
    return this.domainsRepository.findByUser(
      userId,
    );
  }

  async findById(
    userId: string,
    domainId: string,
  ) {
    const domain =
      await this.domainsRepository.findById(
        domainId,
      );

    if (!domain || domain.userId !== userId) {
      throw new NotFoundException(
        'Domain not found.',
      );
    }

    return domain;
  }

  async delete(
    id: string,
    userId: string,
  ): Promise<void> {
    const domain =
      await this.domainsRepository.findById(id);

    if (!domain || domain.userId !== userId) {
      throw new NotFoundException(
        'Domain not found.',
      );
    }

    await this.domainsRepository.delete(id);
  }

  async countByUser(
    userId: string,
  ): Promise<number> {
    const domains =
      await this.domainsRepository.findByUser(
        userId,
      );

    return domains.length;
  }

  async countActiveByUser(
    userId: string,
  ): Promise<number> {
    return this.domainsRepository.countActiveByUser(
      userId,
    );
  }
}