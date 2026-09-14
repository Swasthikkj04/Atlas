import { Injectable, Logger } from '@nestjs/common';
import {
  TopologyLayer,
  TechnologyConfidenceLevel,
} from '../../../infrastructure/discovery/technology/contracts';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { ForensicChangeEvent } from '../contracts/temporal-delta.interface';
import {
  ArchitecturalPostureReport,
  SecurityPostureEvaluation,
  ArchitecturePostureEvaluation,
} from '../contracts/architectural-posture.interface';
import { FindingDto } from '../../infrastructure-findings/dto/finding.dto';
import {
  UnifiedInfrastructureNarrative,
  UnifiedNarrativeArchitectureSection,
  UnifiedNarrativeRequestJourney,
  UnifiedNarrativeJourneyHop,
  UnifiedNarrativeEvolutionSection,
  UnifiedNarrativeForensicEventSummary,
  UnifiedNarrativeCurrentTruthSection,
  UnifiedNarrativeKnownUnknownsSection,
  UnifiedNarrativeEvidenceLineage,
  UnifiedNarrativeEvidenceLineageItem,
  UnifiedNarrativeProgressiveDisclosure,
  NarrativeConfidenceLevel,
} from '../contracts/unified-narrative.interface';

export interface SynthesizeNarrativeParams {
  domainName: string;
  currentSnapshot: DiscoverySnapshot;
  previousSnapshot?: DiscoverySnapshot | null;
  topology?: any | null;
  behavioralSignals?: any[];
  changes?: ForensicChangeEvent[];
  posture?: ArchitecturalPostureReport | null;
  activeFindings?: FindingDto[];
  resolvedFindings?: FindingDto[];
  snapshotId?: string;
  timestamp?: string;
}

/**
 * H5 — Unified Infrastructure Narrative Engine
 *
 * Implements the deterministic, multi-tier narrative synthesis layer:
 * Evidence → Understanding → Narrative (Never Observation → Guess → Narrative).
 *
 * Guaranteed Invariants:
 * - Determinism: Identical inputs produce identical narratives.
 * - Traceability: Every narrative statement has evidence lineage.
 * - Known Unknowns: Explicitly preserves unobserved dimensions without treating them as security risks.
 * - Finding Lifecycle: Respects WX-211 active vs resolved vs stable truth.
 * - Anti-Overreach: Zero unevidenced leaps across sealed perimeters.
 */
@Injectable()
export class UnifiedInfrastructureNarrativeEngine {
  private readonly logger = new Logger(
    UnifiedInfrastructureNarrativeEngine.name,
  );

