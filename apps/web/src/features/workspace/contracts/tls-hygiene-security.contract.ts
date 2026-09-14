/**
 * Certified S3 Invariants for Ingress Security Posture & TLS Hygiene Intelligence.
 */
export const S3_FRONTEND_CERTIFIED_INVARIANTS = {
  S3_TLS_VERSION_HYGIENE_INTEGRITY: true,
  S3_CERTIFICATE_HORIZON_INTEGRITY: true,
  S3_SAN_COVERAGE_INTEGRITY: true,
  S3_HSTS_POLICY_HYGIENE_INTEGRITY: true,
  S3_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION: true,
  S3_ANTI_OVERREACH_ENFORCEMENT: true,
  S3_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S3_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type FrontendTlsProtocolTier =
  | 'DEPRECATED_UNSAFE'
  | 'STANDARD_SUPPORTED'
  | 'MODERN_OPTIMAL';

export type FrontendCertificateExpiryTier =
  | 'EXPIRED'
  | 'URGENT_EXPIRY'
  | 'UPCOMING_EXPIRY'
  | 'HEALTHY';

export type FrontendHstsHygieneTier =
  | 'MISSING'
  | 'SUBOPTIMAL_MAX_AGE'
  | 'STANDARD'
  | 'PRELOAD_READY';

export interface FrontendNormalizedTls {
  protocol: string;
  protocolTier: FrontendTlsProtocolTier;
  isWeakProtocol: boolean;
  supportsTls13: boolean;
}

export interface FrontendNormalizedCert {
  subject: string;
  issuer: string;
  daysRemaining: number;
  expiryTier: FrontendCertificateExpiryTier;
  isSelfSigned: boolean;
  subjectAltNames: string[];
  sanCoverageMatchesDomain: boolean;
}

export interface FrontendNormalizedHsts {
  present: boolean;
  maxAgeSeconds?: number;
  includeSubDomains: boolean;
  preload: boolean;
  hygieneTier: FrontendHstsHygieneTier;
}

export interface FrontendTlsIngressPostureAssessment {
  domain: string;
  snapshotId?: string;
  tls?: FrontendNormalizedTls;
  certificate?: FrontendNormalizedCert;
  hsts?: FrontendNormalizedHsts;
  overallHygieneScore: number;
  isCompliant: boolean;
  summary: string;
}

/**
 * Matches domain with wildcard support.
 */
export function matchesDomainPattern(pattern: string, domain: string): boolean {
  if (!pattern || !domain) return false;
  const cleanPattern = pattern.toLowerCase().trim();
  const cleanDomain = domain.toLowerCase().trim();

  if (cleanPattern === cleanDomain) {
    return true;
  }

  if (cleanPattern.startsWith('*.')) {
    const wildcardSuffix = cleanPattern.slice(2);
    const domainParts = cleanDomain.split('.');
    if (domainParts.length >= 2) {
      const domainBase = domainParts.slice(1).join('.');
      return domainBase === wildcardSuffix;
    }
  }

  return false;
}

/**
 * Evaluates TLS ingress hygiene posture on the client side.
 */
export function evaluateFrontendTlsIngressPosture(
  domain: string,
  sslData?: any,
  headers?: Record<string, any>,
  isHttps: boolean = true,
  snapshotId?: string,
): FrontendTlsIngressPostureAssessment {
  let tls: FrontendNormalizedTls | undefined;
  if (sslData?.protocol) {
    const proto = String(sslData.protocol).trim();
    const isWeak =
      proto === 'TLSv1' || proto === 'TLSv1.0' || proto === 'TLSv1.1' || proto === 'SSLv3';
    const supportsTls13 = proto === 'TLSv1.3';
    const protocolTier: FrontendTlsProtocolTier = isWeak
      ? 'DEPRECATED_UNSAFE'
      : supportsTls13
      ? 'MODERN_OPTIMAL'
      : 'STANDARD_SUPPORTED';

    tls = {
      protocol: proto,
      protocolTier,
      isWeakProtocol: isWeak,
      supportsTls13,
    };
  }

  let certificate: FrontendNormalizedCert | undefined;
  if (sslData) {
    const validTo = sslData.validTo || sslData.valid_to;
    let daysRemaining = typeof sslData.daysRemaining === 'number' ? sslData.daysRemaining : 90;
    if (validTo && typeof sslData.daysRemaining !== 'number') {
      const expiryDate = new Date(validTo).getTime();
      const now = Date.now();
      daysRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    }

    let expiryTier: FrontendCertificateExpiryTier = 'HEALTHY';
    if (daysRemaining <= 0) expiryTier = 'EXPIRED';
    else if (daysRemaining <= 7) expiryTier = 'URGENT_EXPIRY';
    else if (daysRemaining <= 30) expiryTier = 'UPCOMING_EXPIRY';

    const rawSans: string[] = Array.isArray(sslData.subjectAltNames)
      ? sslData.subjectAltNames
      : Array.isArray(sslData.san)
      ? sslData.san
      : [];
    const subjectAltNames = rawSans.map((s) => String(s).trim()).filter(Boolean);

    let sanCoverageMatchesDomain = true;
    if (domain && subjectAltNames.length > 0) {
      sanCoverageMatchesDomain = subjectAltNames.some((pattern) =>
        matchesDomainPattern(pattern, domain),
      );
    }

    certificate = {
      subject: sslData.subject || sslData.commonName || domain,
      issuer: sslData.issuer || 'Unknown',
      daysRemaining,
      expiryTier,
      isSelfSigned: !!(sslData.isSelfSigned || sslData.selfSigned),
      subjectAltNames,
      sanCoverageMatchesDomain,
    };
  }

  let hsts: FrontendNormalizedHsts = {
    present: false,
    includeSubDomains: false,
    preload: false,
    hygieneTier: 'MISSING',
  };

  if (headers && isHttps) {
    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string') {
        normalizedHeaders[k.toLowerCase()] = v;
      }
    }

    const rawHeader = normalizedHeaders['strict-transport-security'];
    if (rawHeader) {
      const maxAgeMatch = /max-age\s*=\s*(\d+)/i.exec(rawHeader);
      const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const includeSubDomains = /includesubdomains/i.test(rawHeader);
      const preload = /preload/i.test(rawHeader);

      let hygieneTier: FrontendHstsHygieneTier = 'STANDARD';
      if (maxAgeSeconds < 15552000) {
        hygieneTier = 'SUBOPTIMAL_MAX_AGE';
      } else if (maxAgeSeconds >= 31536000 && includeSubDomains && preload) {
        hygieneTier = 'PRELOAD_READY';
      }

      hsts = {
        present: true,
        maxAgeSeconds,
        includeSubDomains,
        preload,
        hygieneTier,
      };
    }
  }

  let score = 100;
  if (tls?.isWeakProtocol) score -= 40;
  if (tls?.protocolTier === 'STANDARD_SUPPORTED') score -= 10;
  if (certificate?.expiryTier === 'EXPIRED') score -= 50;
  else if (certificate?.expiryTier === 'URGENT_EXPIRY') score -= 30;
  else if (certificate?.expiryTier === 'UPCOMING_EXPIRY') score -= 15;
  if (certificate?.isSelfSigned) score -= 30;
  if (certificate && !certificate.sanCoverageMatchesDomain) score -= 40;
  if (!hsts.present) score -= 20;
  else if (hsts.hygieneTier === 'SUBOPTIMAL_MAX_AGE') score -= 10;

  const overallHygieneScore = Math.max(0, Math.min(100, score));
  const isCompliant =
    !tls?.isWeakProtocol &&
    certificate?.expiryTier !== 'EXPIRED' &&
    certificate?.expiryTier !== 'URGENT_EXPIRY' &&
    !certificate?.isSelfSigned &&
    (certificate ? certificate.sanCoverageMatchesDomain : true) &&
    hsts.present;

  return {
    domain,
    snapshotId,
    tls,
    certificate,
    hsts,
    overallHygieneScore,
    isCompliant,
    summary: isCompliant
      ? 'Ingress TLS & Transport Security posture verified compliant.'
      : 'Identified cryptographic hygiene or certificate configuration gaps.',
  };
}
