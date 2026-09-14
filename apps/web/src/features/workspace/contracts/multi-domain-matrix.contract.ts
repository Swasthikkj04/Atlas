import type { DomainDto } from '../../../types/api';
import type { AdaptiveComponent } from './adaptive-infrastructure.contract';

/**
 * Move 5: Multi-Domain Ingress Comparison & Architecture Matrix Contract
 *
 * Provides data models and pure normalizer functions for:
 * 1. Side-by-side ingress topology path comparison across monitored infrastructure targets.
 * 2. Multi-domain vendor concentration & single-point-of-failure (SPOF) risk analysis.
 * 3. Fleet-wide architectural anomaly & security posture aggregation.
 */

export type IngressLayer = 'EDGE' | 'GATEWAY' | 'APPLICATION' | 'RUNTIME' | 'HOSTING' | 'OTHER';

export interface MultiDomainTopologyNode {
  readonly layer: IngressLayer;
  readonly name: string;
  readonly version?: string;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';
  readonly isDirect?: boolean;
}

export interface DomainIngressRow {
  readonly domainId: string;
  readonly domainName: string;
  readonly status: 'STABLE' | 'ATTENTION' | 'CHANGED' | 'VERIFYING';
  readonly ingressPath: readonly MultiDomainTopologyNode[];
  readonly edgeTechnology: string;
  readonly gatewayTechnology: string;
  readonly applicationRuntime: string;
  readonly hostingProvider: string;
  readonly postureScore: number;
  readonly anomalyCount: number;
  readonly criticalAnomalyCount: number;
  readonly highAnomalyCount: number;
}

export interface VendorConcentrationMetric {
  readonly category: 'EDGE' | 'GATEWAY' | 'HOSTING' | 'APPLICATION';
  readonly vendorName: string;
  readonly count: number;
  readonly percentage: number; // 0 - 100
  readonly domains: readonly string[];
  readonly isSinglePointOfFailure: boolean; // >= 60% concentration
}

export interface FleetPostureSummary {
  readonly averageScore: number;
  readonly totalAnomalies: number;
  readonly criticalAnomaliesCount: number;
  readonly highAnomaliesCount: number;
  readonly domainsAtRiskCount: number;
  readonly topConcentrations: readonly VendorConcentrationMetric[];
  readonly highestRiskDomainName: string | null;
}

export interface MultiDomainArchitectureMatrixData {
  readonly rows: readonly DomainIngressRow[];
  readonly concentrations: readonly VendorConcentrationMetric[];
  readonly fleetPosture: FleetPostureSummary;
  readonly totalDomains: number;
  readonly isEmpty: boolean;
}

export interface DomainOverviewInput {
  readonly domainId: string;
  readonly domainName?: string;
  readonly components?: readonly AdaptiveComponent[];
  readonly postureScore?: number;
  readonly anomalies?: readonly {
    readonly code: string;
    readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    readonly message: string;
  }[];
  readonly status?: 'STABLE' | 'ATTENTION' | 'CHANGED' | 'VERIFYING';
}

/**
 * Pure function to normalize components of a single domain into an ordered ingress delivery path.
 */
