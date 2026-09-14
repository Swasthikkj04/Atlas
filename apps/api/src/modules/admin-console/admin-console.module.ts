import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AdminSessionModule } from '../admin-session/admin-session.module';
import { AdminAuthorizationModule } from '../admin-authorization/admin-authorization.module';
import { AdminAuditModule } from '../admin-audit/admin-audit.module';
import { AdminConsoleController } from './controllers/admin-console.controller';
import { TelemetryController } from './controllers/telemetry.controller';
import { AdminConsoleService } from './services/admin-console.service';
import { VisitorAnalyticsService } from './services/visitor-analytics.service';

@Module({
  imports: [
    PrismaModule,
    AdminSessionModule,
    AdminAuthorizationModule,
    AdminAuditModule,
  ],
  controllers: [AdminConsoleController, TelemetryController],
  providers: [AdminConsoleService, VisitorAnalyticsService],
  exports: [AdminConsoleService, VisitorAnalyticsService],
})
export class AdminConsoleModule {}
