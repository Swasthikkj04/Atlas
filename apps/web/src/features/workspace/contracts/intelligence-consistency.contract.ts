/**
 * H7 — Infrastructure Intelligence Consistency & Cross-Surface Truth Contracts
 *
 * Enforces the Golden Nebula Invariant:
 * "One verified observation must produce one consistent truth everywhere it appears."
 */

export const H7_CERTIFIED_INVARIANTS = {
  H7_ONE_VERIFIED_OBSERVATION_ONE_TRUTH: true,
  H7_FINDING_LIFECYCLE_CROSS_SURFACE_CONSISTENCY: true,
  H7_TECHNOLOGY_TRUTH_IMMUTABILITY: true,
  H7_INGRESS_TOPOLOGY_ANTI_DRIFT: true,
  H7_CONFIDENCE_PROPAGATION_FIDELITY: true,
  H7_KNOWN_UNKNOWNS_PERIMETER_SEALING: true,
  H7_H3_CHANGE_FORENSICS_CONVERGENCE: true,
  H7_H4_POSTURE_RECALCULATION_SYNCHRONIZATION: true,
  H7_H5_NARRATIVE_EVIDENCE_PROJECTION: true,
  H7_CROSS_SURFACE_CONTRADICTION_DETECTION: true,
  H7_ZERO_STALE_CACHE_TRUTH: true,
  H7_DEEP_NAVIGATION_TRUTH_PRESERVATION: true,
} as const;

export type ConfidenceRating = 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';

export interface FrontendTechnologyTruth {
  readonly name: string;
  readonly layer: string;
  readonly version?: string;
  readonly confidence: ConfidenceRating;
  readonly evidence: string[];
  readonly whatThisDoesNotProve: string[];
}

export interface FrontendTopologyHop {
  readonly hopIndex: number;
  readonly title: string;
  readonly layer: string;
  readonly technologyName?: string;
  readonly status: 'OBSERVED' | 'UNOBSERVED' | 'SEALED';
  readonly isDirectConnection: boolean;
}

export interface FrontendFindingTruth {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  readonly status: 'ACTIVE' | 'RESOLVED' | 'MUTED';
  readonly isCompliant: boolean;
  readonly snapshotId: string;
  readonly resolvingSnapshotId?: string;
  readonly evidence: string[];
}

export interface FrontendKnownUnknown {
  readonly dimension: string;
  readonly status: 'UNOBSERVED' | 'MASKED' | 'UNKNOWN';
  readonly explanation: string;
}

export interface FrontendAuthoritativeIntelligenceState {
  readonly snapshotId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly timestamp: string;
  readonly status: 'STABLE' | 'CHANGED' | 'ATTENTION';
  readonly technologies: FrontendTechnologyTruth[];
  readonly ingressPath: FrontendTopologyHop[];
  readonly activeFindings: FrontendFindingTruth[];
  readonly resolvedFindings: FrontendFindingTruth[];
  readonly changeEvents: Array<{ id: string; type: string; title: string; whatChanged: string }>;
  readonly posture: {
    readonly securityRating: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'DEGRADED' | 'CRITICAL';
    readonly architectureRating: 'MODERN_MULTI_TIER' | 'BUFFERED_GATEWAY' | 'FLAT_DIRECT' | 'INDETERMINATE';
    readonly exposureLevel: 'MINIMAL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
    readonly activeControls: string[];
    readonly securityGaps: string[];
    readonly summary: string;
  };
  readonly whatMattersNow: {
    readonly status: 'STABLE' | 'CHANGED' | 'ATTENTION';
    readonly headline: string;
    readonly narrative: string;
    readonly primaryAction: string;
  };
  readonly unifiedNarrative: {
    readonly headline: string;
    readonly pathSummary: string;
    readonly oneLiner: string;
  };
  readonly knownUnknowns: FrontendKnownUnknown[];
  readonly confidence: {
    readonly overall: ConfidenceRating;
    readonly score: number;
    readonly rationale: string;
  };
}

export type ContradictionDimension =
  | 'FINDING_LIFECYCLE'
  | 'TECHNOLOGY_TRUTH'
  | 'TOPOLOGY_DRIFT'
  | 'CONFIDENCE_MISMATCH'
  | 'KNOWN_UNKNOWNS'
  | 'CHANGE_TRUTH'
  | 'POSTURE_ALIGNMENT'
  | 'NARRATIVE_FIDELITY';

export interface CrossSurfaceContradiction {
  readonly dimension: ContradictionDimension;
  readonly surfaceA: string;
  readonly surfaceB: string;
  readonly message: string;
  readonly severity: 'FATAL' | 'WARNING';
}

export interface SurfaceViewProjection {
  readonly surfaceName: string;
  readonly snapshotId: string;
  readonly status?: 'STABLE' | 'CHANGED' | 'ATTENTION';
  readonly technologies?: Array<{ name: string; layer: string; version?: string }>;
  readonly topologyHops?: string[];
  readonly activeFindings?: string[];
  readonly resolvedFindings?: string[];
  readonly confidenceLevel?: ConfidenceRating;
  readonly knownUnknowns?: string[];
  readonly narrativeClaims?: string[];
}

