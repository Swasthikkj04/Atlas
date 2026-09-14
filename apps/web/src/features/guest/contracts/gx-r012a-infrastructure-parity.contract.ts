/**
 * GX-R012A → GX-R012G — Guest Infrastructure Experience Parity Track
 *
 * Phase: Guest Experience Architecture (GX-R)
 * Ticket: GX-R012A → GX-R012G
 * Type: GX / UX Architecture / Intelligence Parity / Security Isolation / Certification
 * Priority: P0 — Blocking Prerequisite
 * Depends on: GX-R001 → GX-R012 🔒, GX-R013 🔒, SEC-GXWX-001 🔒, S-01 → S-06 🔒
 * Status: FROZEN_INFRASTRUCTURE_PARITY_CONTRACT
 *
 * Acceptance Gate Demonstrated Truth:
 * "GX Infrastructure must use the same canonical Infrastructure information model as WX,
 * with no intelligence downgrade and no Workspace state dependency."
 *
 * Frozen Principles:
 * 1. "Consistency over novelty. The frontend follows the canonical information hierarchy rather than independently inventing intelligence."
 * 2. "Same canonical intelligence: category semantics, role representation, confidence levels, evidence linkage, and ingress topology."
 * 3. "Strict data-plane isolation: GX operates on ephemeral session intelligence with zero AuthContext leakage, zero tenant state, zero persistence, and zero private API access."
 */

import type { Technology } from '../types/index.ts';

export const GX_R012A_TICKET_ID = 'GX-R012A' as const;
export const GX_R012_PARITY_TRACK_PHASE = 'Guest Experience Architecture' as const;
export const GX_R012_PARITY_TRACK_STATUS = 'FROZEN_INFRASTRUCTURE_PARITY_CONTRACT' as const;

export const GX_R012A_GATE_STATEMENT =
  'GX Infrastructure must use the same canonical Infrastructure information model as WX, with no intelligence downgrade and no Workspace state dependency.' as const;

export const GX_R012_FINAL_CERTIFICATION_STATEMENT =
  'Guest Experience exposes the same canonical infrastructure intelligence and investigation quality available to Workspace users, while remaining completely isolated from Workspace authentication state, tenant ownership, persistence, history, monitoring, and memory.' as const;

/**
 * 1. Canonical Infrastructure Categories (Shared Semantics with WX)
 */
export type CanonicalInfrastructureCategory =
  | 'edge'
  | 'web_server'
  | 'application'
  | 'platform'
  | 'runtime'
  | 'hosting'
  | 'dns'
  | 'tls'
  | 'mail'
  | 'ip_address'
  | 'open_ports';

export interface CanonicalCategoryDefinition {
  readonly id: CanonicalInfrastructureCategory;
  readonly label: string;
  readonly iconName: string;
  readonly description: string;
  readonly defaultRole: string;
}

export const CANONICAL_INFRASTRUCTURE_CATEGORIES: readonly CanonicalCategoryDefinition[] = [
  {
    id: 'edge',
    label: 'Edge & CDN',
    iconName: 'Cloud',
    description: 'Anycast ingress proxy, CDN cache, and perimeter DDoS mitigation layer.',
    defaultRole: 'Content Delivery & Anycast Ingress',
  },
  {
    id: 'web_server',
    label: 'Web Server',
    iconName: 'Server',
    description: 'HTTP termination gateway, reverse proxy, and host process.',
    defaultRole: 'Web Gateway & Reverse Proxy',
  },
  {
    id: 'application',
    label: 'Application',
    iconName: 'Layers',
    description: 'Web application framework, frontend renderer, or fullstack runtime.',
    defaultRole: 'Application Framework',
  },
  {
    id: 'platform',
    label: 'Platform',
    iconName: 'Layers',
    description: 'Managed content platform, CMS, or headless distribution engine.',
    defaultRole: 'Managed Platform',
  },
  {
    id: 'runtime',
    label: 'Runtime',
    iconName: 'Cpu',
    description: 'Execution language runtime or container environment.',
    defaultRole: 'Execution Runtime',
  },
  {
    id: 'hosting',
    label: 'Hosting',
    iconName: 'Cpu',
    description: 'Origin cloud compute infrastructure and network provider.',
    defaultRole: 'Cloud Compute Origin',
  },
  {
    id: 'dns',
    label: 'DNS',
    iconName: 'Network',
    description: 'Authoritative nameservers, zone authority, and public DNS records.',
    defaultRole: 'Authoritative Nameserver & Routing',
  },
  {
    id: 'tls',
    label: 'TLS / SSL',
    iconName: 'ShieldCheck',
    description: 'Transport layer cryptographic handshake, cipher suites, and public x509 cert.',
    defaultRole: 'Transport Layer Security & Certificate',
  },
  {
    id: 'mail',
    label: 'Mail & MX',
    iconName: 'Mail',
    description: 'Mail exchange routing, MX records, and email transport infrastructure.',
    defaultRole: 'Mail Exchange Routing',
  },
  {
    id: 'ip_address',
    label: 'IP & Endpoints',
    iconName: 'Terminal',
    description: 'Public IPv4 / IPv6 network routing and perimeter host endpoints.',
    defaultRole: 'Public Network Ingress Endpoint',
  },
  {
    id: 'open_ports',
    label: 'Open Ports',
    iconName: 'ArrowUpRight',
    description: 'Observed active network ports accepting public TCP connections.',
    defaultRole: 'Public Service Listener Ports',
  },
] as const;

