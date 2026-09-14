import { Injectable, Logger } from '@nestjs/common';
import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  DetectedTechnology,
  TopologyLayer,
} from '../../../infrastructure/discovery/technology/contracts';
import {
  ChangeCategory,
  ChangeSignificance,
  ForensicChangeEvent,
  ForensicExplanation,
  InfrastructureDeltaState,
  TemporalDeltaResult,
} from '../contracts/temporal-delta.interface';

/**
 * Ephemeral headers and signal names that represent normal runtime telemetry fluctuations,
 * not meaningful infrastructure change.
 */
const EPHEMERAL_HEADERS = new Set([
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
]);

@Injectable()
export class TemporalDeltaEngineService {
  private readonly logger = new Logger(TemporalDeltaEngineService.name);

  /**
   * Computes temporal forensic delta between previous verified understanding and current understanding.
   *
   * Core Question:
   * "What changed in this infrastructure since the previous verified understanding,
   *  why does it matter, and does anything require attention?"
   */
  computeTemporalDelta(
    domainId: string,
    previous: DiscoverySnapshot | null,
    current: DiscoverySnapshot,
    previousSnapshotId?: string,
    currentSnapshotId: string = 'current',
  ): TemporalDeltaResult {
    if (!previous) {
      return {
        hasMeaningfulChanges: false,
        totalChangesCount: 0,
        changesBySignificance: {
          critical: 0,
          important: 0,
          notable: 0,
          informational: 0,
        },
        attentionRequiredCount: 0,
        events: [],
        suppressedNoiseCount: 0,
        currentSnapshotId,
        currentUnderstandingAt: new Date(),
      };
    }

    let suppressedNoiseCount = 0;
    const individualEvents: ForensicChangeEvent[] = [];

    // 1. Noise Suppression & Ephemeral Header Analysis
    suppressedNoiseCount += this.countSuppressedNoise(previous, current);

    // 2. Technology & Runtime Lifecycle Diffs (T23.2 & T23.4)
    this.diffTechnologies(
      domainId,
      previous,
      current,
      previousSnapshotId,
      currentSnapshotId,
      individualEvents,
    );

    // 3. Ingress & Gateway Diffs (T23.2 & T23.4)
    this.diffGatewaysAndEdge(
      domainId,
      previous,
      current,
      previousSnapshotId,
      currentSnapshotId,
      individualEvents,
    );

    // 4. TLS / SSL Security Posture Diffs (T23.2 & T23.4)
    this.diffTlsSecurity(
      domainId,
      previous,
      current,
      previousSnapshotId,
      currentSnapshotId,
      individualEvents,
    );

    // 5. Security Headers Posture Diffs (T23.2 & T23.4)
    this.diffSecurityHeaders(
      domainId,
      previous,
      current,
      previousSnapshotId,
      currentSnapshotId,
      individualEvents,
    );

    // 6. DNS & Origin Routing Diffs (T23.2 & T23.4)
    this.diffDnsAndRouting(
      domainId,
      previous,
      current,
      previousSnapshotId,
      currentSnapshotId,
      individualEvents,
    );

    // 7. Multi-Layer Blast Radius & Forensic Grouping (T23.6)
    const groupedEvents = this.groupCorrelatedForensics(
      domainId,
      individualEvents,
      previousSnapshotId,
      currentSnapshotId,
    );

    // 8. Calculate Significance Metrics
    const changesBySignificance = {
      critical: groupedEvents.filter((e) => e.significance === 'CRITICAL')
        .length,
      important: groupedEvents.filter((e) => e.significance === 'IMPORTANT')
        .length,
      notable: groupedEvents.filter((e) => e.significance === 'NOTABLE').length,
      informational: groupedEvents.filter(
        (e) => e.significance === 'INFORMATIONAL',
      ).length,
    };

    const attentionRequiredCount = groupedEvents.filter(
      (e) => e.explanation.attentionRequired,
    ).length;

    return {
      hasMeaningfulChanges: groupedEvents.length > 0,
      totalChangesCount: groupedEvents.length,
      changesBySignificance,
      attentionRequiredCount,
      events: groupedEvents,
      suppressedNoiseCount,
      previousSnapshotId,
      currentSnapshotId,
      currentUnderstandingAt: new Date(),
    };
  }

