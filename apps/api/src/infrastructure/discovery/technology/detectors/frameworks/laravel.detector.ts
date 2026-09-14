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
export class LaravelDetector extends BaseTechnologyDetector {
  readonly id = 'tech-laravel';
  readonly name = 'Laravel';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Laravel expressive PHP web application framework with elegant syntax';
  readonly role = 'Web Application Framework';
  readonly infrastructureMeaning =
    'The application backend is built with the Laravel PHP framework.';
  readonly detectionSignals = [
    'laravel_session cookie in Set-Cookie',
    'X-Powered-By header containing Laravel',
    'XSRF-TOKEN cookie combined with laravel session cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when laravel_session cookie or Laravel powered-by header is detected.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasLaravelCookie = context.hasCookie('laravel_session');
    const xPoweredBy = context.getHeader('x-powered-by')?.toLowerCase() ?? '';

    if (hasLaravelCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'Laravel default session cookie (laravel_session)',
        observedValue: 'laravel_session',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Laravel Session Cookie',
        type: 'COOKIE',
        indicator: 'laravel_session',
        matched: true,
        weight: 10,
      });
    }

    if (xPoweredBy.includes('laravel')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${context.getHeader('x-powered-by')}`,
        observedValue: context.getHeader('x-powered-by'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Laravel Powered By',
        type: 'HEADER',
        indicator: 'x-powered-by: laravel',
        matched: true,
        weight: 10,
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
      role: `PHP web application framework backend for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
