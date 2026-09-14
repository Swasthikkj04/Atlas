export type SubdomainSource =
  'DNS_BRUTEFORCE' | 'TLS_SAN' | 'DNS_RECORDS' | 'HYBRID';

export type SubdomainTakeoverRisk =
  'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EnvironmentClassification =
  | 'PRODUCTION'
  | 'STAGING'
  | 'DEVELOPMENT'
  | 'INTERNAL'
  | 'DEPRECATED'
  | 'UNKNOWN';

export interface DiscoveredSubdomain {
  readonly hostname: string;
  readonly subdomainPrefix: string;
  readonly ipAddresses: string[];
  readonly ipv6Addresses: string[];
  readonly cnameTargets: string[];
  readonly httpStatus?: number;
  readonly tlsActive: boolean;
  readonly tlsIssuer?: string;
  readonly tlsSubjectAltNames?: string[];
  readonly isWildcard: boolean;
  readonly takeoverRisk: SubdomainTakeoverRisk;
  readonly takeoverProvider?: string;
  readonly takeoverReason?: string;
  readonly environmentType: EnvironmentClassification;
  readonly discoveredVia: SubdomainSource;
  readonly responseTimeMs?: number;
  readonly discoveredAt: string;
}

export interface SubdomainPerimeterReport {
  readonly domain: string;
  readonly totalDiscovered: number;
  readonly subdomains: DiscoveredSubdomain[];
  readonly wildcardDetected: boolean;
  readonly wildcardIps: string[];
  readonly environmentsSummary: Record<EnvironmentClassification, number>;
  readonly takeoverRisksSummary: Record<SubdomainTakeoverRisk, number>;
  readonly executionDurationMs: number;
  readonly scannedAt: string;
}
