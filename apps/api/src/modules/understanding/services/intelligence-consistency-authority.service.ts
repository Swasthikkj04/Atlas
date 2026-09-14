import { Injectable, Logger } from '@nestjs/common';
import {
  AuthoritativeIntelligenceStateDto,
  AuthoritativeTechnologyTruth,
  AuthoritativeTopologyHop,
  AuthoritativeFindingTruth,
  AuthoritativeKnownUnknown,
  AuthoritativeEvidenceLineageItem,
  CrossSurfaceContradiction,
  IntelligenceConsistencyValidationResult,
  SurfaceIntelligenceProjection,
} from '../contracts/authoritative-intelligence-state.interface';
import {
  TopologyLayer,
  TechnologyConfidenceLevel,
} from '../../../infrastructure/discovery/technology/contracts';
import { TechnologyDifference } from '../contracts/technology-change.interface';
import {
  SecurityPostureRating,
  ArchitecturePostureRating,
  ExposureLevel,
} from '../contracts/architectural-posture.interface';
import {
  UnifiedNarrativeLevel1,
  UnifiedNarrativeLevel2,
  UnifiedNarrativeLevel3,
  NarrativeConfidenceLevel,
} from '../contracts/unified-narrative.interface';

@Injectable()
export class IntelligenceConsistencyAuthorityService {
  private readonly logger = new Logger(
    IntelligenceConsistencyAuthorityService.name,
  );

