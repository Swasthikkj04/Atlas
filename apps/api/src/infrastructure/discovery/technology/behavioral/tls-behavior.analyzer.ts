import { Injectable, Logger } from '@nestjs/common';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  BehavioralSignal,
} from '../contracts';

/**
 * T22-D — TLS Behavioral Evidence Analyzer
 *
 * Correlates TLS handshake characteristics and certificate properties without creating a competing TLS subsystem:
 * - Certificate authority and issuer profiling
 * - Managed edge CDN certificate distribution characteristics
 * - Protocol negotiation and ALPN hints
 * - Anti-overreach boundaries (e.g. AWS certificate does not prove EC2 origin compute)
 */
@Injectable()
export class TlsBehaviorAnalyzer {
  private readonly logger = new Logger(TlsBehaviorAnalyzer.name);

  analyze(context: TechnologyDetectionContext): BehavioralSignal[] {
    const signals: BehavioralSignal[] = [];
    const ssl = context.ssl;

    if (!ssl || !ssl.supported || !ssl.certificate) {
      return signals;
    }

    const cert = ssl.certificate;
    const issuer = cert.issuer || '';
    const subject = cert.subject || '';
    const san = cert.subjectAltName || '';

    // 1. Cloudflare Managed Edge TLS Certificate Authority
    if (
      context.hasCertIssuer(/cloudflare/i) ||
      context.hasCertSan(/cloudflare/i) ||
      issuer.toLowerCase().includes('cloudflare')
    ) {
      signals.push({
        id: `sig-tls-cloudflare-${context.domainName}`,
        category: 'TLS',
        type: 'TLS_CERT_ISSUER_FINGERPRINT',
        observationId: `obs-tls-cf-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'MEDIUM',
        description: `Edge TLS termination certificate issued by Cloudflare Certificate Authority (${issuer})`,
        evidenceReferences: [
          `TLS Certificate Issuer: ${issuer}`,
          `TLS Certificate Subject: ${subject}`,
        ],
        targetTechnologyId: 'tech-cloudflare',
        targetTechnologyName: 'Cloudflare',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Delivery & Anycast Proxy',
        observationState: 'OBSERVED',
        observedWireEvidence: `TLS Issuer: ${issuer}`,
        metadata: { issuer, subject, san },
      });
    }

    // 2. Amazon Trust Services / AWS Certificate Manager (ACM) Managed TLS
    if (
      context.hasCertIssuer(/amazon/i) ||
      issuer.toLowerCase().includes('amazon') ||
      issuer.toLowerCase().includes('aws')
    ) {
      const hasCfHeader =
        context.hasHeader('x-amz-cf-id') ||
        context.hasHeaderContaining('via', 'cloudfront');
      signals.push({
        id: `sig-tls-aws-${context.domainName}`,
        category: 'TLS',
        type: 'TLS_CERT_ISSUER_FINGERPRINT',
        observationId: `obs-tls-aws-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description: `Edge TLS certificate provisioned via Amazon Trust Services (${issuer})`,
        evidenceReferences: [
          `TLS Certificate Issuer: ${issuer}`,
          `TLS Certificate Subject: ${subject}`,
        ],
        targetTechnologyId: hasCfHeader ? 'tech-cloudfront' : 'tech-aws',
        targetTechnologyName: hasCfHeader
          ? 'AWS CloudFront'
          : 'Amazon Web Services (AWS)',
        targetCategory: hasCfHeader
          ? TechnologyCategory.CDN_EDGE
          : TechnologyCategory.CLOUD_INFRASTRUCTURE,
        targetLayer: hasCfHeader ? 'EDGE' : 'GATEWAY',
        targetRole: hasCfHeader
          ? 'Content Delivery Network / Edge Cache'
          : 'Cloud Ingress & Infrastructure',
        observationState: 'OBSERVED',
        observedWireEvidence: `TLS Issuer: ${issuer}`,
        metadata: { issuer, subject, san, isAmazonTrust: true },
      });
    }

    // 3. Fastly / Managed CDN TLS Certificate Authority
    if (
      context.hasCertIssuer(/fastly/i) ||
      san.toLowerCase().includes('fastly')
    ) {
      signals.push({
        id: `sig-tls-fastly-${context.domainName}`,
        category: 'TLS',
        type: 'TLS_CERT_ISSUER_FINGERPRINT',
        observationId: `obs-tls-fastly-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description: `Edge TLS certificate provisioned through Fastly Managed CDN infrastructure (${issuer})`,
        evidenceReferences: [`TLS Certificate Issuer: ${issuer}`],
        targetTechnologyId: 'tech-fastly',
        targetTechnologyName: 'Fastly',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Cloud / CDN',
        observationState: 'OBSERVED',
        observedWireEvidence: `TLS Issuer: ${issuer}`,
        metadata: { issuer, san },
      });
    }

    // 4. Microsoft Azure TLS Certificate Authority
    if (
      context.hasCertIssuer(/microsoft azure|microsoft corporation/i) ||
      san.toLowerCase().includes('azurefd.net') ||
      san.toLowerCase().includes('azureedge.net') ||
      san.toLowerCase().includes('azurewebsites.net')
    ) {
      const hasFdSignal =
        context.hasHeader('x-azure-ref') ||
        context.hasHeader('x-azure-fdid') ||
        san.toLowerCase().includes('azurefd.net') ||
        san.toLowerCase().includes('azureedge.net');

      signals.push({
        id: `sig-tls-azure-${context.domainName}`,
        category: 'TLS',
        type: 'TLS_CERT_ISSUER_FINGERPRINT',
        observationId: `obs-tls-azure-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'HIGH',
        description: `Microsoft Azure TLS Certificate Authority infrastructure observed (${issuer || 'Microsoft Azure TLS'})`,
        evidenceReferences: [
          `TLS Certificate Issuer: ${issuer || 'Microsoft Azure CA'}`,
        ],
        targetTechnologyId: hasFdSignal ? 'tech-azure-frontdoor' : 'tech-azure',
        targetTechnologyName: hasFdSignal
          ? 'Azure Front Door'
          : 'Microsoft Azure',
        targetCategory: hasFdSignal
          ? TechnologyCategory.CDN_EDGE
          : TechnologyCategory.CLOUD_INFRASTRUCTURE,
        targetLayer: hasFdSignal ? 'EDGE' : 'GATEWAY',
        targetRole: hasFdSignal
          ? 'Edge Delivery / Global Ingress'
          : 'Cloud Infrastructure & Managed Services',
        observationState: 'OBSERVED',
        observedWireEvidence: `TLS Issuer: ${issuer || 'Microsoft Azure TLS'}`,
        metadata: { issuer, subject, san, isAzureTrust: true },
      });
    }

    // 5. TLS Protocol Version & Cipher Suite Fingerprint (H2-003)
    const tlsProtocol = ssl.protocol;
    const tlsCipher = ssl.cipher;
    if (tlsProtocol || tlsCipher) {
      signals.push({
        id: `sig-tls-handshake-${context.domainName}`,
        category: 'TLS',
        type: 'TLS_HANDSHAKE_FINGERPRINT',
        observationId: `obs-tls-handshake-${context.domainName}`,
        strength: 0.8,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description: `Negotiated TLS security parameters: Protocol=${tlsProtocol || 'TLS'}, Cipher=${tlsCipher || 'Standard'}`,
        evidenceReferences: [
          tlsProtocol ? `TLS Protocol: ${tlsProtocol}` : '',
          tlsCipher ? `TLS Cipher: ${tlsCipher}` : '',
        ].filter(Boolean),
        observationState: 'OBSERVED',
        observedWireEvidence: `TLS: ${tlsProtocol || 'v1.3'} / ${tlsCipher || 'GCM'}`,
        metadata: { protocol: tlsProtocol, cipher: tlsCipher },
      });
    }

    // 6. Let's Encrypt / General Certificate Authority Profile (H2-003 / Anti-Overreach H2-006)
    if (
      context.hasCertIssuer(/let's encrypt|isrg/i) ||
      issuer.toLowerCase().includes("let's encrypt")
    ) {
      signals.push({
        id: `sig-tls-letsencrypt-${context.domainName}`,
        category: 'TLS',
        type: 'TLS_CERT_ISSUER_FINGERPRINT',
        observationId: `obs-tls-le-${context.domainName}`,
        strength: 0.75,
        confidence: 0.65,
        confidenceLevel: 'MEDIUM',
        description: `Automated public TLS certificate issued via Let's Encrypt / ISRG Root CA (${issuer})`,
        evidenceReferences: [`TLS Certificate Issuer: ${issuer}`],
        observationState: 'OBSERVED',
        observedWireEvidence: `TLS Issuer: ${issuer}`,
        metadata: { issuer, isLetsEncrypt: true },
      });
    }

    return signals;
  }
}
