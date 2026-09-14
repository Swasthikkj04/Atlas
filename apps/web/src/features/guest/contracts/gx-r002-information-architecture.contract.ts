/**
 * GX-R002 — Guest Workspace Information Architecture Contract
 *
 * Phase: GX-R — Nebula First Experience Redesign
 * Ticket: GX-R002
 * Type: UX Architecture / Frontend Architecture
 * Priority: P0 — Blocking
 * Status: 🔒 Ready to Implement / Frozen Information Architecture
 * Depends on: GX-R001
 * Unblocks: GX-R003 — Guest Shell & Entry Architecture
 *
 * Establishes the bounded spatial architecture, canonical regions, progressive
 * disclosure tiers, context-preserving investigation paths, 7-state resilience model,
 * responsive transformation, and rejected anti-patterns for Nebula Guest Workspace.
 */

// ─── 1. Canonical Ticket & Principle Constants ───────────────────────────────

export const GX_R002_TICKET_ID = 'GX-R002' as const;
export const GX_R002_PHASE = 'GX-R — Nebula First Experience Redesign' as const;
export const GX_R002_STATUS = 'FROZEN_INFORMATION_ARCHITECTURE' as const;

export const GX_R002_CANONICAL_PRINCIPLE =
  'Nebula GX is a bounded spatial intelligence environment inspired by Workspace, not an infinite-scroll report and not a reduced Workspace clone. Its primary experience is: Understand → Orient → Investigate → Decide whether to keep it.' as const;

export const GX_R002_CENTRAL_DESIGN_RULE =
  'GX should feel like temporarily entering Nebula Workspace, not scrolling through a report about Nebula.' as const;

export const GX_R002_CERTIFICATION_GATE_STATEMENT =
  'A guest can enter a bounded Nebula environment, orient themselves, understand the current infrastructure, investigate meaningful intelligence, and return to their previous context — without navigating an endless report.' as const;

// ─── 2. Canonical Guest Workspace Regions ────────────────────────────────────

export type GuestWorkspaceRegionId =
  | 'overview'
  | 'findings'
  | 'infrastructure'
  | 'evidence';

export interface GuestWorkspaceRegion {
  readonly id: GuestWorkspaceRegionId;
  readonly label: string;
  readonly semanticRole: string;
  readonly cognitiveObjective: string;
  readonly boundedContainerType: 'viewport_bounded' | 'contextual_drawer' | 'contained_scroll' | 'spatial_layer';
  readonly isPrimarySurface: boolean;
  readonly questionAnswered: string;
}

export const GUEST_WORKSPACE_REGIONS: readonly GuestWorkspaceRegion[] = [
  {
    id: 'overview',
    label: 'Overview',
    semanticRole: 'Primary orientation and executive understanding surface',
    cognitiveObjective: 'Anchor domain context, communicate current understanding, and surface what matters now',
    boundedContainerType: 'viewport_bounded',
    isPrimarySurface: true,
    questionAnswered: 'What does Nebula understand about this infrastructure and what matters now?',
  },
  {
    id: 'findings',
    label: 'Findings',
    semanticRole: 'Meaningful observations requiring attention or awareness',
    cognitiveObjective: 'Expose authoritative infrastructure risks and observations with zero severity downgrade',
    boundedContainerType: 'contained_scroll',
    isPrimarySurface: false,
    questionAnswered: 'What specific security, configuration, or operational findings exist?',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    semanticRole: 'Architectural understanding of the observed system',
    cognitiveObjective: 'Reveal 8-category technology inventory, ingress hops, and component relationships',
    boundedContainerType: 'contained_scroll',
    isPrimarySurface: false,
    questionAnswered: 'What technologies, web servers, CDNs, DNS, and TLS certificates compose this system?',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    semanticRole: 'Progressive investigation into why Nebula reached a conclusion',
    cognitiveObjective: 'Provide verifiable wire traces, raw protocol headers, and DNS/TLS records without context loss',
    boundedContainerType: 'contextual_drawer',
    isPrimarySurface: false,
    questionAnswered: 'What immutable wire facts and observations prove this finding or architectural state?',
  },
] as const;

