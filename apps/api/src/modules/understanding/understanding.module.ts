import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { DnsModule } from '../../infrastructure/discovery/dns/dns.module';

import { DomainsModule } from '../domains/domains.module';

import { UnderstandingController } from './understanding.controller';
import { UnderstandingService } from './understanding.service';
import { UnderstandingWorker } from './understanding.worker';
import { UnderstandingEngine } from './understanding.engine';
import { UnderstandingRepository } from './repositories/understanding.repository';
import { InfrastructureVerificationRepository } from './repositories/infrastructure-verification.repository';
import { InfrastructureVerificationService } from './services/infrastructure-verification.service';
import { SnapshotEqualityEngine } from './services/snapshot-equality.engine';
import { HttpModule } from '../../infrastructure/discovery/http/http.module';
import { DiscoveryModule } from '../../infrastructure/discovery/discovery.module';
import { InfrastructureSnapshotsModule } from '../infrastructure-snapshots/infrastructure-snapshots.module';
import { FindingsModule } from '../findings/findings.module';
import { InfrastructureFindingsModule } from '../infrastructure-findings/infrastructure-findings.module';
import { InfrastructureBriefModule } from '../infrastructure-brief/infrastructure-brief.module';
import { WorkerReliabilityService } from './services/worker-reliability.service';

import { GuestModule } from '../guest/guest.module';

@Module({
  imports: [
    PrismaModule,
    DomainsModule,
    forwardRef(() => GuestModule),
    DnsModule,
    HttpModule,
    DiscoveryModule,
    InfrastructureSnapshotsModule,
    FindingsModule,
    InfrastructureFindingsModule,
    InfrastructureBriefModule,
  ],
  controllers: [UnderstandingController],
  providers: [
    UnderstandingService,
    UnderstandingRepository,
    InfrastructureVerificationRepository,
    InfrastructureVerificationService,
    SnapshotEqualityEngine,
    WorkerReliabilityService,
    UnderstandingWorker,
    UnderstandingEngine,
  ],
  exports: [
    UnderstandingService,
    UnderstandingRepository,
    InfrastructureVerificationRepository,
    InfrastructureVerificationService,
    SnapshotEqualityEngine,
    WorkerReliabilityService,
    UnderstandingEngine,
  ],
})
export class UnderstandingModule {}
