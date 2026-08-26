import type { DomainOverviewResponseDto, InfrastructureOverviewDto } from '../../../types/api/overview.dto';

export type CompactInfrastructureCategory =
  | 'edge'
  | 'web_server'
  | 'application'
  | 'hosting'
  | 'dns'
  | 'tls'
  | 'ip_address'
  | 'open_ports';

export interface CompactInfrastructureItem {
  readonly id: CompactInfrastructureCategory;
  readonly label: string;
  readonly value: string;
  readonly isDetected: boolean;
  readonly details?: string;
  readonly decision?: string;
  readonly confidence?: string;
  readonly explanation?: string;
}

export interface CompactInfrastructureResult {
  readonly domainId: string;
  readonly domainName: string;
  readonly items: readonly CompactInfrastructureItem[];
  readonly hasAnyDetected: boolean;
}

/**
 * Pure resolver to map authoritative backend infrastructure DTO to the 8 canonical compact overview rows (WX-909 / WX-1022).
 *
 * Invariants (WX-1022 Authoritative Provider Attribution):
 * - PROVIDER_ATTRIBUTION_IS_EVIDENCE_BACKED: Never guesses hosting from single weak fingerprints.
 * - NO_TECHNOLOGY_TO_HOSTING_INFERENCE: Technology (e.g. Next.js) never implies hosting (e.g. Vercel).
 * - NO_EDGE_TO_HOSTING_INFERENCE: Edge/CDN (e.g. Cloudflare) never implies hosting.
 * - NO_DNS_TO_HOSTING_INFERENCE: DNS provider never implies hosting.
 * - PROVIDER_CONFLICT_MUST_BE_EXPOSED: Conflicting signals produce honest "Inconclusive / Conflicted".
 * - UNKNOWN_PROVIDER_IS_VALID: Missing signals honestly display "Not established".
 */
