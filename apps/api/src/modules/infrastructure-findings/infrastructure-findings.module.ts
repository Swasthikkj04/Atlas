import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { FindingController } from './controllers/finding.controller';
import { InfrastructureFindingRepository } from './repositories/infrastructure-finding.repository';
import { InfrastructureFindingService } from './services/infrastructure-finding.service';

@Module({
  imports: [PrismaModule],
  controllers: [FindingController],
  providers: [InfrastructureFindingRepository, InfrastructureFindingService],
  exports: [InfrastructureFindingService],
})
export class InfrastructureFindingsModule {}
