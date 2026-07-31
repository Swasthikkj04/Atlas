import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ActivityModule } from '../activity/activity.module';
import { UnderstandingModule } from '../understanding/understanding.module';
import { GuestController } from './controllers/guest.controller';
import { GuestSessionRepository } from './repositories/guest-session.repository';
import { GuestDomainResolver } from './resolvers/guest-domain.resolver';
import { GuestDomainMaterializer } from './materializers/guest-domain.materializer';
import { GuestRetentionPolicy } from './policies/guest-retention.policy';
import { GuestEventPublisher } from './publishers/guest-event.publisher';
import { GuestSessionService } from './services/guest-session.service';
import { GuestUnderstandingService } from './services/guest-understanding.service';
import { GuestUnderstandingQueryService } from './services/guest-understanding-query.service';
import { GuestConversionService } from './services/guest-conversion.service';
import { GuestCleanupService } from './services/guest-cleanup.service';
import { GuestAnalyticsService } from './services/guest-analytics.service';
import { GuestCleanupWorker } from './workers/guest-cleanup.worker';

@Module({
  imports: [PrismaModule, AuthModule, ActivityModule, UnderstandingModule],
  controllers: [GuestController],
  providers: [
    GuestSessionRepository,
    GuestSessionService,
    GuestDomainResolver,
    GuestDomainMaterializer,
    GuestRetentionPolicy,
    GuestEventPublisher,
    GuestAnalyticsService,
    GuestUnderstandingService,
    GuestUnderstandingQueryService,
    GuestConversionService,
    GuestCleanupService,
    GuestCleanupWorker,
  ],
  exports: [
    GuestSessionRepository,
    GuestSessionService,
    GuestDomainResolver,
    GuestDomainMaterializer,
    GuestRetentionPolicy,
    GuestEventPublisher,
    GuestAnalyticsService,
    GuestUnderstandingService,
    GuestUnderstandingQueryService,
    GuestConversionService,
    GuestCleanupService,
  ],
})
export class GuestModule {}
