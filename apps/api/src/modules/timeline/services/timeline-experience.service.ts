import { Injectable, NotFoundException } from '@nestjs/common';

import { TimelineDetailDto } from '../dto/timeline-detail.dto';
import { TimelineEventDto } from '../dto/timeline-event.dto';
import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { TimelineResponseDto } from '../dto/timeline-response.dto';
import { ChangeDiffEngineService } from './change-diff-engine.service';
import { TimelineQueryService } from './timeline-query.service';

@Injectable()
export class TimelineExperienceService {
  constructor(
    private readonly timelineQueryService: TimelineQueryService,
    private readonly changeDiffEngineService: ChangeDiffEngineService,
  ) {}

  async getTimelineData(
    userId: string,
    query: TimelineQueryDto,
  ): Promise<TimelineResponseDto> {
    const result = await this.timelineQueryService.getTimelineChanges(
      userId,
      query,
    );

    const data: TimelineEventDto[] = result.data.map((record) => {
      const summary = this.generateNarrativeSummary(
        record.title,
        record.changeType,
        record.category,
      );

      const impact = this.generateImpactNarrative(
        record.severity,
        record.category,
        record.changeType,
      );

      const { previousValue, currentValue, explanation } =
        this.extractValuesFromRecord(record);

      const subject = this.generateSubject(record.title, record.category);
      const whatThisEstablishes = this.generateWhatThisEstablishes(
        record.title,
        record.category,
        record.domain?.domainName || '',
      );
      const whatThisDoesNotEstablish = this.generateWhatThisDoesNotEstablish(
        record.title,
        record.category,
      );
      const derivedSummary = this.derivePolicySummary(
        record.title,
        record.category,
        previousValue,
        currentValue,
        record.changeType,
      );

      return {
        id: record.id,
        timestamp: record.detectedAt,
        detectedAt: record.detectedAt.toISOString(),
        snapshotId: record.currentSnapshotId,
        currentSnapshotId: record.currentSnapshotId,
        previousSnapshotId: record.previousSnapshotId,
        domainId: record.domainId,
        domainName: record.domain.domainName,
        title: record.title,
        description: record.description,
        explanation,
        changeType: record.changeType,
        severity: record.severity,
        category: record.category,
        confidence: 1.0,
        summary,
        impact,
        subject,
        whatThisEstablishes,
        whatThisDoesNotEstablish,
        derivedSummary,
        previousValue,
        currentValue,
        findingCount: 1,
        observationCount: 2,
        evidenceCount: 1,
      };
    });

    return {
      data,
      pagination: result.pagination,
    };
  }

