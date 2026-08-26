/**
 * WX-901: Authoritative Workspace Redesign Truth Audit & Experience Contract.
 *
 * Establishes canonical truth, frozen information hierarchy, product navigation tabs,
 * domain context rules, and architectural invariants before Phase 9 UI redesign implementation.
 */

export type CapabilityStatus =
  | 'IMPLEMENTED'
  | 'BACKEND_ONLY'
  | 'FRONTEND_ONLY'
  | 'CONTRACT_ONLY'
  | 'PARTIAL'
  | 'PLANNED'
  | 'FUTURE'
  | 'TEST_VERIFIED'
  | 'BROWSER_VERIFIED'
  | 'PRODUCTION_READY';

export interface WorkspaceCapabilityTruth {
  readonly capability: string;
  readonly category:
    | 'Domain/Context'
    | 'Current Intelligence'
    | 'Cross-Domain Intelligence'
    | 'Infrastructure'
    | 'Investigation'
    | 'Changes'
    | 'Memory'
    | 'States';
  readonly backendEndpoint: string;
  readonly frontendComponent: string;
  readonly contractFile: string;
  readonly status: CapabilityStatus;
  readonly targetSurface: string;
  readonly notes?: string;
}

export type ProductNavigationTabId =
  | 'overview'
  | 'findings'
  | 'changes'
  | 'infrastructure'
  | 'memory';

export interface ProductNavigationItem {
  readonly id: ProductNavigationTabId;
  readonly label: string;
  readonly path: string;
  readonly questionAnswered: string;
  readonly iconName: string;
  readonly isPrimary: boolean;
}

export const WORKSPACE_PRODUCT_NAVIGATION: readonly ProductNavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/workspace',
    questionAnswered: 'What is happening and what matters now?',
    iconName: 'LayoutGrid',
    isPrimary: true,
  },
  {
    id: 'findings',
    label: 'Findings',
    path: '/workspace/findings',
    questionAnswered: 'What infrastructure risks and observations require attention?',
    iconName: 'ShieldAlert',
    isPrimary: true,
  },
  {
    id: 'changes',
    label: 'Changes',
    path: '/workspace/changes',
    questionAnswered: 'What has changed across the infrastructure perimeter?',
    iconName: 'History',
    isPrimary: true,
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    path: '/workspace/infrastructure',
    questionAnswered: 'What infrastructure components, servers, DNS, and TLS exist?',
    iconName: 'Server',
    isPrimary: true,
  },
  {
    id: 'memory',
    label: 'Memory',
    path: '/workspace/memory',
    questionAnswered: 'How has this infrastructure evolved historically across snapshots?',
    iconName: 'Calendar',
    isPrimary: false, // Contextual/historical experience
  },
] as const;

export interface InformationHierarchyTier {
  readonly rank: number;
  readonly surface: string;
  readonly question: string;
  readonly coreContent: string;
  readonly authoritativeSource: string;
}

export const WORKSPACE_INFORMATION_HIERARCHY: readonly InformationHierarchyTier[] = [
  {
    rank: 1,
    surface: 'Executive Brief',
    question: 'What is the current state?',
    coreContent: 'Synthesized executive summary, posture confidence, key high-level observations',
    authoritativeSource: 'GET /api/v1/workspace/overview -> executiveBrief',
  },
  {
    rank: 2,
    surface: 'Primary Story',
    question: 'What matters most?',
    coreContent: 'Highest severity finding or notable security posture shift',
    authoritativeSource: 'GET /api/v1/workspace/overview -> primaryStory',
  },
  {
    rank: 3,
    surface: 'Secondary Stories',
    question: 'What else is worth knowing?',
    coreContent: 'Ranked secondary findings and noteworthy observations',
    authoritativeSource: 'GET /api/v1/workspace/overview -> secondaryStories',
  },
  {
    rank: 4,
    surface: 'Infrastructure Overview',
    question: 'What exists?',
    coreContent: 'Edge, Web Server, DNS records, TLS certificates, technologies',
    authoritativeSource: 'GET /api/v1/domains/:id/overview -> infrastructure',
  },
  {
    rank: 5,
    surface: 'Evidence & Analysis',
    question: 'How do we know?',
    coreContent: 'Observed protocol facts, headers, raw response evidence, lineage',
    authoritativeSource: 'GET /api/v1/findings/:id/evidence',
  },
] as const;

