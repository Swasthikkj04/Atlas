import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UserAccountStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UserSessionService } from './user-session.service';

describe('UserSessionService', () => {
  let service: UserSessionService;
  let prisma: jest.Mocked<PrismaService>;

  const mockSession = {
    id: 'ses-100',
    userId: 'usr-123',
    refreshTokenHash: 'hash_abc',
    deviceName: 'Chrome on Linux',
    deviceType: 'Desktop',
    browser: 'Chrome',
    operatingSystem: 'Linux',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0...',
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    createdAt: new Date(),
    user: {
      id: 'usr-123',
      status: UserAccountStatus.ACTIVE,
      tokenInvalidatedAt: null,
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      userSession: {
        create: jest.fn().mockResolvedValue(mockSession),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(mockSession),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([mockSession]),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserSessionService>(UserSessionService);
    prisma = module.get(PrismaService);
  });

  it('should create stateful user session with raw refresh token and hashed DB record', async () => {
    const deviceMeta = {
      browser: 'Chrome',
      operatingSystem: 'Linux',
      deviceType: 'Desktop',
      deviceName: 'Chrome on Linux',
    };

    const result = await service.createSession('usr-123', deviceMeta);

    expect(prisma.userSession.create).toHaveBeenCalled();
    expect(result.rawRefreshToken).toHaveLength(64);
    expect(result.session).toBeDefined();
  });

  it('should rotate refresh token and issue new raw refresh token on session refresh', async () => {
    (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

    const result = await service.rotateSession('raw_old_refresh_token');

    expect(prisma.userSession.update).toHaveBeenCalled();
    expect(result.newRawRefreshToken).toHaveLength(64);
    expect(result.newRawRefreshToken).not.toBe('raw_old_refresh_token');
  });

  it('should throw UnauthorizedException if session is revoked', async () => {
    (prisma.userSession.findUnique as jest.Mock).mockResolvedValue({
      ...mockSession,
      revokedAt: new Date(),
    });

    await expect(service.rotateSession('raw_token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should revoke all user sessions and set tokenInvalidatedAt', async () => {
    await service.revokeAllUserSessions('usr-123');

    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'usr-123', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'usr-123' },
      data: { tokenInvalidatedAt: expect.any(Date) },
    });
  });

  it('should revoke all other user sessions preserving current session without setting tokenInvalidatedAt (AX-105)', async () => {
    await service.revokeAllOtherSessions('usr-123', 'current_hash_123');

    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'usr-123',
        revokedAt: null,
        refreshTokenHash: { not: 'current_hash_123' },
      },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
