/**
 * S1 — Cookie & Session Security Intelligence Contracts
 *
 * Golden Security Invariant:
 * Observed cookie behavior -> Security interpretation -> Finding -> Evidence-backed remediation
 * Never: Cookie name -> assumed authentication/session purpose -> security vulnerability.
 */

export const S1_CERTIFIED_INVARIANTS = {
  S1_OBSERVED_COOKIE_BEHAVIOR_INTEGRITY: true,
  S1_CLASSIFICATION_CONSERVATIVE: true,
  S1_HTTPONLY_EVIDENCE_GROUNDED: true,
  S1_SECURE_TRANSPORT_ALIGNED: true,
  S1_SAMESITE_CONTROL_SEPARATED: true,
  S1_COOKIE_ATTRIBUTE_CORRELATED: true,
  S1_SENSITIVE_VALUE_REDACTION: true,
  S1_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION: true,
  S1_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S1_ANTI_OVERREACH_ENFORCEMENT: true,
  S1_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type CookieClassification =
  | 'CONFIRMED_SESSION'
  | 'STRONGLY_INDICATIVE_AUTH'
  | 'POTENTIAL_SESSION'
  | 'ORDINARY_NON_SENSITIVE';

export type CookieClassificationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type SameSitePolicy = 'Strict' | 'Lax' | 'None' | 'Missing';

export interface NormalizedCookieObservation {
  readonly name: string;
  readonly valueRedacted: string;
  readonly rawSetCookieRedacted: string;
  readonly isSecure: boolean;
  readonly isHttpOnly: boolean;
  readonly sameSite: SameSitePolicy;
  readonly sameSiteRaw?: string;
  readonly domain?: string;
  readonly path?: string;
  readonly maxAge?: number;
  readonly expires?: string;
  readonly isPartitioned: boolean;
  readonly classification: CookieClassification;
  readonly classificationConfidence: CookieClassificationConfidence;
  readonly whatThisDoesNotProve: string;
  readonly observationTimestamp: string;
  readonly snapshotId?: string;
}

export interface CookieSecurityAssessment {
  readonly totalCookies: number;
  readonly cookies: NormalizedCookieObservation[];
  readonly sessionCookies: NormalizedCookieObservation[];
  readonly missingHttpOnly: NormalizedCookieObservation[];
  readonly missingSecure: NormalizedCookieObservation[];
  readonly missingSameSite: NormalizedCookieObservation[];
  readonly sameSiteNoneWithoutSecure: NormalizedCookieObservation[];
  readonly fullySecuredCookies: NormalizedCookieObservation[];
  readonly securityGapsCount: number;
  readonly summary: string;
}