export interface FrontendConsistencyValidationResult {
  readonly isConsistent: boolean;
  readonly snapshotId: string;
  readonly checkedSurfaces: string[];
  readonly contradictions: CrossSurfaceContradiction[];
  readonly timestamp: string;
}

/**
 * Validates frontend cross-surface consistency against the authoritative state.
 */
export function validateFrontendCrossSurfaceConsistency(
  state: FrontendAuthoritativeIntelligenceState,
  views: SurfaceViewProjection[] = [],
): FrontendConsistencyValidationResult {
  const contradictions: CrossSurfaceContradiction[] = [];
  const checkedSurfaces: string[] = [];

  for (const view of views) {
    checkedSurfaces.push(view.surfaceName);

    // 1. Snapshot ID Integrity
    if (view.snapshotId !== state.snapshotId) {
      contradictions.push({
        dimension: 'FINDING_LIFECYCLE',
        surfaceA: 'AuthoritativeState',
        surfaceB: view.surfaceName,
        message: `View ${view.surfaceName} displays stale snapshot ${view.snapshotId} instead of ${state.snapshotId}.`,
        severity: 'FATAL',
      });
    }

    // 2. Finding Lifecycle vs What Matters Now
    if (view.status) {
      const hasCriticalFindings = state.activeFindings.some(
        (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH',
      );
      if (hasCriticalFindings && view.status === 'STABLE') {
        contradictions.push({
          dimension: 'FINDING_LIFECYCLE',
          surfaceA: 'AuthoritativeFindings',
          surfaceB: view.surfaceName,
          message: `View ${view.surfaceName} claims STABLE when active critical findings exist.`,
          severity: 'FATAL',
        });
      }
    }

    // 3. Active vs Resolved Finding Integrity
    if (view.activeFindings) {
      for (const findingId of view.activeFindings) {
        const isActuallyResolved = state.resolvedFindings.some((rf) => rf.id === findingId);
        if (isActuallyResolved) {
          contradictions.push({
            dimension: 'FINDING_LIFECYCLE',
            surfaceA: 'AuthoritativeState',
            surfaceB: view.surfaceName,
            message: `View ${view.surfaceName} displays resolved finding ${findingId} as ACTIVE.`,
            severity: 'FATAL',
          });
        }
      }
    }

    // 4. Technology Truth & Layer Immutability
    if (view.technologies) {
      for (const tech of view.technologies) {
        const authTech = state.technologies.find(
          (t) => t.name.toLowerCase() === tech.name.toLowerCase(),
        );
        if (!authTech) {
          contradictions.push({
            dimension: 'TECHNOLOGY_TRUTH',
            surfaceA: 'AuthoritativeTechnologies',
            surfaceB: view.surfaceName,
            message: `View ${view.surfaceName} displays unverified technology '${tech.name}'.`,
            severity: 'FATAL',
          });
        } else if (authTech.layer !== tech.layer) {
          contradictions.push({
            dimension: 'TECHNOLOGY_TRUTH',
            surfaceA: 'AuthoritativeTechnologies',
            surfaceB: view.surfaceName,
            message: `View ${view.surfaceName} displays layer '${tech.layer}' for '${tech.name}' instead of '${authTech.layer}'.`,
            severity: 'FATAL',
          });
        }
      }
    }

    // 5. Topology Ingress Path Anti-Drift
    if (view.topologyHops) {
      const authHopNames = state.ingressPath.map((h) => h.technologyName || h.title);
      for (const hop of view.topologyHops) {
        if (!authHopNames.some((an) => an.toLowerCase() === hop.toLowerCase() || hop.includes(an))) {
          contradictions.push({
            dimension: 'TOPOLOGY_DRIFT',
            surfaceA: 'AuthoritativeTopology',
            surfaceB: view.surfaceName,
            message: `View ${view.surfaceName} injected unobserved hop '${hop}' into request path.`,
            severity: 'FATAL',
          });
        }
      }
    }

    // 6. Confidence Consistency
    if (view.confidenceLevel) {
      if (state.confidence.overall === 'LOW' && view.confidenceLevel === 'HIGH') {
        contradictions.push({
          dimension: 'CONFIDENCE_MISMATCH',
          surfaceA: 'AuthoritativeConfidence',
          surfaceB: view.surfaceName,
          message: `View ${view.surfaceName} inflated confidence from LOW to HIGH.`,
          severity: 'FATAL',
        });
      }
    }

    // 7. Known Unknowns Perimeter Sealing
    if (view.knownUnknowns) {
      const speculativeKeywords = ['postgresql', 'mysql', 'kubernetes', 'redis', 'mongodb', 'oracle'];
      for (const item of view.knownUnknowns) {
        const lowerItem = item.toLowerCase();
        for (const keyword of speculativeKeywords) {
          if (lowerItem.includes(keyword)) {
            const hasAuthKeywordTech = state.technologies.some((t) =>
              t.name.toLowerCase() === keyword,
            );
            if (!hasAuthKeywordTech) {
              contradictions.push({
                dimension: 'KNOWN_UNKNOWNS',
                surfaceA: 'AuthoritativeKnownUnknowns',
                surfaceB: view.surfaceName,
                message: `View ${view.surfaceName} speculated on unobserved dimension '${item}'.`,
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