// ─── 3. Overview Hierarchy Tiers ─────────────────────────────────────────────

export interface OverviewHierarchyTier {
  readonly rank: number;
  readonly tier:
    | 'DOMAIN_IDENTITY'
    | 'CURRENT_UNDERSTANDING'
    | 'WHAT_MATTERS_NOW'
    | 'OTHER_THINGS_WORTH_KNOWING'
    | 'INFRASTRUCTURE_UNDERSTANDING';
  readonly label: string;
  readonly description: string;
  readonly compositionRule: string;
}

export const OVERVIEW_HIERARCHY_TIERS: readonly OverviewHierarchyTier[] = [
  {
    rank: 1,
    tier: 'DOMAIN_IDENTITY',
    label: 'Domain Identity',
    description: 'Target FQDN, favicon, resolution state, and timestamp freshness',
    compositionRule: 'Fixed header/identity anchor; always visible across orientation',
  },
  {
    rank: 2,
    tier: 'CURRENT_UNDERSTANDING',
    label: 'Current Understanding',
    description: 'Synthesized executive editorial narrative and perimeter posture',
    compositionRule: 'Prominent reading surface (65-75 CPL measure) in primary canvas',
  },
  {
    rank: 3,
    tier: 'WHAT_MATTERS_NOW',
    label: 'What Matters Now',
    description: 'Dominant architectural risks, critical security gaps, and high-impact changes',
    compositionRule: 'Primary attention card with direct "Understand why →" trigger',
  },
  {
    rank: 4,
    tier: 'OTHER_THINGS_WORTH_KNOWING',
    label: 'Other Things Worth Knowing',
    description: 'Secondary observations, operational posture, and informational notices',
    compositionRule: 'Calm secondary surface; omitted if quiet/stable with zero filler',
  },
  {
    rank: 5,
    tier: 'INFRASTRUCTURE_UNDERSTANDING',
    label: 'Infrastructure Understanding',
    description: '8-category technology overview, edge routing, and ingress hops',
    compositionRule: 'Structured horizontal/grid cards within contained viewport bounds',
  },
] as const;

// ─── 4. Infrastructure Categories Contract (8 Canonical Categories) ──────────

export type CanonicalInfrastructureCategory =
  | 'Edge'
  | 'Web Server'
  | 'Application'
  | 'Platform'
  | 'Hosting'
  | 'DNS'
  | 'TLS'
  | 'Mail';

export interface InfrastructureCategorySpec {
  readonly category: CanonicalInfrastructureCategory;
  readonly roleDescription: string;
  readonly exampleDetections: readonly string[];
}

export const CANONICAL_INFRASTRUCTURE_CATEGORIES: readonly InfrastructureCategorySpec[] = [
  {
    category: 'Edge',
    roleDescription: 'CDN, WAF, Edge compute, and perimeter reverse proxies',
    exampleDetections: ['Cloudflare', 'Fastly', 'CloudFront', 'Akamai'],
  },
  {
    category: 'Web Server',
    roleDescription: 'HTTP server software handling raw incoming connections',
    exampleDetections: ['Nginx', 'Apache', 'Caddy', 'HAProxy', 'Envoy'],
  },
  {
    category: 'Application',
    roleDescription: 'Web framework, runtime engine, or fullstack application layer',
    exampleDetections: ['Next.js', 'Django', 'React', 'Node.js', 'PHP', 'Ruby on Rails'],
  },
  {
    category: 'Platform',
    roleDescription: 'Managed PaaS, serverless environment, or container orchestrator',
    exampleDetections: ['Vercel', 'Netlify', 'Docker', 'Kubernetes'],
  },
  {
    category: 'Hosting',
    roleDescription: 'Cloud infrastructure provider hosting the compute resources',
    exampleDetections: ['AWS', 'Google Cloud Platform (GCP)', 'Microsoft Azure', 'DigitalOcean'],
  },
  {
    category: 'DNS',
    roleDescription: 'Authoritative name servers and DNS security record configuration',
    exampleDetections: ['Cloudflare DNS', 'Route 53', 'Google Cloud DNS', 'NS1'],
  },
  {
    category: 'TLS',
    roleDescription: 'Certificate authority, cryptographic cipher suites, and expiry lineage',
    exampleDetections: ["Let's Encrypt", 'DigiCert', 'Sectigo', 'Google Trust Services'],
  },
  {
    category: 'Mail',
    roleDescription: 'Transactional and organization mail transit and SPF/DKIM/DMARC posture',
    exampleDetections: ['Google Workspace', 'Microsoft 365', 'SendGrid', 'Postmark'],
  },
] as const;

