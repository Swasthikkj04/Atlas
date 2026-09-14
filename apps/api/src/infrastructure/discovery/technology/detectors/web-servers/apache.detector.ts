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
export class ApacheDetector extends BaseTechnologyDetector {
  readonly id = 'tech-apache';
  readonly name = 'Apache HTTP Server';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'Apache HTTP Server is an open-source HTTP server and reverse proxy for delivering web content';
  readonly role = 'Web Gateway / Web Server';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Apache HTTP Server to serve or participate in handling public HTTP traffic.';
  readonly detectionSignals = [
    'Server response header containing Apache (excluding Tomcat/Coyote)',
    'Version-bearing Apache server tokens (e.g. Apache/2.4.52)',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: Apache header or version-bearing Apache banner is observed.';
  readonly whatThisDoesNotProve =
    'Apache presence does not prove Linux host OS, a particular distribution, PHP, Django, WordPress, Node.js, Docker, Kubernetes, AWS, GCP, Azure, or any specific downstream application architecture.';
  readonly defaultImplications = [
    'Apache HTTP Server acts as the web gateway or reverse proxy handling incoming client connections.',
    'Downstream application execution and host OS remain unobserved unless independently evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const server = context.getHeader('server')?.toLowerCase() ?? '';

    if (!server.includes('apache') || server.includes('coyote')) {
      return null;
    }

    const rawServer = context.getHeader('server') ?? '';
    const versionMatch = rawServer.match(/apache\/([\d.]+)/i);
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
        name: 'Apache Server Banner',
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
      role: `Web gateway and HTTP reverse proxy for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `HTTP response header: Server (${rawServer})`
        : undefined,
    });
  }
}
