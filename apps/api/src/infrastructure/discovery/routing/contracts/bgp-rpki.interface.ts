export type RpkiStatus =
  'VALID' | 'INVALID' | 'NOT_FOUND' | 'UNKNOWN' | 'UNVERIFIABLE';

export interface BgpRoaDetails {
  readonly maxLength?: number;
  readonly authorizedAsn?: number;
  readonly validSince?: string;
  readonly validUntil?: string;
  readonly trustAnchor?: string;
}

export interface BgpPrefixRoute {
  readonly ip: string;
  readonly ipVersion: 4 | 6;
  readonly prefix: string;
  readonly asn: number;
  readonly asName: string;
  readonly asOrg?: string;
  readonly country?: string;
  readonly registry?:
    'ARIN' | 'RIPE NCC' | 'APNIC' | 'LACNIC' | 'AFRINIC' | 'UNKNOWN';
  readonly rpkiStatus: RpkiStatus;
  readonly roaDetails?: BgpRoaDetails;
  readonly isAnomaly?: boolean;
  readonly anomalyReason?: string;
}

export interface BgpRpkiSummary {
  readonly totalRoutes: number;
  readonly validCount: number;
  readonly invalidCount: number;
  readonly notFoundCount: number;
  readonly overallRpkiStatus: RpkiStatus;
  readonly coveragePercentage: number;
}

export interface BgpRpkiDiscoveryResult {
  readonly routes: readonly BgpPrefixRoute[];
  readonly uniqueAsns: readonly number[];
  readonly isMultiHomed: boolean;
  readonly rpkiSummary: BgpRpkiSummary;
  readonly hijackRiskDetected: boolean;
  readonly status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  readonly error?: string;
}
