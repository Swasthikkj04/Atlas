import {
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SnapshotDriftForensicsResponseDto } from '../../infrastructure-snapshots/dto/snapshot-drift.dto';
import { WorkspaceAuditService } from '../../audit/services/workspace-audit.service';
import {
  DriftAlertCategory,
  DriftAlertDto,
  DriftAlertStatus,
} from '../dto/drift-alert.dto';

@Injectable()
export class DriftAlertService {
  private readonly logger = new Logger(DriftAlertService.name);
  private readonly alertsStore: Map<string, DriftAlertDto> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: WorkspaceAuditService,
  ) {}

  /**
   * Evaluates computed snapshot drift and triggers active alerts if critical regressions exist.
   */
  async evaluateAndTriggerAlerts(
    userId: string,
    domainId: string,
    drift: SnapshotDriftForensicsResponseDto,
  ): Promise<DriftAlertDto[]> {
    const generatedAlerts: DriftAlertDto[] = [];

    // Check if drift warrants alerts (Score >= 45, or high severity diffs)
    const shouldAlert =
      drift.riskLevel === 'HIGH' ||
      drift.riskLevel === 'CRITICAL' ||
      drift.dns.nameserverShiftDetected ||
      drift.http.changes.some(
        (c) => c.type === 'REMOVED' && c.severity === 'HIGH',
      );

    if (!shouldAlert) {
      return [];
    }

    // Determine category and title
    let category: DriftAlertCategory = 'TECH_STACK';
    let title = 'Infrastructure Configuration Drift Detected';
    let summary = `Observed infrastructure drift with ${drift.riskLevel} risk level (Score: ${drift.driftScore}/100).`;

    if (drift.dns.nameserverShiftDetected) {
      category = 'DNS';
      title = 'Critical DNS Nameserver Delegation Altered';
      summary =
        'Authoritative DNS nameservers shifted unexpectedly. High risk of routing hijack or dangling delegation.';
    } else if (
      drift.http.changes.some(
        (c) => c.type === 'REMOVED' && c.field.includes('Header:'),
      )
    ) {
      category = 'HTTP_SECURITY';
      title = 'Security Header Protection Removed';
      summary =
        'One or more critical HTTP security headers (CSP / HSTS) were removed in the latest snapshot.';
    } else if (drift.tls.issuerChanged) {
      category = 'TLS';
      title = 'TLS Certificate Authority Changed';
      summary =
        'Certificate issuer authority changed between snapshots. Verify certificate lifecycle.';
    } else if (drift.dns.ipShiftDetected) {
      category = 'ROUTING';
      title = 'Ingress IPv4 Routing Shifted';
      summary =
        'Public Anycast or edge IP routing address changed for this domain.';
    }

    const alertId = `alert_${crypto.randomBytes(6).toString('hex')}`;
    const allChanges = [
      ...drift.dns.changes,
      ...drift.tls.changes,
      ...drift.http.changes,
      ...drift.technology.changes,
    ];

    const newAlert: DriftAlertDto = {
      id: alertId,
      domainId,
      domainName: drift.domainName,
      snapshotId: drift.targetSnapshotId,
      previousSnapshotId: drift.baseSnapshotId,
      driftScore: drift.driftScore,
      riskLevel: drift.riskLevel,
      status: 'ACTIVE',
      category,
      title,
      summary,
      forensicNarrative: drift.forensicNarrative,
      changes: allChanges,
      createdAt: new Date(),
    };

    this.alertsStore.set(alertId, newAlert);
    generatedAlerts.push(newAlert);

    this.logger.warn(
      `[DriftAlertTriggered] alertId=${alertId} domain=${drift.domainName} risk=${drift.riskLevel} score=${drift.driftScore}`,
    );

    // Record audit event
    this.auditService?.recordWorkspaceEvent({
      userId,
      eventType: 'UNDERSTANDING_TRIGGERED',
      action: 'DRIFT_ALERT_TRIGGERED',
      resourceType: 'DRIFT_ALERT',
      resourceId: alertId,
      metadata: {
        domainId,
        riskLevel: drift.riskLevel,
        driftScore: drift.driftScore,
        category,
      },
    });

    return generatedAlerts;
  }

  /**
   * Returns all alerts for a specific domain belonging to the user.
   */
  async getAlertsByDomain(
    userId: string,
    domainId: string,
  ): Promise<DriftAlertDto[]> {
    // Verify domain ownership
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, userId },
      select: { id: true },
    });

    if (!domain) {
      throw new NotFoundException(`Domain '${domainId}' not found.`);
    }

    return Array.from(this.alertsStore.values())
      .filter((a) => a.domainId === domainId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Returns all active alerts for all domains within user's workspace.
   */
  async getWorkspaceAlerts(userId: string): Promise<DriftAlertDto[]> {
    const userDomains = await this.prisma.domain.findMany({
      where: { userId },
      select: { id: true },
    });

    const domainIds = new Set(userDomains.map((d) => d.id));

    return Array.from(this.alertsStore.values())
      .filter((a) => domainIds.has(a.domainId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledges an active alert.
   */
  async acknowledgeAlert(
    userId: string,
    domainId: string,
    alertId: string,
  ): Promise<DriftAlertDto> {
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, userId },
      select: { id: true },
    });

    if (!domain) {
      throw new NotFoundException(`Domain '${domainId}' not found.`);
    }

    const alert = this.alertsStore.get(alertId);
    if (!alert || alert.domainId !== domainId) {
      throw new NotFoundException(`Alert '${alertId}' not found.`);
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    this.alertsStore.set(alertId, alert);

    this.auditService?.recordWorkspaceEvent({
      userId,
      eventType: 'DRIFT_ALERT_ACKNOWLEDGED',
      action: 'DRIFT_ALERT_ACKNOWLEDGED',
      resourceType: 'DRIFT_ALERT',
      resourceId: alertId,
      metadata: { domainId },
    });

    return alert;
  }

  /**
   * Resolves an alert.
   */
  async resolveAlert(
    userId: string,
    domainId: string,
    alertId: string,
  ): Promise<DriftAlertDto> {
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, userId },
      select: { id: true },
    });

    if (!domain) {
      throw new NotFoundException(`Domain '${domainId}' not found.`);
    }

    const alert = this.alertsStore.get(alertId);
    if (!alert || alert.domainId !== domainId) {
      throw new NotFoundException(`Alert '${alertId}' not found.`);
    }

    alert.status = 'RESOLVED';
    this.alertsStore.set(alertId, alert);

    this.auditService?.recordWorkspaceEvent({
      userId,
      eventType: 'DRIFT_ALERT_RESOLVED',
      action: 'DRIFT_ALERT_RESOLVED',
      resourceType: 'DRIFT_ALERT',
      resourceId: alertId,
      metadata: { domainId },
    });

    return alert;
  }
}
