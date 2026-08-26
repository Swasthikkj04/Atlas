/**
 * Authoritative Public Infrastructure Overview API DTO Contracts (WX-401).
 *
 * Invariant: Overview communicates what exists in this infrastructure right now
 * and how it is organized, backed strictly by authoritative backend data.
 * React must never parse raw discovery payloads to invent or infer infrastructure entities.
 */

export interface InfrastructureOverviewItemDto {
  readonly name: string;
  readonly category: string;
  readonly role?: string;
  readonly confidence?: number;
}

export interface InfrastructureNetworkOverviewDto {
  readonly ipv4Addresses: readonly string[];
  readonly ipv6Addresses: readonly string[];
  readonly nameservers?: readonly string[];
}

export interface InfrastructureTlsOverviewDto {
  readonly valid: boolean;
  readonly expiresAt: string | null;
  readonly issuer?: string | null;
  readonly protocol?: string | null;
}

export interface InfrastructureHttpOverviewDto {
  readonly statusCode: number;
  readonly responseTimeMs: number;
  readonly server: string | null;
  readonly cdn: string | null;
}

export interface InfrastructureOverviewDto {
  readonly ipv4Addresses: readonly string[];
  readonly ipv6Addresses: readonly string[];
  readonly webServer: string | null;
  readonly cdn: string | null;
  readonly sslValid: boolean;
  readonly sslExpiresAt: string | null;
  readonly technologies: readonly string[];
  readonly httpStatus: number;
  readonly responseTimeMs: number;
  readonly hostingProvider?: string | null;
  readonly hostingDecision?: 'CONFIRMED' | 'STRONGLY_INFERRED' | 'INFERRED' | 'POSSIBLE' | 'UNKNOWN' | 'CONFLICTED' | null;
  readonly hostingConfidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE' | null;
  readonly hostingExplanation?: string | null;
  readonly edgeProvider?: string | null;
  readonly edgeConfidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE' | null;
  readonly dnsProvider?: string | null;
  readonly dnsConfidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE' | null;
  readonly attribution?: unknown;
}

export interface DomainOverviewResponseDto {
  readonly domain: {
    readonly id: string;
    readonly domainName: string;
    readonly monitoringEnabled: boolean;
    readonly createdAt: string;
  };
  readonly health: {
    readonly score: number;
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
    readonly informational: number;
  };
  readonly latestSnapshot: {
    readonly id: string;
    readonly createdAt: string;
    readonly responseTimeMs: number;
    readonly httpStatus: number;
  } | null;
  readonly latestBrief: {
    readonly overallHealth: string;
    readonly summary: string;
    readonly highlights: readonly string[];
    readonly recommendations: readonly string[];
    readonly generatedAt: string;
  } | null;
  readonly findingsSummary: {
    readonly total: number;
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
    readonly informational: number;
  };
  readonly recentFindings: readonly unknown[];
  readonly recentChanges: readonly unknown[];
  readonly latestVerification: {
    readonly id: string;
    readonly changeDetected: boolean;
    readonly snapshotCreated: boolean;
    readonly startedAt: string;
    readonly completedAt: string;
    readonly durationMs: number;
  } | null;
  readonly infrastructure: InfrastructureOverviewDto;
  readonly statistics: {
    readonly totalSnapshots: number;
    readonly totalVerifications: number;
    readonly totalFindings: number;
    readonly criticalFindings: number;
    readonly changesLast30Days: number;
    readonly lastUnderstandingAt: string | null;
  };
}
