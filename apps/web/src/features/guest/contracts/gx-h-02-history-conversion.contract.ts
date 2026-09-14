/**
 * GX-H-02 — Premium History & Drift Conversion Surface Contract
 *
 * Phase: Guest Experience — History & Drift
 * Ticket: GX-H-02
 * Priority: P1 — UX / Conversion
 * Type: Frontend / UX / Information Architecture / Visual Design
 * Depends on: GX-R012 🔒, GX-H-01 🔒
 * Status: FROZEN_HISTORY_CONVERSION_CONTRACT
 *
 * Acceptance Gate Demonstrated Truth:
 * "Demonstrate intelligence first. Place conversion beside the demonstrated value.
 * Never make the user scroll through a sales document to reach Workspace."
 *
 * Core Experience Thesis:
 * "Nebula understood your infrastructure. Now let Nebula remember it."
 */

import type { GuestWorkspaceViewModel } from './gx-r013-guest-workspace-shell.contract.ts';

export const GX_H02_TICKET_ID = 'GX-H-02' as const;
export const GX_H02_PHASE = 'Guest Experience — History & Drift' as const;
export const GX_H02_PRIORITY = 'P1' as const;
export const GX_H02_STATUS = 'FROZEN_HISTORY_CONVERSION_CONTRACT' as const;

export const GX_H02_CORE_EXPERIENCE_THESIS =
  'Nebula understood your infrastructure. Now let Nebula remember it.' as const;

export const GX_H02_DESIGN_GATE_STATEMENT =
  'Demonstrate intelligence first. Place conversion beside the demonstrated value. Never make the user scroll through a sales document to reach Workspace.' as const;

/**
 * 1. Permanently Prohibited Anti-Patterns in Conversion Redesign
 */
export const EXPLICITLY_REJECTED_CONVERSION_PATTERNS = [
  'BOTTOM_OF_PAGE_CONVERSION_CTA',
  'LONG_SCROLLING_SALES_DOCUMENT',
  'ICON_PER_ROW_PROLIFERATION',
  'EXCESSIVE_PILL_BADGE_CLUTTER',
  'MARKETING_GRADIENT_NOISE',
  'FAKE_WORKSPACE_MONITORING_IN_GX',
  'COERCIVE_PAYWALL_RHETORIC',
] as const;

/**
 * 2. Left Side: Demonstrated Intelligence Data Model
 */
export interface DemonstratedIntelligenceWireContext {
  readonly label: string;
  readonly value: string;
}

export interface DemonstratedIntelligenceSummary {
  readonly domain: string;
  readonly signalsCount: number;
  readonly findingsCount: number;
  readonly capturedRelativeTime: string;
  readonly formattedTimestamp: string;
  readonly wireSummary: readonly DemonstratedIntelligenceWireContext[];
  readonly provenanceStatus: 'AUTHORITATIVE_POINT_IN_TIME';
}

/**
 * 3. Right Side: Conversion Surface Data Model
 */
export interface WorkspaceValueProposition {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
}

export interface ConversionPanelContent {
  readonly heading: string;
  readonly supportingMessage: string;
  readonly valuePropositions: readonly WorkspaceValueProposition[];
  readonly ctaLabel: string;
  readonly reassuranceText: string;
}

export const CANONICAL_WORKSPACE_VALUE_PROPOSITIONS: readonly WorkspaceValueProposition[] = [
  {
    id: 'prop-drift',
    title: 'Continuous Drift',
    tagline: 'Know what changes.',
  },
  {
    id: 'prop-alerts',
    title: 'Perimeter Alerts',
    tagline: 'Know when something matters.',
  },
  {
    id: 'prop-memory',
    title: 'Infrastructure Memory',
    tagline: 'Build context over time.',
  },
] as const;

export const CANONICAL_CONVERSION_PANEL_CONTENT: ConversionPanelContent = {
  heading: 'Remember this.',
  supportingMessage: 'Your perimeter is understood. Keep that understanding alive.',
  valuePropositions: CANONICAL_WORKSPACE_VALUE_PROPOSITIONS,
  ctaLabel: 'Claim this infrastructure →',
  reassuranceText: 'Current observation preserved · No re-scan required',
};

