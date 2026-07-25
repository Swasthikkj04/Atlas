import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { InfrastructureSnapshotsModule } from '../infrastructure-snapshots/infrastructure-snapshots.module';
import { InfrastructureFindingsModule } from '../infrastructure-findings/infrastructure-findings.module';

import { InfrastructureBriefController } from './controllers/infrastructure-brief.controller';
import { InfrastructureBriefBuilder } from './builders/infrastructure-brief.builder';
import { InfrastructureBriefRepository } from './repositories/infrastructure-brief.repository';
import { InfrastructureBriefService } from './services/infrastructure-brief.service';

@Module({
  imports: [
    PrismaModule,
    InfrastructureSnapshotsModule,
    InfrastructureFindingsModule,
  ],
  controllers: [InfrastructureBriefController],
  providers: [
    InfrastructureBriefRepository,
    InfrastructureBriefService,
    InfrastructureBriefBuilder,
  ],
  exports: [
    InfrastructureBriefService,
  ],
})
export class InfrastructureBriefModule {}