export const WORKSPACE_TRUTH_MATRIX: readonly WorkspaceCapabilityTruth[] = [
  // 1. Domain/Context
  {
    capability: 'Domain Retrieval',
    category: 'Domain/Context',
    backendEndpoint: 'GET /api/v1/domains',
    frontendComponent: 'useDomains()',
    contractFile: 'domain.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Header Domain Context Switcher',
  },
  {
    capability: 'Domain Switching',
    category: 'Domain/Context',
    backendEndpoint: 'GET /api/v1/workspace/overview?domainId=:id',
    frontendComponent: 'handleSelectDomain()',
    contractFile: 'context-resolution.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Header Domain Context Switcher',
  },
  {
    capability: 'Domain Creation & Reachability Gate',
    category: 'Domain/Context',
    backendEndpoint: 'POST /api/v1/domains',
    frontendComponent: 'DomainEntryDialog',
    contractFile: 'domain-entry-error.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Add Domain Dialog Modal',
  },
  {
    capability: 'Domain Deletion & Cascade',
    category: 'Domain/Context',
    backendEndpoint: 'DELETE /api/v1/domains/:id',
    frontendComponent: 'DeleteDomainDialog / DomainDeletedToast',
    contractFile: 'domain-deletion-integrity.spec.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Domain Context Menu / Bottom Toast',
  },
  {
    capability: 'Domain Limit Enforcement (4 Max)',
    category: 'Domain/Context',
    backendEndpoint: 'POST /api/v1/domains',
    frontendComponent: 'WorkspaceNav / Context Switcher',
    contractFile: 'domains.service.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Context Switcher Footer Counter (n/4)',
  },
  {
    capability: 'URL Deep-Link & Popstate Sync',
    category: 'Domain/Context',
    backendEndpoint: 'N/A (Client routing)',
    frontendComponent: 'WorkspacePage popstate handler',
    contractFile: 'navigation-resilience.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'URL Query Param ?domainId=:id',
  },

  // 2. Current Intelligence
  {
    capability: 'Executive Brief Synthesis',
    category: 'Current Intelligence',
    backendEndpoint: 'GET /api/v1/workspace/overview -> executiveBrief',
    frontendComponent: 'ExecutiveBrief',
    contractFile: 'brief.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Overview Canvas Top-Left Grid',
  },
  {
    capability: 'Primary Story Selection',
    category: 'Current Intelligence',
    backendEndpoint: 'GET /api/v1/workspace/overview -> primaryStory',
    frontendComponent: 'PrimaryStory',
    contractFile: 'finding.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'What Matters Now Card',
  },
  {
    capability: 'Secondary Stories Ranking',
    category: 'Current Intelligence',
    backendEndpoint: 'GET /api/v1/workspace/overview -> secondaryStories',
    frontendComponent: 'SecondaryStories',
    contractFile: 'finding.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Other Things Worth Knowing List',
  },
  {
    capability: 'Quiet State Determination',
    category: 'Current Intelligence',
    backendEndpoint: 'GET /api/v1/workspace/overview -> quietStatus',
    frontendComponent: 'QuietState / CurrentIntelligence',
    contractFile: 'workspace-state-matrix.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Overview Quiet Canvas ("Posture Stable")',
  },

  // 3. Infrastructure
  {
    capability: 'Infrastructure Topology Overview',
    category: 'Infrastructure',
    backendEndpoint: 'GET /api/v1/domains/:id/overview',
    frontendComponent: 'InfrastructureOverview',
    contractFile: 'overview.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Overview Canvas Top-Right Compact Card & Infrastructure Page',
  },
  {
    capability: 'DNS & Network Details',
    category: 'Infrastructure',
    backendEndpoint: 'GET /api/v1/domains/:id/overview -> infrastructure',
    frontendComponent: 'DnsNetworkOverviewSection',
    contractFile: 'overview.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Section',
  },
  {
    capability: 'TLS & Certificate Expiration',
    category: 'Infrastructure',
    backendEndpoint: 'GET /api/v1/domains/:id/overview -> infrastructure',
    frontendComponent: 'TlsCertificateOverviewSection',
    contractFile: 'overview.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Section',
  },
  {
    capability: 'Technology Stack Recognition',
    category: 'Infrastructure',
    backendEndpoint: 'GET /api/v1/domains/:id/overview -> infrastructure.technologies',
    frontendComponent: 'TechnologyOverviewSection',
    contractFile: 'overview.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Section',
  },

  // 4. Investigation
  {
    capability: 'Finding Explainability & Narrative',
    category: 'Investigation',
    backendEndpoint: 'GET /api/v1/findings/:id',
    frontendComponent: 'FindingInvestigation',
    contractFile: 'investigation.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Finding Deep Investigation Surface',
  },
  {
    capability: 'Change Explainability & Diffs',
    category: 'Investigation',
    backendEndpoint: 'GET /api/v1/timeline/:id/details',
    frontendComponent: 'ChangeInvestigation',
    contractFile: 'investigation.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Change Deep Investigation Surface',
  },
  {
    capability: 'Observation Protocol Evidence & Lineage',
    category: 'Investigation',
    backendEndpoint: 'GET /api/v1/findings/:id/evidence',
    frontendComponent: 'ObservationEvidenceSurface / SnapshotLineageSurface',
    contractFile: 'investigation.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Evidence & Lineage Drawer / Deep Surface',
  },

  // 5. Memory
  {
    capability: 'Snapshot History Lineage',
    category: 'Memory',
    backendEndpoint: 'GET /api/v1/domains/:id/snapshots',
    frontendComponent: 'SnapshotHistory',
    contractFile: 'snapshot-history.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Memory Sub-Surface',
  },
  {
    capability: 'Infrastructure Change Timeline',
    category: 'Memory',
    backendEndpoint: 'GET /api/v1/timeline?domainId=:id',
    frontendComponent: 'InfrastructureTimeline',
    contractFile: 'timeline.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Changes Page / Timeline Surface',
  },

  // 6. States
  {
    capability: 'First-Run 0-Domain Experience',
    category: 'States',
    backendEndpoint: 'N/A (domains.length === 0)',
    frontendComponent: 'FirstRunDomainSetup',
    contractFile: 'entry-state.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Workspace First-Run Direct Entry',
  },
  {
    capability: 'Manual Understanding Control (Understand now)',
    category: 'Current Intelligence',
    backendEndpoint: 'POST /api/v1/domains/:id/understand',
    frontendComponent: 'UnderstandNowButton',
    contractFile: 'understanding.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Workspace Domain Understanding Header',
  },
  {
    capability: 'Understanding Job State & Convergence',
    category: 'Current Intelligence',
    backendEndpoint: 'GET /api/v1/jobs/:jobId & GET /api/v1/domains/:id/jobs',
    frontendComponent: 'UnderstandNowButton & useUnderstandingJob',
    contractFile: 'understanding-convergence.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Workspace Domain Understanding Header & Intelligence Reconciliation',
  },
  {
    capability: 'Manual Understanding Action Emphasis & Active Experience',
    category: 'Current Intelligence',
    backendEndpoint: 'POST /api/v1/domains/:id/understand & GET /api/v1/domains/:id/jobs',
    frontendComponent: 'ActiveUnderstandingBanner & UnderstandNowButton',
    contractFile: 'understanding-convergence.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Workspace Canvas Active Understanding Banner & Header Action',
  },
  {
    capability: 'Manual Understanding Action Placement & Visual Authority',
    category: 'Current Intelligence',
    backendEndpoint: 'POST /api/v1/domains/:id/understand & GET /api/v1/domains/:id/jobs',
    frontendComponent: 'ReturningWorkspaceEntry Header Action Zone & UnderstandNowButton',
    contractFile: 'understanding-convergence.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Workspace Domain-Understanding Header Action Zone',
  },
  {
    capability: 'Compact Infrastructure Overview Surface',
    category: 'Infrastructure',
    backendEndpoint: 'GET /api/v1/domains/:id/overview',
    frontendComponent: 'InfrastructureOverview & CompactInfrastructureOverview',
    contractFile: 'compact-infrastructure.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Dedicated Infrastructure Experience (/workspace/infrastructure)',
  },
  {
    capability: 'Infrastructure Findings Integration',
    category: 'Infrastructure',
    backendEndpoint: 'GET /api/v1/findings',
    frontendComponent: 'InfrastructureOverview & InfrastructureFindingsSection',
    contractFile: 'finding.dto.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Dedicated Infrastructure Surface Findings Section',
  },
  {
    capability: 'Workspace Understanding Synchronization & Truth Convergence',
    category: 'States',
    backendEndpoint: 'GET /api/v1/understanding/jobs & GET /api/v1/domains/:id/overview',
    frontendComponent: 'useWorkspaceUnderstandingConvergence & reconcileWorkspaceUnderstanding',
    contractFile: 'understanding-convergence.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Global Workspace Domain Synchronization',
  },
  {
    capability: 'Workspace Visual Authority & Premium Surface Refinement',
    category: 'Current Intelligence',
    backendEndpoint: 'N/A (Visual Authority / Surface Layering)',
    frontendComponent: 'ExecutiveBrief, PrimaryStory, CompactInfrastructureOverview, InfrastructureFindingsSection',
    contractFile: 'tokens.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Workspace Visual Hierarchy & Card Boundaries',
  },
  {
    capability: 'Workspace Composition & Information Density',
    category: 'Current Intelligence',
    backendEndpoint: 'GET /api/v1/domains/:id/overview & GET /api/v1/briefs/:id',
    frontendComponent: 'CurrentIntelligence (ExecutiveBrief + CompactInfrastructureOverview Grid)',
    contractFile: 'compact-infrastructure.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Top-Level 2-Column Overview Composition',
  },
  {
    capability: 'Understanding In Progress',
    category: 'States',
    backendEndpoint: 'GET /api/v1/understanding/jobs/:id',
    frontendComponent: 'LoadingState with live polling',
    contractFile: 'workspace-state-matrix.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Canvas Loading Overlay',
  },
  {
    capability: 'Workspace Understanding State Convergence',
    category: 'States',
    backendEndpoint: 'GET /api/v1/jobs/:jobId & GET /api/v1/domains/:id/overview',
    frontendComponent: 'useWorkspaceUnderstandingConvergence & resolveAuthoritativeUnderstandingState',
    contractFile: 'understanding-convergence.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Global Workspace Surfaces (Overview, Findings, Changes, Infrastructure, Memory)',
  },
  {
    capability: 'Changes Truth Audit & Experience Contract',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/timeline & GET /api/v1/snapshots',
    frontendComponent: 'resolveChangesState & resolveMeaningfulChangeStory',
    contractFile: 'changes.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Changes Surface (/workspace/changes)',
  },
  {
    capability: 'Snapshot Comparison & Change Detection Integration',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/timeline & GET /api/v1/domains/:id/snapshots',
    frontendComponent: 'resolveVerifiedSnapshotPair & integrateAuthoritativeChanges',
    contractFile: 'snapshot-comparison.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Changes Surface (/workspace/changes)',
  },
  {
    capability: 'Changes Timeline Foundation',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/timeline & GET /api/v1/domains/:id/snapshots',
    frontendComponent: 'ChangesTimeline & ChangeStoryCard',
    contractFile: 'changes.contract.ts & snapshot-comparison.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Changes Surface (/workspace/changes)',
  },
  {
    capability: 'Change Classification & Meaning',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/timeline & GET /api/v1/timeline/:id/details',
    frontendComponent: 'normalizeChangeType & ChangeStoryCard',
    contractFile: 'changes.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Changes Surface (/workspace/changes)',
  },
  {
    capability: 'Change Significance & Impact',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/timeline & GET /api/v1/timeline/:id/details',
    frontendComponent: 'resolveAuthoritativeImpact & ChangeStoryCard',
    contractFile: 'changes.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Changes Surface (/workspace/changes)',
  },
  {
    capability: 'Change Evidence & Investigation Integration',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/findings/:id/evidence & GET /api/v1/timeline/:id',
    frontendComponent: 'ObservationEvidenceSurface & ChangeInvestigation',
    contractFile: 'changes.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Changes Surface (/workspace/changes)',
  },
  {
    capability: 'Changes Cross-Surface Convergence',
    category: 'Changes',
    backendEndpoint: 'POST /api/v1/understanding/domains/:id/jobs & GET /api/v1/timeline',
    frontendComponent: 'useWorkspaceUnderstandingConvergence & reconcileWorkspaceUnderstanding',
    contractFile: 'changes.contract.ts & snapshot-comparison.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'All 5 Workspace Surfaces (Overview, Findings, Changes, Infrastructure, Memory)',
  },
  {
    capability: 'Historical Snapshot Comparison',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/snapshots/domains/:id & GET /api/v1/timeline',
    frontendComponent: 'HistoricalComparisonSurface & resolveHistoricalSnapshotComparison',
    contractFile: 'snapshot-comparison.contract.ts & changes.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Historical Comparison Surface (/workspace?sourceType=historical_comparison)',
  },
  {
    capability: 'Changes Resilience & State Experience',
    category: 'Changes',
    backendEndpoint: 'GET /api/v1/timeline & GET /api/v1/snapshots',
    frontendComponent: 'ChangesTimeline & resolveChangesState & HistoricalComparisonSurface',
    contractFile: 'changes.contract.ts & snapshot-comparison.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Infrastructure Changes Surface (/workspace/changes)',
  },
  {
    capability: 'Understanding Freshness & Completion Truth',
    category: 'Current Intelligence',
    backendEndpoint: 'GET /api/v1/jobs/:jobId & GET /api/v1/domains/:id/snapshots',
    frontendComponent: 'resolveUnderstandingFreshness & ReturningWorkspaceEntry',
    contractFile: 'understanding-freshness.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Workspace Domain Header Action Zone & All Workspace Surfaces',
  },
  {
    capability: 'Persistent Authenticated Session & Silent Session Renewal',
    category: 'States',
    backendEndpoint: 'POST /api/v1/auth/refresh & POST /api/v1/auth/logout',
    frontendComponent: 'ApiClient & SingleFlightCoordinator & AuthProvider',
    contractFile: 'session-renewal.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface: 'Global API Client & Authentication Layer & All Workspace Surfaces',
  },
  {
    capability: 'Understanding-to-Snapshot Workspace Convergence',
    category: 'States',
    backendEndpoint:
      'POST /api/v1/domains/:domainId/understand & GET /api/v1/snapshots/domain/:domainId',
    frontendComponent:
      'reconcileWorkspaceUnderstanding & SnapshotHistory & Overview & Changes & Findings & Infrastructure',
    contractFile: 'understanding-snapshot-convergence.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'All 5 Workspace Surfaces (Overview, Findings, Changes, Infrastructure, Memory)',
  },
  {
    capability: 'Workspace Premium Surface Shading & Color Authority (WX-1017)',
    category: 'Current Intelligence',
    backendEndpoint: 'N/A (Visual Authority & Surface Layering)',
    frontendComponent:
      'ExecutiveBrief, PrimaryStory, SecondaryStories, CompactInfrastructureOverview, InfrastructureFindingsSection, UnderstandNowButton',
    contractFile: 'tokens.ts & colors.css & elevation.css & theme.css',
    status: 'PRODUCTION_READY',
    targetSurface:
      'All Workspace Surfaces (Overview, Findings, Changes, Infrastructure, Memory, Header)',
  },
  {
    capability: 'Understanding Lifecycle & Current-State Communication (WX-1018)',
    category: 'Current Intelligence',
    backendEndpoint:
      'POST /api/v1/domains/:id/understand & GET /api/v1/domains/:id/jobs & GET /api/v1/snapshots',
    frontendComponent:
      'resolveUnderstandingLifecycleState, ReturningWorkspaceEntry, ExecutiveBrief, ChangesTimeline, InfrastructureOverview',
    contractFile: 'understanding-lifecycle.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'All Workspace Surfaces (Header, Overview, Findings, Changes, Infrastructure, Memory)',
  },
  {
    capability: 'Investigation Meaning & Evidence Hierarchy (WX-1019)',
    category: 'Investigation',
    backendEndpoint:
      'GET /api/v1/findings/:id & GET /api/v1/timeline/:id & GET /api/v1/snapshots/:id',
    frontendComponent:
      'FindingInvestigation, ChangeInvestigation, resolveFindingMeaningHierarchy, resolveChangeMeaningHierarchy',
    contractFile: 'investigation-hierarchy.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'Deep Investigation Surfaces (Finding Investigation, Change Investigation, Observation Evidence)',
  },
  {
    capability: 'Observation Truth & Finding Accuracy Audit (WX-1020)',
    category: 'Investigation',
    backendEndpoint:
      'GET /api/v1/findings/:id & GET /api/v1/findings/:id/evidence & GET /api/v1/snapshots/:id',
    frontendComponent:
      'FindingInvestigation, ObservationEvidenceSurface, validateObservationIntegrity, validateFindingSnapshotAffinity',
    contractFile: 'observation-truth.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'All Workspace Surfaces (Overview Brief, Findings List, Investigation, Observation Evidence, Memory)',
  },
  {
    capability: 'Change Evidence Retrieval Integrity (WX-1021)',
    category: 'Investigation',
    backendEndpoint:
      'GET /api/v1/timeline/:id/evidence & GET /api/v1/timeline/:id/details & GET /api/v1/findings/:id/evidence',
    frontendComponent:
      'ChangeStoryCard, ChangesTimeline, ObservationEvidenceSurface, resolveAuthoritativeEvidence, useEvidenceResolver',
    contractFile: 'canonical-evidence-resolver.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'Infrastructure Changes & Investigation Surfaces (Changes Timeline, Change Story Card, Observation Evidence)',
  },
  {
    capability: 'Authoritative Infrastructure Provider & Deployment Attribution (WX-1022)',
    category: 'Infrastructure',
    backendEndpoint:
      'GET /api/v1/domains/:id/overview & GET /api/v1/snapshots/:id',
    frontendComponent:
      'CompactInfrastructureOverview, resolveCompactInfrastructure, InfrastructureOverview',
    contractFile: 'compact-infrastructure.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'Infrastructure Overview Surfaces (Executive Overview, Infrastructure Inventory, Memory History)',
  },
  {
    capability: 'Domain Identity & Favicon Surface (WX-1021)',
    category: 'Domain/Context',
    backendEndpoint:
      'GET /api/v1/domains & GET /api/v1/domains/:id',
    frontendComponent:
      'DomainIdentity, DomainFavicon',
    contractFile: 'DomainIdentity.tsx',
    status: 'PRODUCTION_READY',
    targetSurface:
      'All Workspace Surfaces (Overview, Findings, Changes, Infrastructure, Memory, Investigation, Context Switcher)',
  },
  {
    capability: 'Authoritative HTTP Response Verification & Finding Confidence (WX-1022)',
    category: 'Current Intelligence',
    backendEndpoint:
      'GET /api/v1/domains/:id/findings & GET /api/v1/snapshots/:id',
    frontendComponent:
      'ObservationEvidenceSurface, FindingInvestigation, PrimaryStory',
    contractFile: 'investigation-hierarchy.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'Finding Investigation & Observation Evidence Surfaces (Findings, Investigation, Evidence Lineage)',
  },
  {
    capability: 'Finding Severity, Impact & Confidence Calibration (WX-1023)',
    category: 'Investigation',
    backendEndpoint:
      'GET /api/v1/findings/:id & GET /api/v1/domains/:id/findings',
    frontendComponent:
      'FindingInvestigation, InfrastructureFindingsSection, resolveFindingMeaningHierarchy',
    contractFile: 'investigation-hierarchy.contract.ts & finding-result.interface.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'All Workspace Surfaces (Findings, Investigation, Overview, Evidence Lineage)',
  },
  {
    capability: 'Change Intelligence & Improvement Experience (WX-1024)',
    category: 'Changes',
    backendEndpoint:
      'GET /api/v1/timeline & GET /api/v1/timeline/:id/details & GET /api/v1/timeline/:id/evidence',
    frontendComponent:
      'ChangeStoryCard, ChangesTimeline, ChangeInvestigation, resolveMeaningfulChangeStory',
    contractFile: 'changes.contract.ts & investigation-hierarchy.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'Infrastructure Changes (/workspace/changes) & Change Investigation Surfaces',
  },
  {
    capability: 'Workspace Intelligence Landing & Multi-Domain Brief (WX-1025)',
    category: 'Cross-Domain Intelligence',
    backendEndpoint:
      'GET /api/v1/domains & GET /api/v1/timeline',
    frontendComponent:
      'WorkspaceIntelligenceLanding, MultiDomainHero, MonitoredInfrastructureList, CrossDomainWhatChanged, resolveMultiDomainBrief',
    contractFile: 'multi-domain-brief.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'Workspace Landing (/workspace) & Cross-Domain Intelligence Briefing',
  },
  {
    capability: 'Changes Timeline: Infinite Historical Intelligence (WX-1026)',
    category: 'Changes',
    backendEndpoint:
      'GET /api/v1/timeline?cursor=...&limit=20',
    frontendComponent:
      'ChangesTimeline, StickyEpochSpine, CompactChangeRow, DenseChangeRow, InfrastructureOriginSeal, ReturnToPresentButton, partitionInfiniteTimeline',
    contractFile: 'infinite-timeline.contract.ts & changes.contract.ts',
    status: 'PRODUCTION_READY',
    targetSurface:
      'Infrastructure Changes (/workspace/changes) & Continuous Historical Memory',
  },
] as const;

