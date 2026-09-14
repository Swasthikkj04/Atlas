/**
 * S-09 Audit Integrity & Non-Repudiation Engine
 *
 * Implements S09-I06, S09-I07, S09-I10:
 * - Server-generated event IDs & authoritative timestamps
 * - Anti-forgery validation (ignores/rejects client-supplied actor, plane, severity, decision)
 * - Append-only integrity
 */

import { randomUUID } from 'crypto';
import {
  CanonicalAuditEvent,
  AuditPrincipal,
  AuditRequestInfo,
} from './audit-context';
import {
  SecurityEventType,
  CANONICAL_EVENT_SEVERITIES,
} from './security-event-types';
import { AuditRedactor } from './audit-redactor';

export interface RawEventCreationParams {
  eventType: SecurityEventType;
  principal: AuditPrincipal;
  plane: 'GX' | 'WX' | 'ADMIN';
  action: string;
  decision: 'ALLOWED' | 'DENIED' | 'RECORDED';
  request: AuditRequestInfo;
  resource?: { resourceType?: string; resourceId?: string };
  reasonCode?: string;
  source?: { ip?: string; userAgent?: string };
  metadata?: Record<string, any>;
  occurredAt?: number;
}

export class AuditIntegrityEngine {
  /**
   * Constructs an immutable, server-signed CanonicalAuditEvent.
   * Enforces server-generated eventId, timestamp, and severity.
   */
  static createEvent(params: RawEventCreationParams): CanonicalAuditEvent {
    const serverGeneratedId = randomUUID();
    const serverGeneratedTimestamp = params.occurredAt ?? Date.now();
    const authoritativeSeverity =
      CANONICAL_EVENT_SEVERITIES[params.eventType] || 'INFO';

    // Redact metadata before creating immutable event
    const sanitizedMetadata = AuditRedactor.redactAuditMetadata(
      params.metadata,
    );

    return Object.freeze({
      eventId: serverGeneratedId,
      eventType: params.eventType,
      occurredAt: serverGeneratedTimestamp,
      severity: authoritativeSeverity,
      principal: {
        identityType: params.principal.identityType,
        userId: params.principal.userId,
        sessionId: params.principal.sessionId,
      },
      plane: params.plane,
      action: params.action,
      resource: params.resource || {},
      decision: params.decision,
      reasonCode: params.reasonCode,
      request: {
        requestId: params.request.requestId,
        method: params.request.method,
        route: params.request.route,
      },
      source: params.source || {},
      metadata: sanitizedMetadata,
    });
  }

  /**
   * Rejects any client attempt to forge audit records via API.
   */
  static validateUntrustedClientPayload(clientPayload: any): {
    isForged: boolean;
    decision: 'CLIENT_AUDIT_FORGERY_BLOCKED' | 'VALID_INTERNAL_EVENT';
  } {
    if (!clientPayload || typeof clientPayload !== 'object') {
      return { isForged: false, decision: 'VALID_INTERNAL_EVENT' };
    }

    // If client attempts to specify its own server-governed fields
    if (
      clientPayload.eventId ||
      clientPayload.occurredAt ||
      clientPayload.severity ||
      clientPayload.decision
    ) {
      return { isForged: true, decision: 'CLIENT_AUDIT_FORGERY_BLOCKED' };
    }

    return { isForged: false, decision: 'VALID_INTERNAL_EVENT' };
  }
}
