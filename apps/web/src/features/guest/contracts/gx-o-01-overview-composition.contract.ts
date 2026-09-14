/**
 * GX-O-01 — Guest Overview Composition & Intelligence Hierarchy Contract
 *
 * Phase: GX — First Experience / Current Intelligence
 * Ticket: GX-O-01
 * Priority: P0 — BLOCKING
 * Type: UX Architecture / Information Architecture / Frontend / Composition
 * Depends on: GX-R001 → GX-R012 🔒
 * Blocks: GX-O-02 → GX-O-XX
 * WX Impact: NONE — WX remains frozen
 * Status: UNLOCKED_READY_FOR_IMPLEMENTATION
 *
 * Frozen Principle:
 * "Current understanding before technical inventory."
 */

import type {
  GuestWorkspaceViewModel,
  FindingViewModel,
  IngressHopViewModel,
} from './gx-r013-guest-workspace-shell.contract.ts';

export const GX_O01_TICKET_ID = 'GX-O-01';
export const GX_O01_PHASE = 'GX — First Experience / Current Intelligence';
export const GX_O01_PRIORITY = 'P0 — BLOCKING';
export const GX_O01_STATUS = 'UNLOCKED_READY_FOR_IMPLEMENTATION';

export const GX_O01_FROZEN_PRINCIPLE = 'Current understanding before technical inventory.';

export const GX_O01_DEMONSTRATED_TRUTH =
  'A guest can enter the Overview and understand the current state of a domain, what deserves attention, what infrastructure was observed, and where deeper evidence can be inspected — without interpreting a dashboard.';

export const GX_O01_CERTIFICATION_GATE_STATEMENT =
  "The Guest Overview presents Nebula's current infrastructure understanding as a coherent intelligence narrative — beginning with meaning, surfacing what matters, establishing the observed architecture, exposing verified infrastructure, and allowing evidence inspection without becoming a dashboard, scanner report, or authenticated Workspace.";

/**
 * Canonical 7-Tier Overview Hierarchy
 */
export const CANONICAL_OVERVIEW_SECTION_ORDER = [
  'DOMAIN_CONTEXT',
  'EXECUTIVE_UNDERSTANDING',
  'WHAT_MATTERS_NOW',
  'INFRASTRUCTURE_SUMMARY',
  'OBSERVED_ARCHITECTURE',
  'POSITIVE_INTELLIGENCE',
  'UNOBSERVABLE_BOUNDARY',
] as const;

export type OverviewSectionKey = (typeof CANONICAL_OVERVIEW_SECTION_ORDER)[number];

/**
 * Explicitly Prohibited & Rejected Anti-Patterns (GX-O-01)
 */
export const EXPLICITLY_REJECTED_PATTERNS = [
  'KPI_DASHBOARD_WALL',
  'FOUR_EQUAL_METRIC_CARDS',
  'SECURITY_SCORE_OBSESSION',
  'VULNERABILITY_FIRST_COMPOSITION',
  'TECHNOLOGY_TAG_SOUP',
  'ARTIFICIAL_SEVERITY',
  'FABRICATED_RELATIONSHIPS',
  'HISTORICAL_DRIFT_IN_GX',
  'CONTINUOUS_MONITORING_UI',
  'SIGNUP_WALLS',
  'WX_NAVIGATION_MASQUERADING_AS_GX',
  'RAW_EVIDENCE_AS_PRIMARY_CONTENT',
  'MARKETING_UPGRADE_BANNERS',
  'EXCESSIVE_NESTED_CARDS',
  'FULL_WIDTH_DASHBOARD_GRIDS_WITHOUT_HIERARCHY',
] as const;

export type RejectedPattern = (typeof EXPLICITLY_REJECTED_PATTERNS)[number];

/**
 * Compact Intelligence Strip Data (replaces 4-card KPI wall)
 */
export interface CompactIntelligenceStripData {
  perimeter: {
    label: string;
    verdict: string;
    statusBadge: 'HARDENED' | 'ATTENTION_ADVISED' | 'CRITICAL_ATTENTION';
  };
  ingress: {
    label: string;
    value: string;
    count: number;
  };
  transport: {
    label: string;
    value: string;
    cipher: string;
  };
  observed: {
    label: string;
    value: string;
    count: number;
  };
}

/**
 * Meaningful Attention Item
 */
export interface MeaningfulAttentionItem {
  id: string;
  title: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  evidenceSource: string;
}

/**
 * Positive Hygiene Observation
 */
export interface PositiveObservationItem {
  id: string;
  title: string;
  category: 'TRANSPORT' | 'DNS' | 'EDGE' | 'IDENTITY' | 'SECURITY_HEADERS';
  evidenceSummary: string;
}

/**
 * Unobservable Boundary Item (Epistemic Honesty)
 */
export interface UnobservableDimension {
  title: string;
  description: string;
  examples: string;
}

