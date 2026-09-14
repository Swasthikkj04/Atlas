import { Severity } from '../enums/severity.enum';
import {
  FindingConfidence,
  RiskClassification,
} from './finding-result.interface';

/**
 * Certified S3 Invariants for Ingress Security Posture & TLS Hygiene Intelligence.
 */
export const S3_CERTIFIED_INVARIANTS = {
  S3_TLS_VERSION_HYGIENE_INTEGRITY: true,
  S3_CERTIFICATE_HORIZON_INTEGRITY: true,
  S3_SAN_COVERAGE_INTEGRITY: true,
  S3_HSTS_POLICY_HYGIENE_INTEGRITY: true,
  S3_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION: true,
  S3_ANTI_OVERREACH_ENFORCEMENT: true,
  S3_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S3_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type TlsProtocolTier =
  | 'DEPRECATED_UNSAFE' // TLSv1.0, TLSv1.1, SSLv3
  | 'STANDARD_SUPPORTED' // TLSv1.2
  | 'MODERN_OPTIMAL'; // TLSv1.3

export type CertificateExpiryTier =
  | 'EXPIRED' // <= 0 days
  | 'URGENT_EXPIRY' // <= 7 days
  | 'UPCOMING_EXPIRY' // <= 30 days
  | 'HEALTHY'; // > 30 days

export type HstsHygieneTier =
  'MISSING' | 'SUBOPTIMAL_MAX_AGE' | 'STANDARD' | 'PRELOAD_READY';

export interface NormalizedTlsObservation {
  protocol: string;
  protocolTier: TlsProtocolTier;
  cipherSuite?: string;
  keyExchange?: string;
  isWeakProtocol: boolean;
  supportsTls13: boolean;
  observationTimestamp: string;
}

export interface NormalizedCertificateObservation {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  expiryTier: CertificateExpiryTier;
  isSelfSigned: boolean;
  subjectAltNames: string[];
  sanCoverageMatchesDomain: boolean;
  serialNumberRedacted?: string;
}

export interface NormalizedHstsObservation {
  present: boolean;
  rawHeader?: string;
  maxAgeSeconds?: number;
  includeSubDomains: boolean;
  preload: boolean;
  hygieneTier: HstsHygieneTier;
}

export interface TlsIngressPostureAssessment {
  domain: string;
  snapshotId?: string;
  tls?: NormalizedTlsObservation;
  certificate?: NormalizedCertificateObservation;
  hsts?: NormalizedHstsObservation;
  overallHygieneScore: number; // 0 to 100
  isCompliant: boolean;
  summary: string;
}
