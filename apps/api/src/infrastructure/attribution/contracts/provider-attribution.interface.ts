export type InfrastructureRole =
  | 'HOSTING'
  | 'EDGE_CDN'
  | 'DNS'
  | 'WEB_SERVER'
  | 'APPLICATION';

export type AttributionDecision =
  | 'CONFIRMED'
  | 'STRONGLY_INFERRED'
  | 'INFERRED'
  | 'POSSIBLE'
  | 'UNKNOWN'
  | 'CONFLICTED';

export type AttributionConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INCONCLUSIVE';

export interface AttributionSignal {
  type: 'DNS' | 'HTTP' | 'IP_ASN' | 'TLS' | 'TECH';
  source: string;
  indicator: string;
  matched: boolean;
  weight: number;
  details?: string;
}

export interface CandidateProvider {
  provider: string;
  score: number;
  signals: string[];
}

export interface ProviderConflict {
  providerA: string;
  providerB: string;
  reason: string;
}

export interface ProviderAttributionRecord {
  role: InfrastructureRole;
  provider: string | null;
  decision: AttributionDecision;
  confidence: AttributionConfidence;
  signals: AttributionSignal[];
  candidateProviders: CandidateProvider[];
  conflicts: ProviderConflict[];
  explanation: string;
  observedAt?: string | Date;
  snapshotId?: string;
}

export interface InfrastructureAttributionMap {
  hosting: ProviderAttributionRecord;
  edgeCdn: ProviderAttributionRecord;
  dns: ProviderAttributionRecord;
  webServer: ProviderAttributionRecord;
  application: ProviderAttributionRecord;
}
