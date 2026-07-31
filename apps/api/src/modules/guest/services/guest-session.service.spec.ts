import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GuestSessionStatus } from '@prisma/client';
import { GuestSessionRepository } from '../repositories/guest-session.repository';
import { GuestSessionService } from './guest-session.service';
import { GuestAnalyticsService } from './guest-analytics.service';

describe('GuestSessionService', () => {
  let service: GuestSessionService;
  let repository: jest.Mocked<GuestSessionRepository>;

  const mockSession = {
    id: 'gst-12345',
    sessionToken: 'gst_abc123',
    status: GuestSessionStatus.ACTIVE,
    understandingJobId: null,
    expiresAt: new Date(Date.now() + 86400000),
    lastSeenAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findById: jest.fn(),
      refresh: jest.fn(),
      markCompleted: jest.fn(),
      markConverted: jest.fn(),
      markExpired: jest.fn(),
      deleteExpired: jest.fn(),
    };

    const mockAnalytics = {
      trackSessionCreated: jest.fn().mockResolvedValue(undefined),
      trackSessionExpired: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestSessionService,
        { provide: GuestSessionRepository, useValue: mockRepo },
        { provide: GuestAnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<GuestSessionService>(GuestSessionService);
    repository = module.get(GuestSessionRepository);
  });

  it('should create a guest session with 24h default TTL', async () => {
    repository.create.mockResolvedValue(mockSession);

    const result = await service.createSession();

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionToken: expect.stringMatching(/^gst_/),
        expiresAt: expect.any(Date),
      }),
    );
    expect(result).toEqual(mockSession);
  });

  it('should resume valid active session', async () => {
    repository.findByToken.mockResolvedValue(mockSession);

    const result = await service.resumeSession('gst_abc123');

    expect(repository.findByToken).toHaveBeenCalledWith('gst_abc123');
    expect(result).toEqual(mockSession);
  });

  it('should throw NotFoundException when resuming non-existent session', async () => {
    repository.findByToken.mockResolvedValue(null);

    await expect(service.resumeSession('invalid')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw UnauthorizedException and mark expired when session is expired', async () => {
    const expiredSession = {
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000),
    };
    repository.findByToken.mockResolvedValue(expiredSession);

    await expect(service.resumeSession('gst_abc123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(repository.markExpired).toHaveBeenCalledWith('gst-12345');
  });

  it('should refresh session expiration', async () => {
    repository.findByToken.mockResolvedValue(mockSession);
    repository.refresh.mockResolvedValue({
      ...mockSession,
      expiresAt: new Date(Date.now() + 172800000),
    });

    const result = await service.refreshSession('gst_abc123', 48);

    expect(repository.refresh).toHaveBeenCalled();
    expect(result.expiresAt.getTime()).toBeGreaterThan(mockSession.expiresAt.getTime());
  });

  it('should complete active session', async () => {
    repository.findByToken.mockResolvedValue(mockSession);
    repository.markCompleted.mockResolvedValue({
      ...mockSession,
      status: GuestSessionStatus.COMPLETED,
    });

    const result = await service.completeSession('gst_abc123');

    expect(repository.markCompleted).toHaveBeenCalledWith('gst-12345');
    expect(result.status).toBe(GuestSessionStatus.COMPLETED);
  });

  it('should convert session to full account', async () => {
    repository.findByToken.mockResolvedValue(mockSession);
    repository.markConverted.mockResolvedValue({
      ...mockSession,
      status: GuestSessionStatus.CONVERTED,
    });

    const result = await service.convertSession('gst_abc123');

    expect(repository.markConverted).toHaveBeenCalledWith('gst-12345');
    expect(result.status).toBe(GuestSessionStatus.CONVERTED);
  });

  it('should cleanup expired sessions', async () => {
    repository.deleteExpired.mockResolvedValue(12);

    const count = await service.cleanupExpiredSessions();

    expect(count).toBe(12);
  });
});
