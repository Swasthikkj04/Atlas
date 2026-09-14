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
export class NginxDetector extends BaseTechnologyDetector {
  readonly id = 'tech-nginx';
  readonly name = 'NGINX';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'NGINX high-performance web server, reverse proxy, and HTTP gateway';
  readonly role = 'Web Gateway / Reverse Proxy';
  readonly infrastructureMeaning =
    'NGINX appears to participate in handling or forwarding public HTTP traffic at the observed gateway/application boundary.';
  readonly detectionSignals = [
    'Server response header containing nginx',
    'Version-bearing Server header (e.g. nginx/1.24.0)',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: nginx header or version signature is observed.';
  readonly whatThisDoesNotProve =
    'NGINX presence confirms web gateway software, but does not prove underlying Linux distribution, Docker, Kubernetes, AWS/cloud hosting, or downstream application framework.';
  readonly defaultImplications = [
    'NGINX handles HTTP request ingress, reverse proxying, or static file delivery.',
    'Downstream application services may reside behind NGINX proxy.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const server = context.getHeader('server')?.toLowerCase() ?? '';

    if (!server.includes('nginx')) {
      return null;
    }

    const rawServer = context.getHeader('server') ?? '';
    const versionMatch = rawServer.match(/nginx\/([\d.]+)/i);
    const version = versionMatch ? versionMatch[1] : undefined;

    const evidence: TechnologyEvidence[] = [
      {
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      },
    ];

    const signals: TechnologySignal[] = [
      {
        name: 'NGINX Server Banner',
        type: 'HEADER',
        indicator: rawServer,
        matched: true,
        weight: 10,
      },
    ];

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Web gateway and reverse proxy for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
    });
  }
}