export const WORKSPACE_CERTIFIED_INVARIANTS = {
  NO_DOMAIN_SIDEBAR_AS_PRIMARY_CONTEXT:
    'Domains are context, not primary navigation. The sidebar must contain Product Navigation (Overview, Findings, Changes, Infrastructure, Memory).',
  NO_MIXED_DOMAIN_CONTEXT:
    'Selecting a domain updates the entire contextual Workspace. Never blend data across different domains.',
  NO_FRONTEND_INTELLIGENCE_REINTERPRETATION:
    'Backend is authoritative for intelligence, synthesis, ranking, and evidence. Frontend does not synthesize or re-rank.',
  NO_FAKE_CAPABILITY:
    'No placeholder charts, fake metrics, or unbacked telemetry.',
  NO_INVENTED_API:
    'Frontend reuses existing backend endpoints (GET /workspace/overview, GET /domains/:id/overview, GET /findings, GET /timeline).',
  NO_DUPLICATE_NAVIGATION_SYSTEM:
    'Domain selector serves only domain switching and identification, not secondary module routing.',
  NO_BACKEND_REDESIGN_WITHOUT_GAP:
    'Existing backend already provides all necessary domain intelligence, findings, timeline, and snapshot contracts.',
  NO_HISTORICAL_TRUTH_MUTATION:
    'Snapshots and timeline changes remain immutable.',
  NO_DESIGN_TOKEN_INVENTION:
    'UI uses established Base-8 spacing, 6-tier severity tokens, Newsreader typography, and hairline borders.',
  NO_DOMAIN_CONTEXT_LOSS:
    'Switching navigation tabs preserves the active domain context in state and URL.',
  NO_STALE_DOMAIN_CONTEXT:
    'Deleted or non-existent domains gracefully converge to the first available domain or first-run state.',
  NO_PREMATURE_EVIDENCE_DOMINANCE:
    'High-level intelligence (Brief, Stories) is presented first; raw protocol evidence is progressively disclosed.',
  NO_DASHBOARD_DRIFT:
    'Workspace is an intelligence narrative, not a dashboard with 20 metric widgets.',
  NO_SCANNER_REPORT_DRIFT:
    'Workspace is not a findings dump or traditional vulnerability scanner report.',
  NO_ACTIVITY_FEED_DRIFT:
    'Workspace is not a raw log stream or DevOps activity feed.',
  NO_UNAUTHORIZED_MANUAL_UNDERSTANDING:
    'Manual understanding requires authenticated session and authorized domain context.',
  NO_CLIENT_SELECTED_DOMAIN_AUTHORITY:
    'Manual understanding strictly targets the server-authoritative active domain ID.',
  NO_INVENTED_UNDERSTANDING_API:
    'Reuses existing POST /api/v1/domains/:domainId/understand without creating a parallel API.',
  NO_FAKE_PROGRESS:
    'No simulated percentage progress or fake scanning progress animations.',
  NO_DUPLICATE_UNDERSTANDING_JOB:
    'Duplicate clicks or concurrent manual understanding executions for the same domain are blocked and disabled.',
  NO_STALE_DOMAIN_EXECUTION:
    'Domain context switches immediately decouple in-flight UI state from stale domains.',
  NO_CROSS_DOMAIN_UNDERSTANDING:
    'Triggering understanding for domain A never affects or queries domain B.',
  SERVER_AUTHORITATIVE_JOB_STATE:
    'The workspace reflects real understanding/job states returned by the backend.',
  NO_FAKE_COMPLETION:
    'Completed state is only recognized when confirmed by server response and cache invalidation.',
  NO_FALSE_COMPLETION:
    'Completed state is only recognized when confirmed by server response and cache invalidation.',
  FAILURE_STATE_IS_TRUTHFUL:
    'Error state truthfully informs the user ("Understanding couldn\'t be completed.") with a retry option without claiming false success.',
  UNDERSTANDING_RESULT_RECONVERGES_TO_SERVER:
    'On completion, the workspace cache is invalidated so the Executive Brief, Stories, and Snapshots reflect server truth.',
  ACCESSIBLE_MANUAL_ACTION:
    'The manual understand action is accessible via keyboard and screen readers with live status announcements.',
  NO_STALE_JOB_STATE:
    'Active job state is bound strictly to the domain context and does not retain stale jobs upon switching or reload.',
  NO_DUPLICATE_ACTIVE_JOB:
    'If an active understanding job is already running on the server for a domain, duplicate triggers are prohibited.',
  NO_GLOBAL_JOB_STATE:
    'Understanding state belongs strictly to the domain/job, never stored in a global singleton.',
  NO_CLIENT_ONLY_JOB_AUTHORITY:
    'Frontend never synthesizes or assumes job completion; server is authoritative.',
  NO_PREMATURE_INTELLIGENCE_REFRESH:
    'Intelligence queries (Executive Brief, Stories, Overview) are only refreshed after authoritative job completion, never upon immediate 202 acceptance.',
  NO_FALSE_SUCCESS:
    'Failed jobs are truthfully exposed with retry action without claiming false success.',
  NO_RUNAWAY_POLLING:
    'Job polling stops immediately upon completion, failure, unmount, or domain change.',
  NO_STALE_DOMAIN_RECONCILIATION:
    'Reconciling intelligence invalidates only the target domain cache.',
  NO_JOB_STATE_FABRICATION:
    'No synthetic intermediate phases or fake worker progress stages.',
  NO_BACKEND_CONTRACT_DUPLICATION:
    'Reuses existing /jobs/:id and /domains/:id/understand endpoints.',
  NO_INTELLIGENCE_REINTERPRETATION:
    'Frontend does not reinterpret backend intelligence results or findings ranking.',
  NO_ACCESSIBILITY_STATE_LOSS:
    'Accessible screen-reader announcements reflect real start, completion, and failure events.',
  NO_INVISIBLE_MANUAL_ACTION:
    'Understand now is visually prominent, discoverable, and clearly positioned in the domain header.',
  NO_TINY_PRIMARY_ACTION:
    'The manual action has a comfortable hit area with sufficient horizontal padding and primary visual weight.',
  NO_FAKE_UNDERSTANDING_STATE:
    'The active understanding banner truthfully communicates backend job state without fabricated stages.',
  NO_DUPLICATE_UNDERSTANDING:
    'While understanding is active, triggering duplicate understanding jobs is strictly prohibited.',
  NO_STALE_DOMAIN_UNDERSTANDING:
    'Active understanding banners decouple immediately upon domain switching without retaining stale domain context.',
  NO_MIXED_DOMAIN_STATE:
    'Understanding jobs on domain A never alter or display within domain B.',
  NO_HISTORICAL_TRUTH_ERASURE:
    'Previous intelligence remains visible and available as historical truth while understanding is in progress.',
  NO_FRONTEND_JOB_AUTHORITY:
    'The backend owns the understanding lifecycle; frontend only renders authoritative server truth.',
  NO_BACKEND_CONTRACT_INVENTION:
    'Consumes existing understanding API endpoints without inventing parallel contracts.',
  NO_SCANNING_THEATER:
    'Communicates state rather than manufacturing simulated progress bars or percentage counters.',
  NO_WORKSPACE_CONTEXT_LOSS:
    'Domain context, active navigation surface, and understanding state are preserved across navigation and reload.',
  NO_ACCESSIBILITY_FEEDBACK_LOSS:
    'Live regions announce state transitions politely without spamming polling updates.',
  NO_DETACHED_UNDERSTANDING_ACTION:
    'Understand now lives directly within the domain-understanding header, structurally associated with the active domain state.',
  NO_WEAK_UTILITY_ACTION_STYLING:
    'Understand now is styled as a primary action with unmistakable visual weight rather than a subtle outline utility.',
  NO_SECONDARY_BUTTON_DRIFT:
    'The manual understanding action cannot degrade into a secondary or tertiary muted control.',
  NO_CORNER_ISOLATED_ACTION:
    'The action is integrated directly in the domain intelligence header action zone, not isolated at the extreme screen edges.',
  NO_HEADER_METADATA_DISCONNECT:
    'The domain understanding status and timestamp are bound directly to the active understanding action in the header.',
  ACCESSIBLE_PRIMARY_ACTION:
    'Primary manual action maintains full keyboard, screen-reader, and WCAG AAA focus contrast.',
  NO_EDITORIAL_OVERVIEW_DOMINANCE:
    'Overview displays compact infrastructure card rather than large multi-page editorial layouts.',
  NO_FABRICATED_INFRASTRUCTURE_CATEGORIES:
    'Infrastructure inventory represents 8 canonical categories using authoritative backend data.',
  NO_UNOBSERVED_VALUE_FABRICATION:
    'Missing infrastructure attributes display calm "Not detected" without guessing or simulating.',
  FULL_INFRASTRUCTURE_PRESERVATION:
    'Detailed /workspace/infrastructure model remains available with active domain context preserved.',
  QUIET_AUTHORITATIVE_INVENTORY:
    'Card is rendered as a quiet, authoritative inventory without dashboard metric tiles or monitoring theater.',
  NO_OVERVIEW_INVENTORY_POLLUTION:
    'Workspace Overview focuses purely on synthesized intelligence (Executive Brief, Stories) and does not host infrastructure inventory cards.',
  INFRASTRUCTURE_PAGE_IS_INVENTORY_HOME:
    'The dedicated Infrastructure experience (/workspace/infrastructure) is the sole authoritative home for the 8-category inventory and full infrastructure model.',
  OVERVIEW_EQUALS_INTELLIGENCE:
    'Overview explains what is happening; Infrastructure exposes what exists.',
  NO_INVENTED_INFRASTRUCTURE_FINDINGS:
    'Findings displayed on the infrastructure surface must come exclusively from authoritative findings APIs (useFindings) and never be inferred from infrastructure categories.',
  INFRASTRUCTURE_EXPOSES_MODEL_AND_FINDINGS:
    'The /workspace/infrastructure experience authoritative structure presents both the infrastructure model and active infrastructure findings.',
  TRUTHFUL_INFRASTRUCTURE_FINDINGS_EMPTY_STATE:
    'When zero findings exist, the infrastructure surface displays a calm "No infrastructure findings" state while keeping the infrastructure model fully visible.',
  ONE_DOMAIN_ONE_AUTHORITATIVE_TRUTH:
    'One domain + one completed understanding = one authoritative Workspace state across Overview, Findings, Changes, Infrastructure, and Memory.',
  UNIFIED_MANUAL_AND_AUTOMATIC_CONVERGENCE:
    'Manual and automatic understanding share the exact same convergence path and authoritative state invalidation.',
  DOMAIN_ISOLATED_SYNCHRONIZATION:
    'Understanding synchronization is strictly scoped by domainId; background completions on other domains never contaminate the active domain view.',
  NO_INDEPENDENT_PAGE_REGISTRY:
    'No individual Workspace page maintains an independent understanding registry; all derive from backend-authoritative snapshot state.',
  WORKSPACE_VISUAL_AUTHORITY:
    'Workspace intelligence presents deliberate surface contrast and tactile card boundaries rather than disappearing into empty space.',
  NO_RAINBOW_DASHBOARD:
    'Semantic color communicates actual meaning (emerald=stable, amber=attention, red=critical, blue=informational/active) rather than decorative dashboard noise.',
  NO_DECORATIVE_THEATER:
    'Zero glassmorphism, neon gradients, giant shadows, fake metrics, or excessive animations.',
  COMPACT_OVERVIEW_COMPOSITION:
    'Overview establishes the 2-column top composition with Executive Brief and Compact Infrastructure Overview side-by-side on desktop, followed by dominant Primary Story.',
  TWO_COLUMN_DESKTOP_INTELLIGENCE_GRID:
    'On desktop breakpoints, Executive Brief and Compact Infrastructure Overview share the top-level grid without giant single-column card stretching.',
  ONE_DOMAIN_ONE_CURRENT_UNDERSTANDING:
    'A single domain understanding operation must produce one authoritative understanding state across the entire Workspace.',
  NO_FRONTEND_ONLY_UNDERSTOOD_FLAGS:
    'No frontend-only understood flags or client-simulated completion status.',
  NO_INDEPENDENT_PER_PAGE_UNDERSTANDING_STATE:
    'No independent per-page understanding state; all surfaces converge on the single authoritative domain understanding.',
  NO_STALE_INFRASTRUCTURE_CACHE:
    'No stale infrastructure cache survives a completed understanding.',
  NO_PAGE_SPECIFIC_JOB_INTERPRETATION:
    'No page-specific interpretation of job completion; unified convergence path across all surfaces.',
  NO_MIXED_SNAPSHOTS:
    'Workspace surfaces never mix snapshots from different understanding runs.',
  NO_INFRASTRUCTURE_NOT_UNDERSTOOD_AFTER_SUCCESS:
    'Infrastructure not understood state is prohibited after a successful understanding completion.',
  NO_INVENTED_CHANGES:
    'Changes must only be derived from backend comparison between verified snapshots. Never fabricate changes or mock events.',
  NO_FRONTEND_CHANGE_DETECTION:
    'Frontend never diffs raw snapshot JSON or decides that two observations represent a change. Intelligence belongs exclusively to the backend.',
  NO_SNAPSHOT_MUTATION:
    'Snapshots are immutable historical records. A change event references snapshots without altering their facts.',
  NO_ACTIVITY_FEED:
    'Changes is not an activity feed. System events (e.g. worker claimed job, DNS request executed, understanding started) are strictly prohibited from the Changes timeline.',
  NO_FINDINGS_AS_CHANGES:
    'Findings represent security/operational posture facts. Finding != Change. A finding may link to a change, but findings are not changes.',
  NO_MEMORY_AS_CHANGES:
    'Memory answers "How has this infrastructure evolved over time?". Changes answers "What is different?". The surfaces and their state models are strictly separated.',
  NO_RAW_SNAPSHOT_COMPARISON_UI:
    'Users are never presented with raw JSON diffs or collector logs. Nebula presents interpreted change stories.',
  NO_UNSUPPORTED_CHANGE_CATEGORY:
    'Only change categories with authoritative backend intelligence backing (DNS, TLS/SSL, HTTP, Security Headers, Technology, Hosting, Edge/CDN, Network, Performance) are valid.',
  NO_FALSE_COMPARISON:
    'Single-snapshot domains (initial baseline) must display "No changes yet" and never imply a comparison took place ("Everything unchanged" is prohibited).',
  NO_PARTIAL_UNDERSTANDING_AS_CHANGE:
    'In-flight or incomplete understanding jobs never produce partial change stories or overwrite trusted change history.',
  NO_STALE_CHANGE_STATE:
    'When a new understanding completes, all changes surfaces invalidate and consume the authoritative new comparison results.',
  NO_UNSUPPORTED_CAUSALITY:
    'Narrative explanations must strictly reflect backend significance without client-side speculation.',
  EVIDENCE_LINEAGE_PRESERVED:
    'Every meaningful change must link back to authoritative snapshot facts and raw observation evidence.',
  PREVIOUS_AND_CURRENT_SNAPSHOT_LINEAGE_PRESERVED:
    'Every comparative change story must preserve explicit before/after snapshot lineage IDs.',
  PREVIOUS_SNAPSHOT_IS_IMMEDIATELY_PRECEDING:
    'Previous snapshot is strictly the immediately preceding verified snapshot; never compare against in-progress or failed runs.',
  CURRENT_SNAPSHOT_IS_LATEST_VERIFIED:
    'Current snapshot is strictly the latest successfully verified snapshot for the active domain.',
  UNIFIED_CHANGE_CONVERGENCE:
    'Manual and automatic understandings produce identical change detection truth through the shared snapshot comparison pipeline.',
  STRICT_DOMAIN_ISOLATION:
    'A change detected on domain A must never appear on domain B.',
  NO_CLIENT_SIDE_DIFF_FABRICATION:
    'All value transitions (previousValue -> currentValue) and category mappings originate from backend comparison intelligence.',
  EXPLANATION_OVER_RAW_DIFF:
    'Change presentation prioritizes human-readable meaning and significance over raw visual diff output.',
  NO_INVENTED_SIGNIFICANCE:
    'Significance narratives must strictly originate from authoritative backend intelligence; never synthesize causal explanations in the client.',
  CANONICAL_CHANGE_CLASSIFICATION:
    'Every detected change must strictly resolve to one of the 9 certified categories with consistent label, icon, and severity semantics.',
  HONEST_SIGNIFICANCE_FALLBACK:
    'When backend significance is absent, present transition facts honestly without speculative commentary.',
  AUTHORITATIVE_IMPACT_SEMANTICS:
    'Impact and severity must represent authoritative backend assessment of actual risk/benefit, never inferred from category alone.',
  PROGRESSIVE_CHANGE_DISCLOSURE:
    'Change card layout strictly follows progressive disclosure: Category/Impact -> Title -> What Changed -> Why It Matters -> Value Transitions -> Evidence Lineage.',
  CHANGE_DIRECTION_INTEGRITY:
    'Change direction (Improvement, Regression, Neutral) is strictly grounded in verified state transitions and authoritative backend classifications.',
  NO_SPECULATIVE_CAUSALITY_FALLBACK:
    'Where backend provides no causal explanation, cards present verified transition facts without filler paragraphs or client speculation.',
  CANONICAL_EVIDENCE_LINEAGE:
    'Every comparative change story preserves verifiable snapshot lineage (currentSnapshotId, previousSnapshotId) and immutable evidence counts.',
  AUTHENTIC_EVIDENCE_NAVIGATION:
    'Clicking "View evidence" navigates strictly using authoritative change, finding, or snapshot identifiers to dedicated investigation surfaces.',
  DOMAIN_PRESERVED_INVESTIGATION:
    'Investigation and evidence traversal strictly preserves active domain identity and prevents cross-domain context loss.',
  HONEST_EVIDENCE_ABSENCE:
    'When evidence count is 0, the UI communicates evidence absence honestly without rendering fake evidence links or synthetic observations.',
  EVIDENCE_FAILURE_RESILIENCE:
    'Failure or unavailability of deeper evidence artifacts does not invalidate or alter the authoritative change story itself.',
  NO_CROSS_SURFACE_TRUTH_DIVERGENCE:
    'A single completed domain understanding operation must produce one coherent truth across all 5 Workspace surfaces (Overview, Findings, Changes, Infrastructure, Memory).',
  MANUAL_AUTOMATIC_CONVERGENCE:
    'Manual ("Understand now") and automatic (UnderstandingWorker) understanding operations converge through the exact same snapshot commitment and comparison pipeline.',
  NO_PARTIAL_SNAPSHOT_PROPAGATION:
    'In-flight, partial, or failed understanding jobs must never update any workspace surface or corrupt trusted historical snapshot lineage.',
  NO_QUERY_KEY_COLLISION:
    'Query keys for domain-scoped data, workspace overview, infrastructure overview, snapshots, findings, timeline, and memory are strictly isolated.',
  NO_CROSS_DOMAIN_CACHE_CONTAMINATION:
    'Domain context switching immediately scopes query invalidation and caching to the active domainId, preventing foreign domain bleed.',
  FAILED_UNDERSTANDING_PRESERVES_TRUSTED_STATE:
    'A failed understanding run leaves existing trusted snapshots, change events, and findings completely intact.',
  MEMORY_CHANGES_SNAPSHOT_CONSISTENCY:
    'The snapshot pair evaluated in Changes (Previous -> Current) must strictly exist and match the chronological snapshot chain in Memory.',
  NO_DUPLICATE_UNDERSTANDING_PIPELINE:
    'No surface may implement an independent understanding or change-detection trigger outside the unified Workspace convergence pipeline.',
  NO_UNVERIFIED_SNAPSHOT_COMPARISON:
    'Only immutable, successfully captured snapshots can be selected for historical comparison; never compare failed or in-progress runs.',
  NO_CROSS_DOMAIN_COMPARISON:
    'Historical comparisons are strictly isolated to snapshots belonging to the active domain context.',
  IMMUTABLE_SNAPSHOT_PRESERVATION:
    'Historical snapshots are immutable records. Comparison produces analytical views without altering underlying facts.',
  AUTHORITATIVE_COMPARISON_ONLY:
    'Differences and unchanged components are derived from verified backend records, never heuristic client diffing.',
  NO_FRONTEND_DIFF_INFERENCE:
    'Frontend does not execute custom JSON/string diffing algorithms; it consumes authoritative backend transition records.',
  NO_FALSE_UNCHANGED_CLAIM:
    'When no differences exist between snapshots, communicate honest absence of changes rather than claiming everything is unchanged.',
  SNAPSHOT_LINEAGE_PRESERVED:
    'Every historical comparison preserves explicit base and target snapshot identifiers.',
  DOMAIN_CONTEXT_PRESERVED:
    'Domain identity is strictly preserved across comparison surface navigation and deep investigation links.',
  NO_TIMELINE_REGRESSION:
    'Historical comparison is an investigation capability that enriches rather than replaces the primary Changes timeline.',
  NO_FAKE_CHANGE_STATE:
    'Changes states (READY, QUIET, FIRST_UNDERSTANDING, EMPTY, UNAVAILABLE, ERROR) reflect authoritative backend facts without client fabrication.',
  NO_PARTIAL_CHANGE_RENDERING:
    'In-flight understanding never injects partial or speculative change stories into the timeline.',
  LAST_TRUSTED_STATE_PRESERVED:
    'While understanding executes, the UI preserves the last verified comparative state and historical groups.',
  NO_CROSS_DOMAIN_STATE_LEAK:
    'All changes, snapshots, and historical comparison state are strictly scoped to the active domain ID.',
  NO_FAKE_EVIDENCE:
    'When evidence count is 0, the UI communicates evidence absence honestly without rendering fake evidence links.',
  NO_BROKEN_COMPARISON_LINK:
    'Historical comparison gracefully handles invalid, missing, or cross-domain snapshot references.',
  RETRY_PRESERVES_DOMAIN_CONTEXT:
    'Error state retries strictly refetch queries scoped to the active domain context.',
  UNDERSTANDING_STATE_CONVERGENCE:
    'Manual and automatic understanding jobs converge to unified truth across all surfaces upon completion.',
  HISTORICAL_STATE_INTEGRITY:
    'Historical comparisons preserve explicit base and target snapshot identifiers and lineage.',
  NO_FALSE_EMPTY_CHANGES_STATE:
    'A domain with verified snapshots must never resolve to EMPTY state ("No infrastructure changes recorded").',
  ONE_SNAPSHOT_IS_NOT_EMPTY:
    'A single verified snapshot represents the initial baseline and must resolve to FIRST_UNDERSTANDING ("No changes yet"), not EMPTY.',
  MULTIPLE_SNAPSHOTS_REQUIRE_COMPARISON:
    'Multiple verified snapshots evaluate detected changes: resolving to QUIET when 0 diffs exist, and READY when diffs exist.',
  NO_CROSS_DOMAIN_CHANGE_DATA:
    'Changes and snapshot data are strictly isolated to the active domainId, preventing cross-domain leakage.',
  NO_STALE_CHANGES_CACHE:
    'Changes queries and caches are authoritatively invalidated upon understanding completion, preventing stale empty states.',
  MANUAL_AUTOMATIC_CHANGE_CONVERGENCE:
    'Manual and automatic background understanding operations converge to identical Changes truth.',
  VERIFIED_SNAPSHOT_CREATES_LINEAGE:
    'Every successfully completed understanding creates exactly one immutable, verified snapshot that extends domain lineage.',
  NO_INCOMPLETE_SNAPSHOT:
    'Incomplete, failed, or in-flight understanding jobs never create snapshots or corrupt historical lineage.',
  NO_DUPLICATE_SNAPSHOT:
    'Deduplicated understanding runs link to existing snapshots without generating duplicate records.',
  NO_CROSS_DOMAIN_SNAPSHOT:
    'Snapshots belong exclusively to their active domain context and never leak across tenant boundaries.',
  MEMORY_REFLECTS_SNAPSHOT_LINEAGE:
    'Memory surface honestly reflects actual snapshot history without fabricated chronological events.',
  CHANGES_USES_LATEST_PAIR:
    'Changes compares the latest verified snapshot against the immediately preceding snapshot for the active domain.',
  HISTORICAL_COMPARISON_REQUIRES_TWO_SNAPSHOTS:
    'Historical comparison is discoverable and accessible only when 2 or more verified snapshots exist for the domain.',
  NO_FAKE_COMPARISON_ENTRY:
    'The "Compare understandings →" affordance is strictly hidden when fewer than 2 snapshots exist.',
  COMPARISON_PRESERVES_DOMAIN_CONTEXT:
    'Historical comparison navigation and selector states strictly preserve active domain context.',
  COMPARISON_PRESERVES_SNAPSHOT_IDENTITY:
    'Historical snapshot identities and timestamps are immutably preserved throughout comparison selection.',
  PREMIUM_QUIET_STATE:
    'Changes quiet-state presents an authoritative, structured intelligence surface rather than an empty dashboard or simplistic status message.',
  UNDERSTANDING_COMPLETION_IS_VISIBLE:
    'Completing an understanding makes verified knowledge tangible and visible across all surfaces.',
  FIRST_BASELINE_IS_DISTINCT:
    'First understanding communicates baseline establishment without falsely claiming stability comparison against a prior state.',
  QUIET_STATE_PROVES_COMPARISON:
    'Multi-snapshot quiet state explicitly proves comparative intelligence by rendering verified snapshot timestamps and identities.',
  NO_AMBIGUOUS_EMPTY_STATE:
    'Single baseline and quiet multi-snapshot domains never render ambiguous "No infrastructure changes recorded" empty states.',
  NO_FALSE_STABILITY_CLAIM:
    'Stability claims require at least two verified snapshots evaluated with zero detected differences.',
  VERIFIED_STATUS_REQUIRES_VERIFIED_SNAPSHOT:
    'Verified indicators and metadata require an immutable, successfully completed snapshot record.',
  NO_FAKE_VERIFICATION_METADATA:
    'Observation counts, timestamps, and snapshot IDs originate strictly from backend facts without client fabrication.',
  NO_DECORATIVE_SUCCESS_THEATER:
    'No checkmark celebrations, confetti, or decorative success graphics on quiet or stable states.',
  NO_REPORT_STYLE_DRIFT:
    'Quiet and baseline surfaces maintain the live operational intelligence aesthetic without drifting into static reports.',
  NO_EMPTY_DASHBOARD_DRIFT:
    'Zero-change states provide structured knowledge context rather than blank metric tiles or empty card placeholders.',
  CROSS_SURFACE_UNDERSTANDING_CONVERGENCE:
    'Overview, Infrastructure, Changes, Findings, and Memory convey unified truth for a given domain understanding lifecycle.',
  AUTHORITATIVE_UNDERSTANDING_FRESHNESS:
    'The Workspace header always displays the latest authoritative understanding freshness from backend snapshot truth, never merely a static or cached timestamp.',
  NO_STALE_HEADER_AFTER_COMPLETION:
    'Completing an understanding job immediately updates the header freshness to "Understood just now" without retaining stale prior timestamps.',
  NO_OPTIMISTIC_SUCCESS_TIMESTAMP:
    'The understanding timestamp is never updated optimistically upon button click; it updates strictly after backend snapshot verification and commitment.',
  FAILED_UNDERSTANDING_PRESERVES_LAST_TRUSTED_TIME:
    'Failed understanding attempts display "Understanding failed" while truthfully preserving the previous verified understanding timestamp.',
  MANUAL_AUTOMATIC_FRESHNESS_CONVERGENCE:
    'Manual triggers and automatic background workers converge through the exact same understanding freshness pipeline and timestamp resolution.',
  LATEST_SNAPSHOT_IDENTITY_CONVERGENCE:
    'All Workspace surfaces (Overview, Findings, Changes, Infrastructure, Memory, Header) converge strictly to the identical latest verified snapshot ID.',
  NO_CROSS_SURFACE_TIMESTAMP_DIVERGENCE:
    'Timestamps across Overview, Header, Infrastructure, and Memory derive from the same authoritative snapshot verification time without cross-surface drift.',
  NO_REFRESH_REQUIRED_FOR_FRESHNESS:
    'Workspace intelligence and freshness update reactively and seamlessly upon snapshot commitment without requiring browser refresh or navigation.',
  UNDERSTANDING_STATE_VISIBLE:
    'While understanding is in-progress, the header explicitly displays active understanding state rather than stale historical timestamps.',
  ACTIVE_SESSION_PERSISTS:
    'An active authenticated session persists across normal Workspace usage and navigation without premature automatic logout.',
  NO_ACCESS_TOKEN_EXPIRY_LOGOUT:
    'The expiration of a short-lived access token never forces a visible logout if the underlying refresh session remains valid.',
  SILENT_SESSION_RENEWAL:
    'Expired access tokens silently and automatically renew via the session rotation endpoint, seamlessly retrying the original request.',
  SINGLE_FLIGHT_REFRESH:
    'Concurrent expired API requests are batched to await a single shared refresh operation, preventing refresh token race conditions.',
  NO_REFRESH_SECRET_EXPOSURE:
    'Refresh credentials are cryptographically protected, never exposed in UI or console logs, and never stored in ordinary application state.',
  SESSION_REVOCATION_IS_AUTHORITATIVE:
    'Revoking a session immediately prevents future silent renewal and forces explicit re-authentication upon access token expiry.',
  DEVICE_SESSION_ISOLATION:
    'Each device/browser maintains an independent session; revoking or expiring one device session does not terminate active sessions on other devices.',
  EXPLICIT_LOGOUT_IS_IMMEDIATE:
    'User-initiated logout immediately destroys the current server-side session and clears local credentials.',
  WORKSPACE_CONTEXT_PRESERVED:
    'Silent session renewal strictly preserves active domain, route, query parameters, and in-memory Workspace investigation context.',
  AUTH_FAILURE_IS_EXPLICIT:
    'When silent renewal legitimately fails (revoked/expired session), present a calm authentication prompt that preserves the intended return destination.',
  NO_INFINITE_SESSION:
    'Session persistence is strictly bounded by backend security policy and maximum TTL, never an infinite frontend loop.',
  ONE_UNDERSTANDING_ONE_SNAPSHOT:
    'Every successful Understanding operation produces or verifies exactly one authoritative infrastructure snapshot.',
  ONE_SNAPSHOT_ONE_WORKSPACE_TRUTH:
    'The committed snapshot is the single source of truth that defines the authoritative infrastructure state across all Workspace surfaces.',
  LATEST_SNAPSHOT_IS_AUTHORITATIVE:
    'The most recently committed verified snapshot is authoritative for current infrastructure facts, findings, and comparison baselines.',
  MEMORY_RECEIVES_NEW_SNAPSHOT:
    'Memory immediately includes the newly committed snapshot as Current in historical lineage without requiring a browser refresh.',
  CHANGES_RECEIVES_NEW_SNAPSHOT:
    'Changes immediately calculates and presents the comparison between the previous verified snapshot and the newly committed snapshot.',
  INFRASTRUCTURE_RECEIVES_NEW_SNAPSHOT:
    'Infrastructure immediately renders the authoritative component facts from the newly committed snapshot.',
  FINDINGS_RECEIVES_NEW_SNAPSHOT:
    'Findings immediately displays observations derived from the newly committed snapshot.',
  OVERVIEW_RECEIVES_NEW_SNAPSHOT:
    'Overview immediately updates its executive posture, timestamp, and primary intelligence to reflect the newly committed snapshot.',
  HISTORICAL_COMPARISON_RECEIVES_NEW_SNAPSHOT:
    'Historical Comparison immediately makes the newly committed snapshot available as the latest target for differential comparison.',
  NO_STALE_SURFACE_AFTER_COMMIT:
    'After snapshot commitment, all Workspace surface queries are immediately invalidated and refetched without surviving stale cache.',
  FAILED_UNDERSTANDING_PRESERVES_TRUST:
    'Failed understanding operations strictly preserve the last trusted snapshot across all surfaces without creating partial states.',
  NO_CROSS_DOMAIN_CONTAMINATION:
    'Snapshots, findings, lineage, and query cache entries remain strictly isolated by domain context.',
  UNDERSTANDING_IS_SNAPSHOT_PUBLICATION:
    'An Understanding is not an Overview update. An Understanding is the publication of a new verified infrastructure state.',
  ONE_UNDERSTANDING_ONE_VERIFIED_SNAPSHOT:
    'Every completed understanding operation produces or verifies exactly one authoritative infrastructure snapshot.',
  SNAPSHOT_IS_CROSS_SURFACE_AUTHORITY:
    'The committed infrastructure snapshot is the authoritative convergence point for Overview, Findings, Changes, Infrastructure, and Memory.',
  MEMORY_RECEIVES_EVERY_VERIFIED_SNAPSHOT:
    'Memory immediately includes every verified snapshot in historical lineage without waiting for separate operations.',
  NO_OVERVIEW_ONLY_UNDERSTANDING:
    'Overview does not own understanding; intelligence publishes to all 5 surfaces simultaneously.',
  MANUAL_AUTOMATIC_PIPELINE_CONVERGENCE:
    'Manual "Understand now" and background worker understanding execute the exact same canonical pipeline.',
  NO_CROSS_DOMAIN_SNAPSHOT_CONTAMINATION:
    'Snapshots and query cache entries remain strictly isolated by domain context.',
  ONE_UNDERSTANDING_ONE_WORKSPACE_STATE:
    'Once a verified understanding is committed, every Workspace surface for that domain must resolve the same latest verified understanding and its derived intelligence.',
  NO_SURFACE_SPECIFIC_TRUTH:
    'No Workspace surface may independently maintain or infer its own current infrastructure state.',
  NO_STALE_CURRENT_SNAPSHOT:
    'A successfully committed newer snapshot must never remain invisible on a Workspace surface that represents current state.',
  MEMORY_LINEAGE_IMMEDIATE:
    'A newly committed verified snapshot must immediately become visible in historical Memory.',
  CHANGES_PAIR_IMMEDIATE:
    'Changes must immediately compare the newly committed snapshot against its preceding verified snapshot.',
  MANUAL_AUTOMATIC_IDENTITY:
    'Manual and automatic understanding must produce identical Workspace convergence behavior.',
  NO_BROWSER_REFRESH_REQUIRED:
    'Cross-surface convergence occurs reactively in real time without requiring browser refresh or navigation reload.',
  IMMUTABLE_HISTORICAL_LINEAGE:
    'Historical snapshots in Memory remain immutable and retain unbroken chronological lineage.',
  SURFACE_COMMUNICATES_HIERARCHY:
    'Neutral warm-toned canvas (#F7F7F5), elevated cards (#FFFFFF), supporting areas (#FAFAF8), and metadata (#F4F4F1) establish hierarchy without rainbow card backgrounds.',
  COLOR_COMMUNICATES_MEANING:
    'Frozen semantic palette (Stable #178A68, Attention #B86F18, High #C24D57, Critical #A93442, Info #3568C8) is used exclusively for status, findings, and lineage truth, never decorative fill.',
  NO_RAINBOW_CARDS:
    'Cards remain pure white/neutral elevated surfaces; colored backgrounds on whole cards are strictly forbidden.',
  CALM_RESTRAINED_SURFACES:
    'Subtle borders (#E7E7E3 default, #E1E1DC card, #E2E2DE brief) and refined micro-shadows (shadow-premium-xs, shadow-premium-sm) create visual authority without heavy drop shadows.',
  PRIMARY_DARK_CTA_AUTHORITY:
    'Understand Now button is the strongest dark element (#171816) with subtle depth, retaining unambiguous primary visual weight.',
  STATE_BEFORE_TIMESTAMP:
    'Semantic understanding state must precede temporal metadata.',
  CURRENT_STATE_EXPLICIT:
    'The Workspace must clearly identify the latest verified infrastructure state.',
  NO_TIMESTAMP_ONLY_STATE:
    'A timestamp must never be the sole representation of understanding state.',
  UNDERSTANDING_NON_BLOCKING:
    'An active understanding must not hide or destroy the last trusted state.',
  FAILED_RUN_PRESERVES_TRUST:
    'A failed run preserves the previous verified state.',
  BASELINE_IS_NOT_NO_CHANGE:
    'The first understanding must never be described as "no changes detected."',
  STABLE_REQUIRES_COMPARISON:
    '"Stable" / "no meaningful changes" may only be communicated when a verified comparison actually exists.',
  MANUAL_AUTOMATIC_STATE_IDENTITY:
    'Manual and automatic understanding use identical state semantics.',
  INTELLIGENCE_BEFORE_DATA:
    'Finding and change investigations must present what happened and why it matters before raw technical evidence.',
  SIGNIFICANCE_PRECEDES_EVIDENCE:
    'Significance and impact must be positioned directly beneath the finding narrative, preceding technical evidence.',
  PROGRESSIVE_VERIFICATION_DISCLOSURE:
    'Processing and evidence lineage chains must be progressively disclosed and subordinate to the explanation.',
  SUBORDINATE_UUID_FOOTER:
    'Technical identifiers and snapshot UUIDs must remain accessible in a restrained context rail without dominating the reading path.',
  CANONICAL_INVESTIGATION_PARITY:
    'Finding and Change investigations must share an identical information hierarchy.',
  OBSERVATION_IS_AUTHORITATIVE:
    'A finding is only as trustworthy as the observation that produced it.',
  FINDING_REQUIRES_VALID_OBSERVATION:
    'Every finding must be backed by an authoritative, current observation from the verified infrastructure snapshot that produced it.',
  NO_LOOKUP_FAILURE_AS_ABSENCE:
    'DNS/HTTP/TLS network or resolver lookup failures (timeouts, SERVFAIL) must never be converted into absence of security findings.',
  NO_STALE_FINDING_AS_CURRENT:
    'Findings from an older superseded snapshot must never masquerade as current infrastructure intelligence.',
  NO_CROSS_SNAPSHOT_FINDING:
    'A finding must belong strictly to the verified snapshot in which the observation was evaluated.',
  NO_CROSS_DOMAIN_FINDING:
    'Cross-domain finding evaluation and leakage is strictly prohibited.',
  RAW_OBSERVATION_LINEAGE_PRESERVED:
    'Raw observations (records, headers, status codes) must be preserved in snapshot payloads and evidence layers.',
  RULE_INPUT_IS_EXPLICIT:
    'Rules must specify explicit inputs, validity conditions, and abort on lookup failures.',
  INVESTIGATION_EVIDENCE_MATCHES_FINDING:
    'The investigation surface must present the exact observed values and snapshot lineage supporting the finding.',
  CURRENT_FINDINGS_MATCH_CURRENT_SNAPSHOT:
    'Findings displayed across Overview, Findings, and Infrastructure must strictly match the current snapshot.',
  NO_FRONTEND_FINDING_INFERENCE:
    'The frontend displays backend-produced findings and never infers or creates findings from titles or diffs.',
  NO_FALSE_VERIFICATION:
    'Findings without valid supporting observations cannot be marked or presented as verified.',
  CHANGE_EVIDENCE_CLAIM_MUST_BE_RETRIEVABLE:
    'If Nebula represents an evidence artifact as available (evidenceCount > 0), the canonical evidence resolver must be capable of resolving that artifact through authoritative backend lineage.',
  PROVIDER_ATTRIBUTION_IS_EVIDENCE_BACKED:
    'Provider attribution must be backed by multi-signal evidence and correlation across DNS, HTTP, TLS, and Network.',
  NO_TECHNOLOGY_TO_HOSTING_INFERENCE:
    'A technology/framework fingerprint (e.g. Next.js) alone must never establish a hosting provider (e.g. Vercel).',
  NO_EDGE_TO_HOSTING_INFERENCE:
    'Edge proxy and CDN infrastructure (e.g. Cloudflare) must never be inferred as the origin hosting provider.',
  NO_DNS_TO_HOSTING_INFERENCE:
    'Authoritative DNS nameservers must never be inferred as the origin hosting provider.',
  NO_SINGLE_SIGNAL_PROVIDER_AUTHORITY:
    'A single HTTP header banner (e.g. Server: Vercel) alone cannot establish confirmed hosting authority.',
  PROVIDER_CONFLICT_MUST_BE_EXPOSED:
    'Conflicting provider signals must be explicitly exposed as Conflicted / Inconclusive rather than picking a single detector.',
  UNKNOWN_PROVIDER_IS_VALID:
    'Insufficient telemetry must be presented honestly as Unknown / Not established.',
  ATTRIBUTION_CONFIDENCE_IS_PRESERVED:
    'Attribution confidence and decision state must be preserved in snapshot payloads and overview contracts.',
  ATTRIBUTION_EVIDENCE_IS_SNAPSHOT_BOUND:
    'Provider attribution records and signal lineage are immutably bound to the snapshot that evaluated them.',
  NO_FALSE_PROVIDER_CHANGE:
    'Historical provider changes require authoritative confidence in both snapshot states to prevent noise.',
  DOMAIN_IDENTITY_IS_PRESENTATIONAL:
    'The favicon is strictly a presentational visual identity anchor and never serves as evidence of hosting or ownership.',
  DOMAIN_IDENTITY_NEVER_BLOCKS_UNDERSTANDING:
    'Favicon resolution is asynchronous and never blocks understanding runs, snapshot evaluation, or UI rendering.',
  DOMAIN_IDENTITY_MATCHES_CANONICAL_DOMAIN:
    'Domain identity always renders the active canonical domain being observed.',
  FAVICON_FAILURE_HAS_NEUTRAL_FALLBACK:
    'Broken or missing favicons render a calm neutral globe fallback without exposing broken-image icons to the user.',
  NO_SYNTHETIC_DOMAIN_BRANDING:
    'Domain identity preserves native favicon colors and strictly avoids synthetic AI-generated logos or decorative glows.',
  DOMAIN_IDENTITY_CONSISTENT_ACROSS_SURFACES:
    'The DomainIdentity primitive is reused consistently across Overview, Findings, Changes, Infrastructure, Memory, and Investigation.',
  HTTP_FINDING_REQUIRES_AUTHORITATIVE_RESPONSE:
    'HTTP security header rules evaluate strictly against an explicitly identified authoritative response rather than arbitrary intermediate hops.',
  REDIRECT_CHAIN_IS_PRESERVED:
    'HTTP discovery captures and preserves the complete redirect chain including hop statuses, locations, scheme transitions, and hop headers.',
  FINAL_RESPONSE_CONTEXT_IS_EXPLICIT:
    'Findings identify the exact final response URL, status code, protocol, and authority supporting the observation.',
  NO_REDIRECT_RESPONSE_AS_FINAL_TRUTH:
    'Intermediate 3xx redirect headers are never presented as the final authoritative response truth.',
  NO_FAILED_LOOKUP_AS_HEADER_ABSENCE:
    'Network timeouts, DNS errors, and connection failures are preserved as probe errors and never converted into false missing header findings.',
  HSTS_REQUIRES_HTTPS_CONTEXT:
    'Strict-Transport-Security is only evaluated and required when a valid authoritative HTTPS endpoint is reached.',
  CSP_OBSERVATION_IS_RESPONSE_AWARE:
    'Content-Security-Policy evaluation considers the response status code and content-type, skipping redirects and non-HTML assets.',
  OBSERVATION_CONFIDENCE_CANNOT_BE_EXCEEDED:
    'A finding cannot claim higher confidence or severity than its underlying observation probe.',
  PERFORMANCE_IS_NOT_SECURITY_FINDING:
    'Slow HTTP response observations are classified as operational performance metrics, not exploitable security vulnerabilities.',
  INFORMATIONAL_HEADERS_DO_NOT_IMPLY_VULNERABILITY:
    'Server banners and response metadata remain informational unless separate authoritative intelligence proves security risk.',
  RAW_HTTP_LINEAGE_PRESERVED:
    'Investigation surfaces maintain unbroken lineage from finding to rule, normalized observation, raw HTTP response, and redirect hops.',
  SEVERITY_AND_CONFIDENCE_ARE_SEPARATE:
    'Severity describes potential impact while confidence describes evidence strength; they are independent orthogonal dimensions.',
  FINDING_CONFIDENCE_CANNOT_EXCEED_OBSERVATION:
    'A finding confidence rating cannot exceed the confidence of the underlying authoritative observation that produced it.',
  NO_OBSERVATION_EQUALS_CONFIRMED_EXPLOIT:
    'An infrastructure configuration or security control observation must never be equated with an active confirmed exploit.',
  SECURITY_HARDENING_IS_NOT_CONFIRMED_EXPLOIT:
    'The absence of a defensive security control (e.g. CSP, HSTS, SPF) represents a hardening gap, not a confirmed exploitable vulnerability.',
  OPERATIONAL_OBSERVATION_IS_NOT_SECURITY_VULNERABILITY:
    'Operational performance and latency metrics (e.g. slow response, single nameserver) must not be presented as security vulnerabilities.',
  INFORMATIONAL_OBSERVATION_IS_NOT_SECURITY_VULNERABILITY:
    'Informational infrastructure metadata (e.g. IPv6 status, server identification) remains informational and not a security risk.',
  SEVERITY_REQUIRES_EXPLICIT_RATIONALE:
    'Every assigned severity level must have an explicit, evidence-backed rationale explained in the finding intelligence model.',
  NO_FRONTEND_SEVERITY_INFERENCE:
    'The frontend presentation layer must strictly respect backend-assigned finding severities and never infer or elevate severity.',
  NO_FRONTEND_CONFIDENCE_ESCALATION:
    'The frontend presentation layer must strictly respect backend-assigned finding confidence and never upgrade confidence.',
  INVESTIGATION_EXPLAINS_SECURITY_BOUNDARY:
    'The investigation experience must explicitly delineate what Nebula knows from what the observation does not prove.',
  EVIDENCE_SUPPORTS_FINDING_CLAIM:
    'All finding titles, explanations, and impact descriptions must be strictly supported by the observed technical evidence.',
  CHANGE_HEADLINE_OUTCOME_ORIENTED:
    'Change headline must express outcome (e.g. Content-Security-Policy improved) rather than raw before/after data.',
  CANONICAL_CHANGE_OUTCOME_CLASSIFICATION:
    'Changes must authoritatively distinguish IMPROVED, DEGRADED, ADDED, REMOVED, CHANGED, and STABLE from backend comparison.',
  RESTRAINED_SEMANTIC_CHANGE_BADGES:
    'Change outcome badges strictly adhere to semantic color palette (#178A68 for improved, #C24D57 for degraded, #5F625F for neutral) with zero rainbow styling.',
  INTELLIGENT_WHAT_CHANGED_INTERPRETATION:
    'What Changed provides an intelligent narrative interpretation of what happened rather than raw diff logs.',
  EXPLAIN_CONSEQUENCE_OVER_MECHANICS:
    'Why It Matters explains defensive consequences and operational posture strengthening rather than simplistic generic descriptions.',
  COMPACT_SUMMARY_BEFORE_EVIDENCE:
    'Displays structured compact state transitions and authoritative policy summaries before raw evidence.',
  COLLAPSIBLE_RAW_POLICY_EVIDENCE:
    'Raw policy text is progressively disclosed inside collapsible evidence panels so summary precedes raw text.',
  EVIDENCE_LINEAGE_STRIP_TRACEABILITY:
    'Lineage strip renders chronological step progression with snapshot identifiers and verification timestamps.',
  ANTI_OVERCLAIMING_SECURITY_BOUNDARY:
    'Change presentation explicitly distinguishes defensive posture improvement from an absolute security guarantee, defining what is and is not established.',
  AUTHORITATIVE_BACKEND_CHANGE_CONTRACT:
    'Change conclusions, classifications, and derived summaries are authored by backend comparisons, never manufactured by React.',
  NO_AUTOMATIC_DOMAIN_CAPTURE:
    '/workspace must not automatically open a single domain for a returning user who has multiple monitored domains.',
  CROSS_DOMAIN_INTELLIGENCE_SURFACE:
    '/workspace serves as the cross-domain intelligence surface answering what Nebula knows across all monitored infrastructure.',
  AUTHORITATIVE_SNAPSHOT_AGGREGATION:
    'Cross-domain intelligence is aggregated strictly from authoritative verified snapshots, never heuristic client guessing.',
  QUIET_STATE_IS_PREMIER_FEATURE:
    'Silence and stability ("No significant changes detected") is a first-class successful intelligence outcome.',
  ONE_CLICK_DOMAIN_NAVIGATION:
    'Navigating from cross-domain intelligence into an individual domain workspace is strictly 1 click away.',
  NO_CROSS_DOMAIN_DATA_CONTAMINATION:
    'No domain fact, finding, or snapshot can appear to belong to another domain.',
  NO_GREETING_CHATBOT_THEATER:
    'Landing communicates directly and objectively as an expert briefing without personality theater or chatbot greetings.',
  EXPLICIT_VERIFICATION_TRANSPARENCY:
    'When understanding is executing, communicate active verification honestly without pretending state is static.',
  RESTRAINED_SURFACE_HIERARCHY:
    'Visual authority adheres strictly to WX-1017 tokens (Canvas #F7F7F5, Hero #FFFFFF, Metadata #F4F4F1, Borders #E1E1DC).',
  CANONICAL_WORKSPACE_CONVERGENCE:
    'The landing briefing consumes canonical Workspace truth preserving ONE_UNDERSTANDING_ONE_WORKSPACE_STATE.',
  TIMELINE_IS_CHRONOLOGICAL:
    'Changes timeline is strictly ordered newest to oldest by authoritative event timestamps.',
  TIMELINE_USES_CURSOR_AUTHORITY:
    'Infinite scrolling uses cursor-based pagination from backend without client-side synthetic gaps.',
  NO_DUPLICATE_TIMELINE_ENTRIES:
    'Cursor transitions and infinite query pages must deduplicate timeline items deterministically.',
  NO_GAPS_WITHOUT_EXPLICIT_BACKEND_BOUNDARY:
    'No temporal gaps may exist in timeline presentation without explicit backend demarcation.',
  ORIGIN_REPRESENTS_TRUE_FIRST_SNAPSHOT:
    'Infrastructure Origin Seal is rendered strictly when backend confirms no earlier historical cursor exists.',
  CURRENT_STATE_REMAINS_DISTINCT_FROM_HISTORY:
    'Current active state is clearly delineated from historical change archive entries.',
  CHANGE_TIMESTAMP_IS_AUTHORITATIVE:
    'Timestamps and epochs reflect authoritative backend detection dates, never frontend render times.',
  DOMAIN_CONTEXT_IS_PRESERVED:
    'Multi-domain and single-domain filtering preserves isolated domain lineage and identifiers.',
  TIMELINE_FILTERS_DO_NOT_CREATE_NEW_TRUTH:
    'Filtering by domain or category queries the canonical timeline without synthesizing altered conclusions.',
  HISTORICAL_DENSITY_DOES_NOT_REMOVE_MEANING:
    'Progressive density increases compactness for older history while preserving full meaning and inspectability.',
  NO_SILENT_HISTORY_TRUNCATION:
    'If backend has more history, UI must never falsely imply currently loaded items represent complete archive.',
} as const;