export function extractDomainIngressPath(components: readonly AdaptiveComponent[] = []): readonly MultiDomainTopologyNode[] {
  const path: MultiDomainTopologyNode[] = [];

  // 1. Edge Layer (Cloudflare, CloudFront, Fastly, Akamai)
  const edgeComp = components.find(
    (c) => c.category === 'EDGE' || c.layer === 'EDGE' || (c.role || '').toLowerCase().includes('edge') || (c.role || '').toLowerCase().includes('cdn')
  );
  if (edgeComp) {
    path.push({
      layer: 'EDGE',
      name: edgeComp.name,
      version: edgeComp.version,
      confidence: (edgeComp.confidenceLevel as any) || 'HIGH',
    });
  } else {
    path.push({
      layer: 'EDGE',
      name: 'Direct Origin (No CDN)',
      confidence: 'HIGH',
      isDirect: true,
    });
  }

  // 2. Gateway / Reverse Proxy Layer (NGINX, Apache, Caddy, HAProxy)
  const gatewayComp = components.find(
    (c) => c.category === 'GATEWAY' || c.layer === 'GATEWAY' || (c.role || '').toLowerCase().includes('proxy') || (c.role || '').toLowerCase().includes('gateway')
  );
  if (gatewayComp) {
    path.push({
      layer: 'GATEWAY',
      name: gatewayComp.name,
      version: gatewayComp.version,
      confidence: (gatewayComp.confidenceLevel as any) || 'HIGH',
    });
  }

  // 3. Application / Framework Layer (Next.js, Django, React, Rails, Laravel, WordPress)
  const appComp = components.find(
    (c) => c.category === 'APPLICATION' || c.layer === 'APPLICATION' || (c.role || '').toLowerCase().includes('framework') || (c.role || '').toLowerCase().includes('application')
  );
  if (appComp) {
    path.push({
      layer: 'APPLICATION',
      name: appComp.name,
      version: appComp.version,
      confidence: (appComp.confidenceLevel as any) || 'HIGH',
    });
  }

  // 4. Runtime Layer (Node.js, Python, PHP, Java, Go, Rust, .NET)
  const runtimeComp = components.find(
    (c) => c.category === 'RUNTIME' || c.layer === 'RUNTIME' || (c.role || '').toLowerCase().includes('runtime') || (c.role || '').toLowerCase().includes('engine')
  );
  if (runtimeComp && (!appComp || runtimeComp.name !== appComp.name)) {
    path.push({
      layer: 'RUNTIME',
      name: runtimeComp.name,
      version: runtimeComp.version,
      confidence: (runtimeComp.confidenceLevel as any) || 'HIGH',
    });
  }

  // 5. Hosting / Platform Layer (AWS, Cloudflare, Google Cloud, Docker, Kubernetes)
  const hostComp = components.find(
    (c) => c.category === 'HOSTING' || c.category === 'PLATFORM' || c.layer === 'PLATFORM' || (c.role || '').toLowerCase().includes('hosting') || (c.role || '').toLowerCase().includes('container')
  );
  if (hostComp && !path.some((p) => p.name === hostComp.name)) {
    path.push({
      layer: 'HOSTING',
      name: hostComp.name,
      version: hostComp.version,
      confidence: (hostComp.confidenceLevel as any) || 'HIGH',
    });
  }

  return path;
}


/**
 * Computes vendor and provider concentration metrics across the monitored fleet.
 */
