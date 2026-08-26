import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import authConfig from './config/auth.config';

import { LoggerModule } from './infrastructure/logger/logger.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { DiscoveryModule } from './infrastructure/discovery/discovery.module';
import { EvidenceModule } from './infrastructure/evidence/evidence.module';
import { NormalizationModule } from './infrastructure/normalization/normalization.module';
import { IntelligenceModule } from './infrastructure/intelligence/intelligence.module';
import { PlatformModule } from './infrastructure/platform/platform.module';

import { AuthModule } from './modules/auth/auth.module';
import { DomainDetailsModule } from './modules/domain-details/domain-details.module';
import { DomainsModule } from './modules/domains/domains.module';
import { HealthModule } from './modules/health/health.module';
import { InfrastructureBriefModule } from './modules/infrastructure-brief/infrastructure-brief.module';
import { InfrastructureFindingsModule } from './modules/infrastructure-findings/infrastructure-findings.module';
import { InfrastructureSnapshotsModule } from './modules/infrastructure-snapshots/infrastructure-snapshots.module';
import { UnderstandingModule } from './modules/understanding/understanding.module';
import { GuestModule } from './modules/guest/guest.module';
import { UsersModule } from './modules/users/users.module';
import { AccountModule } from './modules/account/account.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { ActivityModule } from './modules/activity/activity.module';
import { SearchModule } from './modules/search/search.module';
import { ExplorerModule } from './modules/explorer/explorer.module';
import { QueueModule } from './modules/queue/queue.module';

import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { CsrfGuard } from './common/guards/csrf.guard';

import { RateLimitingModule } from './infrastructure/rate-limiting/rate-limiting.module';

import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      validate: validateEnvironment,
    }),

    LoggerModule,
    MetricsModule,
    RateLimitingModule,
    PrismaModule,
    EvidenceModule,
    NormalizationModule,
    IntelligenceModule,
    PlatformModule,

    UsersModule,
    AccountModule,
    AuthModule,
    DomainsModule,
    HealthModule,
    UnderstandingModule,
    GuestModule,
    DiscoveryModule,
    InfrastructureSnapshotsModule,
    InfrastructureFindingsModule,
    InfrastructureBriefModule,

    WorkspaceModule,
    DomainDetailsModule,
    TimelineModule,
    ActivityModule,
    SearchModule,
    ExplorerModule,
    QueueModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