// ─── 5. Context-Preserving Investigation Flow ────────────────────────────────

export interface InvestigationFlowStep {
  readonly stepNumber: number;
  readonly stepName: string;
  readonly userAction: string;
  readonly spatialStateChange: string;
  readonly backgroundContextPreserved: boolean;
}

export const CONTEXT_PRESERVING_INVESTIGATION_FLOW: readonly InvestigationFlowStep[] = [
  {
    stepNumber: 1,
    stepName: 'Overview Exploration',
    userAction: 'Guest observes high-level executive brief and primary attention finding',
    spatialStateChange: 'Primary canvas active; viewport-bounded overview visible',
    backgroundContextPreserved: true,
  },
  {
    stepNumber: 2,
    stepName: 'Investigation Trigger',
    userAction: 'Guest clicks "Understand why →" on finding or infrastructure component',
    spatialStateChange: 'Contextual investigation drawer/layer smoothly opens; background dimmed but locked in place',
    backgroundContextPreserved: true,
  },
  {
    stepNumber: 3,
    stepName: 'Evidence & Anti-Overreach Review',
    userAction: 'Guest inspects cryptographic hashes, protocol headers, and what the finding does/does not prove',
    spatialStateChange: 'Investigation drawer displays deep evidence lineage and wire traces with contained scroll',
    backgroundContextPreserved: true,
  },
  {
    stepNumber: 4,
    stepName: 'Context-Preserved Dismissal',
    userAction: 'Guest clicks close (or presses Escape)',
    spatialStateChange: 'Investigation drawer closes; focus immediately returns to origin trigger element',
    backgroundContextPreserved: true,
  },
] as const;

// ─── 6. Seven Canonical Resilience States ─────────────────────────────────────

export type GuestResilienceStateId =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'PARTIAL_UNDERSTANDING'
  | 'READY'
  | 'QUIET_STABLE'
  | 'MEANINGFUL_CHANGE'
  | 'FAILURE';

export interface GuestResilienceStateDefinition {
  readonly stateId: GuestResilienceStateId;
  readonly code: string;
  readonly label: string;
  readonly description: string;
  readonly shellBehavior: string;
  readonly primaryAction: string;
}