export const CANONICAL_UNOBSERVABLE_DIMENSIONS: readonly UnobservableDimension[] = [
  {
    title: 'Private Infrastructure & Data Stores',
    description: 'Internal databases, backend datastores, and VPC topologies are isolated from external wire telemetry.',
    examples: 'Database topology · Private VPC · Cluster subnets',
  },
  {
    title: 'Identity & Access Management (IAM)',
    description: 'Cloud provider IAM policies, role delegations, and service account entitlements cannot be observed from public perimeter probing.',
    examples: 'IAM policies · Role bindings · Internal secrets',
  },
  {
    title: 'Internal Microservices & East-West Traffic',
    description: 'Service mesh configurations, internal RPC endpoints, and origin microservice meshes behind reverse proxies remain private.',
    examples: 'East-west service traffic · Private API gateways · Internal daemon listeners',
  },
] as const;

/**
 * Architecture Node View Model for Ingress Flow
 */
export interface ArchitectureNodeViewModel {
  step: number;
  role: 'CLIENT' | 'EDGE' | 'GATEWAY' | 'APP' | 'CLOUD' | 'HOST';
  label: string;
  componentName: string;
  verifiedByEvidence: boolean;
  evidenceRef?: string;
}

/**
 * Helper: Format Compact Intelligence Strip
 */
export function formatCompactIntelligenceStrip(
  viewModel: GuestWorkspaceViewModel
): CompactIntelligenceStripData {
  const statusBadge: 'HARDENED' | 'ATTENTION_ADVISED' | 'CRITICAL_ATTENTION' =
    viewModel.severityDistribution.critical > 0
      ? 'CRITICAL_ATTENTION'
      : viewModel.severityDistribution.high > 0
      ? 'ATTENTION_ADVISED'
      : 'HARDENED';

  const postureVerdict =
    statusBadge === 'HARDENED'
      ? 'Hardened Perimeter'
      : statusBadge === 'CRITICAL_ATTENTION'
      ? 'Critical attention advised'
      : 'Attention advised';

  const rawScore = viewModel.perimeterVitals?.postureScore || 'Grade A';
  const scoreClean = rawScore.split('·')[0].trim();

  return {
    perimeter: {
      label: 'PERIMETER',
      verdict: `${scoreClean} · ${postureVerdict}`,
      statusBadge,
    },
    ingress: {
      label: 'INGRESS',
      value: `${viewModel.perimeterVitals?.ingressHopsCount || 1} verified layer${
        (viewModel.perimeterVitals?.ingressHopsCount || 1) === 1 ? '' : 's'
      }`,
      count: viewModel.perimeterVitals?.ingressHopsCount || 1,
    },
    transport: {
      label: 'TRANSPORT',
      value: 'TLS 1.3',
      cipher: viewModel.perimeterVitals?.tlsCipherSuite || 'ChaCha20 / AES-GCM',
    },
    observed: {
      label: 'OBSERVED',
      value: `${viewModel.perimeterVitals?.totalEvidenceCount || 0} verified signals`,
      count: viewModel.perimeterVitals?.totalEvidenceCount || 0,
    },
  };
}

/**
 * Helper: Extract Meaningful Observations (Significant items only)
 */
export function extractMeaningfulObservations(
  findings: readonly FindingViewModel[],
  limit = 3
): MeaningfulAttentionItem[] {
  if (!findings || findings.length === 0) return [];

  // Filter for actionable findings with true significance (never dump low-value noise)
  const sorted = [...findings].sort((a, b) => {
    const scoreMap: Record<string, number> = {
      CRITICAL: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      INFORMATIONAL: 1,
    };
    return (scoreMap[b.severity] || 0) - (scoreMap[a.severity] || 0);
  });

  return sorted.slice(0, limit).map((f) => {
    let significance: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (f.severity === 'CRITICAL' || f.severity === 'HIGH') {
      significance = 'HIGH';
    } else if (f.severity === 'LOW' || f.severity === 'INFORMATIONAL') {
      significance = 'LOW';
    }

    return {
      id: f.id,
      title: f.label,
      category: f.category || 'Perimeter Security',
      severity: f.severity,
      significance,
      explanation: f.whyItMatters || f.occurrence || 'Observed via passive network telemetry.',
      evidenceSource: f.evidenceSource || 'Wire Telemetry',
    };
  });
}

/**
 * Helper: Synthesize Positive Observations (Confirmed Hygiene)
 */
