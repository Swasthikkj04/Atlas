import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ExplorerController } from './controllers/explorer.controller';
import { ExplorerRepository } from './repositories/explorer.repository';
import { InfrastructureExplorerExperienceService } from './services/explorer-experience.service';
import { InfrastructureExplorerQueryService } from './services/explorer-query.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExplorerController],
  providers: [
    ExplorerRepository,
    InfrastructureExplorerQueryService,
    InfrastructureExplorerExperienceService,
  ],
  exports: [
    InfrastructureExplorerQueryService,
    InfrastructureExplorerExperienceService,
  ],
})
export class ExplorerModule {}
