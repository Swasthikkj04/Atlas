export type SecurityPostureGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type SecurityPostureStatus =
  'HARDENED' | 'ATTENTION' | 'CRITICAL_RISK' | 'BASELINE';
export type SecurityPillarHealth =
  'SECURE' | 'ATTENTION' | 'CRITICAL' | 'UNAUDITED';

export interface SecurityPillarSummary {
  readonly id:
    | 'cookie_session'
    | 'data_leakage'
    | 'tls_transport'
    | 'content_security'
    | 'dns_mail'
    | 'http_transit'
    | 'perimeter_exposure';
  readonly name: string;
  readonly code: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7';
  readonly status: SecurityPillarHealth;
  readonly summary: string;
  readonly findingsCount: number;
  readonly signals: readonly string[];
}

export interface SecurityBriefHighlight {
  readonly id: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  readonly title: string;
  readonly description: string;
  readonly pillarCode?: string;
}

export interface SecurityBriefRecommendation {
  readonly id: string;
  readonly priority: 'P0' | 'P1' | 'P2';
  readonly title: string;
  readonly action: string;
  readonly rationale: string;
}

export interface SecurityBriefResult {
  readonly domainName: string;
  readonly posture: SecurityPostureStatus;
  readonly securityScore: number;
  readonly securityGrade: SecurityPostureGrade;
  readonly securitySummary: string;
  readonly highlights: readonly SecurityBriefHighlight[];
  readonly pillars: readonly SecurityPillarSummary[];
  readonly recommendations: readonly SecurityBriefRecommendation[];
  readonly verifiedAt: string;
}
