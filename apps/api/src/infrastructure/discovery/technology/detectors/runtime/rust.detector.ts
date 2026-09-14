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
export class RustDetector extends BaseTechnologyDetector {
  readonly id = 'tech-rust';
  readonly name = 'Rust';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Rust is a compiled systems programming language and runtime ecosystem commonly used for high-performance network services, APIs, and infrastructure software';
  readonly role = 'Server-side Application Runtime / Rust Environment';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose or execute a Rust-based server-side application/runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Rust or Rust web framework',
    'Server response header containing Rust, actix-web, rocket, axum, or warp',
    'Custom runtime headers such as x-rust-version',
  ];
  readonly confidenceRules =
    'HIGH confidence when explicit Rust runtime headers, Server banners containing Rust/actix-web/rocket/axum, or Rust runtime version signatures are observed.';
  readonly whatThisDoesNotProve =
    'Rust presence confirms server-side runtime execution, but does not prove Axum, Actix Web, Rocket, Warp, Tide, Tokio, Linux, Docker, Kubernetes, AWS, GCP, Azure, or any database (PostgreSQL, MySQL, MongoDB, Redis).';
  readonly defaultImplications = [
    'Application executes within a compiled Rust server-side runtime environment.',
    'Application frameworks (Axum, Actix Web), web servers/gateways (NGINX), databases, and cloud hosting remain unobserved unless directly evidenced.',
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
    const rawRustVer = context.getHeader('x-rust-version');

    let version: string | undefined;

    // 1. Check X-Powered-By header
    if (
      xPoweredBy.includes('rust') ||
      xPoweredBy.includes('actix') ||
      xPoweredBy.includes('rocket') ||
      xPoweredBy.includes('axum')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Rust Powered By Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const rustVerMatch = rawPoweredBy.match(/rust[\/ ]v?([\d.]+)/i);
      if (rustVerMatch) {
        version = rustVerMatch[1];
      }
    }

    // 2. Check Server header for Rust, actix-web, rocket, axum, warp
    if (
      server.includes('rust') ||
      server.includes('actix-web') ||
      server.includes('rocket') ||
      server.includes('axum') ||
      server.includes('warp')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Rust Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(/rust[\/ ]v?([\d.]+)/i);
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check X-Rust-Version header
    if (rawRustVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-rust-version',
        indicator: `X-Rust-Version: ${rawRustVer}`,
        observedValue: rawRustVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-Rust-Version Header',
        type: 'HEADER',
        indicator: rawRustVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawRustVer.replace(/^(?:rust)?v?/i, '').trim();
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
      role: `Server-side Rust application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Extracted Rust version ${version}`
        : undefined,
    });
  }
}
