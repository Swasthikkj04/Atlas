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
export class NewRelicDetector extends BaseTechnologyDetector {
  readonly id = 'tech-new-relic';
  readonly name = 'New Relic';
  readonly category = TechnologyCategory.ANALYTICS;
  readonly description =
    'New Relic full-stack observability and application performance monitoring platform';
  readonly role = 'Application Performance Monitoring (APM)';
  readonly infrastructureMeaning =
    'The public endpoint sends transaction and browser performance metrics to New Relic.';
  readonly detectionSignals = [
    'x-newrelic-id or x-newrelic-app-data response headers',
    'HTML containing newrelic.com or NREUM browser agent payload',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-newrelic-* headers or NREUM browser monitoring script is observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasNrHeader =
      context.hasHeader('x-newrelic-id') ||
      context.hasHeader('x-newrelic-app-data');
    const hasNrScript =
      context.hasHtmlPattern('js-agent.newrelic.com') ||
      context.hasHtmlPattern('NREUM');

    if (hasNrHeader) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-newrelic-id',
        indicator: 'New Relic cross-application tracing header',
        observedValue:
          context.getHeader('x-newrelic-id') ||
          context.getHeader('x-newrelic-app-data'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'New Relic Header',
        type: 'HEADER',
        indicator: 'x-newrelic-id',
        matched: true,
        weight: 10,
      });
    }

    if (hasNrScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'New Relic browser telemetry agent (NREUM / js-agent.newrelic.com)',
        observedValue: 'NREUM',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'New Relic Browser Agent',
        type: 'SCRIPT',
        indicator: 'NREUM',
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
      role: `Application performance monitoring (APM) for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
