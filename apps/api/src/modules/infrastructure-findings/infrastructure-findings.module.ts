import { Module } from '@nestjs/common';

import { InfrastructureFindingRepository } from './repositories/infrastructure-finding.repository';
import { InfrastructureFindingService } from './services/infrastructure-finding.service';

@Module({
  providers: [
    InfrastructureFindingRepository,
    InfrastructureFindingService,
  ],
  exports: [
    InfrastructureFindingService,
  ],
})
export class InfrastructureFindingsModule {}