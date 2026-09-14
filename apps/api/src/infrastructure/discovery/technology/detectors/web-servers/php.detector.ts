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
export class PhpDetector extends BaseTechnologyDetector {
  readonly id = 'tech-php';
  readonly name = 'PHP';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'PHP is a server-side scripting runtime environment commonly used to execute web applications';
  readonly role = 'Server-side Application Runtime';
  readonly infrastructureMeaning =
    'The observed endpoint appears to execute or expose a PHP-based server-side application/runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing PHP',
    'Set-Cookie header containing PHPSESSID session token',
  ];
  readonly confidenceRules =
    'HIGH confidence when X-Powered-By: PHP or PHPSESSID cookie is observed.';
  readonly whatThisDoesNotProve =
    'PHP presence confirms server-side runtime, but does not prove WordPress, Laravel, Symfony, Drupal, Apache, NGINX, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any specific database.';
  readonly defaultImplications = [
    'Application executes server-side scripting logic within a PHP runtime interpreter.',
    'Upstream web gateway, downstream database, and host infrastructure remain unobserved unless directly evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawPoweredBy = context.getHeader('x-powered-by') ?? '';
    const xPoweredBy = rawPoweredBy.toLowerCase();
    const hasPhpSession = context.hasCookie('phpsessid');

    let version: string | undefined;

    if (xPoweredBy.includes('php')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'PHP Powered By',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const versionMatch = rawPoweredBy.match(/php\/([\d.]+)/i);
      version = versionMatch ? versionMatch[1] : undefined;
    }

    if (hasPhpSession) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'PHP standard session cookie (PHPSESSID)',
        observedValue: 'PHPSESSID',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'PHPSESSID Cookie',
        type: 'COOKIE',
        indicator: 'phpsessid',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Server-side application execution runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `HTTP response header: X-Powered-By (${rawPoweredBy})`
        : undefined,
    });
  }
}
