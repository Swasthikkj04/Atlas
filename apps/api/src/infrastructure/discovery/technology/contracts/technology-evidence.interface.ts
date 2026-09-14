import { TechnologyConfidenceLevel } from './technology-confidence.enum';

export type TechnologyEvidenceSourceType =
  | 'DNS'
  | 'HTTP'
  | 'TLS'
  | 'HTML'
  | 'NETWORK'
  | 'HEADER'
  | 'COOKIE'
  | 'BEHAVIORAL'
  | 'WIRE_BEHAVIOR';

export interface TechnologyEvidence {
  readonly sourceType: TechnologyEvidenceSourceType;
  readonly source: string;
  readonly indicator: string;
  readonly observedValue?: string;
  readonly details?: string;
  readonly confidence?: TechnologyConfidenceLevel;
}
