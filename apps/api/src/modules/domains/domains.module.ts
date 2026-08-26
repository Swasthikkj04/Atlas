import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { DomainsRepository } from './repositories/domains.repository';
import { DomainReachabilityService } from './services/domain-reachability.service';
import { DomainSecurityValidator } from './services/domain-security.validator';

@Module({
  imports: [PrismaModule],
  controllers: [DomainsController],
  providers: [
    DomainsService,
    DomainsRepository,
    DomainReachabilityService,
    DomainSecurityValidator,
  ],
  exports: [DomainsService, DomainReachabilityService, DomainSecurityValidator],
})
export class DomainsModule {}