export const GUEST_RESILIENCE_STATES: readonly GuestResilienceStateDefinition[] = [
  {
    stateId: 'IDLE',
    code: '01',
    label: 'Idle Entry',
    description: 'Guest has entered the experience but has not initiated an understanding probe.',
    shellBehavior: 'Clean calm input surface with curated sample domains (stripe.com, github.com, etc.).',
    primaryAction: 'Input domain & understand',
  },
  {
    stateId: 'UNDERSTANDING',
    code: '02',
    label: 'Understanding Active',
    description: 'Nebula is actively probing DNS, TLS, HTTP, and synthesizing perimeter intelligence.',
    shellBehavior: 'Progressive telemetry sequence with deliberate 520ms pause; shell structure remains stable.',
    primaryAction: 'Observe live synthesis',
  },
  {
    stateId: 'PARTIAL_UNDERSTANDING',
    code: '03',
    label: 'Partial Understanding',
    description: 'Core DNS/HTTP signals are resolved while deep or auxiliary probes finish.',
    shellBehavior: 'Displays initial executive brief with subtle indication of ongoing enrichment.',
    primaryAction: 'Explore available insights',
  },
  {
    stateId: 'READY',
    code: '04',
    label: 'Ready / Complete',
    description: 'Current understanding synthesis is 100% complete.',
    shellBehavior: 'Full bounded spatial workspace with executive brief, findings, and infrastructure matrix.',
    primaryAction: 'Explore & investigate',
  },
  {
    stateId: 'QUIET_STABLE',
    code: '05',
    label: 'Quiet / Stable',
    description: 'Perimeter is well-configured; no critical risks or anomalous findings exist.',
    shellBehavior: 'Calm affirmative posture; no artificial card clutter or warning fillers added.',
    primaryAction: 'Review stable architecture',
  },
  {
    stateId: 'MEANINGFUL_CHANGE',
    code: '06',
    label: 'Meaningful Change / Attention',
    description: 'High-impact findings, configuration drifts, or security gaps detected.',
    shellBehavior: 'Highlighted Primary Attention story with prominent "Understand why →" investigation trigger.',
    primaryAction: 'Investigate critical finding',
  },
  {
    stateId: 'FAILURE',
    code: '07',
    label: 'Understanding Failure',
    description: 'Network timeout, unresolvable domain, or rate limit exceeded.',
    shellBehavior: 'Graceful failure canvas explaining exact typed failure code with 1-click retry.',
    primaryAction: 'Retry understanding',
  },
] as const;

// ─── 7. Responsive Transformation Model ──────────────────────────────────────

export interface ResponsiveBreakpointBehavior {
  readonly deviceTier: 'Desktop' | 'Tablet' | 'Mobile';
  readonly viewportWindow: string;
  readonly spatialComposition: string;
  readonly navigationModel: string;
  readonly investigationContainer: string;
}

export const RESPONSIVE_TRANSFORMATION_MODEL: readonly ResponsiveBreakpointBehavior[] = [
  {
    deviceTier: 'Desktop',
    viewportWindow: '>= 1024px',
    spatialComposition: 'Multi-pane bounded canvas; 65-75 CPL reading measure; side-by-side or bounded grid regions.',
    navigationModel: 'Minimal header orientation with quick-anchor region jumps; zero full-page scrolling.',
    investigationContainer: 'Slide-over contextual drawer (480-560px width) anchored to the right canvas.',
  },
  {
    deviceTier: 'Tablet',
    viewportWindow: '641px - 1023px',
    spatialComposition: 'Reduced spatial density while maintaining strict visual hierarchy; contained card zones.',
    navigationModel: 'Compact contextual navigation with breadcrumb orientation.',
    investigationContainer: 'Bottom sheet or full-width slide-over drawer with preserved backdrop.',
  },
  {
    deviceTier: 'Mobile',
    viewportWindow: '<= 640px',
    spatialComposition: 'Transforms into controlled sequential surfaces (Domain → Understanding → What Matters → Infra → Evidence).',
    navigationModel: 'Sticky header orientation with progress indicator; bounded surface-to-surface transitions.',
    investigationContainer: 'Full-screen overlay layer with explicit top "← Back to Overview" navigation.',
  },
] as const;

// ─── 8. Progressive Rendering Pipeline (7 Phases) ────────────────────────────

export type ProgressiveRenderingPhaseId =
  | 'shell'
  | 'domain'
  | 'current_understanding'
  | 'primary_intelligence'
  | 'secondary_intelligence'
  | 'infrastructure'
  | 'evidence';

export interface ProgressiveRenderingStep {
  readonly order: number;
  readonly phaseId: ProgressiveRenderingPhaseId;
  readonly targetElement: string;
  readonly blockingPriority: 'CRITICAL_FIRST_PAINT' | 'HIGH_INTERACTIVE' | 'BACKGROUND_ENRICHMENT';
  readonly performanceBudgetMs: number;
}

