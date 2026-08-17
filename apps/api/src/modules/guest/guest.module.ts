import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import {
  GuestUnderstandingController,
  JobsController,
} from './guest-understanding.controller';
import { GuestUnderstandingService } from './guest-understanding.service';
import { UnderstandingModule } from '../understanding/understanding.module';
import { InfrastructureSnapshotsModule } from '../infrastructure-snapshots/infrastructure-snapshots.module';
import { InfrastructureFindingsModule } from '../infrastructure-findings/infrastructure-findings.module';
import { InfrastructureBriefModule } from '../infrastructure-brief/infrastructure-brief.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UnderstandingModule),
    InfrastructureSnapshotsModule,
    InfrastructureFindingsModule,
    InfrastructureBriefModule,
  ],
  controllers: [GuestUnderstandingController, JobsController],
  providers: [GuestUnderstandingService],
  exports: [GuestUnderstandingService],
})
export class GuestModule {}
