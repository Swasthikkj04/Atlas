import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AdminAuditCryptoService } from './services/admin-audit-crypto.service';
import { AdminAnomalyDetectionService } from './services/admin-anomaly-detection.service';
import { AdminAuditService } from './services/admin-audit.service';
import { AdminHardeningService } from './services/admin-hardening.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    AdminAuditCryptoService,
    AdminAnomalyDetectionService,
    AdminAuditService,
    AdminHardeningService,
  ],
  exports: [
    AdminAuditCryptoService,
    AdminAnomalyDetectionService,
    AdminAuditService,
    AdminHardeningService,
  ],
})
export class AdminAuditModule {}
