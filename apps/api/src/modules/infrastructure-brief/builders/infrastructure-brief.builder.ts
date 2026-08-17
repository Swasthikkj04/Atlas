import { Injectable } from '@nestjs/common';
import { SnapshotDetailDto } from '../../infrastructure-snapshots/dto/snapshot-detail.dto';
import { FindingDto } from '../../infrastructure-findings/dto/finding.dto';
import {
  InfrastructureBriefResult,
  InfrastructureBriefRecommendation,
} from '../contracts/infrastructure-brief-result.interface';

@Injectable()
export class InfrastructureBriefBuilder {
  build(
    snapshot: SnapshotDetailDto,
    findings: FindingDto[],
  ): InfrastructureBriefResult {
    const critical = findings.filter(
      (finding) => finding.severity === 'CRITICAL',
    ).length;

    const high = findings.filter(
      (finding) => finding.severity === 'HIGH',
    ).length;

    let overallHealth = 'Excellent';

    if (critical > 0) {
      overallHealth = 'Critical';
    } else if (high > 0) {
      overallHealth = 'Poor';
    } else if (findings.length > 0) {
      overallHealth = 'Fair';
    }

    const snapshotPayload = (snapshot.payload || {}) as any;
    let domain =
      snapshot.domainName ||
      snapshotPayload?.domain ||
      snapshotPayload?.domainName;

    if (!domain || domain === 'the target domain') {
      const httpUrl =
        snapshotPayload?.http?.finalUrl || snapshotPayload?.http?.url;
      if (typeof httpUrl === 'string' && httpUrl.length > 0) {
        domain = httpUrl.replace(/^https?:\/\//i, '').split('/')[0];
      }
    }

    if (!domain || domain === 'the target domain') {
      for (const f of findings) {
        const text = `${(f as any).whyItMatters || ''} ${f.description || ''}`;
        const match = text.match(/for\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (match && match[1]) {
          domain = match[1];
          break;
        }
      }
    }

    if (!domain) {
      domain = 'the target domain';
    }

    const severityMap: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      INFO: 0,
    };

    const sortedFindings = [...findings].sort(
      (a, b) => (severityMap[b.severity] ?? 0) - (severityMap[a.severity] ?? 0),
    );

    const summary = this.buildExecutiveSummary(
      domain,
      snapshot,
      sortedFindings,
      critical,
      high,
    );

    return {
      overallHealth,
      summary,
      highlights: findings
        .filter(
          (finding) =>
            finding.severity === 'CRITICAL' || finding.severity === 'HIGH',
        )
        .slice(0, 5)
        .map((finding) => ({
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
        })),
      recommendations: [
        ...new Map(
          findings
            .flatMap((finding) =>
              Array.isArray(finding.recommendations)
                ? finding.recommendations
                : [],
            )
            .map((recommendation: InfrastructureBriefRecommendation) => [
              recommendation.title,
              recommendation,
            ]),
        ).values(),
      ].slice(0, 5),
    };
  }

  private buildExecutiveSummary(
    domain: string,
    snapshot: SnapshotDetailDto,
    findings: FindingDto[],
    criticalCount: number,
    highCount: number,
  ): string {
    const snapshotPayload = (snapshot.payload || {}) as any;

    const actionableFindings = findings.filter(
      (f) =>
        f.severity !== 'INFO' &&
        f.severity !== 'INFORMATIONAL' &&
        !f.title.toLowerCase().includes('infrastructure processed'),
    );

    const topFinding = this.formatTopFinding(actionableFindings[0]?.title);
    const secondaryFindingSentence = this.formatSecondaryFindingSentence(
      actionableFindings[1]?.title,
    );

    const securityPositiveSignal =
      this.getSecurityPositiveSignal(snapshotPayload);
    const technologyOrSignal = this.getTechnologyOrSignal(snapshotPayload);

    // Deterministic variant selection based on snapshot ID
    const seed = snapshot.id || domain;
    const hashIndex = this.getDeterministicIndex(seed, 4);

    if (criticalCount > 0 || highCount >= 3) {
      const criticalText =
        criticalCount === 0
          ? 'no critical findings'
          : criticalCount === 1
            ? '1 critical finding'
            : `${criticalCount} critical findings`;

      const highText =
        highCount === 0
          ? 'no high-severity findings'
          : highCount === 1
            ? '1 high-severity finding'
            : `${highCount} high-severity findings`;

      // BRIEF-04 — Risk Focused
      return this.formatSentence(
        `The current infrastructure surface for ${domain} is operational, but ${topFinding} deserves attention in the next review cycle.${
          secondaryFindingSentence ? ' ' + secondaryFindingSentence : ''
        } The snapshot contains ${criticalText} and ${highText}, giving a clear indication of where attention should be focused.`,
      );
    }

    // Variants for baseline & operational posture
    switch (hashIndex) {
      case 0:
        // BRIEF-01 — Balanced
        return this.formatSentence(
          `${domain} is reachable and operating normally, with the current snapshot showing a small number of configuration gaps rather than an immediate critical exposure. The most significant attention point is ${topFinding}.${
            secondaryFindingSentence ? ' ' + secondaryFindingSentence : ''
          } Nothing observed indicates an immediate service-impacting condition.`,
        );
      case 1:
        // BRIEF-02 — Security First
        return this.formatSentence(
          `The current snapshot shows a generally established security baseline for ${domain}, with ${securityPositiveSignal}. The main gap is ${topFinding}, while ${
            secondaryFindingSentence ? secondaryFindingSentence + ' ' : ''
          }no critical findings were observed in this snapshot.`,
        );
      case 2:
        // BRIEF-03 — Infrastructure Posture
        return this.formatSentence(
          `${domain} is currently reachable and responding successfully. The infrastructure snapshot is largely defined by ${technologyOrSignal}, with the main configuration concern being ${topFinding}.${
            secondaryFindingSentence ? ' ' + secondaryFindingSentence : ''
          } The observed issues are configuration-level findings rather than evidence of an immediate outage.`,
        );
      case 3:
      default:
        // BRIEF-05 — Minimal Executive
        return this.formatSentence(
          `${domain} is currently reachable and has no critical findings in this snapshot. The primary area requiring attention is ${topFinding}.${
            secondaryFindingSentence ? ' ' + secondaryFindingSentence : ''
          } Overall, the observed posture points to targeted configuration improvements rather than immediate infrastructure risk.`,
        );
    }
  }

  private formatTopFinding(title?: string): string {
    if (!title) return 'identified configuration posture';
    const lower = title.trim();
    if (lower.toLowerCase().includes('spf record not found'))
      return 'the missing SPF record';
    if (lower.toLowerCase().includes('dmarc record not found'))
      return 'the missing DMARC record';
    if (lower.toLowerCase().includes('ipv6 not configured'))
      return 'the missing IPv6 configuration';
    if (lower.toLowerCase().includes('server header exposed'))
      return 'the exposed Server header';
    if (lower.toLowerCase().startsWith('missing '))
      return `the ${lower.toLowerCase()}`;
    return `the ${lower.toLowerCase()}`;
  }

  private formatSecondaryFindingSentence(title?: string): string {
    if (!title) return '';
    const lower = title.trim().toLowerCase();
    if (lower.includes('ipv6 not configured'))
      return 'IPv6 is also not currently configured.';
    if (lower.includes('dmarc record not found'))
      return 'A DMARC policy is also not currently published.';
    if (lower.includes('spf record not found'))
      return 'An SPF record is also not currently published.';
    if (lower.includes('server header exposed'))
      return 'The Server response header is also exposed.';
    return `Secondary observation includes ${title}.`;
  }

  private getSecurityPositiveSignal(payload: any): string {
    if (
      payload?.ssl?.valid ||
      payload?.http?.headers?.['strict-transport-security']
    ) {
      return 'enforced TLS transport security';
    }
    if (payload?.http?.reachable) {
      return 'active HTTP response availability';
    }
    return 'basic network connectivity';
  }

  private getTechnologyOrSignal(payload: any): string {
    const techs = Array.isArray(payload?.technology?.technologies)
      ? payload.technology.technologies.map((t: any) => t.name)
      : [];
    if (techs.length > 0) {
      return `detected technology components (${techs.slice(0, 3).join(', ')})`;
    }
    return 'active DNS routing and web endpoint availability';
  }

  private getDeterministicIndex(seed: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % max;
  }

  private formatSentence(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  }
}
