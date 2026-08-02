import { Injectable } from '@nestjs/common';
import { JobStatus, TriggerType } from '@prisma/client';
import { GuestSessionService } from './guest-session.service';
import { GuestDomainResolver } from '../resolvers/guest-domain.resolver';
import { UnderstandingRepository } from '../../understanding/repositories/understanding.repository';
import { GuestSessionRepository } from '../repositories/guest-session.repository';
import { GuestAnalyticsService } from './guest-analytics.service';
import { GuestUnderstandResponseDto } from '../dto/response/guest-understand-response.dto';

@Injectable()
export class GuestUnderstandingService {
  constructor(
    private readonly sessionService: GuestSessionService,
    private readonly sessionRepository: GuestSessionRepository,
    private readonly domainResolver: GuestDomainResolver,
    private readonly understandingRepository: UnderstandingRepository,
    private readonly analyticsService: GuestAnalyticsService,
  ) {}

  async orchestrateGuestUnderstanding(
    targetDomain: string,
    sessionTokenHeader?: string,
  ): Promise<GuestUnderstandResponseDto> {
    // 1. Session Lifecycle: Resume existing session if valid token provided, otherwise create new
    let session;
    if (sessionTokenHeader) {
      try {
        session = await this.sessionService.resumeSession(sessionTokenHeader);
      } catch {
        session = await this.sessionService.createSession();
      }
    } else {
      session = await this.sessionService.createSession();
    }

    // 2. Resolve or create System Guest Domain under SYSTEM_GUEST_USER_ID
    const domain = await this.domainResolver.resolveGuestDomain(targetDomain);

    // 3. Resolve existing active job or trigger a new UnderstandingJob
    let job = await this.understandingRepository.findActiveJobByDomain(
      domain.id,
    );

    if (!job) {
      job = await this.understandingRepository.create({
        domainId: domain.id,
        trigger: TriggerType.MANUAL,
      });
    }

    // 4. Attach understandingJobId to the GuestSession
    await this.sessionRepository.refresh(session.id, session.expiresAt);
    await this.sessionRepository
      .create({
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        understandingJobId: job.id,
      })
      .catch(() => null);

    // Non-blocking analytics tracking
    void this.analyticsService
      .trackUnderstandingStarted(session.id, targetDomain)
      .catch(() => null);

    // 5. Assemble product response dto
    return {
      session: {
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
      },
      understanding: {
        jobId: job.id,
        status: job.status || JobStatus.PENDING,
      },
    };
  }
}