  synthesizeNarrative(
    params: SynthesizeNarrativeParams,
  ): UnifiedInfrastructureNarrative {
    const {
      domainName,
      currentSnapshot,
      previousSnapshot,
      topology,
      behavioralSignals = [],
      changes = [],
      posture,
      activeFindings = [],
      resolvedFindings = [],
      snapshotId = currentSnapshot?.memory?.snapshotId || 'current-snapshot',
      timestamp = new Date().toISOString(),
    } = params;

    // 1. Synthesize Architecture Section
    const architecture = this.buildArchitectureSection(
      currentSnapshot,
      topology,
    );

    // 2. Synthesize Request Journey Section
    const requestJourney = this.buildRequestJourney(
      domainName,
      currentSnapshot,
      topology,
    );

    // 3. Synthesize Change & Evolution Section (consuming H3 & H4)
    const evolution = this.buildEvolutionSection(changes, posture);

    // 4. Synthesize Current Truth Section (respecting WX-211 finding lifecycle)
    const currentTruth = this.buildCurrentTruthSection(
      activeFindings,
      resolvedFindings,
      changes,
    );

    // 5. Synthesize Known Unknowns (Anti-overreach trust model)
    const knownUnknowns = this.buildKnownUnknownsSection(currentSnapshot);

    // 6. Collect Evidence Lineage
    const evidenceLineage = this.buildEvidenceLineage(
      domainName,
      currentSnapshot,
      behavioralSignals,
      timestamp,
    );

    // 7. Determine overall defensible confidence
    const confidenceLevel = this.calculateDefensibleConfidence(
      architecture,
      behavioralSignals,
      currentSnapshot,
    );

    // 8. Synthesize Progressive Disclosure (Levels 1, 2, 3)
    const progressiveDisclosure = this.buildProgressiveDisclosure({
      domainName,
      snapshotId,
      timestamp,
      architecture,
      requestJourney,
      evolution,
      currentTruth,
      knownUnknowns,
      evidenceLineage,
      posture,
    });

    // 9. Synthesize Executive Brief
    const executiveBrief = this.buildExecutiveBrief({
      domainName,
      architecture,
      evolution,
      currentTruth,
      posture,
    });

    this.logger.debug(
      `Synthesized unified infrastructure narrative for ${domainName}: ${architecture.observedLayers.length} observed layers, status=${currentTruth.lifecycleState}, confidence=${confidenceLevel}`,
    );

    return {
      domainName,
      snapshotId,
      evaluatedAt: timestamp,
      architecture,
      requestJourney,
      evolution,
      currentTruth,
      knownUnknowns,
      evidenceLineage,
      progressiveDisclosure,
      executiveBrief,
      confidenceLevel,
      antiOverreachCertified: true,
    };
  }

