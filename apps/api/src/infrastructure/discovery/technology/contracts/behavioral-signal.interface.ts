import { TechnologyCategory, TechnologyConfidenceLevel } from './index';
import { ObservationState } from '../../contracts/evidence/observation.interface';

export type BehavioralSignalCategory =
  'HTTP' | 'COOKIE' | 'ERROR' | 'TLS' | 'TIMING';

export type BehavioralConfidencePosture =
  'DIRECT' | 'CORROBORATED' | 'CONSISTENT' | 'WEAK_SIGNAL' | 'UNKNOWN';

export type BehavioralSignatureType =
  | 'HEADER_ORDER_FINGERPRINT'
  | 'HEADER_CASING_FINGERPRINT'
  | 'CONNECTION_SEMANTICS_FINGERPRINT'
  | 'RANGE_HANDLING_FINGERPRINT'
  | 'COOKIE_SEMANTIC_FINGERPRINT'
  | 'COOKIE_PREFIX_FINGERPRINT'
  | 'TLS_HANDSHAKE_FINGERPRINT'
  | 'TLS_CERT_ISSUER_FINGERPRINT'
  | 'ERROR_TEMPLATE_FINGERPRINT'
  | 'PROTOCOL_QUIRK_FINGERPRINT'
  | 'TIMING_HEURISTIC_FINGERPRINT';

export interface BehavioralSignal {
  readonly id: string;
  readonly category: BehavioralSignalCategory;
  readonly type: BehavioralSignatureType | string;
  readonly observationId: string;
  readonly strength: number; // [0, 1]
  readonly confidence: number; // [0, 1]
  readonly confidenceLevel: TechnologyConfidenceLevel;
  readonly description: string;
  readonly evidenceReferences: string[];
  readonly targetTechnologyId?: string;
  readonly targetTechnologyName?: string;
  readonly targetCategory?: TechnologyCategory;
  readonly targetLayer?: string;
  readonly targetRole?: string;
  readonly observationState: ObservationState;
  readonly observedWireEvidence: string;
  readonly metadata?: Record<string, any>;
}

export interface BehavioralFingerprintResult {
  readonly signals: BehavioralSignal[];
  readonly evaluatedSignaturesCount: number;
  readonly matchedSignaturesCount: number;
  readonly posturesByTechnology?: Record<string, BehavioralConfidencePosture>;
}

export type BehavioralWireSignal = BehavioralSignal;
