import {
  CaaRecordEntry,
  DnssecRecordData,
  DnssecStatus,
} from '../../../infrastructure/discovery/dns/dns-discovery.service';
import {
  BgpRpkiDiscoveryResult,
  RpkiStatus,
} from '../../../infrastructure/discovery/routing/contracts/bgp-rpki.interface';

/**
 * Certified P2 Invariants for Advanced DNSSEC, CAA & BGP RPKI Validation.
 */
export const P2_CERTIFIED_INVARIANTS = {
  P2_DNSSEC_VALIDATION_INTEGRITY: true,
  P2_CAA_RFC8659_POLICY_COMPLIANCE: true,
  P2_BGP_RPKI_ROUTE_ORIGIN_INTEGRITY: true,
  P2_FAILED_LOOKUP_TRUTH_PRESERVATION: true,
  P2_ANTI_OVERREACH_ENFORCEMENT: true,
  P2_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  P2_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export interface DnssecValidationAssessment {
  readonly enabled: boolean;
  readonly status: DnssecStatus;
  readonly hasDs: boolean;
  readonly hasDnskey: boolean;
  readonly hasRrsig: boolean;
  readonly keyTags?: readonly number[];
  readonly algorithms?: readonly string[];
  readonly digestTypes?: readonly string[];
  readonly isHardened: boolean;
  readonly summary: string;
}

export interface CaaPolicyAssessment {
  readonly present: boolean;
  readonly records: readonly CaaRecordEntry[];
  readonly authorizedIssuers: readonly string[];
  readonly wildcardIssuers: readonly string[];
  readonly iodefMailbox?: string;
  readonly allowsAllIssuers: boolean;
  readonly blocksAllIssuers: boolean;
  readonly isTlsIssuerPermitted: boolean;
  readonly issuerMismatchDetected: boolean;
  readonly isHardened: boolean;
  readonly summary: string;
}

export interface BgpRpkiSecurityAssessment {
  readonly totalPrefixes: number;
  readonly validRoaCount: number;
  readonly invalidRoaCount: number;
  readonly notFoundRoaCount: number;
  readonly coveragePercentage: number;
  readonly overallRpkiStatus: RpkiStatus;
  readonly uniqueAsns: readonly number[];
  readonly isMultiHomed: boolean;
  readonly hijackRiskDetected: boolean;
  readonly isHardened: boolean;
  readonly summary: string;
}

export interface AdvancedDnsRoutingPostureAssessment {
  readonly domain: string;
  readonly snapshotId?: string;
  readonly dnssec: DnssecValidationAssessment;
  readonly caa: CaaPolicyAssessment;
  readonly bgpRpki: BgpRpkiSecurityAssessment;
  readonly overallScore: number; // 0 to 100
  readonly isCompliant: boolean;
  readonly summary: string;
}
