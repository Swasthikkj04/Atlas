import { Injectable } from '@nestjs/common';
import {
  CertificateExpiryTier,
  HstsHygieneTier,
  NormalizedCertificateObservation,
  NormalizedHstsObservation,
  NormalizedTlsObservation,
  TlsIngressPostureAssessment,
  TlsProtocolTier,
} from '../contracts/tls-hygiene-security.interface';

@Injectable()
export class TlsHygieneAnalyzerService {
  /**
   * Evaluates TLS protocol negotiation.
   */
  public analyzeTlsProtocol(
    protocol?: string | null,
    cipherSuite?: string | null,
  ): NormalizedTlsObservation | null {
    if (!protocol) {
      return null;
    }

    const normProto = protocol.trim();
    let protocolTier: TlsProtocolTier = 'STANDARD_SUPPORTED';
    let isWeakProtocol = false;
    let supportsTls13 = false;

    if (
      normProto === 'TLSv1' ||
      normProto === 'TLSv1.0' ||
      normProto === 'TLSv1.1' ||
      normProto === 'SSLv3' ||
      normProto === 'SSLv2'
    ) {
      protocolTier = 'DEPRECATED_UNSAFE';
      isWeakProtocol = true;
    } else if (normProto === 'TLSv1.3') {
      protocolTier = 'MODERN_OPTIMAL';
      supportsTls13 = true;
    } else {
      protocolTier = 'STANDARD_SUPPORTED';
    }

    return {
      protocol: normProto,
      protocolTier,
      cipherSuite: cipherSuite || undefined,
      isWeakProtocol,
      supportsTls13,
      observationTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Checks whether a target domain name matches a given SAN or common name pattern (handling wildcards).
   */
  public matchesDomainPattern(pattern: string, domain: string): boolean {
    if (!pattern || !domain) return false;
    const cleanPattern = pattern.toLowerCase().trim();
    const cleanDomain = domain.toLowerCase().trim();

    if (cleanPattern === cleanDomain) {
      return true;
    }

    if (cleanPattern.startsWith('*.')) {
      const wildcardSuffix = cleanPattern.slice(2);
      // Wildcard *.example.com matches sub.example.com
      const domainParts = cleanDomain.split('.');
      if (domainParts.length >= 2) {
        const domainBase = domainParts.slice(1).join('.');
        return domainBase === wildcardSuffix;
      }
    }

    return false;
  }

  /**
   * Evaluates certificate validity, expiry horizon, and SAN coverage.
   */
  public analyzeCertificate(
    sslData: any,
    targetDomain?: string,
  ): NormalizedCertificateObservation | null {
    if (!sslData) {
      return null;
    }

    const validTo = sslData.validTo || sslData.valid_to;
    const validFrom =
      sslData.validFrom || sslData.valid_from || new Date().toISOString();
    const subject =
      sslData.subject || sslData.commonName || targetDomain || 'Unknown';
    const issuer = sslData.issuer || 'Unknown';
    const isSelfSigned = !!(
      sslData.selfSigned ||
      sslData.isSelfSigned ||
      (issuer && subject && issuer === subject)
    );

    let daysRemaining =
      typeof sslData.daysRemaining === 'number' ? sslData.daysRemaining : 90;

    if (validTo && typeof sslData.daysRemaining !== 'number') {
      const expiryDate = new Date(validTo).getTime();
      const now = Date.now();
      daysRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    }

    let expiryTier: CertificateExpiryTier = 'HEALTHY';
    if (daysRemaining <= 0) {
      expiryTier = 'EXPIRED';
    } else if (daysRemaining <= 7) {
      expiryTier = 'URGENT_EXPIRY';
    } else if (daysRemaining <= 30) {
      expiryTier = 'UPCOMING_EXPIRY';
    } else {
      expiryTier = 'HEALTHY';
    }

    const rawSans: string[] = Array.isArray(sslData.subjectAltNames)
      ? sslData.subjectAltNames
      : Array.isArray(sslData.san)
        ? sslData.san
        : [];

    const subjectAltNames = rawSans
      .map((s) => String(s).trim())
      .filter(Boolean);

    let sanCoverageMatchesDomain = true;
    if (targetDomain && subjectAltNames.length > 0) {
      sanCoverageMatchesDomain = subjectAltNames.some((pattern) =>
        this.matchesDomainPattern(pattern, targetDomain),
      );
    } else if (targetDomain && sslData.commonName) {
      sanCoverageMatchesDomain = this.matchesDomainPattern(
        sslData.commonName,
        targetDomain,
      );
    }

    return {
      subject,
      issuer,
      validFrom: String(validFrom),
      validTo: String(validTo || ''),
      daysRemaining,
      expiryTier,
      isSelfSigned,
      subjectAltNames,
      sanCoverageMatchesDomain,
      serialNumberRedacted: sslData.serialNumber
        ? '[REDACTED_SERIAL]'
        : undefined,
    };
  }

  /**
   * Evaluates HTTP Strict Transport Security (HSTS) configuration.
   */
  public analyzeHsts(
    headers?: Record<string, any> | null,
    isHttps: boolean = true,
  ): NormalizedHstsObservation {
    if (!headers || !isHttps) {
      return {
        present: false,
        includeSubDomains: false,
        preload: false,
        hygieneTier: 'MISSING',
      };
    }

    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string') {
        normalizedHeaders[k.toLowerCase()] = v;
      }
    }

    const rawHeader = normalizedHeaders['strict-transport-security'];
    if (!rawHeader) {
      return {
        present: false,
        includeSubDomains: false,
        preload: false,
        hygieneTier: 'MISSING',
      };
    }

    const maxAgeMatch = /max-age\s*=\s*(\d+)/i.exec(rawHeader);
    const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    const includeSubDomains = /includesubdomains/i.test(rawHeader);
    const preload = /preload/i.test(rawHeader);

    // Standard requirement: max-age >= 15552000 (180 days)
    // Preload requirement: max-age >= 31536000 (1 year), includeSubDomains, preload
    let hygieneTier: HstsHygieneTier = 'STANDARD';
    if (maxAgeSeconds < 15552000) {
      hygieneTier = 'SUBOPTIMAL_MAX_AGE';
    } else if (maxAgeSeconds >= 31536000 && includeSubDomains && preload) {
      hygieneTier = 'PRELOAD_READY';
    } else {
      hygieneTier = 'STANDARD';
    }

    return {
      present: true,
      rawHeader,
      maxAgeSeconds,
      includeSubDomains,
      preload,
      hygieneTier,
    };
  }

