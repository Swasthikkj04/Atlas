import { Injectable } from '@nestjs/common';
import { GuestSession, GuestSessionStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class GuestSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    sessionToken: string;
    expiresAt: Date;
    understandingJobId?: string;
  }): Promise<GuestSession> {
    return this.prisma.guestSession.create({
      data: {
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
        understandingJobId: data.understandingJobId || null,
        status: GuestSessionStatus.ACTIVE,
      },
    });
  }

  async findByToken(sessionToken: string): Promise<GuestSession | null> {
    return this.prisma.guestSession.findUnique({
      where: { sessionToken },
    });
  }

  async findById(id: string): Promise<GuestSession | null> {
    return this.prisma.guestSession.findUnique({
      where: { id },
    });
  }

  async refresh(id: string, newExpiresAt: Date): Promise<GuestSession> {
    return this.prisma.guestSession.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
      },
    });
  }

  async markCompleted(id: string): Promise<GuestSession> {
    return this.prisma.guestSession.update({
      where: { id },
      data: {
        status: GuestSessionStatus.COMPLETED,
      },
    });
  }

  async markConverted(id: string): Promise<GuestSession> {
    return this.prisma.guestSession.update({
      where: { id },
      data: {
        status: GuestSessionStatus.CONVERTED,
      },
    });
  }

  async markExpired(id: string): Promise<GuestSession> {
    return this.prisma.guestSession.update({
      where: { id },
      data: {
        status: GuestSessionStatus.EXPIRED,
      },
    });
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    const result = await this.prisma.guestSession.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    return result.count;
  }
}