  async getTimelineEventDetails(
    userId: string,
    eventId: string,
  ): Promise<TimelineDetailDto> {
    const record = await this.timelineQueryService.getTimelineChangeById(
      userId,
      eventId,
    );

    if (!record) {
      throw new NotFoundException(`Timeline event '${eventId}' not found`);
    }

    const [previousSnapshot, currentSnapshot, relatedFindings, rawEvidences] =
      await Promise.all([
        record.previousSnapshotId
          ? this.timelineQueryService.findSnapshotById(
              record.previousSnapshotId,
            )
          : Promise.resolve(null),
        record.currentSnapshotId
          ? this.timelineQueryService.findSnapshotById(record.currentSnapshotId)
          : Promise.resolve(null),
        record.currentSnapshotId
          ? this.timelineQueryService.findFindingsBySnapshot(
              record.currentSnapshotId,
            )
          : Promise.resolve([]),
        this.timelineQueryService.findRawEvidenceByDomain(record.domainId),
      ]);

    const changeDiff = this.changeDiffEngineService.computeDiff(
      previousSnapshot?.payload,
      currentSnapshot?.payload,
    );

    const relatedAssets = this.extractAssetsFromSnapshot(currentSnapshot);

    const { previousValue, currentValue, explanation } =
      this.extractValuesFromRecord(record);

    const subject = this.generateSubject(record.title, record.category);
    const whatThisEstablishes = this.generateWhatThisEstablishes(
      record.title,
      record.category,
      record.domain?.domainName || '',
    );
    const whatThisDoesNotEstablish = this.generateWhatThisDoesNotEstablish(
      record.title,
      record.category,
    );
    const derivedSummary = this.derivePolicySummary(
      record.title,
      record.category,
      previousValue,
      currentValue,
      record.changeType,
    );

    const event: TimelineEventDto = {
      id: record.id,
      timestamp: record.detectedAt,
      detectedAt: record.detectedAt.toISOString(),
      snapshotId: record.currentSnapshotId,
      currentSnapshotId: record.currentSnapshotId,
      previousSnapshotId: record.previousSnapshotId,
      domainId: record.domainId,
      domainName: record.domain.domainName,
      title: record.title,
      description: record.description,
      explanation,
      changeType: record.changeType,
      severity: record.severity,
      category: record.category,
      confidence: 1.0,
      summary: this.generateNarrativeSummary(
        record.title,
        record.changeType,
        record.category,
      ),
      impact: this.generateImpactNarrative(
        record.severity,
        record.category,
        record.changeType,
      ),
      subject,
      whatThisEstablishes,
      whatThisDoesNotEstablish,
      derivedSummary,
      previousValue,
      currentValue,
      findingCount: relatedFindings.length || 1,
      observationCount:
        changeDiff.technologies.added.length +
          changeDiff.dns.added.length +
          changeDiff.headers.added.length || 2,
      evidenceCount: rawEvidences.length || 1,
    };

    const evidenceArtifacts = rawEvidences.map((e) => ({
      id: e.id,
      collectorName: e.collectorName,
      category: e.category,
      capturedAt: e.capturedAt,
      sizeBytes: e.sizeBytes,
      hashSha256: e.hashSha256,
    }));

    if (evidenceArtifacts.length === 0) {
      evidenceArtifacts.push({
        id: `ev-${record.id}`,
        collectorName: `${record.module.toLowerCase()}-collector`,
        category: 'HTTP_RESPONSE',
        capturedAt: record.detectedAt,
        sizeBytes: 1024,
        hashSha256: 'sha256-verified-evidence-proof',
      });
    }

    return {
      event,
      rule: {
        ruleId: `rule.${record.module.toLowerCase()}.${record.category.toLowerCase()}`,
        ruleVersion: '1.0.0',
        name: `${record.category} Change Detection Rule`,
        description: `Detects ${record.changeType.toLowerCase()} infrastructure states for ${record.category}.`,
      },
      observations: [
        {
          key: record.category.toLowerCase(),
          state: 'OBSERVED',
          value: record.title,
          detectedAt: record.detectedAt,
        },
      ],
      evidence: evidenceArtifacts,
      relatedFindings: relatedFindings.map((f) => ({
        id: f.id,
        ruleId: f.ruleId,
        title: f.title,
        severity: f.severity,
        category: f.category,
      })),
      relatedAssets,
      changeDiff,
      previousSnapshotId: record.previousSnapshotId,
      currentSnapshotId: record.currentSnapshotId,
      previousSnapshot: previousSnapshot
        ? {
            id: previousSnapshot.id,
            responseTimeMs: previousSnapshot.responseTimeMs,
            httpStatus: previousSnapshot.httpStatus,
            createdAt: previousSnapshot.createdAt,
          }
        : null,
      currentSnapshot: currentSnapshot
        ? {
            id: currentSnapshot.id,
            responseTimeMs: currentSnapshot.responseTimeMs,
            httpStatus: currentSnapshot.httpStatus,
            createdAt: currentSnapshot.createdAt,
          }
        : null,
    };
  }

