import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { DnsModule } from '../../infrastructure/discovery/dns/dns.module';

import { DomainsModule } from '../domains/domains.module';

import { UnderstandingController } from './understanding.controller';
import { UnderstandingService } from './understanding.service';
import { UnderstandingWorker } from './understanding.worker';
import { UnderstandingEngine } from './understanding.engine';
import { UnderstandingRepository } from './repositories/understanding.repository';
import { HttpModule } from '../../infrastructure/discovery/http/http.module';
import { DiscoveryModule } from '../../infrastructure/discovery/discovery.module';
import { InfrastructureSnapshotsModule } from '../infrastructure-snapshots/infrastructure-snapshots.module';
import { FindingsModule } from '../findings/findings.module';
import { InfrastructureFindingsModule } from '../infrastructure-findings/infrastructure-findings.module';
@Module({
  imports: [
    PrismaModule,
    DomainsModule,
    DnsModule,
    HttpModule,
    DiscoveryModule,
    InfrastructureSnapshotsModule,
    FindingsModule,
    InfrastructureFindingsModule,
  ],
  controllers: [UnderstandingController],
  providers: [
    UnderstandingService,
    UnderstandingRepository,
    UnderstandingWorker,
    UnderstandingEngine,
  ],
  exports: [UnderstandingService],
})
export class UnderstandingModule {}