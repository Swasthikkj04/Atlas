import { CookieBehaviorAnalyzer } from './cookie-behavior.analyzer';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

describe('CookieBehaviorAnalyzer (T22-B — Cookie Structural Signals)', () => {
  let analyzer: CookieBehaviorAnalyzer;

  beforeEach(() => {
    analyzer = new CookieBehaviorAnalyzer();
  });

  it('extracts Java Servlet Specification JSESSIONID structure', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'enterprise.bank.com',
      headers: {
        'set-cookie': 'JSESSIONID=3E57819B4A09; Path=/; Secure; HttpOnly',
      },
    });

    const signals = analyzer.analyze(context);
    const javaSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-java',
    );

    expect(javaSignal).toBeDefined();
    expect(javaSignal?.category).toBe('COOKIE');
    expect(javaSignal?.targetRole).toBe('Server-side JVM Application Runtime');
    expect(javaSignal?.observedWireEvidence).toBe('Set-Cookie: JSESSIONID');
  });

  it('extracts Microsoft ASP.NET Core session structure (.AspNetCore.Cookies)', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'dotnet.enterprise.com',
      headers: {
        'set-cookie':
          '.AspNetCore.Cookies=CfDJ8N...; path=/; samesite=lax; httponly',
      },
    });

    const signals = analyzer.analyze(context);
    const dotnetSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-dotnet',
    );

    expect(dotnetSignal).toBeDefined();
    expect(dotnetSignal?.category).toBe('COOKIE');
    expect(dotnetSignal?.targetTechnologyName).toBe('.NET');
    expect(dotnetSignal?.confidenceLevel).toBe('HIGH');
  });

  it('extracts Node.js Connect/Express connect.sid session cookie', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'api.express-app.com',
      headers: {
        'set-cookie':
          'connect.sid=s%3A_J8...; Path=/; HttpOnly; SameSite=Strict',
      },
    });

    const signals = analyzer.analyze(context);
    const nodeSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-nodejs',
    );

    expect(nodeSignal).toBeDefined();
    expect(nodeSignal?.targetTechnologyName).toBe('Node.js');
    expect(nodeSignal?.observedWireEvidence).toBe('Set-Cookie: connect.sid');
  });

  it('extracts PHP standard PHPSESSID session cookie', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'php-legacy.org',
      headers: {
        'set-cookie': 'PHPSESSID=d94k20vn58s; path=/',
      },
    });

    const signals = analyzer.analyze(context);
    const phpSignal = signals.find((s) => s.targetTechnologyId === 'tech-php');

    expect(phpSignal).toBeDefined();
    expect(phpSignal?.targetTechnologyName).toBe('PHP');
  });

  it('extracts Django dual-cookie session structure (csrftoken + sessionid)', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'django-portal.com',
      headers: {
        'set-cookie': 'csrftoken=abc123xyz; sessionid=sess987654; Path=/',
      },
    });

    const signals = analyzer.analyze(context);
    const djangoSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-django',
    );

    expect(djangoSignal).toBeDefined();
    expect(djangoSignal?.targetRole).toBe('Python Web Framework');
    expect(djangoSignal?.observedWireEvidence).toBe(
      'Set-Cookie: csrftoken & sessionid',
    );
  });

  it('extracts AWS ALB session routing cookie (AWSALB)', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'aws-ingress.io',
      headers: {
        'set-cookie':
          'AWSALB=k8s71923; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
      },
    });

    const signals = analyzer.analyze(context);
    const awsSignal = signals.find((s) => s.targetTechnologyId === 'tech-aws');

    expect(awsSignal).toBeDefined();
    expect(awsSignal?.targetLayer).toBe('GATEWAY');
  });

  it('extracts Cloudflare __cf_bm bot management cookie', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'cf-protected.io',
      headers: {
        'set-cookie':
          '__cf_bm=token_xyz; path=/; domain=.cf-protected.io; HttpOnly; Secure; SameSite=None',
      },
    });

    const signals = analyzer.analyze(context);
    const cfSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-cloudflare',
    );

    expect(cfSignal).toBeDefined();
    expect(cfSignal?.targetLayer).toBe('EDGE');
  });
});
