import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GuestSession, GuestSessionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { GuestSessionRepository } from '../repositories/guest-session.repository';
import { GuestAnalyticsService } from './guest-analytics.service';

@Injectable()
export class GuestSessionService {
  constructor(
    private readonly repository: GuestSessionRepository,
    private readonly analyticsService: GuestAnalyticsService,
  ) {}

  async createSession(
    ttlHours = 24,
    understandingJobId?: string,
  ): Promise<GuestSession> {
    const sessionToken = `gst_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const session = await this.repository.create({
      sessionToken,
      expiresAt,
      understandingJobId,
    });

    // Non-blocking analytics tracking
    void this.analyticsService.trackSessionCreated(session.id).catch(() => null);

    return session;
  }

  async resumeSession(sessionToken: string): Promise<GuestSession> {
    const session = await this.repository.findByToken(sessionToken);

    if (!session) {
      throw new NotFoundException('Guest session not found.');
    }

    if (session.status === GuestSessionStatus.EXPIRED || new Date() > session.expiresAt) {
      if (session.status !== GuestSessionStatus.EXPIRED) {
        await this.repository.markExpired(session.id);
        void this.analyticsService.trackSessionExpired(session.id).catch(() => null);
      }
      throw new UnauthorizedException('Guest session has expired.');
    }

    return session;
  }

  async refreshSession(
    sessionToken: string,
    extendHours = 24,
  ): Promise<GuestSession> {
    const session = await this.resumeSession(sessionToken);
    const newExpiresAt = new Date(Date.now() + extendHours * 60 * 60 * 1000);

    return this.repository.refresh(session.id, newExpiresAt);
  }

  async completeSession(sessionToken: string): Promise<GuestSession> {
    const session = await this.resumeSession(sessionToken);
    return this.repository.markCompleted(session.id);
  }

  async convertSession(sessionToken: string): Promise<GuestSession> {
    const session = await this.repository.findByToken(sessionToken);
    if (!session) {
      throw new NotFoundException('Guest session not found.');
    }
    return this.repository.markConverted(session.id);
  }

  async expireSession(sessionToken: string): Promise<GuestSession> {
    const session = await this.repository.findByToken(sessionToken);
    if (!session) {
      throw new NotFoundException('Guest session not found.');
    }
    const updated = await this.repository.markExpired(session.id);
    void this.analyticsService.trackSessionExpired(session.id).catch(() => null);
    return updated;
  }

  async cleanupExpiredSessions(): Promise<number> {
    return this.repository.deleteExpired();
  }
}
