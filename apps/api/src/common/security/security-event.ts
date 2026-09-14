/**
 * S-09 Security Event Factory & Dispatcher
 *
 * Provides standard, streamlined methods to emit structured, server-governed audit events.
 */

import {
  CanonicalAuditEvent,
  AuditPrincipal,
  AuditRequestInfo,
} from './audit-context';
import { SecurityEventType } from './security-event-types';
import { AuditIntegrityEngine } from './audit-integrity';
import { SecurityAuditWriter } from './security-audit-writer';
import { SecurityDetector, DetectionAlert } from './security-detector';

export class SecurityEvent {
  /**
   * Creates, validates, stores, and analyzes a security audit event.
   */
  static emit(params: {
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
  }): { event: CanonicalAuditEvent; alert: DetectionAlert | null } {
    const event = AuditIntegrityEngine.createEvent(params);
    SecurityAuditWriter.record(event);
    const alert = SecurityDetector.analyzeEvent(event);

    return { event, alert };
  }
}
