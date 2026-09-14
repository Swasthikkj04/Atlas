import { Injectable } from '@nestjs/common';
import { BaseTechnologyDetector } from '../../base/base-technology.detector';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyEvidence,
  TechnologySignal,
} from '../../contracts';

@Injectable()
export class HAProxyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-haproxy';
  readonly name = 'HAProxy';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'HAProxy high-performance, open-source load balancer and reverse proxy for TCP and HTTP applications';
  readonly role = 'Reverse Proxy / Load Balancer';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose HAProxy as a gateway or load-balancing boundary.';
  readonly whatThisDoesNotProve =
    'Observable HAProxy infrastructure confirms reverse proxy / load balancing gateway presence, but does not prove Kubernetes, Docker, Linux, cloud provider, service mesh, microservices, specific backend runtime, specific application framework, database, HAProxy configuration, backend topology, or internal load-balancing targets.';
  readonly defaultImplications = [
    'The endpoint terminates or routes traffic through an HAProxy load-balancing boundary.',
    'Upstream applications, host operating systems, container runtimes, cloud platforms, and databases remain unobserved unless directly evidenced.',
  ];
  readonly detectionSignals = [
    'Server header containing haproxy (e.g. Server: HAProxy, Server: HAProxy/2.8.5)',
    'HAProxy default 503 error page (No server is available to handle this request)',
    'HAProxy 502/504 error page templates (504 Gateway Time-out, 502 Bad Gateway, 400 Bad Request)',
    'x-haproxy-id or x-haproxy-server response headers',
    'HAProxy session persistence cookies (SERVERID, SRV)',
    'Via header containing haproxy',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: HAProxy banner, HAProxy error signatures, or explicit x-haproxy-* headers are observed. Corroborated when combined with behavioral wire signals.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawServer = context.getHeader('server') ?? '';
    const serverLower = rawServer.toLowerCase();
    const htmlBody = context.htmlBody ?? '';
    const rawSetCookie = context.getHeader('set-cookie') ?? '';
    const rawVia = context.getHeader('via') ?? '';

    // 1. Server Header Evidence (Server: HAProxy or Server: HAProxy/2.8.5)
    let version: string | undefined;
    let versionEvidence: string | undefined;

    if (serverLower.includes('haproxy')) {
      const versionMatch = rawServer.match(/haproxy\/([\d.]+(?:-[\w.]+)?)/i);
      if (versionMatch) {
        version = versionMatch[1];
        versionEvidence = `Server: ${rawServer}`;
      }

      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'HAProxy Server Banner',
        type: 'HEADER',
        indicator: `server: ${rawServer}`,
        matched: true,
        weight: 10,
      });
    }

    // 2. HAProxy Transaction & Routing Headers (x-haproxy-id, x-haproxy-server)
    if (context.hasHeader('x-haproxy-id')) {
      const val = context.getHeader('x-haproxy-id') ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-haproxy-id',
        indicator: 'HAProxy transaction ID header',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'HAProxy Transaction ID',
        type: 'HEADER',
        indicator: 'x-haproxy-id',
        matched: true,
        weight: 10,
      });
    }

    if (context.hasHeader('x-haproxy-server')) {
      const val = context.getHeader('x-haproxy-server') ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-haproxy-server',
        indicator: 'HAProxy backend server header',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'HAProxy Backend Server Header',
        type: 'HEADER',
        indicator: 'x-haproxy-server',
        matched: true,
        weight: 9,
      });
    }

    // 3. Via Header containing HAProxy
    if (rawVia.toLowerCase().includes('haproxy')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: `Via: ${rawVia}`,
        observedValue: rawVia,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'HAProxy Via Header',
        type: 'HEADER',
        indicator: `via: ${rawVia}`,
        matched: true,
        weight: 9,
      });
    }

    // 4. HAProxy Session Persistence Cookies (SERVERID, SRV)
    if (
      context.hasCookie('serverid') ||
      context.hasCookie('srv') ||
      /serverid=/i.test(rawSetCookie)
    ) {
      const cookieMatch = rawSetCookie.match(/(?:SERVERID|SRV)=[^;]+/i);
      const cookieVal = cookieMatch ? cookieMatch[0] : 'SERVERID';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'HAProxy server persistence cookie (SERVERID/SRV)',
        observedValue: cookieVal,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'HAProxy Session Persistence Cookie',
        type: 'COOKIE',
        indicator: cookieVal,
        matched: true,
        weight: 9,
      });
    }

    // 5. HAProxy Canonical Error Page Templates
    if (
      htmlBody.includes('No server is available to handle this request.') ||
      (htmlBody.includes('503 Service Unavailable') &&
        htmlBody.includes('No server is available')) ||
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
      let matchedSignature = 'HAProxy Error Response Template';
      if (htmlBody.includes('No server is available to handle this request.')) {
        matchedSignature =
          '503 Service Unavailable: No server is available to handle this request.';
      } else if (htmlBody.includes('504 Gateway Time-out')) {
        matchedSignature =
          '504 Gateway Time-out: The gateway server did not receive a timely response';
      } else if (htmlBody.includes('502 Bad Gateway')) {
        matchedSignature =
          '502 Bad Gateway: The server was acting as a gateway or proxy';
      } else if (htmlBody.includes('400 Bad Request')) {
        matchedSignature =
          '400 Bad Request: Your browser sent a request that this server could not understand.';
      }

      evidence.push({
        sourceType: 'HTTP',
        source: 'HTML Body: HAProxy Error Page',
        indicator: 'Canonical HAProxy error response body signature',
        observedValue: matchedSignature,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'HAProxy Error Page Signature',
        type: 'BODY',
        indicator: matchedSignature,
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      version,
      versionEvidence,
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: this.role,
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
      implications: this.defaultImplications,
    });
  }
}
