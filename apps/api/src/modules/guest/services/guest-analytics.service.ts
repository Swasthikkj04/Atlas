import { Injectable } from '@nestjs/common';
import { GuestEventPublisher } from '../publishers/guest-event.publisher';

@Injectable()
export class GuestAnalyticsService {
  constructor(private readonly publisher: GuestEventPublisher) {}

  async trackSessionCreated(guestSessionId: string): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_SESSION_CREATED',
      guestSessionId,
      timestamp: new Date(),
    });
  }

  async trackUnderstandingStarted(
    guestSessionId: string,
    domain: string,
  ): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_UNDERSTANDING_STARTED',
      guestSessionId,
      domain,
      timestamp: new Date(),
    });
  }

  async trackUnderstandingCompleted(
    guestSessionId: string,
    domain: string,
    durationSeconds: number,
  ): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_UNDERSTANDING_COMPLETED',
      guestSessionId,
      domain,
      timestamp: new Date(),
      metadata: { durationSeconds },
    });
  }

  async trackUnderstandingFailed(
    guestSessionId: string,
    domain: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_UNDERSTANDING_FAILED',
      guestSessionId,
      domain,
      timestamp: new Date(),
      metadata: { errorMessage: errorMessage || 'Unknown failure' },
    });
  }

  async trackConversionStarted(guestSessionId: string): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_CONVERSION_STARTED',
      guestSessionId,
      timestamp: new Date(),
    });
  }

  async trackConverted(
    guestSessionId: string,
    domain: string,
    durationSeconds: number,
  ): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_CONVERTED',
      guestSessionId,
      domain,
      timestamp: new Date(),
      metadata: { durationSeconds },
    });
  }

  async trackSessionExpired(guestSessionId: string): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_SESSION_EXPIRED',
      guestSessionId,
      timestamp: new Date(),
    });
  }

  async trackSessionCleaned(guestSessionId: string): Promise<void> {
    await this.publisher.publish({
      type: 'GUEST_SESSION_CLEANED',
      guestSessionId,
      timestamp: new Date(),
    });
  }
}
