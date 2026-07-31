import { Test, TestingModule } from '@nestjs/testing';
import { GuestSessionStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestRetentionPolicy } from '../policies/guest-retention.policy';
import { GuestCleanupService } from './guest-cleanup.service';
import { GuestAnalyticsService } from './guest-analytics.service';
import { SYSTEM_GUEST_USER_ID } from '../constants/guest.constants';

describe('GuestCleanupService', () => {
  let service: GuestCleanupService;
  let prisma: jest.Mocked<PrismaService>;

  const mockExpiredSession = {
    id: 'gst-expired-1',
    sessionToken: 'gst_expired',
    status: GuestSessionStatus.EXPIRED,
    understandingJobId: 'job-guest-777',
    expiresAt: new Date(Date.now() - 10000),
    lastSeenAt: new Date(),
    createdAt: new Date(),
  };

  const mockJob = {
    id: 'job-guest-777',
    domainId: 'dom-guest-999',
    domain: {
      id: 'dom-guest-999',
      userId: SYSTEM_GUEST_USER_ID,
    },
    infrastructureSnapshot: {
      id: 'snp-100',
      brief: { snapshotId: 'snp-100' },
      findings: [{ id: 'fnd-1' }],
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      guestSession: {
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({}),
      },
      understandingJob: {
        findUnique: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
      },
      infrastructureSnapshot: {
        delete: jest.fn().mockResolvedValue({}),
      },
      infrastructureBrief: {
        delete: jest.fn().mockResolvedValue({}),
      },
      infrastructureFinding: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      domain: {
        delete: jest.fn().mockResolvedValue({}),
      },
    };

    const mockAnalytics = {
      trackSessionCleaned: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestCleanupService,
        GuestRetentionPolicy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GuestAnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<GuestCleanupService>(GuestCleanupService);
    prisma = module.get(PrismaService);
  });

  it('should clean up expired guest session and temporary infrastructure', async () => {
    (prisma.guestSession.findMany as jest.Mock).mockResolvedValue([mockExpiredSession]);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
    (prisma.infrastructureFinding.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.understandingJob.count as jest.Mock).mockResolvedValue(0);

    const summary = await service.cleanupExpiredSessions();

    expect(prisma.infrastructureBrief.delete).toHaveBeenCalled();
    expect(prisma.infrastructureFinding.deleteMany).toHaveBeenCalled();
    expect(prisma.infrastructureSnapshot.delete).toHaveBeenCalled();
    expect(prisma.understandingJob.delete).toHaveBeenCalled();
    expect(prisma.guestSession.delete).toHaveBeenCalledWith({ where: { id: 'gst-expired-1' } });
    expect(summary.sessionsCleaned).toBe(1);
    expect(summary.jobsCleaned).toBe(1);
  });

  it('should NOT clean up CONVERTED sessions', async () => {
    (prisma.guestSession.findMany as jest.Mock).mockResolvedValue([]);

    const summary = await service.cleanupExpiredSessions();

    expect(prisma.guestSession.delete).not.toHaveBeenCalled();
    expect(summary.sessionsCleaned).toBe(0);
  });

  it('should NOT clean up infrastructure owned by authenticated users', async () => {
    const authUserJob = {
      ...mockJob,
      domain: { id: 'dom-user', userId: 'usr-authenticated-user-123' },
    };
    (prisma.guestSession.findMany as jest.Mock).mockResolvedValue([mockExpiredSession]);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(authUserJob);

    const summary = await service.cleanupExpiredSessions();

    expect(prisma.infrastructureBrief.delete).not.toHaveBeenCalled();
    expect(prisma.understandingJob.delete).not.toHaveBeenCalled();
    // Session itself is still cleaned up if expired
    expect(prisma.guestSession.delete).toHaveBeenCalledWith({ where: { id: 'gst-expired-1' } });
    expect(summary.jobsCleaned).toBe(0);
  });
});