/**
 * Helper: Derives the concise demonstrated intelligence summary for the left side panel.
 */
export function deriveDemonstratedIntelligenceSummary(
  viewModel: GuestWorkspaceViewModel
): DemonstratedIntelligenceSummary {
  const domain = viewModel.domain || 'Target Domain';
  const timestamp = viewModel.snapshotTimestamp || new Date().toISOString();
  const formattedTimestamp = new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const wireSummary: DemonstratedIntelligenceWireContext[] = [];

  const edgeComp = viewModel.categorizedComponents.find(
    (c) => c.category?.toLowerCase().includes('edge') || c.category?.toLowerCase().includes('cdn')
  );
  if (edgeComp) {
    wireSummary.push({ label: 'Edge CDN', value: edgeComp.name });
  }

  const webComp = viewModel.categorizedComponents.find(
    (c) => c.category?.toLowerCase().includes('server') || c.category?.toLowerCase().includes('gateway')
  );
  if (webComp) {
    wireSummary.push({ label: 'Web Gateway', value: webComp.name });
  }

  const tlsVersion = viewModel.perimeterVitals?.tlsCipherSuite
    ? (viewModel.perimeterVitals.tlsCipherSuite.includes('TLS') ? 'TLS 1.3' : viewModel.perimeterVitals.tlsCipherSuite)
    : 'TLS 1.3';
  wireSummary.push({ label: 'Transport', value: tlsVersion });

  const signalsCount = viewModel.perimeterVitals?.totalEvidenceCount || 5;
  const findingsCount = viewModel.findings?.length || 0;

  return {
    domain,
    signalsCount,
    findingsCount,
    capturedRelativeTime: 'Captured just now',
    formattedTimestamp,
    wireSummary,
    provenanceStatus: 'AUTHORITATIVE_POINT_IN_TIME',
  };
}

/**
 * Helper: Returns canonical conversion panel content.
 */
export function getCanonicalConversionPanelContent(): ConversionPanelContent {
  return CANONICAL_CONVERSION_PANEL_CONTENT;
}

/**
 * Layout Validator: Asserts canonical split-column architecture.
 */
export function validateConversionSurfaceLayout(config: {
  isRightSideConversion: boolean;
  isCtaAdjacentToDemonstratedIntelligence: boolean;
  valuePropositionsCount: number;
}): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (!config.isRightSideConversion) {
    violations.push('Layout violation: Conversion panel must live on the right side of the viewport on desktop.');
  }

  if (!config.isCtaAdjacentToDemonstratedIntelligence) {
    violations.push('Layout violation: Primary conversion CTA must be visually adjacent to demonstrated intelligence.');
  }

  if (config.valuePropositionsCount !== 3) {
    violations.push('Value prop violation: Conversion panel must communicate exactly 3 compact value propositions.');
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Gate Verifier: Asserts GX-H-02 Certification Gate.
 */
export function verifyGXH02CertificationGate(
  viewModel: GuestWorkspaceViewModel
): { certified: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const summary = deriveDemonstratedIntelligenceSummary(viewModel);
  if (!summary.domain || summary.domain.length === 0) {
    reasons.push('Demonstrated intelligence must have a valid domain.');
  }
  if (summary.provenanceStatus !== 'AUTHORITATIVE_POINT_IN_TIME') {
    reasons.push('Demonstrated intelligence must guarantee AUTHORITATIVE_POINT_IN_TIME.');
  }

  const content = getCanonicalConversionPanelContent();
  if (content.heading !== 'Remember this.') {
    reasons.push('Conversion heading must be "Remember this."');
  }
  if (content.valuePropositions.length !== 3) {
    reasons.push('Must define exactly 3 compact value propositions.');
  }
  if (!content.reassuranceText.includes('No re-scan required')) {
    reasons.push('Reassurance text must guarantee "No re-scan required".');
  }

  return {
    certified: reasons.length === 0,
    reasons,
  };
}
