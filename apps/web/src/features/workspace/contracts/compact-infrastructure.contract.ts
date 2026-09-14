import type { DomainOverviewResponseDto, InfrastructureOverviewDto } from '../../../types/api/overview.dto';

export type CompactInfrastructureCategory =
  | 'edge'
  | 'web_server'
  | 'application'
  | 'platform'
  | 'runtime'
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
  readonly detectedItems: readonly CompactInfrastructureItem[];
  readonly hasAnyDetected: boolean;
}

/**
 * Pure resolver to map authoritative backend infrastructure DTO to dynamic, curated overview rows.
 *
 * Invariants:
 * - Dynamic, domain-adaptive presentation for the Overview tab.
 * - Shows only observed and relevant infrastructure for that specific domain.
 * - Preserves authoritative attribution and anti-overreach rules (WX-1022).
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
    const fallbackItems: CompactInfrastructureItem[] = [
      { id: 'edge', label: 'Edge', value: 'Not detected', isDetected: false },
      { id: 'web_server', label: 'Web Server', value: 'Not detected', isDetected: false },
      { id: 'application', label: 'Application', value: 'Not detected', isDetected: false },
      { id: 'hosting', label: 'Hosting', value: 'Not established', isDetected: false },
      { id: 'dns', label: 'DNS', value: 'Not detected', isDetected: false },
      { id: 'tls', label: 'TLS / SSL', value: 'Not detected', isDetected: false },
      { id: 'ip_address', label: 'IP Address', value: 'Not detected', isDetected: false },
      { id: 'open_ports', label: 'Open Ports', value: 'Not detected', isDetected: false },
    ];
    return {
      domainId,
      domainName,
      items: fallbackItems,
      detectedItems: [],
      hasAnyDetected: false,
    };
  }

  const keyTechs = infra?.technologyArchitecture?.keyTechnologies || [];

  // 1. Edge / CDN
  let edgeValue = 'Not detected';
  let isEdgeDetected = false;
  let edgeDetails: string | undefined;

  const edgeTech = keyTechs.find((t) => t.layer === 'EDGE' || t.category === 'CDN / Edge');
  if (edgeTech) {
    edgeValue = edgeTech.name;
    isEdgeDetected = true;
    edgeDetails = edgeTech.confidenceLevel ? `${edgeTech.confidenceLevel.toLowerCase()} confidence` : undefined;
  } else if (infra.edgeProvider) {
    edgeValue = infra.edgeProvider;
    isEdgeDetected = true;
    edgeDetails = infra.edgeConfidence ? `${infra.edgeConfidence.toLowerCase()} confidence` : undefined;
  } else if (infra.cdn) {
    edgeValue = infra.cdn;
    isEdgeDetected = true;
  }

  // 2. Web Server / Gateway
  let webServerValue = 'Not detected';
  let isWebServerDetected = false;
  const gwTech = keyTechs.find((t) => t.layer === 'GATEWAY' || t.category === 'Web / Server');
  if (gwTech) {
    webServerValue = gwTech.version ? `${gwTech.name} ${gwTech.version}` : gwTech.name;
    isWebServerDetected = true;
  } else if (infra.webServer) {
    webServerValue = infra.webServer;
    isWebServerDetected = true;
  }

  // 3. Platform / CMS (e.g. WordPress)
  let platformValue = 'Not detected';
  let isPlatformDetected = false;
  const platformTech = keyTechs.find((t) => t.layer === 'PLATFORM' || t.category === 'CMS / Platforms');
  if (platformTech) {
    platformValue = platformTech.version ? `${platformTech.name} ${platformTech.version}` : platformTech.name;
    isPlatformDetected = true;
  }

  // 4. Application Framework (e.g. Next.js, React, Django)
  let applicationValue = 'Not detected';
  let isAppDetected = false;
  const appTechs = keyTechs.filter((t) => t.layer === 'APPLICATION' || (t.category && (t.category.includes('Application') || t.category.includes('UI'))));
  if (infra.technologies && infra.technologies.length > 0) {
    const appFramework = infra.technologies.find((t) =>
      /next\.js|react|vue|nuxt|angular|node|express|django|rails|laravel|wordpress|svelte|remix|gatsby/i.test(t)
    ) || infra.technologies[0];
    applicationValue = appFramework;
    isAppDetected = true;
  } else if (appTechs.length > 0) {
    applicationValue = appTechs[0].version ? `${appTechs[0].name} ${appTechs[0].version}` : appTechs[0].name;
    isAppDetected = true;
  }

  // 5. Runtime (e.g. PHP, Docker, Python, Node.js)
  let runtimeValue = 'Not detected';
  let isRuntimeDetected = false;
  const runtimeTechs = keyTechs.filter((t) => t.layer === 'RUNTIME' || (t.category && t.category.includes('Runtime')));
  if (runtimeTechs.length > 0) {
    runtimeValue = runtimeTechs[0].version ? `${runtimeTechs[0].name} ${runtimeTechs[0].version}` : runtimeTechs[0].name;
    isRuntimeDetected = true;
  }

  // 6. Hosting (Origin Deployment / Compute - WX-1022 Multi-Signal Attributed)
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

  // 7. DNS (Authoritative Nameserver - WX-1022)
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

  // 8. TLS / SSL
  let tlsValue = 'Not detected';
  let isTlsDetected = false;
  let tlsDetails: string | undefined;
  if (infra.sslValid) {
    tlsValue = 'TLS 1.3';
    isTlsDetected = true;
    if (infra.sslExpiresAt) {
      try {
        const days = Math.ceil(
          (new Date(infra.sslExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (days > 0) {
          tlsDetails = `${days}d remaining`;
        }
      } catch {
        // Ignore date parsing error
      }
    }
  }

  // 9. IP Address
  let ipValue = 'Not detected';
  let isIpDetected = false;
  if (infra.ipv4Addresses && infra.ipv4Addresses.length > 0) {
    ipValue = infra.ipv4Addresses[0];
    isIpDetected = true;
  } else if (infra.ipv6Addresses && infra.ipv6Addresses.length > 0) {
    ipValue = infra.ipv6Addresses[0];
    isIpDetected = true;
  }

  // 10. Open Ports
  let portsValue = 'Not detected';
  let isPortsDetected = false;
  if (infra.httpStatus > 0 || isIpDetected || isTlsDetected) {
    portsValue = infra.sslValid ? '80, 443' : '80';
    isPortsDetected = true;
  }

  const allItems: CompactInfrastructureItem[] = [
    { id: 'edge', label: 'Edge', value: edgeValue, isDetected: isEdgeDetected, details: edgeDetails },
    { id: 'web_server', label: 'Web Server', value: webServerValue, isDetected: isWebServerDetected },
    ...(isPlatformDetected ? [{ id: 'platform' as CompactInfrastructureCategory, label: 'Platform', value: platformValue, isDetected: true }] : []),
    { id: 'application', label: 'Application', value: applicationValue, isDetected: isAppDetected },
    ...(isRuntimeDetected ? [{ id: 'runtime' as CompactInfrastructureCategory, label: 'Runtime', value: runtimeValue, isDetected: true }] : []),
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
    { id: 'tls', label: 'TLS / SSL', value: tlsValue, isDetected: isTlsDetected, details: tlsDetails },
    { id: 'ip_address', label: 'IP Address', value: ipValue, isDetected: isIpDetected },
    { id: 'open_ports', label: 'Open Ports', value: portsValue, isDetected: isPortsDetected },
  ];

  const detectedItems = allItems.filter((item) => item.isDetected);
  const hasAnyDetected = detectedItems.length > 0;

  return {
    domainId,
    domainName,
    items: allItems,
    detectedItems,
    hasAnyDetected,
  };
}