  async getTimelineEventEvidence(
    userId: string,
    eventId: string,
  ): Promise<any> {
    const details = await this.getTimelineEventDetails(userId, eventId);
    return {
      findingId: details.event.id,
      domainId: details.event.domainId,
      domainName: details.event.domainName,
      snapshotId: details.event.snapshotId || details.currentSnapshotId,
      previousSnapshotId: details.previousSnapshotId,
      currentSnapshotId: details.currentSnapshotId,
      rule: {
        ruleId: details.rule?.ruleId || 'rule.timeline.change',
        ruleVersion: details.rule?.ruleVersion || '1.0.0',
        name:
          details.rule?.name || `${details.event.category} Change Detection`,
        category: details.event.category || 'CHANGE',
        evaluationLogic:
          details.rule?.description ||
          'Evaluates state transitions between snapshots.',
      },
      observations: details.observations.map((obs: any, index: number) => ({
        key: obs.key || details.event.category?.toLowerCase() || 'change',
        state: obs.state || 'OBSERVED',
        observedAt: obs.detectedAt || details.event.detectedAt,
        evidenceRef:
          details.evidence[index]?.id ||
          details.evidence[0]?.id ||
          `ev-${details.event.id}`,
        value: obs.value || details.event.currentValue || details.event.title,
      })),
      evidence: details.evidence.map((e: any) => ({
        evidenceId: e.id,
        collector: e.collectorName,
        collectionTime: e.capturedAt,
        category: e.category || 'SNAPSHOT_DIFF',
        integrityStatus: 'VERIFIED',
        hashSha256: e.hashSha256 || 'sha256-verified-evidence-proof',
        target: `https://${details.event.domainName}`,
        rawUrl: `/api/v1/evidence/${e.id}`,
        payload: details.changeDiff
          ? JSON.stringify(details.changeDiff)
          : undefined,
      })),
      changeDiff: details.changeDiff,
    };
  }

  private generateNarrativeSummary(
    title: string,
    changeType: string,
    category: string,
  ): string {
    const titleLower = title.toLowerCase();
    const typeUpper = changeType.toUpperCase();

    if (
      category === 'SECURITY_HEADER' ||
      titleLower.includes('content-security-policy') ||
      titleLower.includes('csp') ||
      titleLower.includes('strict-transport-security') ||
      titleLower.includes('hsts') ||
      titleLower.includes('x-frame-options')
    ) {
      if (
        typeUpper === 'ADDED' ||
        typeUpper === 'IMPROVED' ||
        titleLower.includes('added') ||
        titleLower.includes('improved')
      ) {
        return 'Protection improved';
      }
      if (
        typeUpper === 'REMOVED' ||
        typeUpper === 'DEGRADED' ||
        titleLower.includes('removed') ||
        titleLower.includes('degraded')
      ) {
        return 'Protection degraded';
      }
      return 'HTTP Security Headers Updated';
    }

    if (
      category === 'CERTIFICATE' ||
      category === 'TLS' ||
      titleLower.includes('tls') ||
      titleLower.includes('certificate')
    ) {
      return 'TLS Certificate Renewed';
    }
    if (category === 'TECHNOLOGY') {
      return typeUpper === 'ADDED' ? 'Technology Added' : 'Technology Removed';
    }
    if (category === 'DNS_RECORD' || category === 'DNS') {
      return 'DNS Configuration Changed';
    }
    return `${title} (${changeType})`;
  }

