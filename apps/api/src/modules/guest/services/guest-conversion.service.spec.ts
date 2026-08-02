import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GuestSessionStatus, JobStatus } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestSessionService } from './guest-session.service';
import { GuestSessionRepository } from '../repositories/guest-session.repository';
import { GuestDomainMaterializer } from '../materializers/guest-domain.materializer';
import { GuestConversionService } from './guest-conversion.service';
import { GuestAnalyticsService } from './guest-analytics.service';

describe('GuestConversionService', () => {
  let service: GuestConversionService;
  let sessionService: jest.Mocked<GuestSessionService>;
  let sessionRepo: jest.Mocked<GuestSessionRepository>;
  let authService: jest.Mocked<AuthService>;
  let materializer: jest.Mocked<GuestDomainMaterializer>;
  let prisma: jest.Mocked<PrismaService>;

  const mockSession = {
    id: 'gst-123',
    sessionToken: 'gst_valid_token',
    status: GuestSessionStatus.ACTIVE,
    understandingJobId: 'job-777',
    expiresAt: new Date(Date.now() + 86400000),
    lastSeenAt: new Date(),
    createdAt: new Date(),
  };

  const mockCompletedJob = {
    id: 'job-777',
    domainId: 'dom-999',
    status: JobStatus.COMPLETED,
    trigger: 'MANUAL' as any,
    durationMs: 1200,
    startedAt: new Date(),
    completedAt: new Date(),
    errorMessage: null,
    domain: {
      domainName: 'github.com',
    },
  };

  const mockAuthResult = {
    accessToken: 'jwt.access.token',
    refreshToken: 'jwt.refresh.token',
    user: {
      id: 'usr-100',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    },
  };

  beforeEach(async () => {
    const mockSessionSvc = {
      resumeSession: jest.fn(),
    };

    const mockSessionRepo = {
      markConverted: jest.fn(),
    };

    const mockAuth = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const mockMat = {
      materializeUserDomain: jest.fn(),
    };

    const mockPrisma = {
      understandingJob: {
        findUnique: jest.fn(),
      },
    };

    const mockAnalytics = {
      trackConversionStarted: jest.fn().mockResolvedValue(undefined),
      trackConverted: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestConversionService,
        { provide: GuestSessionService, useValue: mockSessionSvc },
        { provide: GuestSessionRepository, useValue: mockSessionRepo },
        { provide: AuthService, useValue: mockAuth },
        { provide: GuestDomainMaterializer, useValue: mockMat },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GuestAnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<GuestConversionService>(GuestConversionService);
    sessionService = module.get(GuestSessionService);
    sessionRepo = module.get(GuestSessionRepository);
    authService = module.get(AuthService);
    materializer = module.get(GuestDomainMaterializer);
    prisma = module.get(PrismaService);
  });

  it('should throw UnauthorizedException if session token header is missing', async () => {
    await expect(
      service.convertGuestSession(
        { fullName: 'Jane', email: 'j@e.com', password: 'password123' },
        undefined,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException if job is not completed yet', async () => {
    sessionService.resumeSession.mockResolvedValue(mockSession);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue({
      ...mockCompletedJob,
      status: JobStatus.RUNNING,
    });

    await expect(
      service.convertGuestSession(
        { fullName: 'Jane', email: 'j@e.com', password: 'password123' },
        'gst_valid_token',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should convert guest session into permanent workspace account', async () => {
    sessionService.resumeSession.mockResolvedValue(mockSession);
    (prisma.understandingJob.findUnique as jest.Mock).mockResolvedValue(
      mockCompletedJob,
    );
    authService.register.mockResolvedValue({
      message: 'User registered',
      user: mockAuthResult.user,
    });
    authService.login.mockResolvedValue(mockAuthResult);
    materializer.materializeUserDomain.mockResolvedValue({} as any);

    const result = await service.convertGuestSession(
      {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      },
      'gst_valid_token',
    );

    expect(authService.register).toHaveBeenCalledWith({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });
    expect(authService.login).toHaveBeenCalledWith(
      {
        email: 'jane@example.com',
        password: 'password123',
      },
      expect.objectContaining({
        browser: 'Guest Client',
      }),
    );
    expect(materializer.materializeUserDomain).toHaveBeenCalledWith(
      'usr-100',
      'github.com',
      'job-777',
    );
    expect(sessionRepo.markConverted).toHaveBeenCalledWith('gst-123');
    expect(result.user.email).toBe('jane@example.com');
    expect(result.authentication.accessToken).toBe('jwt.access.token');
    expect(result.next.action).toBe('OPEN_WORKSPACE');
  });
});
