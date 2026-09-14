/**
 * Certified S5 Invariants for DNS Security Posture & Mail Authentication Intelligence.
 */
export const S5_CERTIFIED_INVARIANTS = {
  S5_DNS_MAIL_SECURITY_INTEGRITY: true,
  S5_SPF_PERMISSIVE_QUALIFIER_DETECTION: true,
  S5_DMARC_ENFORCEMENT_POLICY_DETECTION: true,
  S5_DANGLING_CNAME_TAKEOVER_AUDIT: true,
  S5_FAILED_LOOKUP_TRUTH_PRESERVATION: true,
  S5_ANTI_OVERREACH_ENFORCEMENT: true,
  S5_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S5_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type SpfQualifier =
  'PASS_ALL' | 'NEUTRAL_ALL' | 'SOFTFAIL_ALL' | 'HARDFFAIL_ALL' | 'CUSTOM';

export interface NormalizedSpfObservation {
  present: boolean;
  rawRecord?: string;
  qualifier?: SpfQualifier;
  isPermissive: boolean; // +all or ?all
  includeCount: number;
  mechanisms: string[];
}

export type DmarcPolicyLevel = 'NONE' | 'QUARANTINE' | 'REJECT' | 'UNKNOWN';

export interface NormalizedDmarcObservation {
  present: boolean;
  rawRecord?: string;
  policy: DmarcPolicyLevel;
  subdomainPolicy?: DmarcPolicyLevel;
  percentage?: number;
  ruaDestination?: string;
  isEnforced: boolean; // p=quarantine or p=reject
  isMonitoringOnly: boolean; // p=none
}

export interface NormalizedDanglingCnameObservation {
  hasCname: boolean;
  cnameTarget?: string;
  matchedProvider?: string;
  isPotentiallyDangling: boolean;
  targetServiceType?: string;
}

export interface DnsSecurityPostureAssessment {
  domain: string;
  snapshotId?: string;
  spf: NormalizedSpfObservation;
  dmarc: NormalizedDmarcObservation;
  danglingCname: NormalizedDanglingCnameObservation;
  overallScore: number; // 0 to 100
  isCompliant: boolean;
  summary: string;
}
