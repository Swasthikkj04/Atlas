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
export class KotlinDetector extends BaseTechnologyDetector {
  readonly id = 'tech-kotlin';
  readonly name = 'Kotlin';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Kotlin is a statically typed JVM programming language used for server-side applications and services';
  readonly role = 'Server-side Application Runtime / Kotlin JVM Language';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose or execute a Kotlin-based server-side application/runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Kotlin or Ktor',
    'Server response header containing Kotlin or Ktor',
    'Custom runtime headers such as x-kotlin-version',
  ];
  readonly confidenceRules =
    'HIGH confidence when explicit Kotlin runtime headers, Server banners containing Kotlin/Ktor, or Kotlin runtime version signatures are observed.';
  readonly whatThisDoesNotProve =
    'Kotlin presence confirms server-side JVM language execution, but does not prove Spring Boot, Ktor, Java, Tomcat, Jetty, JVM version, Docker, Kubernetes, Linux, AWS, GCP, Azure, Android, or any database (PostgreSQL, MySQL, MongoDB, Redis).';
  readonly defaultImplications = [
    'Application executes within a Kotlin server-side runtime environment.',
    'Frameworks (Spring Boot, Ktor), application servers (Tomcat, Jetty), JVM version, databases, and cloud hosting remain unobserved unless directly evidenced.',
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
    const rawKotlinVer = context.getHeader('x-kotlin-version');

    let version: string | undefined;

    // 1. Check X-Powered-By header
    if (xPoweredBy.includes('kotlin') || xPoweredBy.includes('ktor')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Kotlin Powered By Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const kotlinVerMatch = rawPoweredBy.match(/kotlin[\/ ]v?([\d.]+)/i);
      if (kotlinVerMatch) {
        version = kotlinVerMatch[1];
      }
    }

    // 2. Check Server header for Kotlin or Ktor
    if (server.includes('kotlin') || server.includes('ktor')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Kotlin Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(/kotlin[\/ ]v?([\d.]+)/i);
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check X-Kotlin-Version header
    if (rawKotlinVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-kotlin-version',
        indicator: `X-Kotlin-Version: ${rawKotlinVer}`,
        observedValue: rawKotlinVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-Kotlin-Version Header',
        type: 'HEADER',
        indicator: rawKotlinVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawKotlinVer.replace(/^(?:kotlin)?v?/i, '').trim();
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
      role: `Server-side Kotlin application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Extracted Kotlin version ${version}`
        : undefined,
    });
  }
}