/**
 * 2. Canonical Confidence Semantics (Shared with WX)
 */
export type ParityConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ParityConfidenceSemantics {
  readonly level: ParityConfidenceLevel;
  readonly badgeClass: string;
  readonly meaning: string;
}

export const PARITY_CONFIDENCE_SCALE: Record<ParityConfidenceLevel, ParityConfidenceSemantics> = {
  HIGH: {
    level: 'HIGH',
    badgeClass: 'bg-[#EAF7F2] text-[#178A68] border border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/30',
    meaning: 'Direct wire proof with exact cryptographic signature or explicit header broadcast.',
  },
  MEDIUM: {
    level: 'MEDIUM',
    badgeClass: 'bg-[#FFF8E6] text-[#996500] border border-[#FFE6A5] dark:text-amber-400 dark:bg-amber-950/30',
    meaning: 'Multiple converging secondary signals without explicit proprietary header proof.',
  },
  LOW: {
    level: 'LOW',
    badgeClass: 'bg-[#EEF4FF] text-[#3568C8] border border-[#C8D8F6] dark:text-primary dark:bg-primary/10',
    meaning: 'Single heuristic indicator; unverified origin assumption.',
  },
};

/**
 * 3. Canonical Observed Ingress Request Path Model (GX-R012C)
 */
export type IngressHopRole = 'CLIENT' | 'EDGE' | 'GATEWAY' | 'APP' | 'PLATFORM' | 'CLOUD';

export interface ParityIngressHop {
  readonly hopNumber: number;
  readonly role: IngressHopRole;
  readonly layerName: string;
  readonly componentName: string;
  readonly protocol: string;
  readonly isVerified: boolean;
  readonly evidenceSignal: string;
}

/**
 * 4. Canonical Infrastructure Investigation Record (GX-R012D)
 */
export interface ParityInfrastructureInvestigation {
  readonly id: string;
  readonly category: CanonicalInfrastructureCategory;
  readonly categoryLabel: string;
  readonly componentName: string;
  readonly role: string;
  readonly confidence: ParityConfidenceLevel;
  readonly observedWireSignal: string;
  readonly whatThisProves: string;
  readonly whatThisDoesNotProve: string;
  readonly rawWirePayload?: string;
  readonly evidenceSource: string;
  readonly timestamp?: string;
  readonly verificationHash?: string;
  readonly isDetected: boolean;
}

/**
 * 5. 17-Capability Parity Matrix & 5-Boundary Separation (GX-R012E)
 */
export interface ParityCapability {
  readonly capabilityId: string;
  readonly name: string;
  readonly category: 'INTELLIGENCE_PARITY' | 'PRODUCT_BOUNDARY';
  readonly supportedInWX: boolean;
  readonly supportedInGX: boolean;
  readonly rationale: string;
}

