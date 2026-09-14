import { HttpBehaviorAnalyzer } from './http-behavior.analyzer';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

describe('HttpBehaviorAnalyzer (T22-A — HTTP Response Behavior)', () => {
  let analyzer: HttpBehaviorAnalyzer;

  beforeEach(() => {
    analyzer = new HttpBehaviorAnalyzer();
  });

  it('extracts Node.js socket Keep-Alive parameterization (timeout=5)', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'api.example.com',
      headers: {
        connection: 'keep-alive',
        'keep-alive': 'timeout=5',
      },
    });

    const signals = analyzer.analyze(context);
    const nodeSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-nodejs',
    );

    expect(nodeSignal).toBeDefined();
    expect(nodeSignal?.category).toBe('HTTP');
    expect(nodeSignal?.type).toBe('CONNECTION_SEMANTICS_FINGERPRINT');
    expect(nodeSignal?.confidenceLevel).toBe('MEDIUM');
    expect(nodeSignal?.observationState).toBe('OBSERVED');
    expect(nodeSignal?.observedWireEvidence).toContain('Keep-Alive: timeout=5');
    expect(nodeSignal?.evidenceReferences).toContain(
      'Response Header: keep-alive (timeout=5)',
    );
  });

  it('extracts NGINX-consistent byte range acceptance and hexadecimal ETag signature', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'static.cdn.io',
      headers: {
        'accept-ranges': 'bytes',
        etag: '"64f1a2b3-1a2b"',
      },
    });

    const signals = analyzer.analyze(context);
    const nginxSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-nginx',
    );

    expect(nginxSignal).toBeDefined();
    expect(nginxSignal?.category).toBe('HTTP');
    expect(nginxSignal?.type).toBe('RANGE_HANDLING_FINGERPRINT');
    expect(nginxSignal?.description).toContain('NGINX-like static delivery');
    expect(nginxSignal?.confidenceLevel).toBe('MEDIUM');
  });

  it('extracts Java/Tomcat Content-Type UTF-8 casing quirk without space', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'portal.bank.internal',
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });

    const signals = analyzer.analyze(context);
    const javaSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-java',
    );

    expect(javaSignal).toBeDefined();
    expect(javaSignal?.type).toBe('HEADER_CASING_FINGERPRINT');
    expect(javaSignal?.description).toContain('Java Servlet Container');
  });

  it('extracts Python/Django Vary: Cookie caching semantics', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'django-app.org',
      headers: {
        vary: 'Cookie, Accept-Language',
      },
    });

    const signals = analyzer.analyze(context);
    const djangoSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-django',
    );

    expect(djangoSignal).toBeDefined();
    expect(djangoSignal?.type).toBe('HEADER_ORDER_FINGERPRINT');
    expect(djangoSignal?.targetRole).toBe('Python Web Framework');
  });

  it('extracts Cloudflare cf-ray edge routing headers', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'cloudflare-edge.net',
      headers: {
        'cf-ray': '89761234abcd-ORD',
        'cf-cache-status': 'HIT',
      },
    });

    const signals = analyzer.analyze(context);
    const cfSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-cloudflare',
    );

    expect(cfSignal).toBeDefined();
    expect(cfSignal?.observedWireEvidence).toContain(
      'CF-Ray: 89761234abcd-ORD',
    );
  });

  it('returns empty array when no behavioral HTTP signatures match', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'plain.io',
      headers: {
        'content-type': 'text/plain',
      },
    });

    const signals = analyzer.analyze(context);
    expect(signals).toHaveLength(0);
  });
});
