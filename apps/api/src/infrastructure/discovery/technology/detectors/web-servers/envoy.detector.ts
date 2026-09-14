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
export class EnvoyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-envoy';
  readonly name = 'Envoy';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'Envoy high-performance cloud-native open-source edge and service proxy';
  readonly role = 'Reverse Proxy / Service Proxy';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose Envoy as a gateway or proxy boundary.';
  readonly whatThisDoesNotProve =
    'Envoy presence confirms service/gateway proxying, but does not prove Kubernetes, Istio, Docker, Linux, service mesh, sidecar deployment, ingress gateway, API gateway, microservices, specific cloud load balancer, or any specific upstream application or database.';
  readonly defaultImplications = [
    'The endpoint terminates or routes traffic through an Envoy proxy boundary.',
    'Upstream application, container orchestrator (Kubernetes/Istio), hosting platform, and database remain unobserved unless directly evidenced.',
  ];
  readonly detectionSignals = [
    'Server header containing envoy (e.g. Server: envoy, Server: envoy/1.28.0)',
    'x-envoy-upstream-service-time response header',
    'x-envoy-decorator-operation response header',
    'x-envoy-peer-metadata response header',
    'x-envoy-attempt-count response header',
    'x-envoy-immediate-health-check-fail response header',
    'x-envoy-original-path response header',
    'x-envoy-overloaded response header',
    'x-envoy-ratelimited response header',
    'Canonical Envoy error phrases (upstream connect error, no healthy upstream, direct_response)',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: envoy or explicit x-envoy-* headers are observed. Corroborated when combined with behavioral wire signals.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawServer = context.getHeader('server') ?? '';
    const serverLower = rawServer.toLowerCase();
    const htmlBody = context.htmlBody ?? '';

    // 1. Server Header Evidence (Server: envoy or Server: envoy/1.28.0)
    let version: string | undefined;
    let versionEvidence: string | undefined;

    if (serverLower.includes('envoy')) {
      const versionMatch = rawServer.match(/envoy\/([\d.]+)/i);
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
        name: 'Envoy Server Banner',
        type: 'HEADER',
        indicator: `server: ${rawServer}`,
        matched: true,
        weight: 10,
      });
    }

    // 2. Envoy Upstream Service Time Header
    if (context.hasHeader('x-envoy-upstream-service-time')) {
      const val = context.getHeader('x-envoy-upstream-service-time') ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-envoy-upstream-service-time',
        indicator: 'Envoy upstream service timing telemetry',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Envoy Upstream Service Time',
        type: 'HEADER',
        indicator: 'x-envoy-upstream-service-time',
        matched: true,
        weight: 10,
      });
    }

    // 3. Envoy Decorator Operation Header
    if (context.hasHeader('x-envoy-decorator-operation')) {
      const val = context.getHeader('x-envoy-decorator-operation') ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-envoy-decorator-operation',
        indicator: 'Envoy decorator operation header',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Envoy Decorator',
        type: 'HEADER',
        indicator: 'x-envoy-decorator-operation',
        matched: true,
        weight: 9,
      });
    }

    // 4. Envoy Peer Metadata Header
    if (context.hasHeader('x-envoy-peer-metadata')) {
      const val = context.getHeader('x-envoy-peer-metadata') ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-envoy-peer-metadata',
        indicator: 'Envoy peer metadata header',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Envoy Peer Metadata',
        type: 'HEADER',
        indicator: 'x-envoy-peer-metadata',
        matched: true,
        weight: 9,
      });
    }

    // 5. Envoy Attempt Count Header
    if (context.hasHeader('x-envoy-attempt-count')) {
      const val = context.getHeader('x-envoy-attempt-count') ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-envoy-attempt-count',
        indicator: 'Envoy routing attempt count header',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Envoy Attempt Count',
        type: 'HEADER',
        indicator: 'x-envoy-attempt-count',
        matched: true,
        weight: 8,
      });
    }

    // 6. Envoy Immediate Health Check Fail Header
    if (context.hasHeader('x-envoy-immediate-health-check-fail')) {
      const val =
        context.getHeader('x-envoy-immediate-health-check-fail') ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-envoy-immediate-health-check-fail',
        indicator: 'Envoy immediate health check failure telemetry',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Envoy Health Check Fail',
        type: 'HEADER',
        indicator: 'x-envoy-immediate-health-check-fail',
        matched: true,
        weight: 9,
      });
    }

    // 7. Envoy Overloaded / Ratelimited Headers
    if (
      context.hasHeader('x-envoy-overloaded') ||
      context.hasHeader('x-envoy-ratelimited')
    ) {
      const headerName = context.hasHeader('x-envoy-overloaded')
        ? 'x-envoy-overloaded'
        : 'x-envoy-ratelimited';
      const val = context.getHeader(headerName) ?? '';
      evidence.push({
        sourceType: 'HTTP',
        source: `Response Header: ${headerName}`,
        indicator: 'Envoy proxy flow control telemetry',
        observedValue: val,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Envoy Flow Control',
        type: 'HEADER',
        indicator: headerName,
        matched: true,
        weight: 9,
      });
    }

    // 8. Canonical Envoy Error Body Indicators
    if (
      htmlBody.includes(
        'upstream connect error or disconnect/reset before headers',
      ) ||
      htmlBody.includes('no healthy upstream') ||
      htmlBody.includes('route_not_found') ||
      htmlBody.includes('cluster_not_found') ||
      htmlBody.includes('direct_response')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Body: Canonical Envoy Error Structure',
        indicator: 'Envoy router connection/cluster failure template',
        observedValue: 'Envoy canonical error pattern',
        confidence: 'MEDIUM',
      });
      signals.push({
        name: 'Envoy Error Body Template',
        type: 'BODY',
        indicator: 'Envoy error response string',
        matched: true,
        weight: 7,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      version,
      versionEvidence,
      role: 'Reverse Proxy / Service Proxy',
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
      implications: this.defaultImplications,
    });
  }
}