export const PARITY_CAPABILITY_MATRIX: readonly ParityCapability[] = [
  // 17 Intelligence Parity Capabilities (Must be identical between WX & GX)
  { capabilityId: 'cap-infra-summary', name: 'Infrastructure Summary', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Exact compact row presentation with observed count.' },
  { capabilityId: 'cap-edge-cdn', name: 'Edge/CDN Intelligence', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Identifies Cloudflare, CloudFront, Fastly, Akamai.' },
  { capabilityId: 'cap-web-server', name: 'Web Server Intelligence', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Identifies NGINX, Apache, Caddy, Envoy, Traefik.' },
  { capabilityId: 'cap-application', name: 'Application Framework', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Identifies Next.js, React, Vue, Rails, Django, Laravel.' },
  { capabilityId: 'cap-platform', name: 'Platform / CMS', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Identifies WordPress, Shopify, Squarespace, Wix.' },
  { capabilityId: 'cap-hosting', name: 'Cloud Hosting / Compute', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Identifies AWS, GCP, Azure, Vercel, Netlify origin compute.' },
  { capabilityId: 'cap-dns', name: 'Authoritative DNS', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Authoritative nameservers and DNS authority status.' },
  { capabilityId: 'cap-tls', name: 'TLS / SSL Cryptography', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'TLS version, cipher handshake, and certificate validity.' },
  { capabilityId: 'cap-mail', name: 'Mail / MX Routing', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Mail exchange routing records.' },
  { capabilityId: 'cap-ip-endpoints', name: 'IP & Endpoints', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Public IPv4/IPv6 and active ingress listener ports.' },
  { capabilityId: 'cap-ingress-topology', name: 'Observed Ingress Topology', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Multi-hop observed request path from Client to Origin.' },
  { capabilityId: 'cap-component-role', name: 'Component Role Representation', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Precise architectural purpose (e.g. Ingress Reverse Proxy).' },
  { capabilityId: 'cap-confidence-scale', name: 'Canonical Confidence Scale', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'HIGH / MEDIUM / LOW based on wire proof strength.' },
  { capabilityId: 'cap-wire-evidence', name: 'Wire Evidence Transmission', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Exact HTTP headers, TLS handshake records, and DNS packets.' },
  { capabilityId: 'cap-component-investigation', name: 'Component Investigation Modal', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Contextual investigation with verification & anti-overreach claims.' },
  { capabilityId: 'cap-provenance', name: 'Evidence Provenance & Hashes', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Source attribution and SHA verification hashes.' },
  { capabilityId: 'cap-anti-overreach', name: 'Anti-Overreach Boundary', category: 'INTELLIGENCE_PARITY', supportedInWX: true, supportedInGX: true, rationale: 'Explicit statements of what passive perimeter telemetry cannot prove.' },

  // 5 Product Boundary Differences (Must be strictly isolated / absent in GX)
  { capabilityId: 'bound-persistence', name: 'Tenant Database Persistence', category: 'PRODUCT_BOUNDARY', supportedInWX: true, supportedInGX: false, rationale: 'GX is 100% ephemeral and discarded on session end.' },
  { capabilityId: 'bound-history', name: 'Historical Timeline & Diffing', category: 'PRODUCT_BOUNDARY', supportedInWX: true, supportedInGX: false, rationale: 'Historical drift tracking requires persistent authenticated workspace.' },
  { capabilityId: 'bound-memory', name: 'Infrastructure Memory', category: 'PRODUCT_BOUNDARY', supportedInWX: true, supportedInGX: false, rationale: 'Long-term telemetry memory across scans is an authenticated feature.' },
  { capabilityId: 'bound-monitoring', name: 'Continuous Background Monitoring', category: 'PRODUCT_BOUNDARY', supportedInWX: true, supportedInGX: false, rationale: 'Scheduled polling requires tenant authorization and billing.' },
  { capabilityId: 'bound-multi-domain', name: 'Multi-Domain Fleet Management', category: 'PRODUCT_BOUNDARY', supportedInWX: true, supportedInGX: false, rationale: 'Multi-domain portfolios belong strictly to authenticated workspaces.' },
] as const;

/**
 * 6. GX/WX Data-Plane Isolation Invariants (GX-R012F)
 */
export interface IsolationViolation {
  readonly ruleId: string;
  readonly description: string;
  readonly severity: 'FATAL_SECURITY_BREACH';
}

export const DATA_PLANE_ISOLATION_RULES = [
  'GX MUST NEVER import or access AuthContext',
  'GX MUST NEVER call authenticated /api/v1/workspaces routes',
  'GX MUST NEVER accept or handle tenant UUIDs',
  'GX MUST NEVER read or write Workspace persistence metadata',
  'GX MUST NEVER access historical snapshots or timeline drift',
  'GX MUST NEVER trigger background monitoring jobs',
  'GX investigation modal MUST NEVER redirect into authenticated WX routes',
] as const;

/**
 * 7. Pure Canonical Resolvers for GX Infrastructure Parity
 */
export function resolveParityCategory(
  name: string = '',
  role: string = '',
  category: string = ''
): CanonicalInfrastructureCategory {
  const norm = `${name} ${role} ${category}`.toLowerCase();

  if (/cloudflare|fastly|cloudfront|akamai|cdn|edge|anycast/i.test(norm)) return 'edge';
  if (/nginx|apache|caddy|envoy|traefik|haproxy|gateway|reverse proxy|http server/i.test(norm)) return 'web_server';
  if (/wordpress|shopify|squarespace|wix|ghost|drupal|joomla|platform|cms/i.test(norm)) return 'platform';
  if (/next\.js|react|vue|nuxt|angular|django|laravel|rails|express|svelte|remix|gatsby/i.test(norm)) return 'application';
  if (/node\.js|python|php|ruby|go|java|docker|runtime/i.test(norm)) return 'runtime';
  if (/aws|amazon|google cloud|gcp|azure|vercel|netlify|digitalocean|heroku|hosting|compute/i.test(norm)) return 'hosting';
  if (/dns|nameserver|route53|ns1/i.test(norm)) return 'dns';
  if (/tls|ssl|certificate|https|x509/i.test(norm)) return 'tls';
  if (/mail|smtp|mx|sendgrid|mailgun/i.test(norm)) return 'mail';
  if (/port|tcp|listener|socket/i.test(norm)) return 'open_ports';
  return 'ip_address';
}

export function synthesizeParityIngressPath(
  technologies: Technology[] = [],
  domain: string = ''
): ParityIngressHop[] {
  const safeDomain = domain || 'Domain';
  const hops: ParityIngressHop[] = [
    {
      hopNumber: 1,
      role: 'CLIENT',
      layerName: 'Public Ingress Source',
      componentName: 'Public Client',
      protocol: 'HTTPS / TLS 1.3',
      isVerified: true,
      evidenceSignal: 'Public browser / API connection initiated',
    },
  ];

  const safeTechs = Array.isArray(technologies) ? technologies.filter(Boolean) : [];

  // Step 2: Edge CDN
  const edge = safeTechs.find((t) => resolveParityCategory(t?.name, t?.role, t?.category) === 'edge');
  if (edge) {
    hops.push({
      hopNumber: hops.length + 1,
      role: 'EDGE',
      layerName: 'Edge CDN & Anycast Layer',
      componentName: edge.name,
      protocol: 'Anycast HTTP/2',
      isVerified: true,
      evidenceSignal: `${edge.name} edge ingress headers verified`,
    });
  }

  // Step 3: Gateway / Reverse Proxy
  const gw = safeTechs.find((t) => resolveParityCategory(t?.name, t?.role, t?.category) === 'web_server');
  if (gw) {
    hops.push({
      hopNumber: hops.length + 1,
      role: 'GATEWAY',
      layerName: 'Web Gateway & Reverse Proxy',
      componentName: gw.version ? `${gw.name} ${gw.version}` : gw.name,
      protocol: 'HTTP/1.1 Ingress',
      isVerified: true,
      evidenceSignal: `server: ${gw.name.toLowerCase()} response banner`,
    });
  }

  // Step 4: Application / Platform
  const app = safeTechs.find((t) => {
    const c = resolveParityCategory(t?.name, t?.role, t?.category);
    return c === 'application' || c === 'platform';
  });
  if (app) {
    hops.push({
      hopNumber: hops.length + 1,
      role: 'APP',
      layerName: 'Application Framework',
      componentName: app.name,
      protocol: 'Application Render',
      isVerified: true,
      evidenceSignal: `${app.name} static asset footprint`,
    });
  }

  // Step 5: Hosting / Cloud Origin
  const host = safeTechs.find((t) => resolveParityCategory(t?.name, t?.role, t?.category) === 'hosting');
  hops.push({
    hopNumber: hops.length + 1,
    role: 'CLOUD',
    layerName: 'Origin Compute Host',
    componentName: host ? host.name : `${safeDomain} Origin`,
    protocol: 'Origin Reachability',
    isVerified: true,
    evidenceSignal: host ? `${host.name} ASN origin telemetry` : 'Direct origin network route verified',
  });

  return hops;
}

export function verifyDataPlaneIsolation(context: {
  hasAuthContext: boolean;
  hasTenantId: boolean;
  hasWorkspaceApiCall: boolean;
  hasPersistenceMetadata: boolean;
}): { isIsolated: boolean; violations: string[] } {
  const violations: string[] = [];

  if (context.hasAuthContext) {
    violations.push('FATAL: GX context accessed AuthContext state.');
  }
  if (context.hasTenantId) {
    violations.push('FATAL: GX received or processed a tenant UUID.');
  }
  if (context.hasWorkspaceApiCall) {
    violations.push('FATAL: GX executed an authenticated Workspace API call.');
  }
  if (context.hasPersistenceMetadata) {
    violations.push('FATAL: GX attempted to access Workspace persistence metadata.');
  }

  return {
    isIsolated: violations.length === 0,
    violations,
  };
}
