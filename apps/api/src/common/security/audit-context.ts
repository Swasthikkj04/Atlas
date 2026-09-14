/**
 * S-09 Canonical Audit Event Structure & Context Interface
 *
 * Implements S09 Canonical Audit Event Contract & Correlation Invariants (S09-I01, S09-I02, S09-I11):
 * - Predictable structured audit payload
 * - Server-enforced principal and plane attribution
 * - Correlation identification (requestId, sessionId, principal, decision)
 */

import {
  SecurityEventType,
  SecuritySeverityLevel,
} from './security-event-types';

export interface AuditPrincipal {
  identityType: 'ANONYMOUS' | 'GUEST' | 'USER' | 'ADMIN';
  userId?: string;
  sessionId?: string;
}

export interface AuditResource {
  resourceType?: string;
  resourceId?: string;
}

export interface AuditRequestInfo {
  requestId: string;
  method: string;
  route: string;
}

export interface AuditSourceInfo {
  ip?: string;
  userAgent?: string;
}

export interface CanonicalAuditEvent {
  eventId: string;
  eventType: SecurityEventType;
  occurredAt: number;
  severity: SecuritySeverityLevel;
  principal: AuditPrincipal;
  plane: 'GX' | 'WX' | 'ADMIN';
  action: string;
  resource: AuditResource;
  decision: 'ALLOWED' | 'DENIED' | 'RECORDED';
  reasonCode?: string;
  request: AuditRequestInfo;
  source: AuditSourceInfo;
  metadata?: Record<string, any>;
}
