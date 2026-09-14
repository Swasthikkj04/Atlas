/**
 * Certified P3 Invariants and Contracts for Subdomain Discovery & Attack Surface Management.
 */

export const P3_ATTACK_SURFACE_INVARIANTS = {
  P3_SUBDOMAIN_ENUMERATION_ENGINE: true,
  P3_WILDCARD_DNS_FILTERING: true,
  P3_DANGLING_CNAME_TAKEOVER_DETECTION: true,
  P3_ENVIRONMENT_PERIMETER_CLASSIFICATION: true,
  P3_MULTI_SOURCE_SAN_AND_WORDLIST_DISCOVERY: true,
} as const;

export type SubdomainSource =
  | 'DNS_BRUTEFORCE'
  | 'TLS_SAN'
  | 'DNS_RECORDS'
  | 'HYBRID';

export type SubdomainTakeoverRisk =
  | 'NONE'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type EnvironmentClassification =
  | 'PRODUCTION'
  | 'STAGING'
  | 'DEVELOPMENT'
  | 'INTERNAL'
  | 'DEPRECATED'
  | 'UNKNOWN';

export interface DiscoveredSubdomainDto {
  readonly hostname: string;
  readonly subdomainPrefix: string;
  readonly ipAddresses: string[];
  readonly ipv6Addresses: string[];
  readonly cnameTargets: string[];
  readonly httpStatus?: number;
  readonly tlsActive: boolean;
  readonly tlsIssuer?: string;
  readonly isWildcard: boolean;
  readonly takeoverRisk: SubdomainTakeoverRisk;
  readonly takeoverProvider?: string;
  readonly takeoverReason?: string;
  readonly environmentType: EnvironmentClassification;
  readonly discoveredVia: SubdomainSource;
  readonly responseTimeMs?: number;
  readonly discoveredAt: string;
}

export interface SubdomainPerimeterReportDto {
  readonly domain: string;
  readonly totalDiscovered: number;
  readonly subdomains: DiscoveredSubdomainDto[];
  readonly wildcardDetected: boolean;
  readonly wildcardIps: string[];
  readonly environmentsSummary: Record<EnvironmentClassification, number>;
  readonly takeoverRisksSummary: Record<SubdomainTakeoverRisk, number>;
  readonly executionDurationMs: number;
  readonly scannedAt: string;
}

export function getEnvironmentColorClass(env: EnvironmentClassification): {
  textClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (env) {
    case 'PRODUCTION':
      return {
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
      };
    case 'STAGING':
      return {
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
      };
    case 'DEVELOPMENT':
      return {
        textClass: 'text-cyan-400',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/20',
      };
    case 'INTERNAL':
      return {
        textClass: 'text-purple-400',
        bgClass: 'bg-purple-500/10',
        borderClass: 'border-purple-500/20',
      };
    case 'DEPRECATED':
      return {
        textClass: 'text-rose-400',
        bgClass: 'bg-rose-500/10',
        borderClass: 'border-rose-500/20',
      };
    default:
      return {
        textClass: 'text-slate-400',
        bgClass: 'bg-slate-800',
        borderClass: 'border-slate-700',
      };
  }
}

export function getTakeoverRiskColorClass(risk: SubdomainTakeoverRisk): {
  textClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (risk) {
    case 'CRITICAL':
      return {
        textClass: 'text-rose-400',
        bgClass: 'bg-rose-500/15',
        borderClass: 'border-rose-500/30',
      };
    case 'HIGH':
      return {
        textClass: 'text-orange-400',
        bgClass: 'bg-orange-500/15',
        borderClass: 'border-orange-500/30',
      };
    case 'MEDIUM':
      return {
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-500/30',
      };
    case 'LOW':
      return {
        textClass: 'text-blue-400',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20',
      };
    default:
      return {
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
      };
  }
}
