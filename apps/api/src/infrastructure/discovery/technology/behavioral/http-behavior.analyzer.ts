import { Injectable, Logger } from '@nestjs/common';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  BehavioralSignal,
} from '../contracts';

/**
 * T22-A — HTTP Response Behavior Analyzer
 *
 * Inspects the response as a behavioral wire artifact without jumping to conclusions:
 * - Header presence & ordering heuristics
 * - Header casing & formatting characteristics
 * - Connection semantics & Keep-Alive socket parameters
 * - Byte-range & static delivery handling
 * - Content-Type parameterization quirks
 */
@Injectable()
export class HttpBehaviorAnalyzer {
  private readonly logger = new Logger(HttpBehaviorAnalyzer.name);

  analyze(context: TechnologyDetectionContext): BehavioralSignal[] {
    const signals: BehavioralSignal[] = [];
    const headers = context.headers || {};
    const headerKeys = Object.keys(headers);
    const rawSetCookie = context.getHeader('set-cookie') || '';
    const keepAlive = context.getHeader('keep-alive')?.toLowerCase() || '';
    const connection = context.getHeader('connection')?.toLowerCase() || '';
    const acceptRanges =
      context.getHeader('accept-ranges')?.toLowerCase() || '';
    const etag = context.getHeader('etag') || '';
    const contentType = context.getHeader('content-type') || '';
    const serverHeader = context.getHeader('server') || '';

    // 1. Connection Semantics: Node.js Keep-Alive Parameterization (timeout=5)
    if (keepAlive.includes('timeout=') && connection === 'keep-alive') {
      const match = keepAlive.match(/timeout=(\d+)/);
      const timeoutSec = match ? parseInt(match[1], 10) : null;

      signals.push({
        id: `sig-http-node-keepalive-${context.domainName}`,
        category: 'HTTP',
        type: 'CONNECTION_SEMANTICS_FINGERPRINT',
        observationId: `obs-http-keepalive-${context.domainName}`,
        strength: timeoutSec === 5 ? 0.85 : 0.65,
        confidence: timeoutSec === 5 ? 0.7 : 0.55,
        confidenceLevel: 'MEDIUM',
        description: `HTTP Keep-Alive connection semantics parameterization (${keepAlive}) consistent with Node.js HTTP server socket defaults`,
        evidenceReferences: [
          `Response Header: keep-alive (${keepAlive})`,
          `Response Header: connection (${connection})`,
        ],
        targetTechnologyId: 'tech-nodejs',
        targetTechnologyName: 'Node.js',
        targetCategory: TechnologyCategory.RUNTIME,
        targetLayer: 'RUNTIME',
        targetRole: 'Server-side JavaScript Runtime',
        observationState: 'OBSERVED',
        observedWireEvidence: `Keep-Alive: ${keepAlive}, Connection: ${connection}`,
        metadata: { timeoutSec, keepAliveRaw: keepAlive },
      });
    }

    // 2. Range Handling & Static Delivery Signature: NGINX-consistent static byte range
    if (acceptRanges === 'bytes' && etag) {
      // NGINX format: strong or weak etag with hexadecimal or quoted timestamp
      const isHexEtag = /^(?:W\/)?"[0-9a-fA-F]+-[0-9a-fA-F]+"$/.test(etag);
      signals.push({
        id: `sig-http-nginx-ranges-${context.domainName}`,
        category: 'HTTP',
        type: 'RANGE_HANDLING_FINGERPRINT',
        observationId: `obs-http-ranges-${context.domainName}`,
        strength: isHexEtag ? 0.75 : 0.55,
        confidence: isHexEtag ? 0.65 : 0.5,
        confidenceLevel: 'MEDIUM',
        description: `HTTP byte-range acceptance and ${isHexEtag ? 'hexadecimal timestamp ETag' : 'ETag'} pattern consistent with NGINX-like static delivery`,
        evidenceReferences: [
          `Response Header: accept-ranges (${acceptRanges})`,
          `Response Header: etag (${etag})`,
        ],
        targetTechnologyId: 'tech-nginx',
        targetTechnologyName: 'NGINX',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Web Server / Reverse Proxy Gateway',
        observationState: 'OBSERVED',
        observedWireEvidence: `Accept-Ranges: bytes, ETag: ${etag}`,
        metadata: { isHexEtag, etag },
      });
    }

    // 3. Content-Type Casing & Formatting: Java/Tomcat UTF-8 casing quirk (text/html;charset=UTF-8 with no space)
    if (
      contentType.includes('charset=UTF-8') &&
      !contentType.includes('charset=utf-8')
    ) {
      signals.push({
        id: `sig-http-java-contenttype-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_CASING_FINGERPRINT',
        observationId: `obs-http-contenttype-${context.domainName}`,
        strength: 0.65,
        confidence: 0.55,
        confidenceLevel: 'MEDIUM',
        description: `Content-Type parameterization format ('${contentType}') consistent with Java Servlet Container (Tomcat / Jetty) header generation`,
        evidenceReferences: [`Response Header: content-type (${contentType})`],
        targetTechnologyId: 'tech-java',
        targetTechnologyName: 'Java',
        targetCategory: TechnologyCategory.RUNTIME,
        targetLayer: 'RUNTIME',
        targetRole: 'Server-side JVM Application Runtime',
        observationState: 'OBSERVED',
        observedWireEvidence: `Content-Type: ${contentType}`,
        metadata: { contentType },
      });
    }

    // 4. Header Combination & Caching: Python / Django Vary: Cookie pattern
    const vary = context.getHeader('vary')?.toLowerCase() || '';
    if (
      vary.includes('cookie') &&
      !serverHeader.toLowerCase().includes('cloudflare')
    ) {
      signals.push({
        id: `sig-http-django-vary-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-vary-${context.domainName}`,
        strength: 0.6,
        confidence: 0.5,
        confidenceLevel: 'LOW',
        description: `HTTP Vary: Cookie header structure consistent with Python/Django session middleware caching semantics`,
        evidenceReferences: [
          `Response Header: vary (${context.getHeader('vary')})`,
        ],
        targetTechnologyId: 'tech-django',
        targetTechnologyName: 'Django',
        targetCategory: TechnologyCategory.FRAMEWORK,
        targetLayer: 'APPLICATION',
        targetRole: 'Python Web Framework',
        observationState: 'OBSERVED',
        observedWireEvidence: `Vary: ${context.getHeader('vary')}`,
        metadata: { vary },
      });
    }

    // 5. AWS Ingress Header Structure (X-Amzn-Trace-Id / X-Amz-Cf-Pop)
    if (
      context.hasHeader('x-amzn-trace-id') ||
      context.hasHeader('x-amz-cf-pop') ||
      context.hasHeader('x-amz-cf-id')
    ) {
      const traceId = context.getHeader('x-amzn-trace-id');
      const cfId = context.getHeader('x-amz-cf-id');
      const cfPop = context.getHeader('x-amz-cf-pop');
      signals.push({
        id: `sig-http-aws-ingress-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-aws-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'HIGH',
        description: `Amazon Web Services ingress and routing correlation headers observed`,
        evidenceReferences: [
          traceId ? `Response Header: x-amzn-trace-id (${traceId})` : '',
          cfId ? `Response Header: x-amz-cf-id (${cfId})` : '',
          cfPop ? `Response Header: x-amz-cf-pop (${cfPop})` : '',
        ].filter(Boolean),
        targetTechnologyId: cfId ? 'tech-cloudfront' : 'tech-aws',
        targetTechnologyName: cfId
          ? 'AWS CloudFront'
          : 'Amazon Web Services (AWS)',
        targetCategory: cfId
          ? TechnologyCategory.CDN_EDGE
          : TechnologyCategory.CLOUD_INFRASTRUCTURE,
        targetLayer: cfId ? 'EDGE' : 'GATEWAY',
        targetRole: cfId
          ? 'Content Delivery Network / Edge Cache'
          : 'Cloud Ingress & Infrastructure',
        observationState: 'OBSERVED',
        observedWireEvidence: traceId || cfId || cfPop || 'AWS Ingress Headers',
        metadata: { traceId, cfId, cfPop },
      });
    }

    // 6. Cloudflare Edge Headers Structure (cf-ray / cf-cache-status)
    if (context.hasHeader('cf-ray') || context.hasHeader('cf-cache-status')) {
      const cfRay = context.getHeader('cf-ray');
      const cfCache = context.getHeader('cf-cache-status');
      signals.push({
        id: `sig-http-cf-edge-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-cf-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Cloudflare Anycast edge routing & cache headers observed on HTTP response wire`,
        evidenceReferences: [
          cfRay ? `Response Header: cf-ray (${cfRay})` : '',
          cfCache ? `Response Header: cf-cache-status (${cfCache})` : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-cloudflare',
        targetTechnologyName: 'Cloudflare',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Delivery & Anycast Proxy',
        observationState: 'OBSERVED',
        observedWireEvidence: cfRay
          ? `CF-Ray: ${cfRay}`
          : `CF-Cache-Status: ${cfCache}`,
        metadata: { cfRay, cfCache },
      });
    }

    // 7. Envoy Proxy Telemetry & Upstream Timing Headers
    if (
      context.hasHeader('x-envoy-upstream-service-time') ||
      context.hasHeader('x-envoy-decorator-operation') ||
      context.hasHeader('x-envoy-peer-metadata') ||
      context.hasHeader('x-envoy-attempt-count')
    ) {
      const envoyTime = context.getHeader('x-envoy-upstream-service-time');
      const envoyDec = context.getHeader('x-envoy-decorator-operation');
      const envoyPeer = context.getHeader('x-envoy-peer-metadata');
      const envoyAttempt = context.getHeader('x-envoy-attempt-count');
      signals.push({
        id: `sig-http-envoy-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-envoy-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Envoy proxy ingress routing and upstream timing telemetry headers observed on response wire`,
        evidenceReferences: [
          envoyTime
            ? `Response Header: x-envoy-upstream-service-time (${envoyTime})`
            : '',
          envoyDec
            ? `Response Header: x-envoy-decorator-operation (${envoyDec})`
            : '',
          envoyPeer
            ? `Response Header: x-envoy-peer-metadata (${envoyPeer})`
            : '',
          envoyAttempt
            ? `Response Header: x-envoy-attempt-count (${envoyAttempt})`
            : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-envoy',
        targetTechnologyName: 'Envoy',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Reverse Proxy / Service Proxy',
        observationState: 'OBSERVED',
        observedWireEvidence: envoyTime
          ? `x-envoy-upstream-service-time: ${envoyTime}`
          : 'Envoy Telemetry Headers',
        metadata: { envoyTime, envoyDec, envoyPeer, envoyAttempt },
      });
    }

    // 8. Azure Front Door Edge Headers Structure (x-azure-ref / x-azure-fdid / x-azure-clientip)
    if (
      context.hasHeader('x-azure-ref') ||
      context.hasHeader('x-azure-fdid') ||
      context.hasHeader('x-azure-clientip')
    ) {
      const azureRef = context.getHeader('x-azure-ref');
      const azureFdid = context.getHeader('x-azure-fdid');
      const azureClientIp = context.getHeader('x-azure-clientip');
      signals.push({
        id: `sig-http-azure-fd-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-azure-fd-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Microsoft Azure Front Door Anycast edge routing & tracking headers observed on response wire`,
        evidenceReferences: [
          azureRef ? `Response Header: x-azure-ref (${azureRef})` : '',
          azureFdid ? `Response Header: x-azure-fdid (${azureFdid})` : '',
          azureClientIp
            ? `Response Header: x-azure-clientip (${azureClientIp})`
            : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-azure-frontdoor',
        targetTechnologyName: 'Azure Front Door',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Delivery / Global Ingress',
        observationState: 'OBSERVED',
        observedWireEvidence: azureRef
          ? `x-azure-ref: ${azureRef}`
          : azureFdid
            ? `x-azure-fdid: ${azureFdid}`
            : 'Azure Front Door Headers',
        metadata: { azureRef, azureFdid, azureClientIp },
      });
    }

    // 9. Azure Application Gateway & Resource Headers Structure (x-ms-routing-name / x-ms-request-id / x-ms-version)
    if (
      context.hasHeader('x-ms-routing-name') ||
      context.hasHeader('x-ms-request-id') ||
      context.hasHeader('x-ms-version')
    ) {
      const routingName = context.getHeader('x-ms-routing-name');
      const msReqId = context.getHeader('x-ms-request-id');
      const msVersion = context.getHeader('x-ms-version');
      signals.push({
        id: `sig-http-azure-gw-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-azure-gw-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'HIGH',
        description: `Microsoft Azure Application Gateway routing and resource management headers observed on response wire`,
        evidenceReferences: [
          routingName
            ? `Response Header: x-ms-routing-name (${routingName})`
            : '',
          msReqId ? `Response Header: x-ms-request-id (${msReqId})` : '',
          msVersion ? `Response Header: x-ms-version (${msVersion})` : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-azure',
        targetTechnologyName: 'Microsoft Azure',
        targetCategory: TechnologyCategory.CLOUD_INFRASTRUCTURE,
        targetLayer: 'GATEWAY',
        targetRole: routingName
          ? 'Application Gateway / Reverse Proxy'
          : 'Cloud Infrastructure & Managed Services',
        observationState: 'OBSERVED',
        observedWireEvidence: routingName
          ? `x-ms-routing-name: ${routingName}`
          : msReqId
            ? `x-ms-request-id: ${msReqId}`
            : 'Azure Service Headers',
        metadata: { routingName, msReqId, msVersion },
      });
    }

    // 10. HAProxy Load Balancer & Proxy Headers (x-haproxy-id / x-haproxy-server / via)
    if (
      context.hasHeader('x-haproxy-id') ||
      context.hasHeader('x-haproxy-server') ||
      (context.getHeader('via') || '').toLowerCase().includes('haproxy')
    ) {
      const haproxyId = context.getHeader('x-haproxy-id');
      const haproxyServer = context.getHeader('x-haproxy-server');
      const via = context.getHeader('via');
      signals.push({
        id: `sig-http-haproxy-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-haproxy-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `HAProxy load-balancer transaction ID or proxy routing headers observed on response wire`,
        evidenceReferences: [
          haproxyId ? `Response Header: x-haproxy-id (${haproxyId})` : '',
          haproxyServer
            ? `Response Header: x-haproxy-server (${haproxyServer})`
            : '',
          via ? `Response Header: via (${via})` : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-haproxy',
        targetTechnologyName: 'HAProxy',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Reverse Proxy / Load Balancer',
        observationState: 'OBSERVED',
        observedWireEvidence: haproxyId
          ? `x-haproxy-id: ${haproxyId}`
          : via
            ? `via: ${via}`
            : 'HAProxy Headers',
        metadata: { haproxyId, haproxyServer, via },
      });
    }

    // 11. Fastly Edge Behavioral Routing Headers (H2-001)
    if (
      context.hasHeader('x-served-by') ||
      context.hasHeader('fastly-restarts') ||
      context.hasHeader('x-fastly-request-id')
    ) {
      const servedBy = context.getHeader('x-served-by');
      const fastlyId = context.getHeader('x-fastly-request-id');
      const restarts = context.getHeader('fastly-restarts');
      signals.push({
        id: `sig-http-fastly-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-fastly-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Fastly edge delivery and cache routing headers observed on response wire`,
        evidenceReferences: [
          servedBy ? `Response Header: x-served-by (${servedBy})` : '',
          fastlyId ? `Response Header: x-fastly-request-id (${fastlyId})` : '',
          restarts ? `Response Header: fastly-restarts (${restarts})` : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-fastly',
        targetTechnologyName: 'Fastly',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Cloud / CDN',
        observationState: 'OBSERVED',
        observedWireEvidence: servedBy
          ? `x-served-by: ${servedBy}`
          : fastlyId
            ? `x-fastly-request-id: ${fastlyId}`
            : 'Fastly Edge Headers',
        metadata: { servedBy, fastlyId, restarts },
      });
    }

    // 12. Akamai Edge Behavioral Headers (H2-001)
    if (
      context.hasHeader('x-akamai-transformed') ||
      context.hasHeader('x-check-cacheable') ||
      context.hasHeader('akamai-grn') ||
      context.hasHeader('x-true-cache-key')
    ) {
      const transformed = context.getHeader('x-akamai-transformed');
      const grn = context.getHeader('akamai-grn');
      signals.push({
        id: `sig-http-akamai-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-akamai-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Akamai Intelligent Edge transformation and routing headers observed on response wire`,
        evidenceReferences: [
          transformed
            ? `Response Header: x-akamai-transformed (${transformed})`
            : '',
          grn ? `Response Header: akamai-grn (${grn})` : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-akamai',
        targetTechnologyName: 'Akamai',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Delivery & Global CDN',
        observationState: 'OBSERVED',
        observedWireEvidence: transformed
          ? `x-akamai-transformed: ${transformed}`
          : grn
            ? `akamai-grn: ${grn}`
            : 'Akamai Edge Headers',
        metadata: { transformed, grn },
      });
    }

    // 13. Vercel & Netlify Edge Serverless Platform Behavioral Headers (H2-001)
    if (
      context.hasHeader('x-vercel-id') ||
      context.hasHeader('x-vercel-cache')
    ) {
      const vercelId = context.getHeader('x-vercel-id');
      const vercelCache = context.getHeader('x-vercel-cache');
      signals.push({
        id: `sig-http-vercel-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-vercel-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Vercel Edge Network routing and cache telemetry headers observed on response wire`,
        evidenceReferences: [
          vercelId ? `Response Header: x-vercel-id (${vercelId})` : '',
          vercelCache ? `Response Header: x-vercel-cache (${vercelCache})` : '',
        ].filter(Boolean),
        targetTechnologyId: 'tech-vercel',
        targetTechnologyName: 'Vercel',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Cloud & Serverless Platform',
        observationState: 'OBSERVED',
        observedWireEvidence: vercelId
          ? `x-vercel-id: ${vercelId}`
          : `x-vercel-cache: ${vercelCache}`,
        metadata: { vercelId, vercelCache },
      });
    }

    if (context.hasHeader('x-nf-request-id')) {
      const nfId = context.getHeader('x-nf-request-id');
      signals.push({
        id: `sig-http-netlify-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-netlify-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Netlify Edge Network deployment request tracking header observed on response wire`,
        evidenceReferences: [`Response Header: x-nf-request-id (${nfId})`],
        targetTechnologyId: 'tech-netlify',
        targetTechnologyName: 'Netlify',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Cloud & Serverless Platform',
        observationState: 'OBSERVED',
        observedWireEvidence: `x-nf-request-id: ${nfId}`,
        metadata: { nfId },
      });
    }

    // 14. Modern Ingress Gateway: Traefik & Caddy Behavioral Headers (H2-001)
    if (
      context.hasHeader('x-traefik-router') ||
      (context.getHeader('server') || '').toLowerCase().includes('traefik')
    ) {
      const traefikRouter = context.getHeader('x-traefik-router');
      signals.push({
        id: `sig-http-traefik-${context.domainName}`,
        category: 'HTTP',
        type: 'HEADER_ORDER_FINGERPRINT',
        observationId: `obs-http-traefik-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'HIGH',
        description: `Traefik ingress routing and proxy telemetry headers observed on response wire`,
        evidenceReferences: [
          traefikRouter
            ? `Response Header: x-traefik-router (${traefikRouter})`
            : 'Traefik Signature',
        ],
        targetTechnologyId: 'tech-traefik',
        targetTechnologyName: 'Traefik',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Cloud Native Ingress Gateway & Reverse Proxy',
        observationState: 'OBSERVED',
        observedWireEvidence: traefikRouter
          ? `x-traefik-router: ${traefikRouter}`
          : 'Traefik Gateway Header',
        metadata: { traefikRouter },
      });
    }

    // 15. HTTP/2 Wire Protocol Fingerprint (H2-002)
    const isHttp2 =
      context.hasHeader(':status') ||
      context.hasHeader('x-http2') ||
      context.getHeader('via')?.toLowerCase().includes('2.0') ||
      (context.http as any)?.protocol === 'http2' ||
      (context.http as any)?.httpVersion?.startsWith('2');

    if (isHttp2) {
      signals.push({
        id: `sig-http2-wire-${context.domainName}`,
        category: 'HTTP',
        type: 'PROTOCOL_QUIRK_FINGERPRINT',
        observationId: `obs-http2-${context.domainName}`,
        strength: 0.85,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description: `HTTP/2 multiplexed transport wire protocol behavior observed`,
        evidenceReferences: ['HTTP Transport Protocol: HTTP/2'],
        observationState: 'OBSERVED',
        observedWireEvidence: 'Transport: HTTP/2',
        metadata: { http2: true },
      });
    }

    return signals;
  }
}
