import { Injectable, Logger } from '@nestjs/common';
import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';

import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface DetectedDifference {
  module: FindingModule;
  category: FindingCategory;
  changeType: ChangeType;
  severity: ChangeSeverity;
  title: string;
  description: string;
}

@Injectable()
export class ChangeDetectionEngine {
  private readonly logger = new Logger(ChangeDetectionEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  async detectAndPersistChanges(
    domainId: string,
    previousSnapshotId: string,
    currentSnapshotId: string,
    previous: DiscoverySnapshot,
    current: DiscoverySnapshot,
  ): Promise<number> {
    const diffs = this.computeDifferences(previous, current);

    if (diffs.length === 0) {
      return 0;
    }

    const created = await this.prisma.changeHistory.createMany({
      data: diffs.map((diff) => ({
        domainId,
        previousSnapshotId,
        currentSnapshotId,
        module: diff.module,
        category: diff.category,
        changeType: diff.changeType,
        severity: diff.severity,
        title: diff.title,
        description: diff.description,
        detectedAt: new Date(),
      })),
    });

    this.logger.log(
      `Detected and persisted ${created.count} change event(s) between snapshots ${previousSnapshotId} and ${currentSnapshotId} for domain ${domainId}.`,
    );

    return created.count;
  }

  computeDifferences(
    previous: DiscoverySnapshot,
    current: DiscoverySnapshot,
  ): DetectedDifference[] {
    const differences: DetectedDifference[] = [];

    // 1. HTTP Security Headers
    this.diffSecurityHeaders(previous, current, differences);

    // 2. HTTP Server & Status
    this.diffHttpGeneral(previous, current, differences);

    // 3. TLS / SSL Certificates
    this.diffSsl(previous, current, differences);

    // 4. DNS Records
    this.diffDns(previous, current, differences);

    // 5. Technologies
    this.diffTechnologies(previous, current, differences);

    // 6. Multi-Signal Authoritative Provider Attribution (WX-1022)
    this.diffProviderAttribution(previous, current, differences);

    return differences;
  }

  private diffProviderAttribution(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: DetectedDifference[],
  ): void {
    const prevAttr = prev.attribution;
    const currAttr = curr.attribution;

    if (!prevAttr || !currAttr) {
      return;
    }

    // P0 Invariant (WX-1022): NO_FALSE_PROVIDER_CHANGE
    // Only detect provider change if BOTH states meet high attribution confidence.
    const isPrevHostingAuthoritative =
      prevAttr.hosting?.confidence === 'HIGH' &&
      (prevAttr.hosting?.decision === 'CONFIRMED' ||
        prevAttr.hosting?.decision === 'STRONGLY_INFERRED');

    const isCurrHostingAuthoritative =
      currAttr.hosting?.confidence === 'HIGH' &&
      (currAttr.hosting?.decision === 'CONFIRMED' ||
        currAttr.hosting?.decision === 'STRONGLY_INFERRED');

    if (
      isPrevHostingAuthoritative &&
      isCurrHostingAuthoritative &&
      prevAttr.hosting.provider &&
      currAttr.hosting.provider &&
      prevAttr.hosting.provider !== currAttr.hosting.provider
    ) {
      diffs.push({
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.TECHNOLOGY,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.HIGH,
        title: 'Hosting provider changed',
        description: `Hosting provider changed from '${prevAttr.hosting.provider}' to '${currAttr.hosting.provider}'.`,
      });
    }

    // Edge / CDN Provider diff
    const isPrevEdgeAuthoritative =
      prevAttr.edgeCdn?.confidence === 'HIGH' &&
      prevAttr.edgeCdn?.decision === 'CONFIRMED';
    const isCurrEdgeAuthoritative =
      currAttr.edgeCdn?.confidence === 'HIGH' &&
      currAttr.edgeCdn?.decision === 'CONFIRMED';

    if (
      isPrevEdgeAuthoritative &&
      isCurrEdgeAuthoritative &&
      prevAttr.edgeCdn.provider &&
      currAttr.edgeCdn.provider &&
      prevAttr.edgeCdn.provider !== currAttr.edgeCdn.provider
    ) {
      diffs.push({
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.TECHNOLOGY,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'Edge / CDN network changed',
        description: `Edge / CDN network changed from '${prevAttr.edgeCdn.provider}' to '${currAttr.edgeCdn.provider}'.`,
      });
    }
  }

  private diffSecurityHeaders(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: DetectedDifference[],
  ): void {
    const headerConfigs: Array<{
      key: string;
      displayName: string;
    }> = [
      { key: 'x-frame-options', displayName: 'X-Frame-Options' },
      {
        key: 'strict-transport-security',
        displayName: 'Strict-Transport-Security',
      },
      {
        key: 'content-security-policy',
        displayName: 'Content-Security-Policy',
      },
      { key: 'x-content-type-options', displayName: 'X-Content-Type-Options' },
      { key: 'referrer-policy', displayName: 'Referrer-Policy' },
    ];

    for (const config of headerConfigs) {
      const prevVal = this.getHeaderValue(prev.http?.headers, config.key);
      const currVal = this.getHeaderValue(curr.http?.headers, config.key);

      if (prevVal !== currVal) {
        if (!prevVal && currVal) {
          diffs.push({
            module: FindingModule.HTTP,
            category: FindingCategory.SECURITY_HEADER,
            changeType: ChangeType.ADDED,
            severity: ChangeSeverity.LOW,
            title: `${config.displayName} header added`,
            description: `${config.displayName} response header added with value '${currVal}'.`,
          });
        } else if (prevVal && !currVal) {
          diffs.push({
            module: FindingModule.HTTP,
            category: FindingCategory.SECURITY_HEADER,
            changeType: ChangeType.REMOVED,
            severity: ChangeSeverity.HIGH,
            title: `${config.displayName} header removed`,
            description: `${config.displayName} response header was removed (previously '${prevVal}').`,
          });
        } else if (prevVal && currVal && prevVal !== currVal) {
          diffs.push({
            module: FindingModule.HTTP,
            category: FindingCategory.SECURITY_HEADER,
            changeType: ChangeType.MODIFIED,
            severity: ChangeSeverity.MEDIUM,
            title: `${config.displayName} changed`,
            description: `${config.displayName} response header changed from '${prevVal}' to '${currVal}'.`,
          });
        }
      }
    }
  }

  private diffHttpGeneral(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: DetectedDifference[],
  ): void {
    // Web Server header
    const prevServer = this.getHeaderValue(prev.http?.headers, 'server');
    const currServer = this.getHeaderValue(curr.http?.headers, 'server');

    if (prevServer !== currServer && (prevServer || currServer)) {
      diffs.push({
        module: FindingModule.HTTP,
        category: FindingCategory.RESPONSE,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        title: 'Web server changed',
        description: `Web server changed from '${prevServer || 'None'}' to '${currServer || 'None'}'.`,
      });
    }

    // Status Code
    if (
      prev.http?.statusCode !== undefined &&
      curr.http?.statusCode !== undefined &&
      prev.http?.statusCode !== curr.http?.statusCode
    ) {
      diffs.push({
        module: FindingModule.HTTP,
        category: FindingCategory.RESPONSE,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'HTTP status code changed',
        description: `HTTP status code changed from '${prev.http.statusCode}' to '${curr.http.statusCode}'.`,
      });
    }
  }

  private diffSsl(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: DetectedDifference[],
  ): void {
    const prevCert = prev.ssl?.certificate;
    const currCert = curr.ssl?.certificate;

    // Certificate Expiry / Renewal
    if (
      prevCert?.validTo !== currCert?.validTo &&
      (prevCert?.validTo || currCert?.validTo)
    ) {
      diffs.push({
        module: FindingModule.SSL,
        category: FindingCategory.CERTIFICATE,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        title: 'TLS Certificate renewed',
        description: `Certificate validity changed from '${prevCert?.validTo || 'unknown'}' to '${currCert?.validTo || 'unknown'}'.`,
      });
    }

    // Certificate Issuer
    if (
      prevCert?.issuer !== currCert?.issuer &&
      (prevCert?.issuer || currCert?.issuer)
    ) {
      diffs.push({
        module: FindingModule.SSL,
        category: FindingCategory.CERTIFICATE,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'TLS Certificate issuer changed',
        description: `Certificate issuer changed from '${prevCert?.issuer || 'none'}' to '${currCert?.issuer || 'none'}'.`,
      });
    }

    // Authorization Status
    if (
      prev.ssl?.authorized !== undefined &&
      curr.ssl?.authorized !== undefined &&
      prev.ssl?.authorized !== curr.ssl?.authorized
    ) {
      diffs.push({
        module: FindingModule.SSL,
        category: FindingCategory.TLS,
        changeType: ChangeType.MODIFIED,
        severity: curr.ssl.authorized
          ? ChangeSeverity.LOW
          : ChangeSeverity.CRITICAL,
        title: curr.ssl.authorized
          ? 'TLS Certificate authorization restored'
          : 'TLS Certificate authorization failed',
        description: `TLS certificate authorization changed to ${curr.ssl.authorized ? 'valid' : 'invalid'}.`,
      });
    }
  }

  private diffDns(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: DetectedDifference[],
  ): void {
    // A records (IPv4)
    const prevA = (prev.dns?.a || []).slice().sort();
    const currA = (curr.dns?.a || []).slice().sort();
    if (
      !this.areArraysEqual(prevA, currA) &&
      (prevA.length > 0 || currA.length > 0)
    ) {
      diffs.push({
        module: FindingModule.DNS,
        category: FindingCategory.DNS_RECORD,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'DNS IPv4 addresses modified',
        description: `A records changed from [${prevA.join(', ')}] to [${currA.join(', ')}].`,
      });
    }

    // AAAA records (IPv6)
    const prevAaaa = (prev.dns?.aaaa || []).slice().sort();
    const currAaaa = (curr.dns?.aaaa || []).slice().sort();
    if (
      !this.areArraysEqual(prevAaaa, currAaaa) &&
      (prevAaaa.length > 0 || currAaaa.length > 0)
    ) {
      diffs.push({
        module: FindingModule.DNS,
        category: FindingCategory.DNS_RECORD,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        title: 'DNS IPv6 addresses modified',
        description: `AAAA records changed from [${prevAaaa.join(', ')}] to [${currAaaa.join(', ')}].`,
      });
    }

    // MX records
    const prevMx = (prev.dns?.mx || [])
      .map((r) => `${r.priority}:${r.exchange}`)
      .sort();
    const currMx = (curr.dns?.mx || [])
      .map((r) => `${r.priority}:${r.exchange}`)
      .sort();
    if (
      !this.areArraysEqual(prevMx, currMx) &&
      (prevMx.length > 0 || currMx.length > 0)
    ) {
      diffs.push({
        module: FindingModule.DNS,
        category: FindingCategory.DNS_RECORD,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'Mail server (MX) configuration modified',
        description: `Mail exchange records were updated.`,
      });
    }

    // DMARC & TXT
    const prevTxt = (prev.dns?.txt || [])
      .map((t) => (Array.isArray(t) ? t.join('') : String(t)))
      .sort();
    const currTxt = (curr.dns?.txt || [])
      .map((t) => (Array.isArray(t) ? t.join('') : String(t)))
      .sort();
    if (
      !this.areArraysEqual(prevTxt, currTxt) &&
      (prevTxt.length > 0 || currTxt.length > 0)
    ) {
      diffs.push({
        module: FindingModule.DNS,
        category: FindingCategory.DNS_RECORD,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'DNS TXT / DMARC records modified',
        description: `DNS TXT and policy records were updated.`,
      });
    }
  }

  private diffTechnologies(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: DetectedDifference[],
  ): void {
    const prevTechs = (prev.technology?.technologies || []).map((t: any) =>
      typeof t === 'string' ? t : t.name || String(t),
    );
    const currTechs = (curr.technology?.technologies || []).map((t: any) =>
      typeof t === 'string' ? t : t.name || String(t),
    );

    const prevSet = new Set(prevTechs);
    const currSet = new Set(currTechs);

    for (const tech of currTechs) {
      if (!prevSet.has(tech)) {
        diffs.push({
          module: FindingModule.TECHNOLOGY,
          category: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.ADDED,
          severity: ChangeSeverity.LOW,
          title: `Technology added: ${tech}`,
          description: `Technology ${tech} was detected on the target infrastructure.`,
        });
      }
    }

    for (const tech of prevTechs) {
      if (!currSet.has(tech)) {
        diffs.push({
          module: FindingModule.TECHNOLOGY,
          category: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.REMOVED,
          severity: ChangeSeverity.LOW,
          title: `Technology removed: ${tech}`,
          description: `Technology ${tech} is no longer detected on the target infrastructure.`,
        });
      }
    }
  }

  private getHeaderValue(
    headers: Record<string, string> | undefined,
    key: string,
  ): string | undefined {
    if (!headers) return undefined;
    const targetKey = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === targetKey) {
        return v;
      }
    }
    return undefined;
  }

  private areArraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
