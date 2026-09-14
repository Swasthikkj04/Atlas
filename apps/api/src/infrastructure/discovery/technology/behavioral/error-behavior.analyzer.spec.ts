import { ErrorBehaviorAnalyzer } from './error-behavior.analyzer';
import { createTechnologyDetectionContext } from '../context/technology-detection-context.impl';

describe('ErrorBehaviorAnalyzer (T22-C — Error Response Fingerprints)', () => {
  let analyzer: ErrorBehaviorAnalyzer;

  beforeEach(() => {
    analyzer = new ErrorBehaviorAnalyzer();
  });

  it('extracts NGINX canonical centered 404 error template', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'nginx-hidden.corp',
      htmlBody:
        '<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr></body></html>',
    });

    const signals = analyzer.analyze(context);
    const nginxSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-nginx',
    );

    expect(nginxSignal).toBeDefined();
    expect(nginxSignal?.category).toBe('ERROR');
    expect(nginxSignal?.type).toBe('ERROR_TEMPLATE_FINGERPRINT');
    expect(nginxSignal?.targetTechnologyName).toBe('NGINX');
    expect(nginxSignal?.targetLayer).toBe('GATEWAY');
  });

  it('extracts Apache HTTP Server address block error footer', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'apache-hidden.org',
      htmlBody:
        '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN"><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL was not found on this server.</p><hr><address>Apache/2.4.52 (Ubuntu) Server at apache-hidden.org Port 443</address></body></html>',
    });

    const signals = analyzer.analyze(context);
    const apacheSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-apache',
    );

    expect(apacheSignal).toBeDefined();
    expect(apacheSignal?.targetTechnologyName).toBe('Apache HTTP Server');
  });

  it('extracts Express.js router unmatched path signature (Cannot GET /api/v1)', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'express-api.io',
      htmlBody:
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Error</title></head><body><pre>Cannot GET /api/v1/missing</pre></body></html>',
    });

    const signals = analyzer.analyze(context);
    const nodeSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-nodejs',
    );

    expect(nodeSignal).toBeDefined();
    expect(nodeSignal?.targetTechnologyName).toBe('Node.js');
    expect(nodeSignal?.observedWireEvidence).toContain(
      'Cannot GET/POST route signature',
    );
  });

  it('extracts Django URLconf & debug error page signature', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'django-debug.site',
      htmlBody:
        '<h1>Page not found (404)</h1><p>Using the URLconf defined in <code>myproject.urls</code>, Django tried these URL patterns in this order:</p>',
    });

    const signals = analyzer.analyze(context);
    const djangoSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-django',
    );

    expect(djangoSignal).toBeDefined();
    expect(djangoSignal?.targetTechnologyName).toBe('Django');
  });

  it('extracts Next.js client Not-Found component layout', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'next-portal.dev',
      htmlBody:
        '<div id="__next"><div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;height:100vh;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center"><div><style>body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}</style><h1 class="next-error-h1">404</h1><div style="display:inline-block"><h2 style="font-size:14px;font-weight:400;line-height:28px">This page could not be found.</h2></div></div></div></div>',
    });

    const signals = analyzer.analyze(context);
    const nextSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-nextjs',
    );

    expect(nextSignal).toBeDefined();
    expect(nextSignal?.targetTechnologyName).toBe('Next.js');
  });

  it('extracts Cloudflare edge gateway 5xx error layout with Ray ID', () => {
    const context = createTechnologyDetectionContext({
      domainName: 'cf-down.com',
      htmlBody:
        '<div class="cf-error-details"><p>Error 521</p><p>Web server is returning an unknown error</p><div class="cf-ray">Cloudflare Ray ID: 89ab12cd34ef5678</div></div>',
    });

    const signals = analyzer.analyze(context);
    const cfSignal = signals.find(
      (s) => s.targetTechnologyId === 'tech-cloudflare',
    );

    expect(cfSignal).toBeDefined();
    expect(cfSignal?.targetTechnologyName).toBe('Cloudflare');
  });
});
