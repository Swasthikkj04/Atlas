/**
 * Certified S4 Invariants for Content Security & Asset Integrity Intelligence.
 */
export const S4_CERTIFIED_INVARIANTS = {
  S4_CSP_POLICY_ANALYSIS_INTEGRITY: true,
  S4_PERMISSIVE_DIRECTIVE_DETECTION: true,
  S4_CROSS_ORIGIN_ISOLATION_INTEGRITY: true,
  S4_PERMISSIONS_POLICY_HYGIENE_INTEGRITY: true,
  S4_RESPONSE_AWARE_HTML_BOUNDARY: true,
  S4_ANTI_OVERREACH_ENFORCEMENT: true,
  S4_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S4_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type CspDirectivesMap = Record<string, string[]>;

export interface NormalizedCspObservation {
  present: boolean;
  isReportOnly: boolean;
  rawPolicy?: string;
  directives: CspDirectivesMap;
  hasUnsafeInline: boolean;
  hasUnsafeEval: boolean;
  hasWildcardScript: boolean;
  hasMissingObjectSrc: boolean;
  hasMissingBaseUri: boolean;
  isStrict: boolean;
  permissiveTokens: string[];
}

export interface NormalizedCrossOriginIsolationObservation {
  coop?: string; // Cross-Origin-Opener-Policy
  coep?: string; // Cross-Origin-Embedder-Policy
  corp?: string; // Cross-Origin-Resource-Policy
  isIsolated: boolean; // coop === 'same-origin' && coep === 'require-corp'
}

export interface NormalizedPermissionsPolicyObservation {
  present: boolean;
  rawHeader?: string;
  restrictedFeatures: string[];
  wildcardFeatures: string[];
  isConfigured: boolean;
}

export interface ContentSecurityPostureAssessment {
  domain: string;
  snapshotId?: string;
  csp: NormalizedCspObservation;
  crossOriginIsolation: NormalizedCrossOriginIsolationObservation;
  permissionsPolicy: NormalizedPermissionsPolicyObservation;
  overallScore: number; // 0 to 100
  isCompliant: boolean;
  summary: string;
}