  /**
   * Identifies ephemeral fluctuations that are suppressed to prevent noisy feeds (T23.3).
   */
  private countSuppressedNoise(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
  ): number {
    let count = 0;
    const prevHeaders = prev.http?.headers || {};
    const currHeaders = curr.http?.headers || {};

    const allKeys = new Set([
      ...Object.keys(prevHeaders).map((k) => k.toLowerCase()),
      ...Object.keys(currHeaders).map((k) => k.toLowerCase()),
    ]);

    for (const key of allKeys) {
      if (EPHEMERAL_HEADERS.has(key)) {
        const prevVal = this.getHeaderValue(prevHeaders, key);
        const currVal = this.getHeaderValue(currHeaders, key);
        if (prevVal !== currVal) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Technology & Runtime Lifecycle Diffs (T23.2)
   */
  private diffTechnologies(
    domainId: string,
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    prevSnapId: string | undefined,
    currSnapId: string,
    events: ForensicChangeEvent[],
  ): void {
    const prevTechs: DetectedTechnology[] = (
      prev.technology?.technologies || []
    ).map((t: any) =>
      typeof t === 'string'
        ? ({
            id: `tech-${t.toLowerCase()}`,
            name: t,
            category: 'Web Server',
          } as any)
        : t,
    );

    const currTechs: DetectedTechnology[] = (
      curr.technology?.technologies || []
    ).map((t: any) =>
      typeof t === 'string'
        ? ({
            id: `tech-${t.toLowerCase()}`,
            name: t,
            category: 'Web Server',
          } as any)
        : t,
    );

    const prevMap = new Map<string, DetectedTechnology>();
    for (const t of prevTechs) {
      prevMap.set(this.normalizeTechKey(t), t);
    }

    const currMap = new Map<string, DetectedTechnology>();
    for (const t of currTechs) {
      currMap.set(this.normalizeTechKey(t), t);
    }

    // Technology Newly Observed (ADDED)
    for (const [key, currTech] of currMap.entries()) {
      if (!prevMap.has(key)) {
        const significance: ChangeSignificance =
          currTech.category?.toLowerCase().includes('edge') ||
          currTech.category?.toLowerCase().includes('server')
            ? 'IMPORTANT'
            : 'NOTABLE';

        events.push({
          id: `delta-tech-added-${currTech.id}`,
          domainId,
          previousSnapshotId: prevSnapId,
          currentSnapshotId: currSnapId,
          title: `Technology observed: ${currTech.name}`,
          summary: `${currTech.name}${currTech.version ? ` (${currTech.version})` : ''} newly became observable in public telemetry.`,
          state: 'ADDED',
          significance,
          category: 'technology',
          module: FindingModule.TECHNOLOGY,
          findingCategory: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.ADDED,
          severity: ChangeSeverity.LOW,
          layer: TopologyLayer.APPLICATION,
          blastRadiusLayers: [TopologyLayer.APPLICATION],
          technologyId: currTech.id,
          technologyName: currTech.name,
          currentState: currTech,
          previousEvidenceReferences: [],
          currentEvidenceReferences:
            currTech.evidence?.map((e) => e.source) || [],
          detectedAt: new Date(),
          explanation: {
            whatChanged: `${currTech.name} appeared in observed infrastructure`,
            whyWeBelieveIt: `Current telemetry exposes matching signatures (${currTech.evidence?.map((e) => e.indicator).join(', ') || 'explicit headers'}).`,
            whatItMeans: `The application infrastructure newly demonstrates presence of ${currTech.name} (${currTech.role || currTech.category || 'technology component'}).`,
            whatWeCannotConclude: `This does not establish when the technology was originally deployed or what internal infrastructure topology hosts it.`,
            impact: `Architectural surface expanded.`,
            attention: `No action required.`,
            attentionRequired: false,
          },
        });
      }
    }

    // Technology No Longer Observable (REMOVED - Anti-overreach)
    for (const [key, prevTech] of prevMap.entries()) {
      if (!currMap.has(key)) {
        const significance: ChangeSignificance =
          prevTech.category?.toLowerCase().includes('edge') ||
          prevTech.category?.toLowerCase().includes('server')
            ? 'IMPORTANT'
            : 'NOTABLE';

        events.push({
          id: `delta-tech-removed-${prevTech.id}`,
          domainId,
          previousSnapshotId: prevSnapId,
          currentSnapshotId: currSnapId,
          title: `Technology no longer observed: ${prevTech.name}`,
          summary: `${prevTech.name} is no longer observable from current public telemetry.`,
          state: 'REMOVED',
          significance,
          category: 'technology',
          module: FindingModule.TECHNOLOGY,
          findingCategory: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.REMOVED,
          severity: ChangeSeverity.LOW,
          layer: TopologyLayer.APPLICATION,
          blastRadiusLayers: [TopologyLayer.APPLICATION],
          technologyId: prevTech.id,
          technologyName: prevTech.name,
          previousState: prevTech,
          previousEvidenceReferences:
            prevTech.evidence?.map((e) => e.source) || [],
          currentEvidenceReferences: [],
          detectedAt: new Date(),
          explanation: {
            whatChanged: `${prevTech.name} is no longer observable from public telemetry`,
            whyWeBelieveIt: `Previous understanding exposed ${prevTech.name} signatures, which are absent in current response telemetry.`,
            whatItMeans: `${prevTech.name} is either decommissioned, behind an obfuscating proxy, or no longer exposed to public requests.`,
            whatWeCannotConclude: `This does not prove the technology was deleted internally; public telemetry only establishes absence of external visibility.`,
            impact: `Observed component footprint reduced.`,
            attention: `No action required.`,
            attentionRequired: false,
          },
        });
      }
    }

    // Technology Attribute / Version Modified (MODIFIED)
    for (const [key, currTech] of currMap.entries()) {
      const prevTech = prevMap.get(key);
      if (
        prevTech &&
        prevTech.version &&
        currTech.version &&
        prevTech.version !== currTech.version
      ) {
        events.push({
          id: `delta-tech-version-${currTech.id}`,
          domainId,
          previousSnapshotId: prevSnapId,
          currentSnapshotId: currSnapId,
          title: `${currTech.name} runtime changed: ${prevTech.version} → ${currTech.version}`,
          summary: `${currTech.name} version updated from ${prevTech.version} to ${currTech.version}.`,
          state: 'MODIFIED',
          significance: 'NOTABLE',
          category: 'technology',
          module: FindingModule.TECHNOLOGY,
          findingCategory: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.MODIFIED,
          severity: ChangeSeverity.LOW,
          layer: TopologyLayer.APPLICATION,
          blastRadiusLayers: [TopologyLayer.APPLICATION],
          technologyId: currTech.id,
          technologyName: currTech.name,
          previousState: prevTech,
          currentState: currTech,
          previousEvidenceReferences:
            prevTech.evidence?.map((e) => e.source) || [],
          currentEvidenceReferences:
            currTech.evidence?.map((e) => e.source) || [],
          detectedAt: new Date(),
          explanation: {
            whatChanged: `${currTech.name} runtime changed: ${prevTech.version} → ${currTech.version}`,
            whyWeBelieveIt: `Current telemetry exposes ${currTech.name} ${currTech.version}. Previous understanding exposed ${prevTech.name} ${prevTech.version}.`,
            whatItMeans: `The observed server-side runtime boundary changed between the two verified understandings.`,
            whatWeCannotConclude: `This does not establish why the upgrade occurred, who performed it, or what deployment platform was used.`,
            impact: `No architectural regression observed.`,
            attention: `No action required.`,
            attentionRequired: false,
          },
        });
      }
    }
  }

  /**
   * Ingress & Gateway Diffs (T23.2 & T23.4)
   */
  private diffGatewaysAndEdge(
    domainId: string,
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    prevSnapId: string | undefined,
    currSnapId: string,
    events: ForensicChangeEvent[],
  ): void {
    const prevServer = this.getHeaderValue(prev.http?.headers, 'server');
    const currServer = this.getHeaderValue(curr.http?.headers, 'server');

    if (prevServer !== currServer && (prevServer || currServer)) {
      events.push({
        id: `delta-server-header`,
        domainId,
        previousSnapshotId: prevSnapId,
        currentSnapshotId: currSnapId,
        title: `Gateway server banner changed`,
        summary: `Observed server header changed from '${prevServer || 'none'}' to '${currServer || 'none'}'.`,
        state: 'MODIFIED',
        significance: 'IMPORTANT',
        category: 'edge_cdn',
        module: FindingModule.HTTP,
        findingCategory: FindingCategory.RESPONSE,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        layer: TopologyLayer.GATEWAY,
        blastRadiusLayers: [TopologyLayer.GATEWAY],
        previousState: { server: prevServer },
        currentState: { server: currServer },
        previousEvidenceReferences: ['headers.server'],
        currentEvidenceReferences: ['headers.server'],
        detectedAt: new Date(),
        explanation: {
          whatChanged: `Gateway server header changed from '${prevServer || 'none'}' to '${currServer || 'none'}'`,
          whyWeBelieveIt: `Direct public HTTP response banner comparison.`,
          whatItMeans: `Ingress web server or reverse proxy identity presented to clients has mutated.`,
          whatWeCannotConclude: `This does not prove internal backend architecture changed if an edge proxy was reconfigured.`,
          impact: `Gateway ingress banner updated.`,
          attention: `No action required.`,
          attentionRequired: false,
        },
      });
    }
  }

  /**
   * TLS / SSL Security Posture Diffs (T23.2 & T23.4)
   */
  private diffTlsSecurity(
    domainId: string,
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    prevSnapId: string | undefined,
    currSnapId: string,
    events: ForensicChangeEvent[],
  ): void {
    const prevCert = prev.ssl?.certificate;
    const currCert = curr.ssl?.certificate;

    // Certificate Authorization Failure (CRITICAL)
    if (
      prev.ssl?.authorized !== undefined &&
      curr.ssl?.authorized !== undefined &&
      prev.ssl?.authorized !== curr.ssl?.authorized
    ) {
      const isAuthorized = curr.ssl.authorized;
      events.push({
        id: `delta-tls-authorization`,
        domainId,
        previousSnapshotId: prevSnapId,
        currentSnapshotId: currSnapId,
        title: isAuthorized
          ? 'TLS Certificate authorization restored'
          : 'TLS Certificate authorization failed',
        summary: isAuthorized
          ? 'TLS certificate is now properly trusted and authorized by public root CAs.'
          : 'TLS certificate authorization failed (untrusted, expired, or invalid hostname).',
        state: 'MODIFIED',
        significance: isAuthorized ? 'IMPORTANT' : 'CRITICAL',
        category: 'tls_ssl',
        module: FindingModule.SSL,
        findingCategory: FindingCategory.TLS,
        changeType: ChangeType.MODIFIED,
        severity: isAuthorized ? ChangeSeverity.LOW : ChangeSeverity.CRITICAL,
        layer: TopologyLayer.EDGE,
        blastRadiusLayers: [TopologyLayer.EDGE, TopologyLayer.GATEWAY],
        previousState: { authorized: prev.ssl.authorized },
        currentState: { authorized: curr.ssl.authorized },
        previousEvidenceReferences: ['ssl.authorized'],
        currentEvidenceReferences: ['ssl.authorized'],
        detectedAt: new Date(),
        explanation: {
          whatChanged: `TLS certificate authorization status changed to ${isAuthorized ? 'AUTHORIZED' : 'UNAUTHORIZED'}`,
          whyWeBelieveIt: `TLS handshake validation state evaluated against standard trust store.`,
          whatItMeans: isAuthorized
            ? `Encrypted sessions are verified by valid certificate authorities.`
            : `Clients connecting via HTTPS will encounter browser security warnings.`,
          whatWeCannotConclude: `This does not indicate root cause (private key mismatch, DNS drift, or CA revocation).`,
          impact: isAuthorized
            ? `Security posture normalized.`
            : `Critical security barrier compromised.`,
          attention: isAuthorized
            ? `No action required.`
            : `Action required: Review and re-issue valid TLS certificate immediately.`,
          attentionRequired: !isAuthorized,
        },
      });
    }

    // Certificate Issuer Change (NOTABLE / INFORMATIONAL)
    if (
      prevCert?.issuer !== currCert?.issuer &&
      (prevCert?.issuer || currCert?.issuer)
    ) {
      events.push({
        id: `delta-tls-issuer`,
        domainId,
        previousSnapshotId: prevSnapId,
        currentSnapshotId: currSnapId,
        title: 'TLS Certificate issuer changed',
        summary: `Certificate authority changed from '${prevCert?.issuer || 'none'}' to '${currCert?.issuer || 'none'}'.`,
        state: 'MODIFIED',
        significance: 'NOTABLE',
        category: 'tls_ssl',
        module: FindingModule.SSL,
        findingCategory: FindingCategory.CERTIFICATE,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        layer: TopologyLayer.EDGE,
        blastRadiusLayers: [TopologyLayer.EDGE],
        previousState: { issuer: prevCert?.issuer },
        currentState: { issuer: currCert?.issuer },
        previousEvidenceReferences: ['ssl.certificate.issuer'],
        currentEvidenceReferences: ['ssl.certificate.issuer'],
        detectedAt: new Date(),
        explanation: {
          whatChanged: `Certificate issuer changed: ${prevCert?.issuer || 'none'} → ${currCert?.issuer || 'none'}`,
          whyWeBelieveIt: `Observed certificate x509 Issuer field comparison.`,
          whatItMeans: `Edge TLS termination certificate authority or provider was changed.`,
          whatWeCannotConclude: `This does not establish whether renewal was manual or automated via ACME.`,
          impact: `Certificate authority updated.`,
          attention: `No action required.`,
          attentionRequired: false,
        },
      });
    }
  }

  /**
   * Security Headers Posture Diffs (T23.2 & T23.4)
   */
  private diffSecurityHeaders(
    domainId: string,
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    prevSnapId: string | undefined,
    currSnapId: string,
    events: ForensicChangeEvent[],
  ): void {
    const headersToCheck: Array<{
      key: string;
      displayName: string;
      criticalOnRemoval: boolean;
    }> = [
      {
        key: 'strict-transport-security',
        displayName: 'Strict-Transport-Security (HSTS)',
        criticalOnRemoval: true,
      },
      {
        key: 'content-security-policy',
        displayName: 'Content-Security-Policy (CSP)',
        criticalOnRemoval: true,
      },
      {
        key: 'x-frame-options',
        displayName: 'X-Frame-Options',
        criticalOnRemoval: false,
      },
      {
        key: 'x-content-type-options',
        displayName: 'X-Content-Type-Options',
        criticalOnRemoval: false,
      },
    ];

    for (const h of headersToCheck) {
      const prevVal = this.getHeaderValue(prev.http?.headers, h.key);
      const currVal = this.getHeaderValue(curr.http?.headers, h.key);

      if (prevVal !== currVal) {
        // Newly Added
        if (!prevVal && currVal) {
          events.push({
            id: `delta-sec-header-added-${h.key}`,
            domainId,
            previousSnapshotId: prevSnapId,
            currentSnapshotId: currSnapId,
            title: `${h.displayName} header enabled`,
            summary: `${h.displayName} is now active in public response headers.`,
            state: 'ADDED',
            significance: 'NOTABLE',
            category: 'security_headers',
            module: FindingModule.HTTP,
            findingCategory: FindingCategory.SECURITY_HEADER,
            changeType: ChangeType.ADDED,
            severity: ChangeSeverity.LOW,
            layer: TopologyLayer.GATEWAY,
            blastRadiusLayers: [TopologyLayer.GATEWAY, TopologyLayer.EDGE],
            currentState: { value: currVal },
            previousEvidenceReferences: [],
            currentEvidenceReferences: [`headers.${h.key}`],
            detectedAt: new Date(),
            explanation: {
              whatChanged: `${h.displayName} response header enabled: '${currVal}'`,
              whyWeBelieveIt: `Header observed in current HTTP response telemetry.`,
              whatItMeans: `Edge or origin gateway has enforced ${h.displayName} protections for client traffic.`,
              whatWeCannotConclude: `This does not verify internal backend compliance for subdomains not visited.`,
              impact: `Security posture strengthened.`,
              attention: `No action required.`,
              attentionRequired: false,
            },
          });
        }
        // Removed / Stripped (CRITICAL if HSTS/CSP)
        else if (prevVal && !currVal) {
          const significance: ChangeSignificance = h.criticalOnRemoval
            ? 'CRITICAL'
            : 'IMPORTANT';
          events.push({
            id: `delta-sec-header-removed-${h.key}`,
            domainId,
            previousSnapshotId: prevSnapId,
            currentSnapshotId: currSnapId,
            title: `${h.displayName} header no longer observed`,
            summary: `${h.displayName} is no longer observable in public response telemetry.`,
            state: 'REMOVED',
            significance,
            category: 'security_headers',
            module: FindingModule.HTTP,
            findingCategory: FindingCategory.SECURITY_HEADER,
            changeType: ChangeType.REMOVED,
            severity: h.criticalOnRemoval
              ? ChangeSeverity.HIGH
              : ChangeSeverity.MEDIUM,
            layer: TopologyLayer.GATEWAY,
            blastRadiusLayers: [TopologyLayer.GATEWAY, TopologyLayer.EDGE],
            previousState: { value: prevVal },
            previousEvidenceReferences: [`headers.${h.key}`],
            currentEvidenceReferences: [],
            detectedAt: new Date(),
            explanation: {
              whatChanged: `${h.displayName} response header is no longer observed`,
              whyWeBelieveIt: `Header was previously present ('${prevVal}'), but is absent in current response telemetry.`,
              whatItMeans: `Clients connecting to this endpoint no longer receive ${h.displayName} directives.`,
              whatWeCannotConclude: `This does not determine whether removal was accidental drift or intentional reconfiguration.`,
              impact: h.criticalOnRemoval
                ? `Critical security regression: transport downgrade protection removed.`
                : `Security defense header relaxed.`,
              attention: `Action required: Verify whether ${h.displayName} was intentionally disabled.`,
              attentionRequired: true,
            },
          });
        }
      }
    }
  }

  /**
   * DNS & Origin Routing Diffs (T23.2 & T23.4)
   */
  private diffDnsAndRouting(
    domainId: string,
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    prevSnapId: string | undefined,
    currSnapId: string,
    events: ForensicChangeEvent[],
  ): void {
    const prevA = (prev.dns?.a || []).slice().sort();
    const currA = (curr.dns?.a || []).slice().sort();

    if (
      !this.areArraysEqual(prevA, currA) &&
      (prevA.length > 0 || currA.length > 0)
    ) {
      events.push({
        id: `delta-dns-ipv4`,
        domainId,
        previousSnapshotId: prevSnapId,
        currentSnapshotId: currSnapId,
        title: 'DNS IPv4 addresses modified',
        summary: `A records changed from [${prevA.join(', ')}] to [${currA.join(', ')}].`,
        state: 'MODIFIED',
        significance: 'NOTABLE',
        category: 'dns',
        module: FindingModule.DNS,
        findingCategory: FindingCategory.DNS_RECORD,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        layer: TopologyLayer.EDGE,
        blastRadiusLayers: [TopologyLayer.EDGE],
        previousState: { a: prevA },
        currentState: { a: currA },
        previousEvidenceReferences: ['dns.a'],
        currentEvidenceReferences: ['dns.a'],
        detectedAt: new Date(),
        explanation: {
          whatChanged: `DNS A records modified: [${prevA.join(', ')}] → [${currA.join(', ')}]`,
          whyWeBelieveIt: `Direct authoritative DNS query resolution comparison.`,
          whatItMeans: `Traffic routing endpoints for this domain have changed.`,
          whatWeCannotConclude: `This does not reveal whether the IP change reflects anycast CDN edge rotation or origin host migration.`,
          impact: `Ingress traffic routing updated.`,
          attention: `No action required.`,
          attentionRequired: false,
        },
      });
    }
  }

  /**
   * Multi-Layer Blast Radius & Forensic Grouping (T23.6)
   *
   * If related changes occur across adjacent layers in the same understanding cycle,
   * correlates them into a cohesive forensic event.
   */
  private groupCorrelatedForensics(
    domainId: string,
    individualEvents: ForensicChangeEvent[],
    prevSnapId: string | undefined,
    currSnapId: string,
  ): ForensicChangeEvent[] {
    if (individualEvents.length <= 1) {
      return individualEvents;
    }

    // Check if there is a correlated Gateway + TLS + Security Header shift
    const gatewayEvent = individualEvents.find(
      (e) =>
        e.layer === TopologyLayer.GATEWAY &&
        (e.category === 'edge_cdn' || e.category === 'technology'),
    );
    const tlsEvent = individualEvents.find((e) => e.category === 'tls_ssl');
    const secEvent = individualEvents.find(
      (e) => e.category === 'security_headers',
    );

    if (gatewayEvent && (tlsEvent || secEvent)) {
      const correlated = [gatewayEvent, tlsEvent, secEvent].filter(Boolean);
      const remaining = individualEvents.filter((e) => !correlated.includes(e));

      const hasCritical = correlated.some((e) => e.significance === 'CRITICAL');
      const attentionRequired = correlated.some(
        (e) => e.explanation.attentionRequired,
      );
      const allBlastLayers = Array.from(
        new Set(correlated.flatMap((e) => e.blastRadiusLayers)),
      );

      const grouped: ForensicChangeEvent = {
        id: `grouped-gateway-tls-${currSnapId}`,
        domainId,
        previousSnapshotId: prevSnapId,
        currentSnapshotId: currSnapId,
        title: 'Gateway & TLS configuration changed',
        summary: `Gateway and security boundary changed in the same understanding (${correlated.map((c) => c.title).join('; ')}).`,
        state: 'MODIFIED',
        significance: hasCritical ? 'CRITICAL' : 'IMPORTANT',
        category: 'edge_cdn',
        module: FindingModule.TECHNOLOGY,
        findingCategory: FindingCategory.TECHNOLOGY,
        changeType: ChangeType.MODIFIED,
        severity: hasCritical ? ChangeSeverity.HIGH : ChangeSeverity.LOW,
        layer: TopologyLayer.GATEWAY,
        blastRadiusLayers: allBlastLayers,
        previousEvidenceReferences: correlated.flatMap(
          (e) => e.previousEvidenceReferences,
        ),
        currentEvidenceReferences: correlated.flatMap(
          (e) => e.currentEvidenceReferences,
        ),
        detectedAt: new Date(),
        explanation: {
          whatChanged: `Gateway & TLS security boundary updated together`,
          whyWeBelieveIt: `Multiple concurrent layer transitions observed: ${correlated.map((c) => c.explanation.whatChanged).join('. ')}`,
          whatItMeans: `The ingress delivery pipeline underwent coordinated configuration or routing changes.`,
          whatWeCannotConclude: `This does not establish internal deployment choreography or root cause.`,
          impact: hasCritical
            ? `Security impact: Critical security configuration modified.`
            : `Security posture remains consistent.`,
          attention: attentionRequired
            ? `Action required: Review security configuration updates.`
            : `No action required.`,
          attentionRequired,
        },
      };

      return [grouped, ...remaining];
    }

    return individualEvents;
  }

  private normalizeTechKey(tech: DetectedTechnology): string {
    return (tech.id || tech.name || '').toLowerCase().trim();
  }

  private getHeaderValue(
    headers: Record<string, string> | undefined,
    key: string,
  ): string | undefined {
    if (!headers) return undefined;
    const targetKey = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === targetKey) return v;
    }
    return undefined;
  }

  private areArraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }
}
