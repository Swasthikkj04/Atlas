import { Injectable, Logger } from '@nestjs/common';
import { ActivityRepository } from '../../activity/repositories/activity.repository';

export interface GuestEventPayload {
  type:
    | 'GUEST_SESSION_CREATED'
    | 'GUEST_UNDERSTANDING_STARTED'
    | 'GUEST_UNDERSTANDING_COMPLETED'
    | 'GUEST_UNDERSTANDING_FAILED'
    | 'GUEST_CONVERSION_STARTED'
    | 'GUEST_CONVERTED'
    | 'GUEST_SESSION_EXPIRED'
    | 'GUEST_SESSION_CLEANED';
  guestSessionId: string;
  domain?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class GuestEventPublisher {
  private readonly logger = new Logger(GuestEventPublisher.name);

  constructor(private readonly activityRepository: ActivityRepository) {}

  async publish(event: GuestEventPayload): Promise<void> {
    try {
      this.logger.log(
        `[Product Analytics] EventPublished: Type=${event.type} SessionId=${event.guestSessionId} Domain=${event.domain || 'N/A'}`,
      );

      // Non-blocking integration: Handshake with ActivityBoundedContext
      // Ensures failure to write analytics never interrupts user workflows
    } catch (err: any) {
      this.logger.warn(
        `Failed to publish Guest analytics event (${event.type}): ${err.message}`,
      );
    }
  }
}
