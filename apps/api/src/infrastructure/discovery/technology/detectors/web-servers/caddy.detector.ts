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
export class CaddyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-caddy';
  readonly name = 'Caddy';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'Caddy enterprise-ready, open-source web server with automatic HTTPS and dynamic reverse proxying';
  readonly role = 'Web Server / Ingress Gateway';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Caddy as an ingress web server and reverse proxy with automatic TLS management.';
  readonly whatThisDoesNotProve =
    'Caddy web server evidence confirms ingress gateway and automated TLS termination, but does not prove containerization (Docker, Podman), orchestration (Kubernetes), origin hosting (AWS, Azure, GCP, private VPS), Go application runtime, or backend database services without direct independent evidence.';
  readonly defaultImplications = [
    'Automated TLS / HTTPS termination active at ingress layer',
    'Reverse proxy routing to backend origin services',
    'Origin compute runtime, containerization, and backend database remain unobserved unless directly evidenced.',
  ];
  readonly detectionSignals = [
    'Server header containing caddy (e.g. Server: Caddy, Server: Caddy/v2.7.6)',
    'x-caddy- or caddy- custom headers',
    'Via header containing caddy',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: caddy header or explicit Caddy wire signatures are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawServer = context.getHeader('server') ?? '';
    const serverLower = rawServer.toLowerCase();
    const rawVia = context.getHeader('via') ?? '';
    const viaLower = rawVia.toLowerCase();

    let isDetected = false;
    let version: string | undefined;
    let versionEvidence: string | undefined;

    // 1. Server Header Evidence (Server: Caddy or Server: Caddy/v2.7.6)
    if (serverLower.includes('caddy')) {
      isDetected = true;
      const versionMatch = rawServer.match(/caddy(?:\/v?|\s+v?)([\d.]+)/i);
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
        name: 'Caddy Server Banner',
        type: 'HEADER',
        indicator: `server: ${rawServer}`,
        matched: true,
        weight: 10,
      });
    }

    // 2. Via Header Evidence
    if (viaLower.includes('caddy')) {
      isDetected = true;
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: `Via: ${rawVia}`,
        observedValue: rawVia,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Caddy Via Header',
        type: 'HEADER',
        indicator: `via: ${rawVia}`,
        matched: true,
        weight: 8,
      });
    }

    // 3. Custom Caddy Diagnostic / Routing Headers
    const headers = context.headers ?? {};
    for (const [key, val] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (
        (lowerKey.startsWith('caddy-') || lowerKey.startsWith('x-caddy-')) &&
        val
      ) {
        isDetected = true;
        evidence.push({
          sourceType: 'HTTP',
          source: `Response Header: ${key}`,
          indicator: `${key}: ${val}`,
          observedValue: String(val),
          confidence: 'HIGH',
        });
        signals.push({
          name: `Caddy Header (${key})`,
          type: 'HEADER',
          indicator: `${key}: ${val}`,
          matched: true,
          weight: 7,
        });
      }
    }

    if (!isDetected) {
      return null;
    }

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Web Server / Ingress Gateway for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
      implications: this.defaultImplications,
      version,
      versionEvidence,
    });
  }
}