export function computeVendorConcentration(rows: readonly DomainIngressRow[]): readonly VendorConcentrationMetric[] {
  if (rows.length === 0) return [];

  const total = rows.length;
  const categories: Array<'EDGE' | 'GATEWAY' | 'HOSTING' | 'APPLICATION'> = ['EDGE', 'GATEWAY', 'HOSTING', 'APPLICATION'];
  const metrics: VendorConcentrationMetric[] = [];

  for (const category of categories) {
    const counts = new Map<string, string[]>();

    for (const row of rows) {
      let value = '';
      if (category === 'EDGE') value = row.edgeTechnology;
      else if (category === 'GATEWAY') value = row.gatewayTechnology;
      else if (category === 'HOSTING') value = row.hostingProvider;
      else if (category === 'APPLICATION') value = row.applicationRuntime;

      if (value && value !== 'Direct Origin (No CDN)' && value !== 'None' && value !== 'Unobserved') {
        const existing = counts.get(value) || [];
        existing.push(row.domainName);
        counts.set(value, existing);
      }
    }

    for (const [vendorName, domains] of counts.entries()) {
      const percentage = Math.round((domains.length / total) * 100);
      metrics.push({
        category,
        vendorName,
        count: domains.length,
        percentage,
        domains,
        isSinglePointOfFailure: percentage >= 60 && total >= 2,
      });
    }
  }

  return metrics.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Resolves the full Multi-Domain Architecture Matrix data model (Move 5).
 */
export function resolveMultiDomainArchitectureMatrix(
  domains: readonly (DomainDto | { id: string; name: string })[] = [],
  overviews: readonly DomainOverviewInput[] = []
): MultiDomainArchitectureMatrixData {
  if (domains.length === 0) {
    return {
      rows: [],
      concentrations: [],
      fleetPosture: {
        averageScore: 100,
        totalAnomalies: 0,
        criticalAnomaliesCount: 0,
        highAnomaliesCount: 0,
        domainsAtRiskCount: 0,
        topConcentrations: [],
        highestRiskDomainName: null,
      },
      totalDomains: 0,
      isEmpty: true,
    };
  }

  const overviewMap = new Map<string, DomainOverviewInput>();
  for (const ov of overviews) {
    overviewMap.set(ov.domainId, ov);
  }

  const rows: DomainIngressRow[] = domains.map((domain) => {
    const domainId = domain.id;
    const domainName = (domain as DomainDto).domainName || (domain as any).name || domainId;
    const ov = overviewMap.get(domainId);

    const components = ov?.components || [];
    const ingressPath = extractDomainIngressPath(components);

    const edgeNode = ingressPath.find((p) => p.layer === 'EDGE');
    const gatewayNode = ingressPath.find((p) => p.layer === 'GATEWAY');
    const appNode = ingressPath.find((p) => p.layer === 'APPLICATION');
    const runtimeNode = ingressPath.find((p) => p.layer === 'RUNTIME');
    const hostNode = ingressPath.find((p) => p.layer === 'HOSTING');

    const appRuntimeStr = appNode && runtimeNode
      ? `${appNode.name} / ${runtimeNode.name}`
      : appNode?.name || runtimeNode?.name || 'Unobserved';

    const anomalies = ov?.anomalies || [];
    const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL').length;
    const highCount = anomalies.filter((a) => a.severity === 'HIGH').length;

    const postureScore = ov?.postureScore !== undefined ? ov.postureScore : 100;

    return {
      domainId,
      domainName,
      status: ov?.status || 'STABLE',
      ingressPath,
      edgeTechnology: edgeNode?.name || 'Direct Origin (No CDN)',
      gatewayTechnology: gatewayNode?.name || 'None',
      applicationRuntime: appRuntimeStr,
      hostingProvider: hostNode?.name || 'Unobserved',
      postureScore,
      anomalyCount: anomalies.length,
      criticalAnomalyCount: criticalCount,
      highAnomalyCount: highCount,
    };
  });

  const concentrations = computeVendorConcentration(rows);

  const totalScore = rows.reduce((acc, r) => acc + r.postureScore, 0);
  const averageScore = rows.length > 0 ? Math.round(totalScore / rows.length) : 100;
  const totalAnomalies = rows.reduce((acc, r) => acc + r.anomalyCount, 0);
  const criticalAnomaliesCount = rows.reduce((acc, r) => acc + r.criticalAnomalyCount, 0);
  const highAnomaliesCount = rows.reduce((acc, r) => acc + r.highAnomalyCount, 0);
  const domainsAtRiskCount = rows.filter((r) => r.postureScore < 80 || r.criticalAnomalyCount > 0).length;

  let lowestScore = 101;
  let highestRiskDomainName: string | null = null;
  for (const r of rows) {
    if (r.postureScore < lowestScore && r.postureScore < 80) {
      lowestScore = r.postureScore;
      highestRiskDomainName = r.domainName;
    }
  }

  const fleetPosture: FleetPostureSummary = {
    averageScore,
    totalAnomalies,
    criticalAnomaliesCount,
    highAnomaliesCount,
    domainsAtRiskCount,
    topConcentrations: concentrations.slice(0, 4),
    highestRiskDomainName,
  };

  return {
    rows,
    concentrations,
    fleetPosture,
    totalDomains: domains.length,
    isEmpty: false,
  };
}