export const PROGRESSIVE_RENDERING_PIPELINE: readonly ProgressiveRenderingStep[] = [
  {
    order: 1,
    phaseId: 'shell',
    targetElement: 'Guest Workspace Application Frame & Navigation Bar',
    blockingPriority: 'CRITICAL_FIRST_PAINT',
    performanceBudgetMs: 50,
  },
  {
    order: 2,
    phaseId: 'domain',
    targetElement: 'Domain Identity, Favicon, and Target FQDN Header',
    blockingPriority: 'CRITICAL_FIRST_PAINT',
    performanceBudgetMs: 80,
  },
  {
    order: 3,
    phaseId: 'current_understanding',
    targetElement: 'Executive Editorial Narrative & Architectural Brief',
    blockingPriority: 'HIGH_INTERACTIVE',
    performanceBudgetMs: 200,
  },
  {
    order: 4,
    phaseId: 'primary_intelligence',
    targetElement: 'Primary Attention Story (Dominant Finding or Stable Posture)',
    blockingPriority: 'HIGH_INTERACTIVE',
    performanceBudgetMs: 300,
  },
  {
    order: 5,
    phaseId: 'secondary_intelligence',
    targetElement: 'Secondary Observations, Operational Notices & Telemetry',
    blockingPriority: 'BACKGROUND_ENRICHMENT',
    performanceBudgetMs: 500,
  },
  {
    order: 6,
    phaseId: 'infrastructure',
    targetElement: '8-Category Infrastructure Matrix & Ingress Topology',
    blockingPriority: 'BACKGROUND_ENRICHMENT',
    performanceBudgetMs: 650,
  },
  {
    order: 7,
    phaseId: 'evidence',
    targetElement: 'Raw Protocol Payloads, DNS/TLS Traces & Cryptographic Evidence',
    blockingPriority: 'BACKGROUND_ENRICHMENT',
    performanceBudgetMs: 800,
  },
] as const;

// ─── 9. Explicitly Rejected Models & Anti-Patterns ────────────────────────────

export type RejectedModelId =
  | 'INFINITE_REPORT'
  | 'TRADITIONAL_DASHBOARD'
  | 'SCANNER'
  | 'WORKSPACE_CLONE'
  | 'MARKETING_FUNNEL';

export interface RejectedArchitectureModel {
  readonly modelId: RejectedModelId;
  readonly name: string;
  readonly visualPattern: string;
  readonly rejectionRationale: string;
}

export const EXPLICITLY_REJECTED_MODELS: readonly RejectedArchitectureModel[] = [
  {
    modelId: 'INFINITE_REPORT',
    name: 'Infinite Scroll Report',
    visualPattern: 'Everything stacked in a 5,000px vertical document (Everything → Everything → Everything)',
    rejectionRationale: 'Feels like an uncontextualized scanner printout rather than an intelligent application.',
  },
  {
    modelId: 'TRADITIONAL_DASHBOARD',
    name: 'Traditional KPI Dashboard',
    visualPattern: 'Grid of equal-weight KPI cards and arbitrary metric counters (KPI → KPI → KPI → KPI)',
    rejectionRationale: 'Generates visual clutter without communicating editorial understanding or architectural narrative.',
  },
  {
    modelId: 'SCANNER',
    name: 'Legacy Vulnerability Scanner',
    visualPattern: 'Progress bar ("Checking... 127 checks 78%") followed by unranked CVE dumps',
    rejectionRationale: 'Treats infrastructure as a checklist rather than synthesizing system architecture and posture.',
  },
  {
    modelId: 'WORKSPACE_CLONE',
    name: 'Direct Workspace Clone',
    visualPattern: 'Authenticated Workspace with locked/disabled buttons everywhere',
    rejectionRationale: 'Creates a frustrating crippled feeling ("Upgrade to click this") rather than a clean temporary workspace.',
  },
  {
    modelId: 'MARKETING_FUNNEL',
    name: 'Marketing Funnel Gate',
    visualPattern: 'Aggressive popups, countdown timers, and "Sign up now" banners covering content',
    rejectionRationale: 'Eats away user trust before value is proven. Conversion must be earned continuity.',
  },
] as const;

