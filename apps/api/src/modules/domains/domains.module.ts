import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { DomainsRepository } from './repositories/domains.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DomainsController],
  providers: [
    DomainsService,
    DomainsRepository,
  ],
  exports: [DomainsService],
})
export class DomainsModule {}