  /**
   * Synthesizes overall TLS Ingress Posture Assessment.
   */
  public assessIngressPosture(
    domain: string,
    sslData?: any,
    httpData?: any,
    snapshotId?: string,
  ): TlsIngressPostureAssessment {
    const tls = this.analyzeTlsProtocol(
      sslData?.protocol,
      sslData?.cipherSuite,
    );
    const certificate = this.analyzeCertificate(sslData, domain);

    const headers = httpData?.finalResponse?.headers || httpData?.headers;
    const isHttps = httpData?.finalResponse
      ? httpData.finalResponse.isHttps
      : httpData?.protocol === 'https';

    const hsts = this.analyzeHsts(headers, isHttps);

    let score = 100;
    if (tls?.isWeakProtocol) score -= 40;
    if (tls?.protocolTier === 'STANDARD_SUPPORTED') score -= 10; // Upgrade opportunity
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

    let summary = `Ingress TLS & Transport Security posture evaluated (Score: ${overallHygieneScore}/100).`;
    if (isCompliant) {
      summary +=
        ' All core cryptographic standards and certificate hygiene checks passed.';
    } else {
      summary +=
        ' Identified cryptographic hygiene or certificate configuration gaps.';
    }

    return {
      domain,
      snapshotId,
      tls: tls || undefined,
      certificate: certificate || undefined,
      hsts,
      overallHygieneScore,
      isCompliant,
      summary,
    };
  }
}
