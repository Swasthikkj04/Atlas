import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestSessionService } from './guest-session.service';
import { GuestUnderstandingQueryService } from './guest-understanding-query.service';

describe('GuestUnderstandingQueryService', () => {
  let service: GuestUnderstandingQueryService;
  let sessionService: jest.Mocked<GuestSessionService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockSession = {
    id: 'gst-123',
    sessionToken: 'gst_valid_token',
    status: 'ACTIVE' as any,
    understandingJobId: 'job-777',
    expiresAt: new Date(Date.now() + 86400000),
    lastSeenAt: new Date(),
    createdAt: new Date(),
  };

  const mockCompletedJob = {
    id: 'job-777',
    domainId: 'dom-123',
    status: JobStatus.COMPLETED,
    trigger: 'MANUAL' as any,
    durationMs: 1200,
    startedAt: new Date(),
    completedAt: new Date(),
    errorMessage: null,
    infrastructureSnapshot: {
      id: 'snp-100',
      brief: {
        summary: 'Global Anycast CDN fronted by Fastly',
        highlights: ['Dual-layer CDN', 'HTTP/3 Enabled'],
        overallHealth: 'HEALTHY',
      },
      findings: [{ id: 'fnd-1' }, { id: 'fnd-2' }],
    },
  };

  beforeEach(async () => {
    const mockSessionSvc = {
      resumeSession: jest.fn(),
    };

    const mockPrisma = {
      understandingJob: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestUnderstandingQueryService,
        { provide: GuestSessionService, useValue: mockSessionSvc },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GuestUnderstandingQueryService>(
      GuestUnderstandingQueryService,
    );
    sessionService = module.get(GuestSessionService);
    prisma = module.get(PrismaService);
  });

  it('should throw UnauthorizedException if session token header is missing', async () => {
    await expect(
      service.getGuestUnderstandingStatus('job-777', undefined),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if job ID does not match session', async () => {
    sessionService.resumeSession.mockResolvedValue(mockSession);

    await expect(
      service.getGuestUnderstandingStatus('job-mismatched', 'gst_valid_token'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should return COMPLETED status presentation for finished understanding job', async () => {
    sessionService.resumeSession.mockResolvedValue(mockSession);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
      mockCompletedJob,
    );

    const result = await service.getGuestUnderstandingStatus(
      'job-777',
      'gst_valid_token',
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.summary?.executiveBrief).toContain('Global Anycast CDN');
    expect(result.stats?.findings).toBe(2);
    expect(result.next?.action).toBe('CREATE_ACCOUNT');
  });

  it('should return progress status presentation for running understanding job', async () => {
    sessionService.resumeSession.mockResolvedValue(mockSession);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue({
      ...mockCompletedJob,
      status: JobStatus.RUNNING,
      current_phase: 'HTTP_FINGERPRINT',
    });

    const result = await service.getGuestUnderstandingStatus(
      'job-777',
      'gst_valid_token',
    );

    expect(result.status).toBe('ANALYZING');
    expect(result.progress?.percentage).toBe(65);
  });

  it('should return product FAILED status for failed job', async () => {
    sessionService.resumeSession.mockResolvedValue(mockSession);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue({
      ...mockCompletedJob,
      status: JobStatus.FAILED,
      errorMessage: 'DNS lookup timeout',
    });

    const result = await service.getGuestUnderstandingStatus(
      'job-777',
      'gst_valid_token',
    );

    expect(result.status).toBe('FAILED');
    expect(result.retryAvailable).toBe(true);
  });
});
