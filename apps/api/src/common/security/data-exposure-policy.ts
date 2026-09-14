/**
 * S-08 Progressive Disclosure & Raw Evidence Exposure Policy
 *
 * Implements S08-I07:
 * - 6-Level Progressive Disclosure Ladder:
 *   0: Orientation -> 1: Meaning -> 2: Attention -> 3: Architecture -> 4: Evidence Preview -> 5: Deep Investigation
 * - Strict containment of raw collector payloads
 * - GX plane restricted to Level 0-3 (Level 4 preview only; Level 5 raw payload blocked)
 */

export type ProgressiveDisclosureLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ProgressiveDisclosureContext {
  plane: 'GX' | 'WX' | 'ADMIN';
  requestedLevel: ProgressiveDisclosureLevel;
  isOwner: boolean;
}

export interface DisclosureEvaluationResult {
  allowed: boolean;
  effectiveLevel: ProgressiveDisclosureLevel;
  includeRawPayload: boolean;
  decision:
    | 'DISCLOSURE_PERMITTED'
    | 'RAW_EVIDENCE_CONTAINED'
    | 'GX_DEEP_INVESTIGATION_BLOCKED'
    | 'UNAUTHORIZED_LEVEL_BLOCKED';
}

export class DataExposurePolicy {
  /**
   * Evaluates if requested disclosure level and raw evidence access is authorized.
   */
  static evaluateProgressiveDisclosure(
    ctx: ProgressiveDisclosureContext,
  ): DisclosureEvaluationResult {
    // 1. GX Plane Boundaries: Maximum Level 3 full architecture, Level 4 summary preview only. Level 5 raw payload strictly blocked.
    if (ctx.plane === 'GX') {
      if (ctx.requestedLevel === 5) {
        return {
          allowed: false,
          effectiveLevel: 3,
          includeRawPayload: false,
          decision: 'GX_DEEP_INVESTIGATION_BLOCKED',
        };
      }
      return {
        allowed: true,
        effectiveLevel: Math.min(
          ctx.requestedLevel,
          4,
        ) as ProgressiveDisclosureLevel,
        includeRawPayload: false,
        decision: 'DISCLOSURE_PERMITTED',
      };
    }

    // 2. WX Plane: Non-owners cannot access deep evidence
    if (ctx.plane === 'WX') {
      if (!ctx.isOwner) {
        return {
          allowed: false,
          effectiveLevel: 0,
          includeRawPayload: false,
          decision: 'UNAUTHORIZED_LEVEL_BLOCKED',
        };
      }

      if (ctx.requestedLevel === 5) {
        return {
          allowed: true,
          effectiveLevel: 5,
          includeRawPayload: true,
          decision: 'DISCLOSURE_PERMITTED',
        };
      }

      return {
        allowed: true,
        effectiveLevel: ctx.requestedLevel,
        includeRawPayload: false,
        decision: 'DISCLOSURE_PERMITTED',
      };
    }

    // 3. ADMIN Plane: Governance access
    return {
      allowed: true,
      effectiveLevel: ctx.requestedLevel,
      includeRawPayload: ctx.requestedLevel === 5,
      decision: 'DISCLOSURE_PERMITTED',
    };
  }
}