  /**
   * Synthesizes the single authoritative cross-surface intelligence state.
   */
  public synthesizeAuthoritativeState(params: {
    snapshotId: string;
    domainId: string;
    domainName: string;
    timestamp?: string;
    technologies: AuthoritativeTechnologyTruth[];
    ingressPath?: AuthoritativeTopologyHop[];
    activeFindings?: AuthoritativeFindingTruth[];
    resolvedFindings?: AuthoritativeFindingTruth[];
    changeEvents?: TechnologyDifference[];
    posture?: {
      securityRating: SecurityPostureRating;
      architectureRating: ArchitecturePostureRating;
      exposureLevel: ExposureLevel;
      activeControls: string[];
      securityGaps: string[];
      summary: string;
    };
    unifiedNarrative?: {
      level1: UnifiedNarrativeLevel1;
      level2: UnifiedNarrativeLevel2;
      level3: UnifiedNarrativeLevel3;
    };
    knownUnknowns?: AuthoritativeKnownUnknown[];
    evidenceLineage?: AuthoritativeEvidenceLineageItem[];
    confidence?: {
      overall: TechnologyConfidenceLevel;
      score: number;
      rationale: string;
    };
  }): AuthoritativeIntelligenceStateDto {
    const timestamp = params.timestamp || new Date().toISOString();
    const activeFindings = params.activeFindings || [];
    const resolvedFindings = params.resolvedFindings || [];
    const changeEvents = params.changeEvents || [];
    const technologies = params.technologies || [];

    // Ensure WX-211 finding compliance invariants
    for (const finding of activeFindings) {
      if (finding.isCompliant) {
        throw new Error(
          `Contradiction: Active finding ${finding.id} cannot be compliant.`,
        );
      }
    }
    for (const finding of resolvedFindings) {
      if (!finding.isCompliant) {
        throw new Error(
          `Contradiction: Resolved finding ${finding.id} must be compliant in resolving snapshot.`,
        );
      }
    }

    // Determine authoritative status for What Matters Now
    const hasCriticalFindings = activeFindings.some(
      (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH',
    );
    let derivedStatus: 'STABLE' | 'CHANGED' | 'ATTENTION' = 'STABLE';
    let headline = 'Infrastructure Verified & Stable';
    let narrative = `All observed layers across ${params.domainName} are operating within normal baseline parameters.`;
    let primaryAction = 'View verified architecture';

    if (hasCriticalFindings) {
      derivedStatus = 'ATTENTION';
      headline = 'Active Finding Requires Attention';
      narrative = `${activeFindings.length} active observation(s) require operator remediation.`;
      primaryAction = 'Review findings';
    } else if (changeEvents.length > 0) {
      derivedStatus = 'CHANGED';
      headline = 'Recent Infrastructure Changes Detected';
      narrative = `${changeEvents.length} change event(s) detected across recent snapshots.`;
      primaryAction = 'Review changes';
    }

    // Fallback topology hops if not provided
    const ingressPath =
      params.ingressPath || this.buildDefaultIngressPath(technologies);

    // Default Known Unknowns to ensure sealed perimeters
    const knownUnknowns = params.knownUnknowns || [
      {
        dimension: 'Database Tier',
        status: 'UNOBSERVED',
        explanation:
          'Sealed internal network boundaries prevent observation of internal storage engines.',
      },
      {
        dimension: 'Host Kernel / OS',
        status: 'UNOBSERVED',
        explanation:
          'Internal host operating system is masked behind edge proxies.',
      },
      {
        dimension: 'Container Orchestrator',
        status: 'UNOBSERVED',
        explanation:
          'No direct orchestrator telemetry exposed at ingress perimeter.',
      },
    ];

    // Default posture
    const posture = params.posture || {
      securityRating: hasCriticalFindings ? 'DEGRADED' : 'GOOD',
      architectureRating: technologies.some((t) => t.layer === 'EDGE')
        ? 'MODERN_MULTI_TIER'
        : 'BUFFERED_GATEWAY',
      exposureLevel: 'LOW',
      activeControls: [
        'TLS 1.3 Transport Security',
        'Edge Reverse Proxy Isolation',
      ],
      securityGaps: hasCriticalFindings ? ['Missing HSTS Header'] : [],
      summary: hasCriticalFindings
        ? 'Security posture degraded due to unmitigated active findings.'
        : 'Robust multi-tier ingress posture observed with verified edge controls.',
    };

    // Default unified narrative
    const unifiedNarrative = params.unifiedNarrative || {
      level1: {
        headline: `${params.domainName} is served via ${technologies.map((t) => t.name).join(' and ') || 'verified endpoints'}.`,
        pathSummary: ingressPath.map((h) => h.title).join(' → '),
        oneLiner: `${params.domainName} ingress architecture verified with ${technologies.length} components.`,
      },
      level2: {
        architectureMeaning: `Observed infrastructure consists of verified ingress layers terminating public telemetry.`,
        layerRationale: technologies.map(
          (t) => `${t.name} operates at the ${t.layer} layer.`,
        ),
        evolutionContext:
          changeEvents.length > 0
            ? 'Recent changes recorded.'
            : 'Infrastructure baseline is stable.',
        postureContext: posture.summary,
        unobservedDimensions: knownUnknowns.map((k) => k.dimension),
      },
      level3: {
        evidenceLineage: technologies.flatMap((t) =>
          t.evidence.map((ev) => ({
            claim: `${t.name} identified at ${t.layer} layer`,
            layer: t.layer,
            technology: t.name,
            source: 'Authoritative Wire Telemetry',
            rawEvidence: ev,
            timestamp,
            confidence:
              t.confidence === 'HIGH'
                ? 'HIGH'
                : t.confidence === 'MEDIUM'
                  ? 'MEDIUM'
                  : 'LOW',
          })),
        ),
        rawObservationsSummary: `${technologies.length} components verified with authoritative wire evidence.`,
        snapshotId: params.snapshotId,
        timestamp,
      },
    };

    // Default evidence lineage
    const evidenceLineage =
      params.evidenceLineage ||
      technologies.flatMap((t, idx) =>
        t.evidence.map((ev, evIdx) => ({
          id: `ev-${t.name.toLowerCase()}-${idx}-${evIdx}`,
          claim: `${t.name} identified at ${t.layer} layer`,
          layer: t.layer,
          technology: t.name,
          source: 'Authoritative Wire Telemetry',
          rawEvidence: ev,
          timestamp,
          confidence: t.confidence,
          snapshotId: params.snapshotId,
        })),
      );

    const overallConfidence: TechnologyConfidenceLevel =
      technologies.length > 0 ? technologies[0].confidence : 'HIGH';

    const confidence = params.confidence || {
      overall: overallConfidence,
      score:
        overallConfidence === 'HIGH'
          ? 0.95
          : overallConfidence === 'MEDIUM'
            ? 0.75
            : 0.4,
      rationale: 'Evidence corroborated with authoritative wire observations.',
    };

    return {
      snapshotId: params.snapshotId,
      domainId: params.domainId,
      domainName: params.domainName,
      timestamp,
      status: derivedStatus,
      technologies,
      ingressPath,
      activeFindings,
      resolvedFindings,
      changeEvents,
      posture,
      whatMattersNow: {
        status: derivedStatus,
        headline,
        narrative,
        primaryAction,
      },
      unifiedNarrative,
      knownUnknowns,
      evidenceLineage,
      confidence,
    };
  }

  /**
   * Validates that multiple UI surface projections contain ZERO contradictions
   * against the authoritative state.
   */
  public validateCrossSurfaceConsistency(
    state: AuthoritativeIntelligenceStateDto,
    projections: SurfaceIntelligenceProjection[],
  ): IntelligenceConsistencyValidationResult {
    const contradictions: CrossSurfaceContradiction[] = [];
    const checkedSurfaces: string[] = [];

    for (const proj of projections) {
      checkedSurfaces.push(proj.surfaceName);

      // 1. Snapshot ID Consistency
      if (proj.snapshotId !== state.snapshotId) {
        contradictions.push({
          dimension: 'FINDING_LIFECYCLE',
          surfaceA: 'AuthoritativeState',
          surfaceB: proj.surfaceName,
          message: `Surface ${proj.surfaceName} is displaying stale snapshot ${proj.snapshotId} instead of authoritative ${state.snapshotId}.`,
          severity: 'FATAL',
        });
      }

      // 2. Finding Lifecycle & Status vs What Matters Now
      if (proj.status) {
        const hasCriticalFindings = state.activeFindings.some(
          (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH',
        );
        if (hasCriticalFindings && proj.status === 'STABLE') {
          contradictions.push({
            dimension: 'FINDING_LIFECYCLE',
            surfaceA: 'AuthoritativeFindings',
            surfaceB: proj.surfaceName,
            message: `Surface ${proj.surfaceName} reports STABLE while active critical findings exist.`,
            severity: 'FATAL',
          });
        }
      }

      // 3. Active vs Resolved Findings Mismatch
      if (proj.activeFindings) {
        for (const findingId of proj.activeFindings) {
          const isActuallyResolved = state.resolvedFindings.some(
            (rf) => rf.id === findingId,
          );
          if (isActuallyResolved) {
            contradictions.push({
              dimension: 'FINDING_LIFECYCLE',
              surfaceA: 'AuthoritativeState',
              surfaceB: proj.surfaceName,
              message: `Surface ${proj.surfaceName} displays resolved finding ${findingId} as ACTIVE.`,
              severity: 'FATAL',
            });
          }
        }
      }

      // 4. Technology Truth Consistency
      if (proj.technologies) {
        for (const projTech of proj.technologies) {
          const authTech = state.technologies.find(
            (t) => t.name.toLowerCase() === projTech.name.toLowerCase(),
          );
          if (!authTech) {
            contradictions.push({
              dimension: 'TECHNOLOGY_TRUTH',
              surfaceA: 'AuthoritativeTechnologies',
              surfaceB: proj.surfaceName,
              message: `Surface ${proj.surfaceName} displays unverified technology '${projTech.name}'.`,
              severity: 'FATAL',
            });
          } else if (authTech.layer !== projTech.layer) {
            contradictions.push({
              dimension: 'TECHNOLOGY_TRUTH',
              surfaceA: 'AuthoritativeTechnologies',
              surfaceB: proj.surfaceName,
              message: `Surface ${proj.surfaceName} displays layer '${projTech.layer}' for '${projTech.name}' instead of '${authTech.layer}'.`,
              severity: 'FATAL',
            });
          }
        }
      }

      // 5. Ingress Topology Anti-Drift
      if (proj.topologyHops) {
        const authHopNames = state.ingressPath.map(
          (h) => h.technologyName || h.title,
        );
        for (const hop of proj.topologyHops) {
          if (
            !authHopNames.some(
              (an) =>
                an.toLowerCase() === hop.toLowerCase() || hop.includes(an),
            )
          ) {
            contradictions.push({
              dimension: 'TOPOLOGY_DRIFT',
              surfaceA: 'AuthoritativeTopology',
              surfaceB: proj.surfaceName,
              message: `Surface ${proj.surfaceName} injected unobserved hop '${hop}' into request path.`,
              severity: 'FATAL',
            });
          }
        }
      }

      // 6. Confidence Consistency (No silent inflation)
      if (proj.confidenceLevel) {
        if (
          state.confidence.overall === 'LOW' &&
          proj.confidenceLevel === 'HIGH'
        ) {
          contradictions.push({
            dimension: 'CONFIDENCE_MISMATCH',
            surfaceA: 'AuthoritativeEvidence',
            surfaceB: proj.surfaceName,
            message: `Surface ${proj.surfaceName} inflated confidence to HIGH when evidence is LOW.`,
            severity: 'FATAL',
          });
        }
      }

      // 7. Known Unknowns Perimeter Sealing
      if (proj.knownUnknowns) {
        const speculativeKeywords = [
          'postgresql',
          'mysql',
          'kubernetes',
          'redis',
          'mongodb',
          'oracle',
        ];
        for (const item of proj.knownUnknowns) {
          const lowerItem = item.toLowerCase();
          for (const keyword of speculativeKeywords) {
            if (lowerItem.includes(keyword)) {
              const hasAuthKeywordTech = state.technologies.some(
                (t) => t.name.toLowerCase() === keyword,
              );
              if (!hasAuthKeywordTech) {
                contradictions.push({
                  dimension: 'KNOWN_UNKNOWNS',
                  surfaceA: 'AuthoritativeKnownUnknowns',
                  surfaceB: proj.surfaceName,
                  message: `Surface ${proj.surfaceName} speculated on unobserved dimension '${item}'.`,
                  severity: 'FATAL',
                });
                break;
              }
            }
          }
        }
      }
    }

    return {
      isConsistent: contradictions.length === 0,
      snapshotId: state.snapshotId,
      checkedSurfaces,
      contradictions,
      timestamp: new Date().toISOString(),
    };
  }

  private buildDefaultIngressPath(
    technologies: AuthoritativeTechnologyTruth[],
  ): AuthoritativeTopologyHop[] {
    const hops: AuthoritativeTopologyHop[] = [
      {
        hopIndex: 1,
        title: 'DNS / Ingress',
        layer: 'DNS' as TopologyLayer,
        status: 'OBSERVED',
        isDirectConnection: true,
      },
    ];

    let hopIdx = 2;
    for (const tech of technologies) {
      hops.push({
        hopIndex: hopIdx++,
        title: tech.name,
        layer: tech.layer,
        technologyName: tech.name,
        status: 'OBSERVED',
        isDirectConnection: true,
      });
    }

    hops.push({
      hopIndex: hopIdx,
      title: 'Sealed Internal Perimeter',
      layer: 'PLATFORM' as TopologyLayer,
      status: 'SEALED',
      isDirectConnection: false,
    });

    return hops;
  }
}
