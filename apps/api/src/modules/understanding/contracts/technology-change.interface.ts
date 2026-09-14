import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';
import { TechnologyEvidence } from '../../../infrastructure/discovery/technology/contracts';

/**
 * H3: Authoritative Infrastructure Change Taxonomy & Forensic Classification
 */
export enum TechnologyChangeClassification {
  // 1. Technology Lifecycle (T1–T30)
  TECHNOLOGY_ADDED = 'TECHNOLOGY_ADDED',
  TECHNOLOGY_REMOVED = 'TECHNOLOGY_REMOVED',
  TECHNOLOGY_CHANGED = 'TECHNOLOGY_CHANGED',
  VERSION_CHANGED = 'VERSION_CHANGED',

  // 2. Topology & Ingress Request Path (H1)
  HOP_ADDED = 'HOP_ADDED',
  HOP_REMOVED = 'HOP_REMOVED',
  ARCHITECTURE_PATH_CHANGED = 'ARCHITECTURE_PATH_CHANGED',
  ARCHITECTURE_ROLE_CHANGED = 'ARCHITECTURE_ROLE_CHANGED',
  ARCHITECTURE_LAYER_CHANGED = 'ARCHITECTURE_LAYER_CHANGED',
  GATEWAY_MIGRATED = 'GATEWAY_MIGRATED',
  FRAMEWORK_MIGRATED = 'FRAMEWORK_MIGRATED',
  EDGE_LAYER_DRIFT = 'EDGE_LAYER_DRIFT',
  RELATIONSHIP_ADDED = 'RELATIONSHIP_ADDED',
  RELATIONSHIP_REMOVED = 'RELATIONSHIP_REMOVED',
  RELATIONSHIP_CHANGED = 'RELATIONSHIP_CHANGED',

  // 3. Deep Wire & Behavioral Changes (H2)
  HTTP_BEHAVIOR_CHANGED = 'HTTP_BEHAVIOR_CHANGED',
  TLS_CHANGED = 'TLS_CHANGED',
  DNS_CHANGED = 'DNS_CHANGED',
  COOKIE_SEMANTICS_CHANGED = 'COOKIE_SEMANTICS_CHANGED',
  ERROR_BEHAVIOR_CHANGED = 'ERROR_BEHAVIOR_CHANGED',

  // 4. Security Posture & Policy
  SECURITY_POSTURE_CHANGED = 'SECURITY_POSTURE_CHANGED',
  SECURITY_HEADER_ADDED = 'SECURITY_HEADER_ADDED',
  SECURITY_HEADER_REMOVED = 'SECURITY_HEADER_REMOVED',
  SECURITY_HEADER_CHANGED = 'SECURITY_HEADER_CHANGED',
  CERTIFICATE_EXPIRATION_CHANGED = 'CERTIFICATE_EXPIRATION_CHANGED',

  // 5. External Integrations
  INTEGRATION_ADDED = 'INTEGRATION_ADDED',
  INTEGRATION_REMOVED = 'INTEGRATION_REMOVED',

  // 6. Observability & Known Unknown Boundaries
  UNKNOWN_BECAME_OBSERVED = 'UNKNOWN_BECAME_OBSERVED',
  OBSERVED_BECAME_UNOBSERVED = 'OBSERVED_BECAME_UNOBSERVED',
  MASKED_BECAME_OBSERVED = 'MASKED_BECAME_OBSERVED',
  OBSERVED_BECAME_MASKED = 'OBSERVED_BECAME_MASKED',

  // 7. Evidence Lineage
  EVIDENCE_CHANGED = 'EVIDENCE_CHANGED',
}

export enum TechnologyChangeImpact {
  ARCHITECTURAL = 'ARCHITECTURAL',
  SECURITY = 'SECURITY',
  INTEGRATION = 'INTEGRATION',
  OBSERVABILITY = 'OBSERVABILITY',
  LIFECYCLE = 'LIFECYCLE',
  PERFORMANCE = 'PERFORMANCE',
}

export interface ForensicExplanation {
  readonly whatChanged: string;
  readonly whyWeBelieveIt: string;
  readonly whatItMeans: string;
  readonly whatWeCannotConclude: string;
  readonly impact: string;
  readonly attention?: string;
  readonly attentionRequired?: boolean;
}

export interface TechnologyDifference {
  classification: TechnologyChangeClassification;
  impact: TechnologyChangeImpact;
  module: FindingModule;
  category: FindingCategory;
  changeType: ChangeType;
  severity: ChangeSeverity;
  title: string;
  description: string;
  technologyId?: string;
  technologyName?: string;
  previousState?: any;
  currentState?: any;
  evidenceBefore?: string[];
  evidenceAfter?: string[];
  whatThisMeans?: string;
  whatThisDoesNotProve?: string;
  forensicExplanation?: ForensicExplanation;
  evidence?: TechnologyEvidence[];
}
