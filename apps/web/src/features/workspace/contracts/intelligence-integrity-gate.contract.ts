/**
 * H8 — Final Intelligence Integrity & Production Hardening Frontend Contract
 *
 * Enforces the Golden H8 Invariant:
 * Observed Evidence -> Technology / Behavior -> Topology -> Change Forensics -> Posture & Impact -> Unified Narrative -> Investigation / Evidence -> Every UI Surface -> ONE CURRENT TRUTH.
 * Never: Missing evidence -> inference -> assertion -> finding.
 */

import type {
  FrontendAuthoritativeIntelligenceState,
  ConfidenceRating,
} from './intelligence-consistency.contract.ts';

export const H8_FRONTEND_CERTIFIED_INVARIANTS = {
  H8_PIPELINE_INTEGRITY_STRICT: true,
  H8_EVIDENCE_LINEAGE_COMPLETENESS: true,
  H8_CONFIDENCE_MONOTONIC_ORDERING: true,
  H8_CURRENT_HISTORICAL_TRUTH_SEPARATION: true,
  H8_CROSS_SURFACE_CONTRADICTION_SWEEP: true,
  H8_ADVERSARIAL_TRUTH_RESILIENCE: true,
  H8_SECURITY_AUTHORIZATION_HARDENING: true,
  H8_DETERMINISM_AND_IDEMPOTENCY: true,
  H8_CACHE_CONVERGENCE_INTEGRITY: true,
  H8_PRODUCTION_FAILURE_RESILIENCE: true,
  H8_MASTER_INTELLIGENCE_CERTIFICATION: true,
  H8_FINAL_PRODUCTION_GATE_SEALED: true,
} as const;

const CONFIDENCE_SCORES: Record<ConfidenceRating, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  INCONCLUSIVE: 0,
};

/**
 * Audits frontend pipeline integrity.
 */
export function validateFrontendPipelineIntegrity(
  state: FrontendAuthoritativeIntelligenceState,
): {
  readonly isValid: boolean;
  readonly ungroundedClaims: string[];
  readonly ungroundedTechnologies: string[];
  readonly ungroundedFindings: string[];
} {
  const ungroundedClaims: string[] = [];
  const ungroundedTechnologies: string[] = [];
  const ungroundedFindings: string[] = [];

  for (const tech of state.technologies) {
    if (!tech.evidence || tech.evidence.length === 0) {
      ungroundedTechnologies.push(tech.name);
    }
  }

  for (const f of state.activeFindings) {
    if (f.isCompliant) {
      ungroundedFindings.push(f.id);
    }
  }

  for (const f of state.resolvedFindings) {
    if (!f.isCompliant) {
      ungroundedFindings.push(f.id);
    }
  }

  const speculativeKeywords = ['postgresql', 'mysql', 'kubernetes', 'mongodb', 'oracle'];
  const narrative = `${state.unifiedNarrative.headline} ${state.unifiedNarrative.pathSummary}`.toLowerCase();
  for (const kw of speculativeKeywords) {
    if (narrative.includes(kw)) {
      const hasObserved = state.technologies.some((t) => t.name.toLowerCase() === kw);
      if (!hasObserved) {
        ungroundedClaims.push(`Speculation on unobserved '${kw}' in narrative.`);
      }
    }
  }

  return {
    isValid:
      ungroundedClaims.length === 0 &&
      ungroundedTechnologies.length === 0 &&
      ungroundedFindings.length === 0,
    ungroundedClaims,
    ungroundedTechnologies,
    ungroundedFindings,
  };
}

/**
 * Validates monotonic confidence ordering on frontend.
 */
export function verifyFrontendConfidenceMonotonicity(
  evidenceConf: ConfidenceRating,
  interpretationConf: ConfidenceRating,
  narrativeConf: ConfidenceRating,
  isBehavioralOnly = false,
): {
  readonly isMonotonic: boolean;
  readonly violations: string[];
} {
  const violations: string[] = [];
  const evScore = CONFIDENCE_SCORES[evidenceConf] ?? 0;
  const intScore = CONFIDENCE_SCORES[interpretationConf] ?? 0;
  const narScore = CONFIDENCE_SCORES[narrativeConf] ?? 0;

  if (intScore > evScore) {
    violations.push(`Interpretation confidence (${interpretationConf}) exceeds evidence (${evidenceConf}).`);
  }
  if (narScore > intScore) {
    violations.push(`Narrative confidence (${narrativeConf}) exceeds interpretation (${interpretationConf}).`);
  }
  if (isBehavioralOnly && narScore > CONFIDENCE_SCORES.MEDIUM) {
    violations.push(`Behavioral-only evidence cannot produce HIGH confidence narrative.`);
  }

  return {
    isMonotonic: violations.length === 0,
    violations,
  };
}

/**
 * Audits current truth vs. historical truth separation.
 */
export function auditFrontendCurrentVsHistoricalSeparation(
  currentState: FrontendAuthoritativeIntelligenceState,
  historicalContext?: {
    previousTechnologies?: string[];
    resolvedFindingIds?: string[];
  },
): {
  readonly isSeparated: boolean;
  readonly leakedFindingIds: string[];
  readonly ghostBadges: string[];
} {
  const leakedFindingIds: string[] = [];
  const ghostBadges: string[] = [];

  if (historicalContext?.resolvedFindingIds) {
    for (const rfId of historicalContext.resolvedFindingIds) {
      if (currentState.activeFindings.some((af) => af.id === rfId)) {
        leakedFindingIds.push(rfId);
      }
    }
  }

  if (historicalContext?.previousTechnologies) {
    for (const prevTech of historicalContext.previousTechnologies) {
      const isStillObserved = currentState.technologies.some(
        (t) => t.name.toLowerCase() === prevTech.toLowerCase(),
      );
      if (!isStillObserved) {
        const inPath = currentState.ingressPath.some(
          (h) => h.technologyName?.toLowerCase() === prevTech.toLowerCase(),
        );
        if (inPath) {
          ghostBadges.push(prevTech);
        }
      }
    }
  }

  return {
    isSeparated: leakedFindingIds.length === 0 && ghostBadges.length === 0,
    leakedFindingIds,
    ghostBadges,
  };
}
