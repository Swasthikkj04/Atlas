import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { SnapshotController } from './controllers/snapshot.controller';
import { InfrastructureSnapshotRepository } from './repositories/infrastructure-snapshot.repository';
import { InfrastructureSnapshotService } from './services/infrastructure-snapshot.service';

@Module({
  imports: [PrismaModule],
  controllers: [SnapshotController],
  providers: [
    InfrastructureSnapshotRepository,
    InfrastructureSnapshotService,
  ],
  exports: [InfrastructureSnapshotService],
})
export class InfrastructureSnapshotsModule {}