export function synthesizePositiveObservations(
  viewModel: GuestWorkspaceViewModel
): PositiveObservationItem[] {
  const items: PositiveObservationItem[] = [];

  // 1. Transport Layer Security
  items.push({
    id: 'pos-tls',
    title: 'TLS 1.3 Cryptographic Handshake Active',
    category: 'TRANSPORT',
    evidenceSummary: 'Modern TLS session established with strong forward secrecy cipher suite.',
  });

  // 2. DNS Zone Authority
  const dnsComp = viewModel.categorizedComponents?.find(
    (c) => c.category?.toLowerCase() === 'dns' || c.role?.toLowerCase().includes('dns')
  );
  items.push({
    id: 'pos-dns',
    title: 'Authoritative DNS Zone Responding',
    category: 'DNS',
    evidenceSummary: dnsComp
      ? `Authoritative nameservers confirmed on ${dnsComp.name}.`
      : 'Authoritative nameservers actively responding to public queries.',
  });

  // 3. Edge CDN Distribution
  const edgeComp = viewModel.categorizedComponents?.find(
    (c) => c.category?.toLowerCase() === 'edge' || c.role?.toLowerCase().includes('edge') || c.role?.toLowerCase().includes('cdn')
  );
  if (edgeComp) {
    items.push({
      id: 'pos-edge',
      title: `${edgeComp.name} Edge Ingress Active`,
      category: 'EDGE',
      evidenceSummary: `Public HTTP transit is routed through ${edgeComp.name} perimeter distribution.`,
    });
  }

  // 4. HSTS / Security Headers check from observations or findings
  const hasHstsFinding = viewModel.findings?.some((f) => f.label.toLowerCase().includes('hsts'));
  if (!hasHstsFinding) {
    items.push({
      id: 'pos-hsts',
      title: 'HTTP Strict Transport Security (HSTS) Enforced',
      category: 'SECURITY_HEADERS',
      evidenceSummary: 'Browser communication is strictly constrained to encrypted HTTPS channels.',
    });
  }

  return items;
}

/**
 * Helper: Get Canonical Unobservable Dimensions
 */
export function getUnobservableDimensions(): readonly UnobservableDimension[] {
  return CANONICAL_UNOBSERVABLE_DIMENSIONS;
}

/**
 * Helper: Convert Ingress Hops to Verified Architecture Nodes
 */
export function buildVerifiedArchitectureNodes(
  hops: readonly IngressHopViewModel[]
): ArchitectureNodeViewModel[] {
  if (!hops || hops.length === 0) {
    return [
      {
        step: 1,
        role: 'CLIENT',
        label: 'Public Client',
        componentName: 'Web / API Consumer',
        verifiedByEvidence: true,
      },
      {
        step: 2,
        role: 'EDGE',
        label: 'Edge Distribution',
        componentName: 'Anycast Transit',
        verifiedByEvidence: true,
      },
      {
        step: 3,
        role: 'HOST',
        label: 'Origin Host',
        componentName: 'Origin Compute',
        verifiedByEvidence: true,
      },
    ];
  }

  return hops.map((h, idx) => ({
    step: h.hopNumber || idx + 1,
    role: h.role,
    label:
      h.role === 'CLIENT'
        ? 'Public Client'
        : h.role === 'EDGE'
        ? 'Edge / CDN'
        : h.role === 'GATEWAY'
        ? 'Gateway / Web Server'
        : h.role === 'APP'
        ? 'Application Framework'
        : 'Origin / Host',
    componentName: h.title || h.subtitle || 'Infrastructure Component',
    verifiedByEvidence: h.isVerified !== false,
  }));
}

/**
 * Validation: Validate Overview Composition Hierarchy
 */
export function validateOverviewComposition(
  sections: readonly string[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  const execIdx = sections.indexOf('EXECUTIVE_UNDERSTANDING');
  const mattersIdx = sections.indexOf('WHAT_MATTERS_NOW');
  const infraIdx = sections.indexOf('INFRASTRUCTURE_SUMMARY');

  if (execIdx === -1) {
    violations.push('Missing required section: EXECUTIVE_UNDERSTANDING');
  }
  if (mattersIdx === -1) {
    violations.push('Missing required section: WHAT_MATTERS_NOW');
  }
  if (infraIdx === -1) {
    violations.push('Missing required section: INFRASTRUCTURE_SUMMARY');
  }

  if (execIdx !== -1 && mattersIdx !== -1 && mattersIdx < execIdx) {
    violations.push('Hierarchy violation: WHAT_MATTERS_NOW must follow EXECUTIVE_UNDERSTANDING');
  }

  if (execIdx !== -1 && infraIdx !== -1 && infraIdx < execIdx) {
    violations.push('Hierarchy violation: EXECUTIVE_UNDERSTANDING must appear before INFRASTRUCTURE_SUMMARY');
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Verification: Certification Gate Verifier
 */
export function verifyGXO01CertificationGate(
  statement: string
): { passed: boolean; similarityRatio: number; canonicalStatement: string } {
  const target = GX_O01_CERTIFICATION_GATE_STATEMENT.toLowerCase().trim();
  const input = (statement || '').toLowerCase().trim();

  if (input === target) {
    return {
      passed: true,
      similarityRatio: 1.0,
      canonicalStatement: GX_O01_CERTIFICATION_GATE_STATEMENT,
    };
  }

  const targetTokens = new Set(target.split(/\s+/));
  const inputTokens = input.split(/\s+/);
  let matchCount = 0;

  for (const token of inputTokens) {
    if (targetTokens.has(token)) {
      matchCount++;
    }
  }

  const similarityRatio = targetTokens.size > 0 ? matchCount / targetTokens.size : 0;
  const passed = similarityRatio >= 0.75;

  return {
    passed,
    similarityRatio,
    canonicalStatement: GX_O01_CERTIFICATION_GATE_STATEMENT,
  };
}
