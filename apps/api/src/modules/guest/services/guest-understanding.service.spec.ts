import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus, TriggerType } from '@prisma/client';
import { GuestSessionService } from './guest-session.service';
import { GuestSessionRepository } from '../repositories/guest-session.repository';
import { GuestDomainResolver } from '../resolvers/guest-domain.resolver';
import { UnderstandingRepository } from '../../understanding/repositories/understanding.repository';
import { GuestUnderstandingService } from './guest-understanding.service';
import { GuestAnalyticsService } from './guest-analytics.service';
import { SYSTEM_GUEST_USER_ID } from '../constants/guest.constants';

describe('GuestUnderstandingService', () => {
  let service: GuestUnderstandingService;
  let sessionService: jest.Mocked<GuestSessionService>;
  let domainResolver: jest.Mocked<GuestDomainResolver>;
  let understandingRepository: jest.Mocked<UnderstandingRepository>;

  const mockSession = {
    id: 'gst-12345',
    sessionToken: 'gst_token_123',
    status: 'ACTIVE' as any,
    understandingJobId: null,
    expiresAt: new Date(Date.now() + 86400000),
    lastSeenAt: new Date(),
    createdAt: new Date(),
  };

  const mockDomain = {
    id: 'dom-999',
    userId: SYSTEM_GUEST_USER_ID,
    domainName: 'github.com',
    monitoringEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJob = {
    id: 'job-777',
    domainId: 'dom-999',
    status: JobStatus.PENDING,
    trigger: TriggerType.MANUAL,
    durationMs: null,
    startedAt: new Date(),
    completedAt: null,
    errorMessage: null,
  };

  beforeEach(async () => {
    const mockSessionSvc = {
      createSession: jest.fn(),
      resumeSession: jest.fn(),
    };

    const mockSessionRepo = {
      refresh: jest.fn(),
      create: jest.fn().mockResolvedValue(mockSession),
    };

    const mockResolver = {
      resolveGuestDomain: jest.fn(),
    };

    const mockUnderstandingRepo = {
      findActiveJobByDomain: jest.fn(),
      create: jest.fn(),
    };

    const mockAnalytics = {
      trackUnderstandingStarted: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestUnderstandingService,
        { provide: GuestSessionService, useValue: mockSessionSvc },
        { provide: GuestSessionRepository, useValue: mockSessionRepo },
        { provide: GuestDomainResolver, useValue: mockResolver },
        { provide: UnderstandingRepository, useValue: mockUnderstandingRepo },
        { provide: GuestAnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<GuestUnderstandingService>(GuestUnderstandingService);
    sessionService = module.get(GuestSessionService);
    domainResolver = module.get(GuestDomainResolver);
    understandingRepository = module.get(UnderstandingRepository);
  });

  it('should orchestrate guest understanding and return 202 Accepted response payload', async () => {
    sessionService.createSession.mockResolvedValue(mockSession);
    domainResolver.resolveGuestDomain.mockResolvedValue(mockDomain);
    understandingRepository.findActiveJobByDomain.mockResolvedValue(null);
    understandingRepository.create.mockResolvedValue(mockJob);

    const result = await service.orchestrateGuestUnderstanding('github.com');

    expect(sessionService.createSession).toHaveBeenCalled();
    expect(domainResolver.resolveGuestDomain).toHaveBeenCalledWith(
      'github.com',
    );
    expect(understandingRepository.create).toHaveBeenCalledWith({
      domainId: 'dom-999',
      trigger: TriggerType.MANUAL,
    });
    expect(result).toEqual({
      session: {
        sessionToken: 'gst_token_123',
        expiresAt: mockSession.expiresAt,
      },
      understanding: {
        jobId: 'job-777',
        status: JobStatus.PENDING,
      },
    });
  });

  it('should resume existing session when valid token provided', async () => {
    sessionService.resumeSession.mockResolvedValue(mockSession);
    domainResolver.resolveGuestDomain.mockResolvedValue(mockDomain);
    understandingRepository.findActiveJobByDomain.mockResolvedValue(mockJob);

    const result = await service.orchestrateGuestUnderstanding(
      'github.com',
      'gst_token_123',
    );

    expect(sessionService.resumeSession).toHaveBeenCalledWith('gst_token_123');
    expect(understandingRepository.create).not.toHaveBeenCalled();
    expect(result.understanding.jobId).toBe('job-777');
  });
});
