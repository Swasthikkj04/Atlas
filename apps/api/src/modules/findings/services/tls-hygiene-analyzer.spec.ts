import { TlsHygieneAnalyzerService } from './tls-hygiene-analyzer.service';

describe('TlsHygieneAnalyzerService (S3-001)', () => {
  let service: TlsHygieneAnalyzerService;

  beforeEach(() => {
    service = new TlsHygieneAnalyzerService();
  });

  describe('analyzeTlsProtocol', () => {
    it('correctly classifies deprecated TLSv1.0 as DEPRECATED_UNSAFE', () => {
      const result = service.analyzeTlsProtocol(
        'TLSv1.0',
        'ECDHE-RSA-AES128-SHA',
      );
      expect(result).not.toBeNull();
      expect(result?.protocolTier).toBe('DEPRECATED_UNSAFE');
      expect(result?.isWeakProtocol).toBe(true);
      expect(result?.supportsTls13).toBe(false);
    });

    it('correctly classifies TLSv1.2 as STANDARD_SUPPORTED', () => {
      const result = service.analyzeTlsProtocol(
        'TLSv1.2',
        'ECDHE-RSA-AES256-GCM-SHA384',
      );
      expect(result).not.toBeNull();
      expect(result?.protocolTier).toBe('STANDARD_SUPPORTED');
      expect(result?.isWeakProtocol).toBe(false);
      expect(result?.supportsTls13).toBe(false);
    });

    it('correctly classifies TLSv1.3 as MODERN_OPTIMAL', () => {
      const result = service.analyzeTlsProtocol(
        'TLSv1.3',
        'TLS_AES_256_GCM_SHA384',
      );
      expect(result).not.toBeNull();
      expect(result?.protocolTier).toBe('MODERN_OPTIMAL');
      expect(result?.isWeakProtocol).toBe(false);
      expect(result?.supportsTls13).toBe(true);
    });
  });

  describe('analyzeCertificate & SAN Matching', () => {
    it('correctly handles wildcard SAN matching (*.example.com for sub.example.com)', () => {
      const ssl = {
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        subject: '*.example.com',
        issuer: "Let's Encrypt Authority X3",
        subjectAltNames: ['*.example.com', 'example.com'],
        isSelfSigned: false,
      };

      const cert = service.analyzeCertificate(ssl, 'api.example.com');
      expect(cert).not.toBeNull();
      expect(cert?.sanCoverageMatchesDomain).toBe(true);
      expect(cert?.expiryTier).toBe('HEALTHY');
    });

    it('flags SAN coverage mismatch when domain is not in SAN list', () => {
      const ssl = {
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'other-domain.com',
        issuer: 'DigiCert Global Root CA',
        subjectAltNames: ['other-domain.com', 'www.other-domain.com'],
        isSelfSigned: false,
      };

      const cert = service.analyzeCertificate(ssl, 'my-app.io');
      expect(cert).not.toBeNull();
      expect(cert?.sanCoverageMatchesDomain).toBe(false);
    });

    it('flags urgent expiry when days remaining <= 7', () => {
      const ssl = {
        validTo: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'expiring.com',
        issuer: "Let's Encrypt",
        daysRemaining: 4,
        subjectAltNames: ['expiring.com'],
      };

      const cert = service.analyzeCertificate(ssl, 'expiring.com');
      expect(cert?.expiryTier).toBe('URGENT_EXPIRY');
    });
  });

  describe('analyzeHsts', () => {
    it('evaluates PRELOAD_READY HSTS configuration', () => {
      const headers = {
        'strict-transport-security':
          'max-age=31536000; includeSubDomains; preload',
      };
      const hsts = service.analyzeHsts(headers, true);
      expect(hsts.present).toBe(true);
      expect(hsts.maxAgeSeconds).toBe(31536000);
      expect(hsts.includeSubDomains).toBe(true);
      expect(hsts.preload).toBe(true);
      expect(hsts.hygieneTier).toBe('PRELOAD_READY');
    });

    it('flags SUBOPTIMAL_MAX_AGE for short durations (< 180 days)', () => {
      const headers = {
        'strict-transport-security': 'max-age=86400',
      };
      const hsts = service.analyzeHsts(headers, true);
      expect(hsts.present).toBe(true);
      expect(hsts.hygieneTier).toBe('SUBOPTIMAL_MAX_AGE');
    });

    it('returns MISSING when not on HTTPS or header absent', () => {
      const hsts = service.analyzeHsts({}, true);
      expect(hsts.present).toBe(false);
      expect(hsts.hygieneTier).toBe('MISSING');
    });
  });

  describe('assessIngressPosture', () => {
    it('synthesizes high hygiene score for modern compliant endpoint', () => {
      const ssl = {
        protocol: 'TLSv1.3',
        cipherSuite: 'TLS_AES_256_GCM_SHA384',
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 90,
        subject: 'modern-app.com',
        issuer: "Let's Encrypt",
        subjectAltNames: ['modern-app.com'],
      };
      const http = {
        finalResponse: {
          isHttps: true,
          headers: {
            'strict-transport-security':
              'max-age=31536000; includeSubDomains; preload',
          },
        },
      };

      const posture = service.assessIngressPosture(
        'modern-app.com',
        ssl,
        http,
        'snap-1',
      );
      expect(posture.overallHygieneScore).toBe(100);
      expect(posture.isCompliant).toBe(true);
    });
  });
});