export function resolveCompactInfrastructure(
  domainId: string,
  domainName: string,
  data?: DomainOverviewResponseDto | InfrastructureOverviewDto | null
): CompactInfrastructureResult {
  const infra: InfrastructureOverviewDto | null =
    data && 'infrastructure' in data
      ? data.infrastructure
      : (data as InfrastructureOverviewDto | null);

  if (!infra) {
    return {
      domainId,
      domainName,
      items: [
        { id: 'edge', label: 'Edge', value: 'Not detected', isDetected: false },
        { id: 'web_server', label: 'Web Server', value: 'Not detected', isDetected: false },
        { id: 'application', label: 'Application', value: 'Not detected', isDetected: false },
        { id: 'hosting', label: 'Hosting', value: 'Not established', isDetected: false },
        { id: 'dns', label: 'DNS', value: 'Not detected', isDetected: false },
        { id: 'tls', label: 'TLS / SSL', value: 'Not detected', isDetected: false },
        { id: 'ip_address', label: 'IP Address', value: 'Not detected', isDetected: false },
        { id: 'open_ports', label: 'Open Ports', value: 'Not detected', isDetected: false },
      ],
      hasAnyDetected: false,
    };
  }

  // 1. Edge / CDN (Edge Proxy, NOT Hosting)
  let edgeValue = 'Not detected';
  let isEdgeDetected = false;
  let edgeDetails: string | undefined;

  if (infra.edgeProvider) {
    edgeValue = infra.edgeProvider;
    isEdgeDetected = true;
    edgeDetails = infra.edgeConfidence ? `${infra.edgeConfidence.toLowerCase()} confidence` : undefined;
  } else if (infra.cdn) {
    edgeValue = infra.cdn;
    isEdgeDetected = true;
  }

  // 2. Web Server (HTTP Server Banner)
  let webServerValue = 'Not detected';
  let isWebServerDetected = false;
  if (infra.webServer) {
    webServerValue = infra.webServer;
    isWebServerDetected = true;
  }

  // 3. Application (Framework / Language Runtime)
  let applicationValue = 'Not detected';
  let isAppDetected = false;
  if (infra.technologies && infra.technologies.length > 0) {
    const appFramework = infra.technologies.find((t) =>
      /next\.js|react|vue|nuxt|angular|node|express|django|rails|laravel|wordpress|svelte|remix|gatsby/i.test(t)
    ) || infra.technologies[0];

    applicationValue = appFramework;
    isAppDetected = true;
  }

  // 4. Hosting (Origin Deployment / Compute - WX-1022 Multi-Signal Attributed)
  let hostingValue = 'Not established';
  let isHostingDetected = false;
  let hostingDetails: string | undefined;
  let hostingDecision = infra.hostingDecision || 'UNKNOWN';
  let hostingConfidence = infra.hostingConfidence || 'LOW';

  if (infra.hostingDecision === 'CONFLICTED') {
    hostingValue = 'Inconclusive';
    isHostingDetected = true;
    hostingDetails = 'Conflicted signals';
  } else if (infra.hostingProvider) {
    hostingValue = infra.hostingProvider;
    isHostingDetected = true;
    if (infra.hostingDecision === 'CONFIRMED' || infra.hostingConfidence === 'HIGH') {
      hostingDetails = 'High confidence';
    } else if (infra.hostingDecision === 'STRONGLY_INFERRED') {
      hostingDetails = 'High confidence';
    } else if (infra.hostingDecision === 'INFERRED') {
      hostingDetails = 'Inferred · Medium';
    } else if (infra.hostingConfidence) {
      hostingDetails = `${infra.hostingConfidence.toLowerCase()} confidence`;
    }
  } else {
    hostingValue = 'Not established';
    isHostingDetected = false;
    hostingDetails = 'Insufficient evidence';
  }

  // 5. DNS (Authoritative Nameserver - WX-1022)
  let dnsValue = 'Not detected';
  let isDnsDetected = false;
  let dnsDetails: string | undefined;

  if (infra.dnsProvider) {
    dnsValue = infra.dnsProvider;
    isDnsDetected = true;
    dnsDetails = infra.dnsConfidence ? `${infra.dnsConfidence.toLowerCase()} confidence` : undefined;
  } else if (infra.ipv4Addresses?.length > 0 || infra.ipv6Addresses?.length > 0) {
    dnsValue = 'Authoritative DNS Active';
    isDnsDetected = true;
  }

  // 6. TLS / SSL
  let tlsValue = 'Not detected';
  let isTlsDetected = false;
  if (infra.sslValid) {
    tlsValue = 'TLS 1.3';
    isTlsDetected = true;
  }

  // 7. IP Address
  let ipValue = 'Not detected';
  let isIpDetected = false;
  if (infra.ipv4Addresses && infra.ipv4Addresses.length > 0) {
    ipValue = infra.ipv4Addresses[0];
    isIpDetected = true;
  } else if (infra.ipv6Addresses && infra.ipv6Addresses.length > 0) {
    ipValue = infra.ipv6Addresses[0];
    isIpDetected = true;
  }

  // 8. Open Ports
  let portsValue = 'Not detected';
  let isPortsDetected = false;
  if (infra.httpStatus > 0 || isIpDetected || isTlsDetected) {
    portsValue = infra.sslValid ? '80, 443' : '80';
    isPortsDetected = true;
  }

  const items: CompactInfrastructureItem[] = [
    { id: 'edge', label: 'Edge', value: edgeValue, isDetected: isEdgeDetected, details: edgeDetails },
    { id: 'web_server', label: 'Web Server', value: webServerValue, isDetected: isWebServerDetected },
    { id: 'application', label: 'Application', value: applicationValue, isDetected: isAppDetected },
    {
      id: 'hosting',
      label: 'Hosting',
      value: hostingValue,
      isDetected: isHostingDetected,
      details: hostingDetails,
      decision: hostingDecision,
      confidence: hostingConfidence,
      explanation: infra.hostingExplanation || undefined,
    },
    { id: 'dns', label: 'DNS', value: dnsValue, isDetected: isDnsDetected, details: dnsDetails },
    { id: 'tls', label: 'TLS / SSL', value: tlsValue, isDetected: isTlsDetected },
    { id: 'ip_address', label: 'IP Address', value: ipValue, isDetected: isIpDetected },
    { id: 'open_ports', label: 'Open Ports', value: portsValue, isDetected: isPortsDetected },
  ];

  const hasAnyDetected = items.some((i) => i.isDetected);

  return {
    domainId,
    domainName,
    items,
    hasAnyDetected,
  };
}
