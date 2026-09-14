import { Injectable, Logger } from '@nestjs/common';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TopologyLayer,
  TechnologyConfidenceLevel,
} from '../../../infrastructure/discovery/technology/contracts';
import {
  TechnologyDifference,
  TechnologyChangeClassification,
  TechnologyChangeImpact,
} from '../contracts/technology-change.interface';
import {
  ArchitecturalPostureReport,
  ArchitecturePostureEvaluation,
  ChangeImpactAssessment,
  ExposurePostureEvaluation,
  ObservableResilienceSignals,
  SecurityPostureEvaluation,
  WhatMattersNowItem,
} from '../contracts/architectural-posture.interface';

@Injectable()
export class ArchitecturalPostureIntelligenceEngine {
  private readonly logger = new Logger(
    ArchitecturalPostureIntelligenceEngine.name,
  );

  /**
   * Generates a complete, authoritative architectural posture and impact report.
   */
  generatePostureReport(
    currentSnapshot: DiscoverySnapshot,
    previousSnapshot: DiscoverySnapshot | null = null,
    currentFindings: any[] = [],
    differences: TechnologyDifference[] = [],
  ): ArchitecturalPostureReport {
    const securityPosture = this.evaluateSecurityPosture(
      currentSnapshot,
      currentFindings,
    );
    const architecturePosture =
      this.evaluateArchitecturePosture(currentSnapshot);
    const exposurePosture = this.evaluateExposurePosture(currentSnapshot);
    const resilienceSignals = this.evaluateResilienceSignals(currentSnapshot);
    const impactAssessments = this.correlateChangeImpact(
      previousSnapshot,
      currentSnapshot,
      differences,
    );
    const whatMattersNow = this.resolveWhatMattersNow(
      currentSnapshot,
      previousSnapshot,
      currentFindings,
      differences,
    );

    return {
      securityPosture,
      architecturePosture,
      exposurePosture,
      resilienceSignals,
      impactAssessments,
      whatMattersNow,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates security posture based on authoritative TLS, HTTP policies, and verified findings.
   */
  evaluateSecurityPosture(
    snapshot: DiscoverySnapshot,
    findings: any[] = [],
  ): SecurityPostureEvaluation {
    const http = snapshot?.http;
    const ssl = snapshot?.ssl;
    const headers = http?.finalResponse?.headers || http?.headers || {};

    let tlsScore = 0;
    const activeControls: string[] = [];
    const securityGaps: string[] = [];

    // 1. Evaluate TLS Transport
    if (ssl?.authorized) {
      tlsScore += 50;
      activeControls.push('Valid TLS Certificate Authority signature');
    }
    const protocol = ssl?.protocol || '';
    if (protocol.includes('TLSv1.3') || protocol.includes('TLS 1.3')) {
      tlsScore += 50;
      activeControls.push('Modern TLS 1.3 encryption protocol');
    } else if (protocol.includes('TLSv1.2') || protocol.includes('TLS 1.2')) {
      tlsScore += 35;
      activeControls.push('TLS 1.2 encryption protocol');
    } else if (ssl?.authorized) {
      tlsScore += 20;
    }

    // 2. Evaluate Security Headers
    let headerScore = 0;
    if (headers['strict-transport-security']) {
      headerScore += 35;
      activeControls.push(
        'Strict-Transport-Security (HSTS) transport enforcement',
      );
    } else {
      securityGaps.push('Strict-Transport-Security (HSTS) absent');
    }

    if (headers['content-security-policy']) {
      headerScore += 25;
      activeControls.push('Content-Security-Policy (CSP) injection defense');
    } else {
      securityGaps.push('Content-Security-Policy absent');
    }

    if (headers['x-frame-options']) {
      headerScore += 15;
      activeControls.push('X-Frame-Options clickjacking mitigation');
    }

    if (headers['x-content-type-options']) {
      headerScore += 15;
      activeControls.push('X-Content-Type-Options MIME sniffing defense');
    }

    if (headers['referrer-policy']) {
      headerScore += 10;
      activeControls.push('Referrer-Policy header control');
    }

    // Protection Layer classification
    const technologies = snapshot?.technology?.technologies || [];
    const hasEdge = technologies.some(
      (t: any) =>
        t.category === 'CDN / Edge' ||
        t.category === 'CDN_EDGE' ||
        t.layer === TopologyLayer.EDGE,
    );
    const hasGateway = technologies.some(
      (t: any) =>
        t.category === 'Web / Server' ||
        t.category === 'WEB_SERVER' ||
        t.layer === TopologyLayer.GATEWAY,
    );

    let protectionLayer:
      'EDGE_PROTECTED' | 'GATEWAY_BUFFERED' | 'DIRECT_ORIGIN' | 'UNKNOWN' =
      'UNKNOWN';
    if (hasEdge) {
      protectionLayer = 'EDGE_PROTECTED';
      activeControls.push('Edge CDN / Anycast Ingress Protection');
    } else if (hasGateway) {
      protectionLayer = 'GATEWAY_BUFFERED';
      activeControls.push('Gateway Reverse Proxy Ingress Buffer');
    } else if (technologies.length > 0) {
      protectionLayer = 'DIRECT_ORIGIN';
      securityGaps.push(
        'Direct application runtime exposure (unbuffered ingress)',
      );
    }

    // Composite Rating
    const totalScore = Math.round((tlsScore + headerScore) / 2);
    const criticalFindings = findings.filter(
      (f) => (f.severity || '').toUpperCase() === 'CRITICAL',
    );
    const highFindings = findings.filter(
      (f) => (f.severity || '').toUpperCase() === 'HIGH',
    );

    let rating: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'DEGRADED' | 'CRITICAL' =
      'ADEQUATE';
    let whyDegraded: string | undefined = undefined;

    if (criticalFindings.length > 0 || (ssl && !ssl.authorized && ssl.error)) {
      rating = 'CRITICAL';
      whyDegraded = 'Critical security or TLS condition observed.';
    } else if (
      highFindings.length > 0 ||
      !headers['strict-transport-security']
    ) {
      rating = 'DEGRADED';
      whyDegraded =
        'Strict-Transport-Security (HSTS) is absent on authoritative HTTPS endpoint.';
    } else if (totalScore >= 85) {
      rating = 'EXCELLENT';
    } else if (totalScore >= 70) {
      rating = 'GOOD';
    }

    const summary =
      rating === 'EXCELLENT'
        ? 'Security posture is thoroughly hardened with TLS 1.3 and active security headers.'
        : rating === 'GOOD'
          ? 'Security posture is well configured with authenticated TLS and core transport controls.'
          : rating === 'DEGRADED'
            ? 'Security posture exhibits missing transport enforcement or configuration gaps.'
            : rating === 'CRITICAL'
              ? 'Security posture requires immediate attention due to critical endpoint or certificate risks.'
              : 'Security posture provides baseline HTTPS transport.';

    return {
      rating,
      tlsScore: Math.min(100, tlsScore),
      headerScore: Math.min(100, headerScore),
      protectionLayer,
      summary,
      activeControls,
      securityGaps,
      whyDegraded,
    };
  }

  /**
   * Evaluates architecture posture without overreaching or guessing unobserved high-availability.
   */
  evaluateArchitecturePosture(
    snapshot: DiscoverySnapshot,
  ): ArchitecturePostureEvaluation {
    const brief =
      snapshot?.technology?.architectureBrief ||
      (snapshot as any)?.memory?.architectureBrief;
    const path = brief?.architecturePath || [];
    const layers = brief?.layers || [];

    const observedLayers = layers
      .filter((l: any) => l.state === 'OBSERVED')
      .map((l: any) => l.layer as TopologyLayer);

    const hasEdge = observedLayers.includes(TopologyLayer.EDGE);
    const hasGateway = observedLayers.includes(TopologyLayer.GATEWAY);
    const hasAppOrRuntime =
      observedLayers.includes(TopologyLayer.APPLICATION) ||
      observedLayers.includes(TopologyLayer.RUNTIME);

    let rating:
      | 'MODERN_MULTI_TIER'
      | 'BUFFERED_GATEWAY'
      | 'FLAT_DIRECT'
      | 'INDETERMINATE' = 'INDETERMINATE';
    let summary = 'Public ingress reaches the observed perimeter.';
    let perimeterBoundary: 'PROTECTED' | 'SEALED' | 'EXPOSED' = 'PROTECTED';

    if (hasEdge && hasGateway && hasAppOrRuntime) {
      rating = 'MODERN_MULTI_TIER';
      summary =
        'Public ingress is distributed across an edge provider and gateway boundary before reaching an observed server-side runtime.';
      perimeterBoundary = 'PROTECTED';
    } else if (hasEdge && (hasGateway || hasAppOrRuntime)) {
      rating = 'MODERN_MULTI_TIER';
      summary =
        'Public ingress terminates at an edge provider and routes traffic to protected origin gateway or application services.';
      perimeterBoundary = 'PROTECTED';
    } else if (hasGateway && hasAppOrRuntime) {
      rating = 'BUFFERED_GATEWAY';
      summary =
        'Public ingress reaches a reverse proxy gateway and proxies traffic to application runtime containers.';
      perimeterBoundary = 'PROTECTED';
    } else if (hasAppOrRuntime && !hasGateway && !hasEdge) {
      rating = 'FLAT_DIRECT';
      summary =
        'Public ingress reaches the application runtime directly without an intermediate reverse proxy or edge CDN.';
      perimeterBoundary = 'EXPOSED';
    }

    const antiOverreachStatement =
      'Public ingress is structured across observed edge and gateway layers. This observation does not establish origin high availability, container cluster redundancy, or database replication.';

    return {
      rating,
      ingressDepth: path.length > 0 ? path.length : observedLayers.length,
      observedLayers,
      perimeterBoundary,
      summary,
      rationale: `Evaluated ${observedLayers.length} observed topological layers across ${path.length} ingress hops.`,
      antiOverreachStatement,
    };
  }

  /**
   * Evaluates implementation exposure level and banner disclosures.
   */
  evaluateExposurePosture(
    snapshot: DiscoverySnapshot,
  ): ExposurePostureEvaluation {
    const headers = snapshot?.http?.headers || {};
    const disclosedBanners: string[] = [];
    const leakedHeaders: string[] = [];

    const serverHeader = headers['server'];
    if (serverHeader) {
      disclosedBanners.push(`Server: ${serverHeader}`);
    }

    const poweredBy = headers['x-powered-by'];
    if (poweredBy) {
      disclosedBanners.push(`X-Powered-By: ${poweredBy}`);
    }

    if (headers['x-aspnet-version'] || headers['x-aspnetmvc-version']) {
      disclosedBanners.push(
        `ASP.NET Version: ${headers['x-aspnet-version'] || headers['x-aspnetmvc-version']}`,
      );
    }

    // Check for origin leak headers
    const sensitiveHeaderKeys = [
      'x-backend-server',
      'x-origin-ip',
      'x-real-ip',
      'x-varnish',
      'x-k8s-pod',
    ];
    for (const key of sensitiveHeaderKeys) {
      if (headers[key]) {
        leakedHeaders.push(`${key}: ${headers[key]}`);
      }
    }

    const hasGranularVersion = disclosedBanners.some((b) => /\d+\.\d+/.test(b));

    let level: 'MINIMAL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL' =
      'MINIMAL';
    if (leakedHeaders.length > 0) {
      level = 'ELEVATED';
    } else if (hasGranularVersion) {
      level = 'MODERATE';
    } else if (disclosedBanners.length > 0) {
      level = 'LOW';
    }

    const summary =
      level === 'MINIMAL'
        ? 'Minimal implementation details disclosed in HTTP response headers.'
        : level === 'LOW'
          ? 'Public banners disclose technology family without granular version numbers.'
          : level === 'MODERATE'
            ? 'Granular software version numbers are publicly advertised in response headers.'
            : 'Sensitive origin routing telemetry or internal infrastructure headers are disclosed.';

    return {
      level,
      disclosedBanners,
      leakedHeaders,
      debugTracesDisclosed: false,
      summary,
    };
  }

  /**
   * Evaluates observable resilience signals without inventing unobserved redundancy.
   */
  evaluateResilienceSignals(
    snapshot: DiscoverySnapshot,
  ): ObservableResilienceSignals {
    const dns = snapshot?.dns;
    const http = snapshot?.http;
    const technologies = snapshot?.technology?.technologies || [];

    const aRecords = dns?.a || [];
    const hasAnycastRouting = aRecords.length > 1;
    const hasEdgeCdn = technologies.some(
      (t: any) =>
        t.category === 'CDN / Edge' ||
        t.category === 'CDN_EDGE' ||
        t.layer === TopologyLayer.EDGE,
    );
    const hasHttp2Or3 =
      Boolean(http?.headers?.['alt-svc']) ||
      (http as any)?.httpVersion === '2' ||
      (http as any)?.httpVersion === '3' ||
      (http?.protocol as unknown) === 'h2' ||
      (http?.protocol as unknown) === 'h3';
    const hasKeepAlive =
      (http?.headers?.['connection'] || '')
        .toLowerCase()
        .includes('keep-alive') || hasHttp2Or3;

    const observableSignals: string[] = [];
    if (hasEdgeCdn) {
      observableSignals.push('Edge CDN Global Anycast Ingress');
    }
    if (hasAnycastRouting) {
      observableSignals.push(
        `Multi-IP Ingress (${aRecords.length} IPv4 addresses observed)`,
      );
    }
    if (hasHttp2Or3) {
      observableSignals.push('HTTP/2 or HTTP/3 Multiplexed Protocol Support');
    }
    if (hasKeepAlive) {
      observableSignals.push('Persistent Connection Keep-Alive Semantics');
    }

    const unobservedDimensions = [
      'Origin Server Instance Count & Cluster Topology',
      'Database Replication & Failover State',
      'Container Orchestration Autoscaling Parameters',
      'Internal Network Partition Tolerance',
    ];

    return {
      hasAnycastRouting,
      hasEdgeCdn,
      hasHttp2Or3,
      hasKeepAlive,
      observableSignals,
      unobservedDimensions,
    };
  }

  /**
   * Correlates H3 changes into high-level posture impact assessments.
   */
  correlateChangeImpact(
    previousSnapshot: DiscoverySnapshot | null,
    currentSnapshot: DiscoverySnapshot,
    differences: TechnologyDifference[] = [],
  ): ChangeImpactAssessment[] {
    const assessments: ChangeImpactAssessment[] = [];

    for (const diff of differences) {
      if (
        diff.classification ===
          TechnologyChangeClassification.SECURITY_HEADER_REMOVED ||
        diff.classification ===
          TechnologyChangeClassification.SECURITY_POSTURE_CHANGED
      ) {
        if (
          diff.title.toLowerCase().includes('hsts') ||
          diff.description.toLowerCase().includes('hsts')
        ) {
          assessments.push({
            impactType: 'SECURITY_REGRESSION',
            significance: 'HIGH',
            title: 'HSTS protection was removed',
            narrative:
              'The Strict-Transport-Security header was removed after the latest infrastructure change, allowing potential cleartext transport downgrade.',
            whatItMeans:
              'User agents will no longer automatically enforce HTTPS transport for subsequent requests to this domain.',
            whatWeCannotConclude:
              'This does not establish active connection interception; it identifies the absence of proactive transport encryption enforcement.',
            evidenceBefore: diff.evidenceBefore || [
              'Strict-Transport-Security: max-age=31536000',
            ],
            evidenceAfter: diff.evidenceAfter || [
              'Header absent on current authoritative HTTPS response',
            ],
            remediationRecommendation:
              'Re-enable the Strict-Transport-Security header with max-age >= 31536000 and includeSubDomains.',
          });
        } else if (
          diff.title.toLowerCase().includes('content-security-policy') ||
          diff.title.toLowerCase().includes('csp')
        ) {
          assessments.push({
            impactType: 'SECURITY_REGRESSION',
            significance: 'MEDIUM',
            title: 'Content Security Policy removed',
            narrative:
              'Content-Security-Policy header was removed in the latest verified snapshot, degrading script execution restrictions.',
            whatItMeans:
              'Browsers will not restrict unauthorized inline scripts or cross-origin assets via Content Security Policy.',
            whatWeCannotConclude:
              'This does not confirm active XSS vulnerability exploitation; it indicates reduced defense-in-depth protection.',
            evidenceBefore: diff.evidenceBefore,
            evidenceAfter: diff.evidenceAfter,
            remediationRecommendation:
              'Restore Content-Security-Policy with appropriate directives.',
          });
        }
      } else if (
        diff.classification ===
        TechnologyChangeClassification.SECURITY_HEADER_ADDED
      ) {
        if (diff.title.toLowerCase().includes('hsts')) {
          assessments.push({
            impactType: 'SECURITY_IMPROVEMENT',
            significance: 'MEDIUM',
            title: 'HSTS protection enabled',
            narrative:
              'Strict-Transport-Security header is now active on the authoritative HTTPS endpoint, enforcing secure transport.',
            whatItMeans:
              'Browsers will automatically enforce HTTPS connections for future visits.',
            whatWeCannotConclude:
              'This does not guarantee that application payload vulnerabilities are eliminated.',
            evidenceBefore: diff.evidenceBefore,
            evidenceAfter: diff.evidenceAfter,
          });
        }
      } else if (
        diff.classification ===
          TechnologyChangeClassification.GATEWAY_MIGRATED ||
        diff.classification ===
          TechnologyChangeClassification.FRAMEWORK_MIGRATED ||
        diff.classification === TechnologyChangeClassification.EDGE_LAYER_DRIFT
      ) {
        assessments.push({
          impactType: 'ARCHITECTURAL_EVOLUTION',
          significance: 'MEDIUM',
          title: diff.title,
          narrative: diff.description,
          whatItMeans:
            diff.whatThisMeans ||
            'Public ingress architecture boundary migrated to a new technology tier.',
          whatWeCannotConclude:
            diff.whatThisDoesNotProve ||
            'This observation does not establish backend cloud-provider migration or container orchestrator changes.',
          evidenceBefore: diff.evidenceBefore,
          evidenceAfter: diff.evidenceAfter,
        });
      }
    }

    return assessments;
  }

  /**
   * Resolves the authoritative "What Matters Now" intelligence item.
   */
  resolveWhatMattersNow(
    currentSnapshot: DiscoverySnapshot,
    previousSnapshot: DiscoverySnapshot | null = null,
    currentFindings: any[] = [],
    differences: TechnologyDifference[] = [],
  ): WhatMattersNowItem {
    const prevHeaders =
      previousSnapshot?.http?.finalResponse?.headers ||
      previousSnapshot?.http?.headers ||
      {};
    const currHeaders =
      currentSnapshot?.http?.finalResponse?.headers ||
      currentSnapshot?.http?.headers ||
      {};

    const prevHadHsts = Boolean(prevHeaders['strict-transport-security']);
    const currHasHsts = Boolean(currHeaders['strict-transport-security']);

    // 1. Check for Security Regression: HSTS removed
    if (prevHadHsts && !currHasHsts) {
      return {
        status: 'ATTENTION',
        title: 'HSTS protection was removed',
        subtitle: 'Observed after the latest infrastructure change.',
        reason:
          'The Strict-Transport-Security header was present in the previous snapshot but is missing in the current snapshot.',
        evidenceBefore:
          'Strict-Transport-Security: max-age=31536000; includeSubDomains',
        evidenceAfter:
          'Strict-Transport-Security header is absent on current endpoint.',
        actionText: 'Review finding →',
        actionTarget: 'findings',
      };
    }

    // 2. Check for Security Improvement: HSTS restored / added
    if (!prevHadHsts && currHasHsts && previousSnapshot !== null) {
      return {
        status: 'RESOLVED',
        title: 'HSTS protection restored',
        subtitle: 'Resolved in the latest verified snapshot.',
        reason:
          'Strict-Transport-Security is now active on the authoritative HTTPS endpoint.',
        evidenceBefore: 'Header absent in previous snapshot',
        evidenceAfter: `Strict-Transport-Security: ${currHeaders['strict-transport-security']}`,
        actionText: 'View timeline →',
        actionTarget: 'changes',
      };
    }

    // 3. Check for Critical Active Findings
    const criticalFindings = currentFindings.filter(
      (f) => (f.severity || '').toUpperCase() === 'CRITICAL',
    );
    if (criticalFindings.length > 0) {
      const first = criticalFindings[0];
      return {
        status: 'ATTENTION',
        title: first.title || 'Critical Architectural Exposure',
        subtitle:
          first.description ||
          'A critical security or certificate condition was detected.',
        reason:
          first.whyItMatters ||
          first.description ||
          'Requires immediate review.',
        actionText: 'Review finding →',
        actionTarget: 'findings',
      };
    }

    // 4. Check for High Severity Active Findings (e.g. Missing HSTS baseline)
    const highFindings = currentFindings.filter(
      (f) => (f.severity || '').toUpperCase() === 'HIGH',
    );
    if (highFindings.length > 0) {
      const first = highFindings[0];
      return {
        status: 'ATTENTION',
        title: first.title,
        subtitle: first.description,
        reason: first.whyItMatters || first.description,
        actionText: 'Review finding →',
        actionTarget: 'findings',
      };
    }

    // 5. Check for Meaningful Architectural Changes
    const archDiff = differences.find(
      (d) =>
        d.classification === TechnologyChangeClassification.GATEWAY_MIGRATED ||
        d.classification ===
          TechnologyChangeClassification.FRAMEWORK_MIGRATED ||
        d.classification === TechnologyChangeClassification.EDGE_LAYER_DRIFT,
    );
    if (archDiff) {
      return {
        status: 'CHANGED',
        title: archDiff.title,
        subtitle: archDiff.description,
        reason:
          archDiff.whatThisMeans ||
          'Public ingress architecture migrated to new technology tier.',
        evidenceBefore: (archDiff.evidenceBefore || []).join('; '),
        evidenceAfter: (archDiff.evidenceAfter || []).join('; '),
        actionText: 'Review changes →',
        actionTarget: 'changes',
      };
    }

    // 6. Calm Reassuring Stable State
    return {
      status: 'STABLE',
      title: 'Architecture Stable',
      subtitle: 'No active infrastructure issues require attention.',
      reason:
        'All observed infrastructure layers and security policies remain verified and consistent.',
    };
  }
}
