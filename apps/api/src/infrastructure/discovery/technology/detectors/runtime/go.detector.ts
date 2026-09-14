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
export class GoDetector extends BaseTechnologyDetector {
  readonly id = 'tech-go';
  readonly name = 'Go';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Go is a compiled programming language and server-side runtime ecosystem commonly used for network services, APIs, and infrastructure software';
  readonly role = 'Server-side Application Runtime / Go Environment';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose or execute a Go-based server-side application/runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Go or Golang',
    'Server response header containing Go, Golang, or fasthttp',
    'Custom runtime headers such as x-go-version',
  ];
  readonly confidenceRules =
    'HIGH confidence when explicit Go runtime headers, Server banners containing Go/Golang/fasthttp, or Go runtime version signatures are observed.';
  readonly whatThisDoesNotProve =
    'Go presence confirms server-side runtime execution, but does not prove Gin, Echo, Fiber, Chi, net/http, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any database (PostgreSQL, MySQL, MongoDB, Redis).';
  readonly defaultImplications = [
    'Application executes within a compiled Go server-side runtime environment.',
    'Application frameworks (Gin, Echo, Fiber), web servers/gateways (NGINX), databases, and cloud hosting remain unobserved unless directly evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawPoweredBy = context.getHeader('x-powered-by') ?? '';
    const xPoweredBy = rawPoweredBy.toLowerCase();
    const rawServer = context.getHeader('server') ?? '';
    const server = rawServer.toLowerCase();
    const rawGoVer = context.getHeader('x-go-version');

    let version: string | undefined;

    // 1. Check X-Powered-By header
    if (
      xPoweredBy.includes('golang') ||
      (xPoweredBy.includes('go') && !xPoweredBy.includes('google'))
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Go Powered By Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const goVerMatch = rawPoweredBy.match(
        /(?:go(?:lang)?)[\/ ](?:go)?v?([\d.]+)/i,
      );
      if (goVerMatch) {
        version = goVerMatch[1];
      }
    }

    // 2. Check Server header for Go, Golang, fasthttp
    if (
      server.includes('golang') ||
      server.includes('fasthttp') ||
      server.startsWith('go/') ||
      server.startsWith('go ') ||
      server.includes('go-http-client')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Go Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(
          /(?:go(?:lang)?)[\/ ](?:go)?v?([\d.]+)/i,
        );
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check X-Go-Version header
    if (rawGoVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-go-version',
        indicator: `X-Go-Version: ${rawGoVer}`,
        observedValue: rawGoVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-Go-Version Header',
        type: 'HEADER',
        indicator: rawGoVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawGoVer.replace(/^(?:go)?v?/i, '').trim();
        if (/^[\d.]+$/.test(cleanVer)) {
          version = cleanVer;
        }
      }
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Server-side Go application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version ? `Extracted Go version ${version}` : undefined,
    });
  }
}