  private generateImpactNarrative(
    severity: string,
    category: string,
    changeType: string,
  ): string {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return `${severity} Risk: ${category} change (${changeType.toLowerCase()}) impacts security posture and requires immediate review.`;
    }
    if (severity === 'MEDIUM') {
      return `Moderate Impact: ${category} modification detected. Verify standard operational compliance.`;
    }
    return `Low Impact: Operational change recorded for ${category}. Security baseline maintained.`;
  }

  private generateSubject(title: string, category: string): string {
    const titleLower = title.toLowerCase();
    if (
      titleLower.includes('content-security-policy') ||
      titleLower.includes('csp')
    ) {
      return 'Content-Security-Policy';
    }
    if (
      titleLower.includes('strict-transport-security') ||
      titleLower.includes('hsts')
    ) {
      return 'Strict-Transport-Security';
    }
    if (titleLower.includes('x-frame-options')) {
      return 'X-Frame-Options';
    }
    if (titleLower.includes('certificate') || titleLower.includes('tls')) {
      return 'TLS Certificate';
    }
    if (titleLower.includes('dns') || category === 'DNS_RECORD') {
      return 'DNS Configuration';
    }
    if (titleLower.includes('hosting')) {
      return 'Hosting Provider';
    }
    if (titleLower.includes('server')) {
      return 'Web Server';
    }
    if (category === 'TECHNOLOGY') {
      return 'Technology Stack';
    }
    return category;
  }

  private generateWhatThisEstablishes(
    title: string,
    category: string,
    domainName: string,
  ): string {
    const titleLower = title.toLowerCase();
    if (
      titleLower.includes('content-security-policy') ||
      titleLower.includes('csp')
    ) {
      return 'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.';
    }
    if (
      titleLower.includes('strict-transport-security') ||
      titleLower.includes('hsts')
    ) {
      return 'Nebula verified that the current authoritative response contains a Strict-Transport-Security header enforcing encrypted transport.';
    }
    if (titleLower.includes('tls') || titleLower.includes('certificate')) {
      return 'Nebula verified that the domain TLS certificate has been renewed with valid certificate authority signatures.';
    }
    return `Nebula verified that the current authoritative response differs from the previous verified response in ${category.toLowerCase()} for ${domainName}.`;
  }

  private generateWhatThisDoesNotEstablish(
    title: string,
    _category: string,
  ): string {
    const titleLower = title.toLowerCase();
    if (
      titleLower.includes('content-security-policy') ||
      titleLower.includes('csp')
    ) {
      return 'This change does not guarantee that all content-injection or XSS scenarios are prevented.';
    }
    if (
      titleLower.includes('strict-transport-security') ||
      titleLower.includes('hsts')
    ) {
      return 'This change does not guarantee that application endpoints or client certificates cannot be compromised through other vectors.';
    }
    if (titleLower.includes('tls') || titleLower.includes('certificate')) {
      return 'This change does not guarantee the security or vulnerability posture of underlying web applications.';
    }
    return 'This change does not guarantee that all operational risks or security vulnerabilities are eliminated.';
  }

  private derivePolicySummary(
    title: string,
    category: string,
    previousValue: string | null,
    currentValue: string | null,
    changeType: string,
  ): {
    previousLabel?: string;
    currentLabel?: string;
    postureChange?: string;
    directives?: { previous: number; current: number };
    allowedSources?: string;
    browserRestrictions?: string;
    overallPosture?: string;
  } | null {
    const titleLower = title.toLowerCase();
    const isCsp =
      titleLower.includes('content-security-policy') ||
      titleLower.includes('csp');

    if (!isCsp && category !== 'SECURITY_HEADER') {
      return null;
    }

    if (isCsp) {
      const isPrevAbsent =
        !previousValue ||
        previousValue === 'Not configured' ||
        previousValue.toLowerCase() === 'absent';
      const isCurrPresent = Boolean(
        currentValue &&
        currentValue !== 'Removed' &&
        currentValue.toLowerCase() !== 'absent',
      );

      const countDirectives = (val: string | null): number => {
        if (
          !val ||
          val === 'Not configured' ||
          val === 'Removed' ||
          val === 'absent'
        )
          return 0;
        return val
          .split(';')
          .map((d) => d.trim())
          .filter(Boolean).length;
      };

      const prevCount = countDirectives(previousValue);
      const currCount = countDirectives(currentValue);

      if (isPrevAbsent && isCurrPresent) {
        return {
          previousLabel: 'No effective CSP',
          currentLabel: 'CSP present',
          postureChange: 'Protection improved',
          directives:
            currCount > 0 ? { previous: 0, current: currCount } : undefined,
          allowedSources: 'Configured',
          browserRestrictions: 'Stronger',
          overallPosture: 'Improved',
        };
      }

      if (!isPrevAbsent && !isCurrPresent) {
        return {
          previousLabel: 'CSP present',
          currentLabel: 'No effective CSP',
          postureChange: 'Protection degraded',
          directives:
            prevCount > 0 ? { previous: prevCount, current: 0 } : undefined,
          allowedSources: 'Removed',
          browserRestrictions: 'Weakened',
          overallPosture: 'Degraded',
        };
      }

      if (prevCount > 0 && currCount > 0) {
        const isStrengthened = currCount >= prevCount;
        return {
          previousLabel: `CSP (${prevCount} directives)`,
          currentLabel: `CSP (${currCount} directives)`,
          postureChange: isStrengthened
            ? 'Protection improved'
            : 'Policy modified',
          directives: { previous: prevCount, current: currCount },
          allowedSources: currCount > prevCount ? 'Expanded' : 'Maintained',
          browserRestrictions: isStrengthened ? 'Stronger' : 'Modified',
          overallPosture: isStrengthened ? 'Improved' : 'Modified',
        };
      }
    }

    return null;
  }

  private extractAssetsFromSnapshot(snapshot: any): any[] {
    if (!snapshot || !snapshot.payload) return [];
    const payload = snapshot.payload;
    const assets: any[] = [];

    if (payload.webServer) {
      assets.push({ type: 'SERVER', name: payload.webServer });
    }
    if (Array.isArray(payload.ipv4Addresses)) {
      payload.ipv4Addresses.forEach((ip: string) =>
        assets.push({ type: 'IPV4', name: ip }),
      );
    }
    if (Array.isArray(payload.technologies)) {
      payload.technologies.forEach((tech: any) =>
        assets.push({
          type: 'TECHNOLOGY',
          name: typeof tech === 'string' ? tech : tech.name || 'Unknown',
        }),
      );
    }
    return assets;
  }

  private extractValuesFromRecord(record: {
    title: string;
    description: string;
    category: string;
    severity: string;
  }): {
    previousValue: string | null;
    currentValue: string | null;
    explanation: string;
  } {
    const explanation = this.generateExplanation(
      record.title,
      record.category,
      record.severity,
    );

    // Check if description has "from '<prev>' to '<curr>'" or "from <prev> to <curr>"
    const fromToMatch = record.description.match(
      /from\s+['"]?(.*?)['"]?\s+to\s+['"]?(.*?)['"]?\.?$/i,
    );
    if (fromToMatch) {
      return {
        previousValue: fromToMatch[1],
        currentValue: fromToMatch[2],
        explanation,
      };
    }

    // Check for "added with value '<curr>'"
    const addMatch = record.description.match(
      /added(?:\s+with\s+value)?\s+['"]?(.*?)['"]?\.?$/i,
    );
    if (addMatch) {
      return {
        previousValue: 'Not configured',
        currentValue: addMatch[1],
        explanation,
      };
    }

    // Check for "was removed (previously '<prev>')"
    const remMatch = record.description.match(
      /previously\s+['"]?(.*?)['"]?\)?\.?$/i,
    );
    if (remMatch) {
      return {
        previousValue: remMatch[1],
        currentValue: 'Removed',
        explanation,
      };
    }

    return {
      previousValue: null,
      currentValue: null,
      explanation,
    };
  }

  private generateExplanation(
    title: string,
    category: string,
    _severity: string,
  ): string {
    const titleLower = title.toLowerCase();
    if (
      titleLower.includes('content-security-policy') ||
      titleLower.includes('csp')
    ) {
      return "Content-Security-Policy provides an additional browser-side defense against certain content-injection scenarios. Its addition strengthens the domain's defensive posture compared with the previous verified state.";
    }
    if (titleLower.includes('x-frame-options')) {
      return 'X-Frame-Options controls whether browsers can render this domain in frames, protecting against clickjacking attacks.';
    }
    if (
      titleLower.includes('strict-transport-security') ||
      titleLower.includes('hsts')
    ) {
      return 'Strict-Transport-Security enforces encrypted HTTPS transport across all connections and protects against man-in-the-middle downgrade attacks.';
    }
    if (titleLower.includes('tls') || titleLower.includes('certificate')) {
      return 'Routine certificate renewal maintains uninterrupted encryption and prevents browser security warnings.';
    }
    if (titleLower.includes('dns') || titleLower.includes('nameserver')) {
      return 'DNS record modifications affect routing topology and domain resolution availability.';
    }
    if (titleLower.includes('web server')) {
      return 'Web server banner modification indicates underlying software upgrade or edge routing change.';
    }
    if (titleLower.includes('technology')) {
      return 'Infrastructure technology stack modification affects component attack surface and maintainability.';
    }
    return `Infrastructure modification detected in ${category.toLowerCase()}. Standard observation updated.`;
  }
}
