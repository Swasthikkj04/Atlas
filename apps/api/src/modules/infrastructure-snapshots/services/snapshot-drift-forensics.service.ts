import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  DiffItemDto,
  DnsDriftSummaryDto,
  DriftRiskLevel,
  HttpDriftSummaryDto,
  SnapshotDriftForensicsResponseDto,
  TechDriftSummaryDto,
  TlsDriftSummaryDto,
} from '../dto/snapshot-drift.dto';

const NOISE_HEADERS = new Set([
  'date',
  'expires',
  'last-modified',
  'etag',
  'cf-ray',
  'cf-cache-status',
  'x-request-id',
  'x-amzn-trace-id',
  'x-runtime',
  'x-response-time',
  'age',
  'server-timing',
  'x-served-by',
  'x-cache',
  'x-cache-hits',
  'x-timer',
  'x-varnish',
  'set-cookie',
]);

@Injectable()
export class SnapshotDriftForensicsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compares two snapshots and produces comprehensive infrastructure drift forensics.
   */
  async computeSnapshotDrift(
    userId: string,
    domainId: string,
    targetSnapshotId: string,
    baseSnapshotId?: string,
  ): Promise<SnapshotDriftForensicsResponseDto> {
    // 1. Verify workspace domain ownership
    const domain = await this.prisma.domain.findFirst({
      where: { id: domainId, userId },
      select: { id: true, domainName: true },
    });

    if (!domain) {
      throw new NotFoundException(
        `Domain '${domainId}' not found in workspace.`,
      );
    }

    // 2. Load target snapshot
    const target = await this.prisma.infrastructureSnapshot.findFirst({
      where: { id: targetSnapshotId, domainId },
      include: { domain: true },
    });

    if (!target) {
      throw new NotFoundException(
        `Target snapshot '${targetSnapshotId}' not found.`,
      );
    }

    // 3. Resolve base snapshot (explicit or preceding)
    let base: any = null;
    if (baseSnapshotId) {
      base = await this.prisma.infrastructureSnapshot.findFirst({
        where: { id: baseSnapshotId, domainId },
      });
      if (!base) {
        throw new NotFoundException(
          `Base snapshot '${baseSnapshotId}' not found.`,
        );
      }
    } else {
      // Find immediately preceding snapshot
      base = await this.prisma.infrastructureSnapshot.findFirst({
        where: {
          domainId,
          createdAt: { lt: target.createdAt },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const targetPayload = (target.payload ||
      {}) as unknown as DiscoverySnapshot;
    const basePayload = (base?.payload || {}) as unknown as DiscoverySnapshot;

    const baseId = base?.id || target.id;
    const baseDate = base?.createdAt || target.createdAt;
    const targetDate = target.createdAt;

    // 4. Perform Layer Diffs
    const dnsDrift = this.diffDns(basePayload.dns, targetPayload.dns);
    const tlsDrift = this.diffTls(basePayload.ssl, targetPayload.ssl);
    const httpDrift = this.diffHttp(basePayload.http, targetPayload.http);
    const techDrift = this.diffTech(
      basePayload.technology,
      targetPayload.technology,
    );

    // 5. Calculate Drift Score & Risk Level
    const { driftScore, riskLevel } = this.calculateDriftScore(
      dnsDrift,
      tlsDrift,
      httpDrift,
      techDrift,
    );

    const totalChangesCount =
      dnsDrift.changes.length +
      tlsDrift.changes.length +
      httpDrift.changes.length +
      techDrift.changes.length;

    // 6. Generate Forensic Narrative
    const narrative = this.generateForensicNarrative(
      domain.domainName,
      dnsDrift,
      tlsDrift,
      httpDrift,
      techDrift,
      driftScore,
    );

    return {
      baseSnapshotId: baseId,
      targetSnapshotId: target.id,
      domainId: domain.id,
      domainName: domain.domainName,
      baseCapturedAt: baseDate,
      targetCapturedAt: targetDate,
      driftScore,
      riskLevel,
      hasMeaningfulDrift: totalChangesCount > 0,
      totalChangesCount,
      forensicNarrative: narrative,
      dns: dnsDrift,
      tls: tlsDrift,
      http: httpDrift,
      technology: techDrift,
    };
  }

  private diffDns(base?: any, target?: any): DnsDriftSummaryDto {
    const changes: DiffItemDto[] = [];
    if (!base && !target)
      return {
        changes: [],
        ipShiftDetected: false,
        nameserverShiftDetected: false,
      };

    const baseA = new Set<string>(base?.a || []);
    const targetA = new Set<string>(target?.a || []);
    const baseNs = new Set<string>(base?.ns || []);
    const targetNs = new Set<string>(target?.ns || []);

    let ipShift = false;
    let nsShift = false;

    // Compare A records
    const addedA = [...targetA].filter((ip) => !baseA.has(ip));
    const removedA = [...baseA].filter((ip) => !targetA.has(ip));
    if (addedA.length > 0 || removedA.length > 0) {
      ipShift = true;
      changes.push({
        field: 'A Records (IPv4)',
        type: 'MODIFIED',
        previousValue: [...baseA],
        currentValue: [...targetA],
        description: `IPv4 routing altered: added [${addedA.join(', ')}], removed [${removedA.join(', ')}]`,
        severity: addedA.length > 0 && baseA.size > 0 ? 'MODERATE' : 'LOW',
      });
    }

    // Compare NS records
    const addedNs = [...targetNs].filter((ns) => !baseNs.has(ns));
    const removedNs = [...baseNs].filter((ns) => !targetNs.has(ns));
    if (addedNs.length > 0 || removedNs.length > 0) {
      nsShift = true;
      changes.push({
        field: 'Nameservers (NS)',
        type: 'MODIFIED',
        previousValue: [...baseNs],
        currentValue: [...targetNs],
        description: `Authoritative DNS delegates altered: added [${addedNs.join(', ')}]`,
        severity: 'HIGH',
      });
    }

    // Compare CNAME
    const baseCname = (base?.cname || []).join(', ');
    const targetCname = (target?.cname || []).join(', ');
    if (baseCname !== targetCname && (baseCname || targetCname)) {
      changes.push({
        field: 'CNAME Target',
        type: 'MODIFIED',
        previousValue: baseCname,
        currentValue: targetCname,
        description: `CNAME alias target changed from "${baseCname}" to "${targetCname}"`,
        severity: 'MODERATE',
      });
    }

    return {
      changes,
      ipShiftDetected: ipShift,
      nameserverShiftDetected: nsShift,
    };
  }

  private diffTls(base?: any, target?: any): TlsDriftSummaryDto {
    const changes: DiffItemDto[] = [];
    if (!base && !target) return { changes: [], issuerChanged: false };

    const baseIssuer =
      typeof base?.issuer === 'string'
        ? base.issuer
        : base?.issuer?.O || base?.issuer?.CN || '';
    const targetIssuer =
      typeof target?.issuer === 'string'
        ? target.issuer
        : target?.issuer?.O || target?.issuer?.CN || '';
    const issuerChanged = Boolean(
      baseIssuer && targetIssuer && baseIssuer !== targetIssuer,
    );

    if (issuerChanged) {
      changes.push({
        field: 'Certificate Issuer',
        type: 'MODIFIED',
        previousValue: baseIssuer,
        currentValue: targetIssuer,
        description: `Certificate authority changed from ${baseIssuer} to ${targetIssuer}`,
        severity: 'NOTABLE' as DriftRiskLevel,
      });
    }

    if (base?.validTo && target?.validTo && base.validTo !== target.validTo) {
      changes.push({
        field: 'Certificate Validity Window',
        type: 'MODIFIED',
        previousValue: base.validTo,
        currentValue: target.validTo,
        description: `Certificate expiration date refreshed from ${base.validTo} to ${target.validTo}`,
        severity: 'CLEAN',
      });
    }

    return {
      changes,
      daysRemainingPrevious: base?.daysRemaining,
      daysRemainingCurrent: target?.daysRemaining,
      issuerChanged,
    };
  }

  private diffHttp(base?: any, target?: any): HttpDriftSummaryDto {
    const changes: DiffItemDto[] = [];
    let noiseCount = 0;

    const prevStatus = base?.statusCode;
    const currStatus = target?.statusCode;

    if (prevStatus && currStatus && prevStatus !== currStatus) {
      changes.push({
        field: 'HTTP Response Status',
        type: 'MODIFIED',
        previousValue: prevStatus,
        currentValue: currStatus,
        description: `Endpoint response status changed from ${prevStatus} to ${currStatus}`,
        severity:
          currStatus >= 500 ? 'CRITICAL' : currStatus >= 400 ? 'HIGH' : 'LOW',
      });
    }

    // Security headers diffing
    const baseHeaders = base?.headers || {};
    const targetHeaders = target?.headers || {};
    const criticalHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
    ];

    for (const h of criticalHeaders) {
      const baseVal = baseHeaders[h];
      const targetVal = targetHeaders[h];

      if (baseVal && !targetVal) {
        changes.push({
          field: `Header: ${h}`,
          type: 'REMOVED',
          previousValue: baseVal,
          currentValue: null,
          description: `Security header "${h}" was removed in recent snapshot.`,
          severity: 'HIGH',
        });
      } else if (!baseVal && targetVal) {
        changes.push({
          field: `Header: ${h}`,
          type: 'ADDED',
          previousValue: null,
          currentValue: targetVal,
          description: `Security header "${h}" was implemented.`,
          severity: 'CLEAN',
        });
      }
    }

    // Count ephemeral suppressed noise
    for (const key of Object.keys(targetHeaders)) {
      if (NOISE_HEADERS.has(key.toLowerCase())) {
        noiseCount++;
      }
    }

    return {
      changes,
      previousStatus: prevStatus,
      currentStatus: currStatus,
      noiseHeadersSuppressed: noiseCount,
    };
  }

  private diffTech(base?: any, target?: any): TechDriftSummaryDto {
    const changes: DiffItemDto[] = [];
    const baseTechMap = new Map<string, string>();
    const targetTechMap = new Map<string, string>();

    const baseList = base?.technologies || [];
    const targetList = target?.technologies || [];

    for (const t of baseList) {
      baseTechMap.set(t.name || t.id, t.version || '');
    }
    for (const t of targetList) {
      targetTechMap.set(t.name || t.id, t.version || '');
    }

    const added: string[] = [];
    const removed: string[] = [];

    for (const [name, version] of targetTechMap.entries()) {
      if (!baseTechMap.has(name)) {
        added.push(name);
        changes.push({
          field: `Technology: ${name}`,
          type: 'ADDED',
          currentValue: version || 'detected',
          description: `Detected new technology: ${name}${version ? ' (v' + version + ')' : ''}`,
          severity: 'LOW',
        });
      }
    }

    for (const [name, version] of baseTechMap.entries()) {
      if (!targetTechMap.has(name)) {
        removed.push(name);
        changes.push({
          field: `Technology: ${name}`,
          type: 'REMOVED',
          previousValue: version || 'detected',
          description: `Technology no longer detected: ${name}`,
          severity: 'MODERATE',
        });
      }
    }

    return {
      changes,
      addedTechnologies: added,
      removedTechnologies: removed,
    };
  }

  private calculateDriftScore(
    dns: DnsDriftSummaryDto,
    tls: TlsDriftSummaryDto,
    http: HttpDriftSummaryDto,
    tech: TechDriftSummaryDto,
  ): { driftScore: number; riskLevel: DriftRiskLevel } {
    let score = 0;

    if (dns.nameserverShiftDetected) score += 40;
    if (dns.ipShiftDetected) score += 20;

    if (http.currentStatus && http.currentStatus >= 500) score += 40;
    else if (http.currentStatus && http.currentStatus >= 400) score += 20;

    for (const c of http.changes) {
      if (c.type === 'REMOVED' && c.severity === 'HIGH') score += 25;
    }

    if (tls.issuerChanged) score += 15;
    if (tech.removedTechnologies.length > 0) score += 15;
    if (tech.addedTechnologies.length > 0) score += 10;

    score = Math.min(100, score);

    let riskLevel: DriftRiskLevel = 'CLEAN';
    if (score >= 70) riskLevel = 'CRITICAL';
    else if (score >= 45) riskLevel = 'HIGH';
    else if (score >= 20) riskLevel = 'MODERATE';
    else if (score > 0) riskLevel = 'LOW';

    return { driftScore: score, riskLevel };
  }

  private generateForensicNarrative(
    domainName: string,
    dns: DnsDriftSummaryDto,
    tls: TlsDriftSummaryDto,
    http: HttpDriftSummaryDto,
    tech: TechDriftSummaryDto,
    driftScore: number,
  ): string[] {
    const narrative: string[] = [];

    if (driftScore === 0) {
      narrative.push(
        `Infrastructure for ${domainName} is completely stable with zero detected configuration drift.`,
      );
      return narrative;
    }

    if (dns.nameserverShiftDetected) {
      narrative.push(
        `Critical DNS nameserver delegation changed. Verify domain registrar integrity.`,
      );
    }
    if (dns.ipShiftDetected) {
      narrative.push(`Public IPv4 ingress routing updated.`);
    }
    if (tls.issuerChanged) {
      narrative.push(`TLS certificate authority changed.`);
    }
    if (tech.addedTechnologies.length > 0) {
      narrative.push(
        `Discovered new active infrastructure technologies: ${tech.addedTechnologies.join(', ')}.`,
      );
    }
    if (tech.removedTechnologies.length > 0) {
      narrative.push(
        `Decommissioned or hidden technologies: ${tech.removedTechnologies.join(', ')}.`,
      );
    }

    return narrative;
  }
}