// ─── 10. Invariant Validators & Certification Engine ──────────────────────────

export interface BoundedViewportValidationInput {
  readonly usesInfinitePageScrollAsPrimary: boolean;
  readonly hasBoundedCanvasContainer: boolean;
  readonly hasContextPreservingInvestigation: boolean;
  readonly primaryInformationVisibleWithoutUnlimitedScroll: boolean;
}

/**
 * Validates that a proposed Guest Workspace layout obeys the Bounded Viewport Principle.
 */
export function validateBoundedViewportCompliance(
  input: BoundedViewportValidationInput
): { valid: boolean; violation?: string } {
  if (input.usesInfinitePageScrollAsPrimary) {
    return {
      valid: false,
      violation: 'Layout violation: Infinite page scrolling MUST NOT be used as the primary Guest Workspace architecture.',
    };
  }

  if (!input.hasBoundedCanvasContainer) {
    return {
      valid: false,
      violation: 'Layout violation: Guest Workspace must reside in a bounded canvas container with controlled regions.',
    };
  }

  if (!input.primaryInformationVisibleWithoutUnlimitedScroll) {
    return {
      valid: false,
      violation: 'Layout violation: Primary executive intelligence must fit within a deliberate spatial composition.',
    };
  }

  if (!input.hasContextPreservingInvestigation) {
    return {
      valid: false,
      violation: 'Layout violation: Investigation must preserve background canvas context instead of navigating to a new report page.',
    };
  }

  return { valid: true };
}

/**
 * Validates that the Guest Workspace supports all 7 canonical resilience states.
 */
export function validateSevenResilienceStates(
  supportedStates: readonly GuestResilienceStateId[]
): { complete: boolean; missingStates: readonly GuestResilienceStateId[] } {
  const allRequired: readonly GuestResilienceStateId[] = [
    'IDLE',
    'UNDERSTANDING',
    'PARTIAL_UNDERSTANDING',
    'READY',
    'QUIET_STABLE',
    'MEANINGFUL_CHANGE',
    'FAILURE',
  ];

  const missing = allRequired.filter((s) => !supportedStates.includes(s));
  return {
    complete: missing.length === 0,
    missingStates: missing,
  };
}

/**
 * 🔒 GX-R002 Certification Gate Verification
 *
 * Verifies that the implementation demonstrates:
 * "A guest can enter a bounded Nebula environment, orient themselves, understand
 * the current infrastructure, investigate meaningful intelligence, and return to
 * their previous context — without navigating an endless report."
 */
export function verifyGXR002CertificationGate(proposedStatement: string): {
  passed: boolean;
  canonicalStatement: string;
  centralDesignRule: string;
  similarityRatio: number;
} {
  const normalize = (text: string) =>
    text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()—]/g, '');

  const normalizedProposed = normalize(proposedStatement);
  const normalizedCanonical = normalize(GX_R002_CERTIFICATION_GATE_STATEMENT);

  const passed = normalizedProposed === normalizedCanonical;

  const proposedWords = new Set(normalizedProposed.split(/\s+/));
  const canonicalWords = new Set(normalizedCanonical.split(/\s+/));
  let matches = 0;
  for (const word of canonicalWords) {
    if (proposedWords.has(word)) {
      matches++;
    }
  }

  return {
    passed,
    canonicalStatement: GX_R002_CERTIFICATION_GATE_STATEMENT,
    centralDesignRule: GX_R002_CENTRAL_DESIGN_RULE,
    similarityRatio: matches / canonicalWords.size,
  };
}
