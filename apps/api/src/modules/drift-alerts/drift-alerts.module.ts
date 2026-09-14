import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { DriftAlertController } from './controllers/drift-alert.controller';
import { DriftAlertService } from './services/drift-alert.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DriftAlertController],
  providers: [DriftAlertService],
  exports: [DriftAlertService],
})
export class DriftAlertsModule {}
