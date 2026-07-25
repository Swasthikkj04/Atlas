import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { EvidenceRepository } from './repositories/evidence.repository';
import { EvidenceService } from './services/evidence.service';

@Module({
  imports: [PrismaModule],
  providers: [EvidenceRepository, EvidenceService],
  exports: [EvidenceRepository, EvidenceService],
})
export class EvidenceModule {}
