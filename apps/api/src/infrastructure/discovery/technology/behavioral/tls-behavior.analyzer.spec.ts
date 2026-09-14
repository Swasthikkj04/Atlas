import { TlsBehaviorAnalyzer } from './tls-behavior.analyzer';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

describe('TlsBehaviorAnalyzer (T22-D — TLS Behavioral Evidence)', () => {
  let analyzer: TlsBehaviorAnalyzer;

  beforeEach(() => {
    analyzer = new TlsBehaviorAnalyzer();
  });

  it('extracts Cloudflare Certificate Authority from SSL certificate', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'cloudflare-tls.io',
      ssl: {
        reachable: true,
        supported: true,
        responseTimeMs: 25,
        certificate: {
          issuer: 'Cloudflare Inc ECC CA-3',
          subject: 'cloudflare-tls.io',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          serialNumber: '987654321',
        },
        error: null,
      },
    });

    const signals = analyzer.analyze(context);
    const cfSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-cloudflare',
    );

    expect(cfSignal).toBeDefined();
    expect(cfSignal?.category).toBe('TLS');
    expect(cfSignal?.type).toBe('TLS_CERT_ISSUER_FINGERPRINT');
    expect(cfSignal?.targetLayer).toBe('EDGE');
    expect(cfSignal?.observedWireEvidence).toBe(
      'TLS Issuer: Cloudflare Inc ECC CA-3',
    );
  });

  it('extracts Amazon Trust Services certificate authority', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'aws-portal.com',
      ssl: {
        reachable: true,
        supported: true,
        responseTimeMs: 30,
        certificate: {
          issuer: 'Amazon Trust Services RSA CA 1',
          subject: 'aws-portal.com',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          serialNumber: '1122334455',
        },
        error: null,
      },
    });

    const signals = analyzer.analyze(context);
    const awsSignal = signals.find((s) => s.targetTechnologyId === 'tech-aws');

    expect(awsSignal).toBeDefined();
    expect(awsSignal?.targetTechnologyName).toBe('Amazon Web Services (AWS)');
    expect(awsSignal?.observedWireEvidence).toBe(
      'TLS Issuer: Amazon Trust Services RSA CA 1',
    );
  });

  it('correlates Amazon certificate with AWS CloudFront if CloudFront headers are present', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'cloudfront-cdn.org',
      headers: {
        'x-amz-cf-id': '981273918237==',
      },
      ssl: {
        reachable: true,
        supported: true,
        responseTimeMs: 30,
        certificate: {
          issuer: 'Amazon Trust Services RSA CA 1',
          subject: 'cloudfront-cdn.org',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          serialNumber: '1122334455',
        },
        error: null,
      },
    });

    const signals = analyzer.analyze(context);
    const cfSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-cloudfront',
    );

    expect(cfSignal).toBeDefined();
    expect(cfSignal?.targetTechnologyName).toBe('AWS CloudFront');
    expect(cfSignal?.targetLayer).toBe('EDGE');
  });

  it('returns empty array if SSL is not supported or missing certificate', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'plain-http.com',
      ssl: {
        reachable: false,
        supported: false,
        responseTimeMs: 0,
        certificate: null,
        error: 'Connection refused',
      },
    });

    const signals = analyzer.analyze(context);
    expect(signals).toHaveLength(0);
  });
});
