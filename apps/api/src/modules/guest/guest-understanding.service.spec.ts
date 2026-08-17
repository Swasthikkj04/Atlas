import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GuestSessionStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UnderstandingEngine } from '../understanding/understanding.engine';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import { GuestUnderstandingService } from './guest-understanding.service';

describe('GuestUnderstandingService - Claim & Security (AUTH-003)', () => {
  let service: GuestUnderstandingService;
  let prisma: jest.Mocked<PrismaService>;

  const mockGuestUser = {
    id: 'usr-guest-sys-1',
    email: 'guest@system.atlas',
    fullName: 'System Guest User',
  };

  const mockGuestDomain = {
    id: 'dom-guest-1',
    userId: 'usr-guest-sys-1',
    domainName: 'github.com',
  };

  const mockUserDomain = {
    id: 'dom-user-100',
    userId: 'usr-swasthik-100',
    domainName: 'github.com',
  };

  const mockJob = {
    id: 'gst_job_123',
    domainId: 'dom-guest-1',
    status: 'COMPLETED',
    domain: mockGuestDomain,
    infrastructureSnapshot: {
      id: 'snap-123',
      jobId: 'gst_job_123',
      domainId: 'dom-guest-1',
    },
  };

  const mockGuestSession = {
    id: 'ses-db-1',
    sessionToken: 'ses_raw_token_xyz',
    domain: 'github.com',
    status: GuestSessionStatus.ACTIVE,
    understandingJobId: 'gst_job_123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h future
    createdAt: new Date(),
    lastSeenAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      guestSession: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      domain: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      understandingJob: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      infrastructureSnapshot: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      rawEvidence: {
        updateMany: jest.fn(),
      },
      infrastructureVerification: {
        updateMany: jest.fn(),
      },
      changeHistory: {
        updateMany: jest.fn(),
      },
      infrastructureFinding: {
        findMany: jest.fn(),
      },
      infrastructureBrief: {
        findUnique: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    const mockUnderstandingEngine = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const mockSnapshotService = {};
    const mockFindingService = {};
    const mockBriefService = {
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestUnderstandingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UnderstandingEngine, useValue: mockUnderstandingEngine },
        {
          provide: InfrastructureSnapshotService,
          useValue: mockSnapshotService,
        },
        {
          provide: InfrastructureFindingService,
          useValue: mockFindingService,
        },
        { provide: InfrastructureBriefService, useValue: mockBriefService },
      ],
    }).compile();

    service = module.get<GuestUnderstandingService>(GuestUnderstandingService);
    prisma = module.get(PrismaService);
  });

  describe('claimGuestSession', () => {
    it('successfully claims guest session and reassigns domain & snapshot lineage to user', async () => {
      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(
        mockGuestSession,
      );
      (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
        mockJob,
      );
      (prisma.domain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.domain.create as jest.Mock).mockResolvedValue(mockUserDomain);

      const result = await service.claimGuestSession(
        'usr-swasthik-100',
        'ses_raw_token_xyz',
      );

      expect(result.success).toBe(true);
      expect(result.domainId).toBe('dom-user-100');
      expect(result.domainName).toBe('github.com');
      expect(result.jobId).toBe('gst_job_123');

      expect(prisma.domain.create).toHaveBeenCalledWith({
        data: {
          userId: 'usr-swasthik-100',
          domainName: 'github.com',
          monitoringEnabled: false,
        },
      });

      expect(prisma.understandingJob.update).toHaveBeenCalledWith({
        where: { id: 'gst_job_123' },
        data: { domainId: 'dom-user-100' },
      });

      expect(prisma.infrastructureSnapshot.update).toHaveBeenCalledWith({
        where: { id: 'snap-123' },
        data: { domainId: 'dom-user-100' },
      });

      expect(prisma.guestSession.update).toHaveBeenCalledWith({
        where: { id: 'ses-db-1' },
        data: { status: GuestSessionStatus.CONVERTED },
      });
    });

    it('is idempotent: same user claiming already converted session returns success', async () => {
      const convertedSession = {
        ...mockGuestSession,
        status: GuestSessionStatus.CONVERTED,
      };
      const claimedJob = {
        ...mockJob,
        domain: {
          id: 'dom-user-100',
          userId: 'usr-swasthik-100',
          domainName: 'github.com',
        },
      };

      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(
        convertedSession,
      );
      (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
        claimedJob,
      );

      const result = await service.claimGuestSession(
        'usr-swasthik-100',
        'ses_raw_token_xyz',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('already claimed');
      expect(result.domainId).toBe('dom-user-100');
    });

    it('replay defense: rejects claim if session was already converted by another user', async () => {
      const convertedSession = {
        ...mockGuestSession,
        status: GuestSessionStatus.CONVERTED,
      };
      const claimedByAnotherUserJob = {
        ...mockJob,
        domain: {
          id: 'dom-other-user',
          userId: 'usr-attacker-999',
          domainName: 'github.com',
        },
      };

      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(
        convertedSession,
      );
      (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
        claimedByAnotherUserJob,
      );

      await expect(
        service.claimGuestSession('usr-swasthik-100', 'ses_raw_token_xyz'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects claim for non-existent session token', async () => {
      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.claimGuestSession('usr-swasthik-100', 'non_existent_token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects claim for expired guest session', async () => {
      const expiredSession = {
        ...mockGuestSession,
        expiresAt: new Date(Date.now() - 10000), // Expired
      };

      (prisma.guestSession.findUnique as jest.Mock).mockResolvedValue(
        expiredSession,
      );

      await expect(
        service.claimGuestSession('usr-swasthik-100', 'ses_raw_token_xyz'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
