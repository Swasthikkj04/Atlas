import type { DomainOverviewResponseDto, InfrastructureOverviewDto } from '../../../types/api';

/**
 * Authoritative Infrastructure Category Taxonomy (WX-401).
 *
 * Defines the canonical structural organization of infrastructure intelligence:
 * - 'edge_delivery': Edge Delivery, CDN, and DDoS protection
 * - 'hosting_compute': Cloud Compute Substrates and Hosting Platforms
 * - 'web_server': Web Servers, Reverse Proxies, and Gateways
 * - 'web_application': Application Frameworks and Frontend Technologies
 * - 'security_tls': TLS Certificates, Protocols, and Encryption Posture
 * - 'dns_network': DNS Records, Nameservers, and IP Addressing
 * - 'other': Miscellaneous detected infrastructure entities
 */
export type InfrastructureCategory =
  | 'edge_delivery'
  | 'hosting_compute'
  | 'web_server'
  | 'web_application'
  | 'security_tls'
  | 'dns_network'
  | 'other';

/**
 * Category Section Presence Status.
 *
 * Distinguishes between verified presence, confirmed absence, and unavailable discovery:
 * - 'PRESENT': Authoritative data exists and items are observed
 * - 'ABSENT': Confirmed absence (e.g. no CDN detected, or no IPv6 records)
 * - 'UNAVAILABLE': Data for this category could not be gathered or is not supported
 */
export type OverviewSectionStatus = 'PRESENT' | 'ABSENT' | 'UNAVAILABLE';

/**
 * Authoritative Overview Lifecycle and Semantic States (WX-401 / WX-915).
 */
export type OverviewState =
  | 'LOADING'
  | 'UNDERSTANDING'
  | 'READY'
  | 'EMPTY'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'QUIET';

/**
 * Structured Category Section Resolution.
 */
export interface OverviewSectionResolution {
  readonly category: InfrastructureCategory;
  readonly label: string;
  readonly status: OverviewSectionStatus;
  readonly items: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Overview Context Contract.
 */
export interface OverviewContext {
  readonly domainId: string;
  readonly domainName: string;
  readonly snapshotId: string | null;
  readonly observedAt: string | null;
  readonly understandingJobId?: string | null;
}

/**
 * Pure, deterministic function to resolve the semantic state of the Infrastructure Overview.
 *
 * Hard Invariant: React must never infer or fabricate state.
 */
export function resolveOverviewState(params: {
  readonly data?: DomainOverviewResponseDto | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isDomainMismatch?: boolean;
  readonly isUnderstanding?: boolean;
}): OverviewState {
  const { data, isLoading, isError, isDomainMismatch, isUnderstanding } = params;

  if (isDomainMismatch) {
    return 'UNAVAILABLE';
  }

  if (isUnderstanding) {
    return 'UNDERSTANDING';
  }

  if (isLoading) {
    return 'LOADING';
  }

  if (isError || !data) {
    return 'ERROR';
  }

  // If no snapshots exist for the domain, it is genuinely EMPTY
  if (!data.latestSnapshot && (!data.statistics || data.statistics.totalSnapshots === 0)) {
    return 'EMPTY';
  }

  const infra = data.infrastructure;
  if (!infra) {
    return 'EMPTY';
  }

  const hasAnyInfrastructure =
    (infra.ipv4Addresses && infra.ipv4Addresses.length > 0) ||
    (infra.ipv6Addresses && infra.ipv6Addresses.length > 0) ||
    Boolean(infra.webServer) ||
    Boolean(infra.cdn) ||
    Boolean(infra.sslValid) ||
    (infra.technologies && infra.technologies.length > 0);

  if (!hasAnyInfrastructure) {
    return 'EMPTY';
  }

  const hasCompleteCoverage =
    Boolean(infra.webServer) &&
    Boolean(infra.sslValid) &&
    infra.ipv4Addresses.length > 0 &&
    infra.technologies.length > 0;

  if (hasCompleteCoverage) {
    return 'READY';
  }

  return 'PARTIAL';
}

/**
 * Resolves authoritative infrastructure sections from backend DTO without client-side inference.
 */
export function resolveInfrastructureSections(
  infra?: InfrastructureOverviewDto | null
): readonly OverviewSectionResolution[] {
  if (!infra) {
    return [];
  }

  const sections: OverviewSectionResolution[] = [
    // 1. Edge & Delivery
    {
      category: 'edge_delivery',
      label: 'Edge Delivery & CDN',
      status: infra.cdn ? 'PRESENT' : 'ABSENT',
      items: infra.cdn ? [infra.cdn] : [],
      metadata: { note: infra.cdn ? undefined : 'No dedicated CDN layer detected' },
    },

    // 2. Web Server & Gateway
    {
      category: 'web_server',
      label: 'Web Server & Reverse Proxy',
      status: infra.webServer ? 'PRESENT' : 'ABSENT',
      items: infra.webServer ? [infra.webServer] : [],
      metadata: { httpStatus: infra.httpStatus, responseTimeMs: infra.responseTimeMs },
    },

    // 3. Security & TLS
    {
      category: 'security_tls',
      label: 'Security & TLS',
      status: infra.sslValid || infra.sslExpiresAt ? 'PRESENT' : 'ABSENT',
      items: infra.sslValid ? ['TLS Certificate Valid'] : ['No Valid TLS Certificate'],
      metadata: {
        sslValid: infra.sslValid,
        sslExpiresAt: infra.sslExpiresAt,
      },
    },

    // 4. DNS & Network
    {
      category: 'dns_network',
      label: 'DNS & Network Infrastructure',
      status:
        infra.ipv4Addresses.length > 0 || infra.ipv6Addresses.length > 0
          ? 'PRESENT'
          : 'ABSENT',
      items: [...infra.ipv4Addresses, ...infra.ipv6Addresses],
      metadata: {
        ipv4Count: infra.ipv4Addresses.length,
        ipv6Count: infra.ipv6Addresses.length,
      },
    },

    // 5. Web / Application Technologies
    {
      category: 'web_application',
      label: 'Web & Application Technologies',
      status: infra.technologies.length > 0 ? 'PRESENT' : 'ABSENT',
      items: infra.technologies,
      metadata: { count: infra.technologies.length },
    },
  ];

  return sections;
}
