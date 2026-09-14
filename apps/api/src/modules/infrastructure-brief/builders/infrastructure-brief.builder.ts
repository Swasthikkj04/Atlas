import { Injectable } from '@nestjs/common';
import { SnapshotDetailDto } from '../../infrastructure-snapshots/dto/snapshot-detail.dto';
import { FindingDto } from '../../infrastructure-findings/dto/finding.dto';
import {
  InfrastructureBriefResult,
  InfrastructureBriefRecommendation,
  InfrastructureBriefHighlight,
} from '../contracts/infrastructure-brief-result.interface';

@Injectable()
export class InfrastructureBriefBuilder {
  build(
    snapshot: SnapshotDetailDto,
    findings: FindingDto[],
  ): InfrastructureBriefResult {
    const criticalFindings = findings.filter(
      (finding) => finding.severity === 'CRITICAL',
    );
    const critical = criticalFindings.length;

    const highFindings = findings.filter(
      (finding) => finding.severity === 'HIGH',
    );
    const high = highFindings.length;

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

    const archBrief = snapshotPayload?.technology?.architectureBrief;
    const changes = Array.isArray(snapshotPayload?.changes)
      ? snapshotPayload.changes
      : undefined;

    const highlights: InfrastructureBriefHighlight[] = [];

    // Critical & High findings highlights
    for (const f of findings) {
      if (f.severity === 'CRITICAL' || f.severity === 'HIGH') {
        highlights.push({
          id: f.id,
          severity: f.severity,
          title: f.title,
          description: f.description,
        });
      }
    }

    // TLS Certificate Expiry Horizon (< 30 days) highlights
    const certExpiryFinding = findings.find(
      (f) =>
        f.ruleId === 'ssl.certificate-expiry' ||
        f.title?.toLowerCase().includes('certificate expir'),
    );
    if (
      certExpiryFinding &&
      !highlights.some((h) => h.id === certExpiryFinding.id)
    ) {
      highlights.push({
        id: certExpiryFinding.id,
        severity: certExpiryFinding.severity,
        title: certExpiryFinding.title,
        description: certExpiryFinding.description,
      });
    } else if (
      !certExpiryFinding &&
      snapshotPayload?.ssl?.certificate?.validTo
    ) {
      const validTo = new Date(snapshotPayload.ssl.certificate.validTo);
      const now = new Date();
      const diffDays = Math.ceil(
        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays > 0 && diffDays <= 30) {
        highlights.push({
          id: 'hl-tls-expiry',
          severity: diffDays <= 15 ? 'HIGH' : 'MEDIUM',
          title: 'SSL Certificate Expiring Soon',
          description: `The TLS certificate will expire in ${diffDays} day(s).`,
        });
      }
    }

    // Changes highlights
    if (changes && changes.length > 0) {
      for (const c of changes) {
        const titleClass = (c.classification || 'CHANGE DETECTED').replace(
          /_/g,
          ' ',
        );
        highlights.push({
          id: c.id ? `chg-${c.id}` : 'chg-summary',
          severity: 'INFO',
          title: `${titleClass}: ${c.summary || c.description}`,
          description: c.description || c.summary,
        });
      }
    }

    // Integrations highlights
    if (archBrief?.integrations && archBrief.integrations.length > 0) {
      const integrationNames = archBrief.integrations
        .map((i: any) => i.name)
        .join(', ');
      highlights.push({
        id: 'hl-integrations',
        severity: 'INFO',
        title: 'External Integrations Detected',
        description: `External services integrated: ${integrationNames}.`,
      });
    }

    // Build summary
    let summary = '';
    if (critical > 0) {
      const topCritical = criticalFindings[0];
      summary = `Critical security condition observed for ${domain}: ${topCritical.title}. ${topCritical.description}`;
    } else if (changes && changes.length > 0) {
      const changeSummary = changes[0].summary || changes[0].description;
      summary = `Recent baseline comparison indicates ${changeSummary}.`;
      if (archBrief?.summary) {
        summary += ` ${archBrief.summary}`;
      }
    } else if (archBrief?.summary) {
      summary = archBrief.summary;
      if (archBrief.knownUnknowns && archBrief.knownUnknowns.length > 0) {
        const masked = archBrief.knownUnknowns
          .map((k: any) => k.dimension)
          .join(' and ');
        summary += ` ${masked} remain unobservable from external inspection.`;
      }
      if (findings.length === 0) {
        summary +=
          ' The current infrastructure configuration appears stable with no critical or high-severity gaps.';
      }
    } else {
      summary = this.buildExecutiveSummary(
        domain,
        snapshot,
        findings,
        critical,
        high,
      );
    }

    const recommendations = [
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
    ].slice(0, 5);

    const result: InfrastructureBriefResult & {
      architecture?: any;
      changes?: any[];
    } = {
      overallHealth,
      summary: this.formatSentence(summary),
      highlights: highlights.slice(0, 10),
      recommendations,
    };

    if (archBrief) {
      result.architecture = {
        summary: archBrief.summary,
        ingressPath: archBrief.architecturePath || archBrief.ingressPath || [],
        integrations: archBrief.integrations || [],
        knownUnknowns: archBrief.knownUnknowns || [],
        claimBoundaries: archBrief.claimBoundaries || [],
        layers: archBrief.layers || [],
        keyTechnologies: archBrief.keyTechnologies || [],
      };
    }

    if (changes) {
      result.changes = changes;
    }

    return result;
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
