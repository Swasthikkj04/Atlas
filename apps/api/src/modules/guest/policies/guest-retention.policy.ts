import { Injectable } from '@nestjs/common';
import { GuestSession, GuestSessionStatus } from '@prisma/client';

@Injectable()
export class GuestRetentionPolicy {
  readonly retentionWindowHours = 24;

  isExpired(expiresAt: Date, now: Date = new Date()): boolean {
    return now > expiresAt;
  }

  isEligibleForCleanup(session: GuestSession, now: Date = new Date()): boolean {
    // 1. Converted sessions must NEVER be cleaned up as guest data
    if (session.status === GuestSessionStatus.CONVERTED) {
      return false;
    }

    // 2. Session must be past its expiration timestamp
    return this.isExpired(session.expiresAt, now);
  }
}
