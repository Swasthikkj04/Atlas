import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DomainsModule } from '../domains/domains.module';
import { InfrastructureBriefModule } from '../infrastructure-brief/infrastructure-brief.module';
import { InfrastructureFindingsModule } from '../infrastructure-findings/infrastructure-findings.module';
import { InfrastructureSnapshotsModule } from '../infrastructure-snapshots/infrastructure-snapshots.module';
import { UnderstandingModule } from '../understanding/understanding.module';

import { DomainDetailsController } from './controllers/domain-details.controller';
import { DomainDetailsService } from './services/domain-details.service';
import { DomainExperienceService } from './services/domain-experience.service';

@Module({
  imports: [
    AuthModule,
    DomainsModule,
    InfrastructureSnapshotsModule,
    InfrastructureFindingsModule,
    InfrastructureBriefModule,
    UnderstandingModule,
  ],
  controllers: [DomainDetailsController],
  providers: [DomainDetailsService, DomainExperienceService],
  exports: [DomainDetailsService, DomainExperienceService],
})
export class DomainDetailsModule {}