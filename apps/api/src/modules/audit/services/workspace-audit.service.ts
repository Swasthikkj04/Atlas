import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CanonicalAuditEvent } from '../../../common/security/audit-context';
import {
  CANONICAL_EVENT_SEVERITIES,
  WorkspaceSecurityEventType,
} from '../../../common/security/security-event-types';
import { SecurityAuditWriter } from '../../../common/security/security-audit-writer';

export interface RecordWorkspaceEventParams {
  userId: string;
  eventType: WorkspaceSecurityEventType;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface WorkspaceAuditLogQuery {
  eventType?: string;
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
}

export interface WorkspaceAuditLogResponse {
  events: CanonicalAuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class WorkspaceAuditService {
  /**
   * Records a strictly scoped workspace mutation or security audit event.
   */
  recordWorkspaceEvent(
    params: RecordWorkspaceEventParams,
  ): CanonicalAuditEvent {
    const occurredAt = Date.now();
    const eventId = `aud_evt_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const severity = CANONICAL_EVENT_SEVERITIES[params.eventType] || 'INFO';

    const auditEvent: CanonicalAuditEvent = {
      eventId,
      eventType: params.eventType,
      occurredAt,
      severity,
      principal: {
        identityType: 'USER',
        userId: params.userId,
      },
      plane: 'WX',
      action: params.action,
      resource: {
        resourceType: params.resourceType || 'WORKSPACE',
        resourceId: params.resourceId,
      },
      decision: 'RECORDED',
      request: {
        requestId: params.requestId || `req_${randomUUID().slice(0, 8)}`,
        method: 'MUTATION',
        route: '/api/v1/workspace',
      },
      source: {
        ip: params.ip,
        userAgent: params.userAgent,
      },
      metadata: params.metadata,
    };

    SecurityAuditWriter.record(auditEvent);
    return auditEvent;
  }

  /**
   * Queries workspace audit records strictly scoped to the requesting user's workspace.
   */
  getWorkspaceAuditLogs(
    userId: string,
    query: WorkspaceAuditLogQuery = {},
  ): WorkspaceAuditLogResponse {
    const result = SecurityAuditWriter.query({
      plane: 'WX',
      requestingUserId: userId,
      targetUserId: userId,
      eventType: query.eventType,
    });

    if (!result.allowed || !result.events) {
      return {
        events: [],
        total: 0,
        limit: query.limit || 50,
        offset: query.offset || 0,
      };
    }

    let events = result.events;

    if (query.startDate) {
      events = events.filter((e) => e.occurredAt >= query.startDate);
    }
    if (query.endDate) {
      events = events.filter((e) => e.occurredAt <= query.endDate);
    }

    // Sort descending by timestamp
    events.sort((a, b) => b.occurredAt - a.occurredAt);

    const total = events.length;
    const limit = Math.min(Math.max(query.limit || 50, 1), 100);
    const offset = Math.max(query.offset || 0, 0);

    const paginatedEvents = events.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total,
      limit,
      offset,
    };
  }
}
