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
export class TraefikDetector extends BaseTechnologyDetector {
  readonly id = 'tech-traefik';
  readonly name = 'Traefik';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'Traefik modern HTTP reverse proxy and cloud-native ingress router';
  readonly role = 'Ingress Gateway / Reverse Proxy';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Traefik as an edge router and ingress reverse proxy for routing traffic to backend services.';
  readonly whatThisDoesNotProve =
    'Traefik ingress gateway evidence confirms reverse proxy routing and traffic management, but does not prove orchestration (Kubernetes, Docker Swarm, Nomad), container runtime (Docker, containerd), origin cloud hosting (AWS, Azure, GCP), microservice architecture, or backend database services without direct independent evidence.';
  readonly defaultImplications = [
    'Cloud-native ingress routing and reverse proxy active at gateway layer',
    'Traffic management and dynamic routing to backend services',
    'Container orchestrators (Kubernetes), container runtimes (Docker), and backend databases remain unobserved unless directly evidenced.',
  ];
  readonly detectionSignals = [
    'Server header containing traefik (e.g. Server: Traefik, Server: traefik/v2.10.4)',
    'x-traefik-router or x-traefik-service routing headers',
    'traefik- specific headers',
    'Via header containing traefik',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: traefik header or explicit Traefik routing headers are observed.';

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

    // 1. Server Header Evidence (Server: Traefik or Server: traefik/v2.10.4)
    if (serverLower.includes('traefik')) {
      isDetected = true;
      const versionMatch = rawServer.match(/traefik(?:\/v?|\s+v?)([\d.]+)/i);
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
        name: 'Traefik Server Banner',
        type: 'HEADER',
        indicator: `server: ${rawServer}`,
        matched: true,
        weight: 10,
      });
    }

    // 2. Via Header Evidence
    if (viaLower.includes('traefik')) {
      isDetected = true;
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: `Via: ${rawVia}`,
        observedValue: rawVia,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Traefik Via Header',
        type: 'HEADER',
        indicator: `via: ${rawVia}`,
        matched: true,
        weight: 8,
      });
    }

    // 3. Custom Traefik Routing / Router Headers
    const headers = context.headers ?? {};
    for (const [key, val] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (
        (lowerKey.startsWith('traefik-') ||
          lowerKey.startsWith('x-traefik-') ||
          lowerKey === 'x-traefik-router' ||
          lowerKey === 'x-traefik-service') &&
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
          name: `Traefik Header (${key})`,
          type: 'HEADER',
          indicator: `${key}: ${val}`,
          matched: true,
          weight: 8,
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
      role: `Ingress Gateway / Reverse Proxy for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
      implications: this.defaultImplications,
      version,
      versionEvidence,
    });
  }
}
