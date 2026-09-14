import { Injectable, Logger } from '@nestjs/common';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  BehavioralSignal,
} from '../contracts';

/**
 * T22-C — Error Response Fingerprints Analyzer
 *
 * Inspects controlled error templates and layout characteristics without claiming absolute certainty:
 * - NGINX canonical centered HTML error templates
 * - Apache HTTP Server address-block error structures
 * - Express.js default router unmatched path templates
 * - Django URLconf and standard error responses
 * - Next.js router & JSON error patterns
 * - Cloudflare edge gateway 5xx error layouts
 */
@Injectable()
export class ErrorBehaviorAnalyzer {
  private readonly logger = new Logger(ErrorBehaviorAnalyzer.name);

  analyze(context: TechnologyDetectionContext): BehavioralSignal[] {
    const signals: BehavioralSignal[] = [];
    const htmlBody = context.htmlBody || '';

    if (!htmlBody) {
      return signals;
    }

    // 1. NGINX Canonical Centered Error Layout
    if (
      /<center><h1>(?:404 Not Found|502 Bad Gateway|403 Forbidden|400 Bad Request|500 Internal Server Error)<\/h1><\/center>/i.test(
        htmlBody,
      ) ||
      /<center>nginx(?:<(?:\/center|\/h1|hr|\/body|\/html)>)?/i.test(htmlBody)
    ) {
      signals.push({
        id: `sig-err-nginx-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-nginx-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description:
          'NGINX canonical HTML error body structure and centered formatting pattern',
        evidenceReferences: [
          'HTML Body Error Template: <center><h1>Error</h1></center>',
        ],
        targetTechnologyId: 'tech-nginx',
        targetTechnologyName: 'NGINX',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Web Server / Reverse Proxy Gateway',
        observationState: 'OBSERVED',
        observedWireEvidence: 'HTML Body: <center><h1>Error</h1></center>',
        metadata: { template: 'NGINX_DEFAULT_CENTERED_ERROR' },
      });
    }

    // 2. Apache HTTP Server Address-Block Error Structure
    if (
      /<address>Apache(?:\/[\d.]+)?/i.test(htmlBody) ||
      /<address>.*?Server at.*?Port \d+<\/address>/i.test(htmlBody) ||
      (htmlBody.includes('The requested URL was not found on this server.') &&
        htmlBody.includes('<address>'))
    ) {
      signals.push({
        id: `sig-err-apache-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-apache-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description:
          'Apache HTTP Server canonical error footer and address signature block',
        evidenceReferences: [
          'HTML Body Error Template: <address>Apache Server</address>',
        ],
        targetTechnologyId: 'tech-apache',
        targetTechnologyName: 'Apache HTTP Server',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Web Server Gateway',
        observationState: 'OBSERVED',
        observedWireEvidence:
          'HTML Body: <address>Apache Server Block</address>',
        metadata: { template: 'APACHE_DEFAULT_ADDRESS_ERROR' },
      });
    }

    // 3. Express.js Default Unmatched Route Template: <pre>Cannot GET /route</pre>
    if (
      /<pre>Cannot (?:GET|POST|PUT|DELETE|PATCH)\s+\/[^<]*<\/pre>/i.test(
        htmlBody,
      ) ||
      /^Cannot (?:GET|POST|PUT|DELETE|PATCH)\s+\//im.test(htmlBody)
    ) {
      signals.push({
        id: `sig-err-express-node-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-node-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description:
          'Express.js router unmatched path signature (Cannot GET/POST) in response body',
        evidenceReferences: [
          'HTML Body Router Template: Cannot GET/POST router signature',
        ],
        targetTechnologyId: 'tech-nodejs',
        targetTechnologyName: 'Node.js',
        targetCategory: TechnologyCategory.RUNTIME,
        targetLayer: 'RUNTIME',
        targetRole: 'Server-side JavaScript Runtime',
        observationState: 'OBSERVED',
        observedWireEvidence: 'HTML Body: Cannot GET/POST route signature',
        metadata: { template: 'EXPRESS_UNMATCHED_ROUTE' },
      });
    }

    // 4. Python / Django URLconf & Debug Error Structure
    if (
      htmlBody.includes('Using the URLconf defined in') ||
      htmlBody.includes(
        "You're seeing this error because you have <code>DEBUG = True</code>",
      ) ||
      /<h1>Page not found \(404\)<\/h1>[\s\S]*?Raised by:/i.test(htmlBody)
    ) {
      signals.push({
        id: `sig-err-django-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-django-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'MEDIUM',
        description:
          'Django framework URLconf routing and standard debug/404 exception template structure',
        evidenceReferences: [
          'HTML Body Error Template: Django URLconf / 404 handler',
        ],
        targetTechnologyId: 'tech-django',
        targetTechnologyName: 'Django',
        targetCategory: TechnologyCategory.FRAMEWORK,
        targetLayer: 'APPLICATION',
        targetRole: 'Python Web Framework',
        observationState: 'OBSERVED',
        observedWireEvidence: 'HTML Body: Django URLconf Error Page',
        metadata: { template: 'DJANGO_DEBUG_ROUTER_ERROR' },
      });
    }

    // 5. Next.js Default 404 / Error Layout
    if (
      (htmlBody.includes('This page could not be found') &&
        (htmlBody.includes('__next') || htmlBody.includes('next-error-h1'))) ||
      htmlBody.includes('next/dist/client/components/not-found-boundary')
    ) {
      signals.push({
        id: `sig-err-nextjs-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-nextjs-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description:
          'Next.js client-side boundary and default Not-Found component layout structure',
        evidenceReferences: [
          'HTML Body Error Template: Next.js Not-Found Boundary',
        ],
        targetTechnologyId: 'tech-nextjs',
        targetTechnologyName: 'Next.js',
        targetCategory: TechnologyCategory.FRAMEWORK,
        targetLayer: 'APPLICATION',
        targetRole: 'React Full-Stack Framework',
        observationState: 'OBSERVED',
        observedWireEvidence: 'HTML Body: Next.js Not-Found Boundary',
        metadata: { template: 'NEXTJS_NOT_FOUND_BOUNDARY' },
      });
    }

    // 6. Cloudflare Edge Gateway Error (520-526) Layout
    if (
      (htmlBody.includes('Cloudflare Ray ID:') ||
        htmlBody.includes('performance &amp; security by Cloudflare')) &&
      /(?:Error 52\d|Web server is returning an unknown error|Origin DNS error|Host Error)/i.test(
        htmlBody,
      )
    ) {
      signals.push({
        id: `sig-err-cf-edge-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-cf-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description:
          'Cloudflare edge gateway failure response template structure with Ray ID tracing',
        evidenceReferences: [
          'HTML Body Error Template: Cloudflare Edge Gateway Error Layout',
        ],
        targetTechnologyId: 'tech-cloudflare',
        targetTechnologyName: 'Cloudflare',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Delivery & Anycast Proxy',
        observationState: 'OBSERVED',
        observedWireEvidence: 'HTML Body: Cloudflare Edge Error Page',
        metadata: { template: 'CLOUDFLARE_EDGE_GATEWAY_ERROR' },
      });
    }

    // 7. Envoy Proxy Error Responses (upstream connect error, no healthy upstream, direct_response)
    if (
      htmlBody.includes(
        'upstream connect error or disconnect/reset before headers',
      ) ||
      htmlBody.includes('no healthy upstream') ||
      htmlBody.includes('route_not_found') ||
      htmlBody.includes('cluster_not_found') ||
      htmlBody.includes('direct_response')
    ) {
      signals.push({
        id: `sig-err-envoy-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-envoy-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description:
          'Envoy canonical proxy error response format (upstream connection or cluster failure)',
        evidenceReferences: [
          'HTML Body Error Template: Envoy Upstream / Route Failure',
        ],
        targetTechnologyId: 'tech-envoy',
        targetTechnologyName: 'Envoy',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Reverse Proxy / Service Proxy',
        observationState: 'OBSERVED',
        observedWireEvidence: 'HTML Body: Envoy Error Response Template',
        metadata: { template: 'ENVOY_PROXY_ERROR' },
      });
    }

    // 8. HAProxy Canonical Proxy Error Responses (503 No server is available, 504 Gateway Time-out, 502 Bad Gateway)
    if (
      htmlBody.includes('No server is available to handle this request.') ||
      (htmlBody.includes('504 Gateway Time-out') &&
        htmlBody.includes(
          'The gateway server did not receive a timely response',
        )) ||
      (htmlBody.includes('502 Bad Gateway') &&
        htmlBody.includes(
          'The server was acting as a gateway or proxy and received an invalid response',
        )) ||
      (htmlBody.includes('400 Bad Request') &&
        htmlBody.includes(
          'Your browser sent a request that this server could not understand.',
        ))
    ) {
      signals.push({
        id: `sig-err-haproxy-${context.domainName}`,
        category: 'ERROR',
        type: 'ERROR_TEMPLATE_FINGERPRINT',
        observationId: `obs-err-haproxy-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'MEDIUM',
        description:
          'HAProxy canonical proxy error response format (no backend server available or gateway timeout)',
        evidenceReferences: [
          'HTML Body Error Template: HAProxy Canonical Error Page',
        ],
        targetTechnologyId: 'tech-haproxy',
        targetTechnologyName: 'HAProxy',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Reverse Proxy / Load Balancer',
        observationState: 'OBSERVED',
        observedWireEvidence: 'HTML Body: HAProxy Error Response Template',
        metadata: { template: 'HAPROXY_PROXY_ERROR' },
      });
    }

    return signals;
  }
}