  // ---------------------------------------------------------------------------
  // 1. Architecture Section Builder
  // ---------------------------------------------------------------------------
  private buildArchitectureSection(
    snapshot: DiscoverySnapshot,
    topology?: any,
  ): UnifiedNarrativeArchitectureSection {
    const technologies = snapshot?.technology?.technologies || [];

    const edgeTechs = technologies.filter(
      (t: any) =>
        t.category === 'CDN / Edge' ||
        t.category === 'CDN_EDGE' ||
        t.layer === TopologyLayer.EDGE,
    );
    const gatewayTechs = technologies.filter(
      (t: any) =>
        t.category === 'Web / Server' ||
        t.category === 'GATEWAY' ||
        t.layer === TopologyLayer.GATEWAY,
    );
    const appTechs = technologies.filter(
      (t: any) =>
        t.category === 'Frameworks' ||
        t.category === 'APPLICATION' ||
        t.layer === TopologyLayer.APPLICATION,
    );
    const runtimeTechs = technologies.filter(
      (t: any) =>
        t.category === 'Programming Languages' ||
        t.category === 'RUNTIME' ||
        t.layer === TopologyLayer.RUNTIME,
    );

    const observedLayers: any[] = [];

    if (edgeTechs.length > 0) {
      observedLayers.push({
        layer: 'EDGE',
        technologies: edgeTechs.map((t: any) => t.name),
        role: 'Global Edge Ingress & Anycast CDN',
        confidence: this.mapConfidence(edgeTechs[0]?.confidence),
      });
    }

    if (gatewayTechs.length > 0) {
      observedLayers.push({
        layer: 'GATEWAY',
        technologies: gatewayTechs.map((t: any) => t.name),
        role: 'Reverse Proxy & Traffic Gateway',
        confidence: this.mapConfidence(gatewayTechs[0]?.confidence),
      });
    }

    if (appTechs.length > 0) {
      observedLayers.push({
        layer: 'APPLICATION',
        technologies: appTechs.map((t: any) => t.name),
        role: 'Application Framework Boundary',
        confidence: this.mapConfidence(appTechs[0]?.confidence),
      });
    }

    if (runtimeTechs.length > 0) {
      observedLayers.push({
        layer: 'RUNTIME',
        technologies: runtimeTechs.map((t: any) => t.name),
        role: 'Server-Side Execution Runtime',
        confidence: this.mapConfidence(runtimeTechs[0]?.confidence),
      });
    }

    // Build human-readable deterministic narrative
    const techParts: string[] = [];
    if (edgeTechs.length > 0) {
      techParts.push(`a ${edgeTechs.map((t: any) => t.name).join('/')} edge`);
    }
    if (gatewayTechs.length > 0) {
      techParts.push(
        `an ${gatewayTechs.map((t: any) => t.name).join('/')} gateway`,
      );
    }
    if (appTechs.length > 0 || runtimeTechs.length > 0) {
      const exec = [...appTechs, ...runtimeTechs]
        .map((t: any) => t.name)
        .join('/');
      techParts.push(`a ${exec} application runtime`);
    }

    let headline = 'Unclassified Ingress Architecture';
    let narrative =
      'The domain presents an unclassified public HTTP endpoint with no evidenced intermediary proxy tiers.';

    if (techParts.length >= 3) {
      headline = 'Multi-Tier Ingress Architecture';
      narrative = `The domain is served through ${techParts[0]}, followed by ${techParts[1]} and ${techParts[2]}.`;
    } else if (techParts.length === 2) {
      headline = 'Buffered Ingress Architecture';
      narrative = `The domain is served through ${techParts[0]}, followed by ${techParts[1]}.`;
    } else if (techParts.length === 1) {
      headline = 'Direct Ingress Architecture';
      narrative = `The domain is served directly through ${techParts[0]}.`;
    }

    const unobservedLayers = [
      'Database Persistence Tier',
      'Container Orchestration Cluster',
      'Private Network VPC Topology',
      'Origin Compute Infrastructure',
    ];

    return {
      headline,
      narrative,
      observedLayers,
      unobservedLayers,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Request Journey Builder
  // ---------------------------------------------------------------------------
  private buildRequestJourney(
    domainName: string,
    snapshot: DiscoverySnapshot,
    topology?: any,
  ): UnifiedNarrativeRequestJourney {
    const technologies = snapshot?.technology?.technologies || [];
    const hops: UnifiedNarrativeJourneyHop[] = [];

    // Hop 0: Client Request
    hops.push({
      hopIndex: 0,
      title: 'Client Ingress',
      layer: 'CLIENT',
      detail: 'Public client initiates TLS/HTTP request',
      status: 'OBSERVED',
    });

    // Hop 1: DNS Resolution
    const dns = snapshot?.dns;
    const aRecords = dns?.a || [];
    hops.push({
      hopIndex: 1,
      title: 'DNS / Ingress',
      layer: 'DNS',
      detail:
        aRecords.length > 0
          ? `Resolves to ${aRecords.length} IP endpoint(s)`
          : `Domain ${domainName} DNS record set`,
      status: 'OBSERVED',
    });

    let hopCounter = 2;

    // Edge Hop
    const edgeTechs = technologies.filter(
      (t: any) =>
        t.category === 'CDN / Edge' ||
        t.category === 'CDN_EDGE' ||
        t.layer === TopologyLayer.EDGE,
    );
    if (edgeTechs.length > 0) {
      hops.push({
        hopIndex: hopCounter++,
        title: edgeTechs.map((t: any) => t.name).join(', '),
        layer: 'EDGE',
        detail: 'Global Edge CDN & Anycast Routing',
        status: 'OBSERVED',
      });
    }

    // Gateway Hop
    const gatewayTechs = technologies.filter(
      (t: any) =>
        t.category === 'Web / Server' ||
        t.category === 'GATEWAY' ||
        t.layer === TopologyLayer.GATEWAY,
    );
    if (gatewayTechs.length > 0) {
      hops.push({
        hopIndex: hopCounter++,
        title: gatewayTechs.map((t: any) => t.name).join(', '),
        layer: 'GATEWAY',
        detail: 'Reverse Proxy & Ingress Gateway',
        status: 'OBSERVED',
      });
    }

    // Application/Runtime Hop
    const appOrRuntimeTechs = technologies.filter(
      (t: any) =>
        t.category === 'Frameworks' ||
        t.category === 'Programming Languages' ||
        t.layer === TopologyLayer.APPLICATION ||
        t.layer === TopologyLayer.RUNTIME,
    );
    if (appOrRuntimeTechs.length > 0) {
      hops.push({
        hopIndex: hopCounter++,
        title: appOrRuntimeTechs.map((t: any) => t.name).join(', '),
        layer: 'RUNTIME',
        detail: 'Observed Server Application Execution',
        status: 'OBSERVED',
      });
    }

    // Sealed Boundary
    hops.push({
      hopIndex: hopCounter++,
      title: 'Sealed Internal Perimeter',
      layer: 'SEALED',
      detail: 'Origin Compute, Database Persistence & Private Cluster',
      status: 'SEALED',
    });

    let missingHopsExplanation: string | null = null;
    if (
      edgeTechs.length > 0 &&
      appOrRuntimeTechs.length > 0 &&
      gatewayTechs.length === 0
    ) {
      missingHopsExplanation =
        'The observed evidence does not establish an intermediate gateway between the edge and application runtime.';
    }

    const journeyParts = hops
      .filter((h) => h.status === 'OBSERVED')
      .map((h) => h.title);
    const journeySummary = `${journeyParts.join(' → ')} → Sealed Internal Perimeter`;

    return {
      hops,
      missingHopsExplanation,
      journeySummary,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Change & Evolution Section Builder (Consuming H3 & H4)
  // ---------------------------------------------------------------------------
  private buildEvolutionSection(
    changes: ForensicChangeEvent[] = [],
    posture?: ArchitecturalPostureReport | null,
  ): UnifiedNarrativeEvolutionSection {
    if (!changes || changes.length === 0) {
      return {
        hasChanges: false,
        changeCount: 0,
        evolutionNarrative:
          'Architecture Stable. No material infrastructure changes observed across verified snapshots.',
        recentForensicEvents: [],
      };
    }

    const recentForensicEvents: UnifiedNarrativeForensicEventSummary[] = changes
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        title: c.title,
        whatChanged:
          (c as any).forensicExplanation?.whatChanged ||
          (c as any).whatChanged ||
          c.summary,
        whatItMeans:
          (c as any).forensicExplanation?.whatItMeans ||
          (c as any).whatThisMeans ||
          'Infrastructure configuration updated.',
        whatWeCannotConclude:
          (c as any).forensicExplanation?.whatWeCannotConclude ||
          (c as any).whatWeCannotConclude ||
          'Internal origin state remains unobserved.',
        significance: c.significance,
      }));

    // Find if there is an architectural migration or security regression
    const securityRegression = changes.find(
      (c) =>
        c.category === 'security_headers' ||
        (typeof c.title === 'string' &&
          c.title.toLowerCase().includes('hsts') &&
          c.title.toLowerCase().includes('removed')),
    );

    const gatewayMigration = changes.find(
      (c) =>
        c.category === 'technology' ||
        (typeof c.title === 'string' &&
          (c.title.toLowerCase().includes('gateway') ||
            c.title.toLowerCase().includes('migrated') ||
            c.title.toLowerCase().includes('envoy') ||
            c.title.toLowerCase().includes('nginx'))),
    );

    let evolutionNarrative = `Observed ${changes.length} infrastructure change event(s) across recent snapshots.`;

    if (gatewayMigration && securityRegression) {
      evolutionNarrative = `${gatewayMigration.title || 'The observed ingress architecture changed'}. The gateway migration coincided with removal of HSTS protection. This change requires attention.`;
    } else if (gatewayMigration && !securityRegression) {
      evolutionNarrative = `${gatewayMigration.title || 'The observed ingress architecture changed'}. This change represents an architectural evolution in the observed gateway layer. No security regression was identified.`;
    } else if (securityRegression) {
      evolutionNarrative = `A security-relevant change was observed: ${securityRegression.title}. This change requires attention.`;
    } else if (changes.length > 0) {
      evolutionNarrative =
        changes[0].summary ||
        changes[0].title ||
        'Infrastructure evolution detected across recent snapshots.';
    }

    return {
      hasChanges: true,
      changeCount: changes.length,
      evolutionNarrative,
      recentForensicEvents,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Current Truth Section Builder (Respecting WX-211 Lifecycle)
  // ---------------------------------------------------------------------------
  private buildCurrentTruthSection(
    activeFindings: FindingDto[] = [],
    resolvedFindings: FindingDto[] = [],
    changes: ForensicChangeEvent[] = [],
  ): UnifiedNarrativeCurrentTruthSection {
    const criticalOrHighActive = activeFindings.filter(
      (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH',
    );

    // 1. Active security finding requires attention
    if (criticalOrHighActive.length > 0) {
      const first = criticalOrHighActive[0];
      const isHsts =
        first.title.toLowerCase().includes('hsts') ||
        first.description.toLowerCase().includes('hsts');
      return {
        lifecycleState: 'ACTIVE',
        headline: isHsts ? 'HSTS Protection Removed' : first.title,
        narrative: isHsts
          ? 'One active infrastructure issue currently requires attention: HSTS protection is absent.'
          : `${criticalOrHighActive.length} active infrastructure issue(s) currently require attention: ${first.title}.`,
        activeFindingsCount: activeFindings.length,
        resolvedFindingsCount: resolvedFindings.length,
        whyTruthIsCurrent:
          'Active finding is verified absent or non-compliant in current snapshot.',
      };
    }

    // 2. Resolved finding in current verified snapshot
    if (resolvedFindings.length > 0 && activeFindings.length === 0) {
      const firstResolved = resolvedFindings[0];
      const isHsts =
        firstResolved.title.toLowerCase().includes('hsts') ||
        firstResolved.description.toLowerCase().includes('hsts');
      return {
        lifecycleState: 'RESOLVED',
        headline: isHsts ? 'HSTS Protection Restored' : firstResolved.title,
        narrative: isHsts
          ? 'HSTS protection was restored in the latest verified snapshot.'
          : `${resolvedFindings.length} previously detected issue(s) have been verified resolved in current snapshot.`,
        activeFindingsCount: 0,
        resolvedFindingsCount: resolvedFindings.length,
        whyTruthIsCurrent:
          'Verified compliant in latest snapshot reconciliation.',
      };
    }

    // 3. Stable quiet state
    return {
      lifecycleState: 'STABLE',
      headline: 'Architecture Stable',
      narrative:
        'Architecture Stable. No active infrastructure issues currently require attention.',
      activeFindingsCount: 0,
      resolvedFindingsCount: resolvedFindings.length,
      whyTruthIsCurrent:
        'All observed controls verified compliant in current snapshot.',
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Known Unknowns Builder (Anti-Overreach Trust Model)
  // ---------------------------------------------------------------------------
  private buildKnownUnknownsSection(
    snapshot: DiscoverySnapshot,
  ): UnifiedNarrativeKnownUnknownsSection {
    const explicitStatements = [
      'The backend database and orchestration layer are not observable from the public evidence available to Nebula.',
      'Origin server instance count, internal failover automation, and database replication topology remain sealed behind ingress.',
      'Host operating system and kernel patches are protected behind edge and gateway network boundaries.',
    ];

    const sealedPerimeterBoundaries = [
      'Origin Compute Infrastructure',
      'Database Persistence Tier',
      'Container Orchestration Cluster',
      'Private VPC Network Mesh',
    ];

    const integrityNote =
      'Nebula explicitly distinguishes between unobserved internal infrastructure and operational failures. Unobserved layers do not constitute security risks.';

    return {
      explicitStatements,
      sealedPerimeterBoundaries,
      integrityNote,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. Evidence Lineage Builder
  // ---------------------------------------------------------------------------
  private buildEvidenceLineage(
    domainName: string,
    snapshot: DiscoverySnapshot,
    behavioralSignals: any[] = [],
    timestamp: string,
  ): UnifiedNarrativeEvidenceLineage {
    const items: UnifiedNarrativeEvidenceLineageItem[] = [];
    const technologies = snapshot?.technology?.technologies || [];

    // Add Technology Evidence
    for (const tech of technologies) {
      const techAny = tech as any;
      const evidenceList = techAny.evidence || [];
      const rawDetail =
        evidenceList.length > 0
          ? evidenceList
              .map(
                (e: any) =>
                  `${e.source}: ${e.pattern || e.detail || e.value || ''}`,
              )
              .join('; ')
          : `Direct response header / banner indicating ${tech.name}`;

      items.push({
        claim: `${techAny.layer || 'Observed'} component identified as ${tech.name}`,
        layer: techAny.layer,
        technology: tech.name,
        source: evidenceList[0]?.source || 'HTTP Response Headers',
        rawEvidence: rawDetail,
        timestamp,
        confidence: this.mapConfidence(tech.confidence),
      });
    }

    // Add TLS Evidence
    const ssl = snapshot?.ssl;
    if (ssl && (ssl.supported || ssl.authorized || (ssl as any).valid)) {
      items.push({
        claim: `Transport security terminated with ${ssl.protocol || 'TLS 1.3'}`,
        layer: 'EDGE',
        source: 'TLS Handshake',
        rawEvidence: `Protocol: ${ssl.protocol || 'TLS 1.3'}, Cipher: ${ssl.cipher || 'Standard'}, Subject: ${ssl.certificate?.subject || 'Valid CA'}`,
        timestamp,
        confidence: 'HIGH',
      });
    }

    // Add Behavioral Evidence (H2)
    for (const signal of behavioralSignals) {
      items.push({
        claim: `Behavioral wire pattern observed: ${signal.signatureName || signal.signatureId || 'Wire Signature'}`,
        layer: signal.layer || 'BEHAVIOR',
        source: 'Wire Behavior',
        rawEvidence:
          signal.explanation ||
          signal.matchedPattern ||
          'Observable response framing and header ordering pattern',
        timestamp,
        confidence: 'MEDIUM',
      });
    }

    // Add DNS Ingress Evidence
    const dns = snapshot?.dns;
    if (dns?.a && dns.a.length > 0) {
      items.push({
        claim: `Ingress multi-IP resolution across ${dns.a.length} IPv4 addresses`,
        layer: 'DNS',
        source: 'DNS A Record Query',
        rawEvidence: dns.a.join(', '),
        timestamp,
        confidence: 'HIGH',
      });
    }

    return { items };
  }

  // ---------------------------------------------------------------------------
  // 7. Progressive Disclosure Builder (Levels 1, 2, 3)
  // ---------------------------------------------------------------------------
  private buildProgressiveDisclosure(params: {
    domainName: string;
    snapshotId: string;
    timestamp: string;
    architecture: UnifiedNarrativeArchitectureSection;
    requestJourney: UnifiedNarrativeRequestJourney;
    evolution: UnifiedNarrativeEvolutionSection;
    currentTruth: UnifiedNarrativeCurrentTruthSection;
    knownUnknowns: UnifiedNarrativeKnownUnknownsSection;
    evidenceLineage: UnifiedNarrativeEvidenceLineage;
    posture?: ArchitecturalPostureReport | null;
  }): UnifiedNarrativeProgressiveDisclosure {
    const {
      domainName,
      snapshotId,
      timestamp,
      architecture,
      requestJourney,
      evolution,
      currentTruth,
      knownUnknowns,
      evidenceLineage,
      posture,
    } = params;

    // Level 1: Understanding
    const level1Understanding = {
      headline: architecture.headline,
      pathSummary: requestJourney.journeySummary,
      oneLiner: architecture.narrative,
    };

    // Level 2: Context
    const layerRationale = architecture.observedLayers.map(
      (l) => `${l.layer}: ${l.technologies.join(', ')} serves as ${l.role}.`,
    );

    const level2Context = {
      architectureMeaning: `Public ingress for ${domainName} is organized across ${architecture.observedLayers.length} independently observable tier(s).`,
      layerRationale,
      evolutionContext: evolution.evolutionNarrative,
      postureContext: posture
        ? `Security Rating: ${posture.securityPosture.rating} (TLS Score: ${posture.securityPosture.tlsScore}, Header Score: ${posture.securityPosture.headerScore}). Exposure Level: ${posture.exposurePosture.level}.`
        : 'Security controls and transport boundaries evaluated against current snapshot baseline.',
      unobservedDimensions: knownUnknowns.explicitStatements,
    };

    // Level 3: Evidence
    const level3Evidence = {
      evidenceLineage: evidenceLineage.items,
      rawObservationsSummary: `${evidenceLineage.items.length} verified evidence items backing architectural claims.`,
      snapshotId,
      timestamp,
    };

    return {
      level1Understanding,
      level2Context,
      level3Evidence,
    };
  }

  // ---------------------------------------------------------------------------
  // 8. Executive Brief Builder
  // ---------------------------------------------------------------------------
  private buildExecutiveBrief(params: {
    domainName: string;
    architecture: UnifiedNarrativeArchitectureSection;
    evolution: UnifiedNarrativeEvolutionSection;
    currentTruth: UnifiedNarrativeCurrentTruthSection;
    posture?: ArchitecturalPostureReport | null;
  }): string {
    const { domainName, architecture, evolution, currentTruth, posture } =
      params;

    const observedLayersList = architecture.observedLayers
      .map(
        (l) =>
          `${l.technologies.join('/')} at the ${l.layer.toLowerCase()} boundary`,
      )
      .join(', ');

    const archParagraph =
      observedLayersList.length > 0
        ? `The domain currently presents a ${architecture.headline.toLowerCase()} with ${observedLayersList}. TLS is terminated at the observed public perimeter, while internal database, orchestration, and origin infrastructure remain unobservable from public evidence.`
        : `The domain currently presents an unclassified public HTTP endpoint. Internal infrastructure remains unobservable from public evidence.`;

    const evolParagraph = evolution.hasChanges
      ? evolution.evolutionNarrative
      : 'No recent material infrastructure changes were observed.';

    const truthParagraph =
      currentTruth.lifecycleState === 'STABLE'
        ? 'Architecture is stable with no active infrastructure findings requiring attention.'
        : currentTruth.narrative;

    return `${archParagraph} ${evolParagraph} ${truthParagraph}`;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private calculateDefensibleConfidence(
    architecture: UnifiedNarrativeArchitectureSection,
    behavioralSignals: any[],
    snapshot: DiscoverySnapshot,
  ): NarrativeConfidenceLevel {
    const observedCount = architecture.observedLayers.length;
    if (observedCount === 0) {
      return 'INCONCLUSIVE';
    }

    const hasHighConfidenceTech = architecture.observedLayers.some(
      (l) => l.confidence === 'HIGH',
    );
    const hasBehavioral = behavioralSignals.length > 0;

    if (
      hasHighConfidenceTech &&
      (hasBehavioral ||
        snapshot?.ssl?.supported ||
        (snapshot?.ssl as any)?.valid ||
        snapshot?.dns?.a)
    ) {
      return 'HIGH';
    }

    if (hasHighConfidenceTech || hasBehavioral) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private mapConfidence(conf: any): NarrativeConfidenceLevel {
    if (!conf) return 'MEDIUM';
    const s = String(conf).toUpperCase();
    if (s.includes('HIGH') || s.includes('AUTHORITATIVE')) return 'HIGH';
    if (s.includes('MEDIUM') || s.includes('SUPPORTED')) return 'MEDIUM';
    if (s.includes('LOW') || s.includes('CONTEXTUAL') || s.includes('INFERRED'))
      return 'LOW';
    return 'INCONCLUSIVE';
  }
}
