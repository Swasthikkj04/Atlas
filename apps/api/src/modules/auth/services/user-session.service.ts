import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { UserAccountStatus, UserSession } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DeviceMetadata } from '../utils/user-agent.parser';

@Injectable()
export class UserSessionService {
  private readonly logger = new Logger(UserSessionService.name);
  readonly defaultTtlDays = 7;

  constructor(private readonly prisma: PrismaService) {}

  generateRawRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashRefreshToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async createSession(
    userId: string,
    deviceMeta?: Partial<DeviceMetadata>,
    ttlDays = this.defaultTtlDays,
  ): Promise<{ session: UserSession; rawRefreshToken: string }> {
    const rawRefreshToken = this.generateRawRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(rawRefreshToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        deviceName: deviceMeta?.deviceName || 'Unknown Device',
        deviceType: deviceMeta?.deviceType || 'Desktop',
        browser: deviceMeta?.browser || 'Unknown Browser',
        operatingSystem: deviceMeta?.operatingSystem || 'Unknown OS',
        ipAddress: deviceMeta?.ipAddress,
        userAgent: deviceMeta?.userAgent,
        lastActivityAt: now,
        expiresAt,
      },
    });

    return { session, rawRefreshToken };
  }

  async rotateSession(rawRefreshToken: string) {
    const oldHash = this.hashRefreshToken(rawRefreshToken);
    const now = new Date();

    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: oldHash },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (session.revokedAt !== null || now > session.expiresAt) {
      throw new UnauthorizedException('Session has been revoked or expired.');
    }

    if (session.user.status !== UserAccountStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active.');
    }

    // Emergency Revocation Kill-switch Enforcement
    if (
      session.user.tokenInvalidatedAt &&
      session.createdAt.getTime() <
        new Date(session.user.tokenInvalidatedAt).getTime()
    ) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: now },
      });
      throw new UnauthorizedException(
        'Session has been revoked due to security update.',
      );
    }

    // Mandatory Refresh Token Rotation
    const newRawRefreshToken = this.generateRawRefreshToken();
    const newHash = this.hashRefreshToken(newRawRefreshToken);
    const newExpiresAt = new Date(
      now.getTime() + this.defaultTtlDays * 24 * 60 * 60 * 1000,
    );

    const updatedSession = await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newHash,
        lastActivityAt: now,
        expiresAt: newExpiresAt,
      },
    });

    return {
      session: updatedSession,
      newRawRefreshToken,
      user: session.user,
    };
  }

  async revokeSessionByRawToken(rawRefreshToken: string): Promise<void> {
    const hash = this.hashRefreshToken(rawRefreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: hash },
    });

    if (session) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      this.logger.log(
        `[SecurityEvent:SESSION_REVOKED] sessionId=${session.id} userId=${session.userId}`,
      );
    }
  }

  async revokeSessionById(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found.');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(
      `[SecurityEvent:SESSION_REVOKED] sessionId=${sessionId} userId=${userId}`,
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const now = new Date();
    const result = await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenInvalidatedAt: now },
    });

    this.logger.log(
      `[SecurityEvent:GLOBAL_SESSION_REVOCATION] userId=${userId} sessionsRevoked=${result.count}`,
    );
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }
}
