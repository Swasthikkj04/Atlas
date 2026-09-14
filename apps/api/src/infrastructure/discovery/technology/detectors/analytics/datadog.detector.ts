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
export class DatadogDetector extends BaseTechnologyDetector {
  readonly id = 'tech-datadog';
  readonly name = 'Datadog';
  readonly category = TechnologyCategory.ANALYTICS;
  readonly description =
    'Datadog observability and security platform for cloud applications';
  readonly role = 'Cloud Observability & APM';
  readonly infrastructureMeaning =
    'The public endpoint sends observability and trace telemetry to Datadog.';
  readonly detectionSignals = [
    'x-datadog-trace-id or x-datadog-parent-id response headers',
    'HTML containing datadoghq.com or @datadog/browser-rum',
    'HTML containing datadogRum.init snippet',
  ];
  readonly confidenceRules =
    'HIGH confidence when Datadog trace headers or RUM script initialization is detected.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasDdTrace =
      context.hasHeader('x-datadog-trace-id') ||
      context.hasHeader('x-datadog-parent-id');
    const hasDdScript =
      context.hasHtmlPattern('datadoghq.com') ||
      context.hasHtmlPattern('datadog-rum') ||
      context.hasHtmlPattern('datadogRum.init');

    if (hasDdTrace) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-datadog-trace-id',
        indicator: 'Datadog distributed APM trace header',
        observedValue:
          context.getHeader('x-datadog-trace-id') ||
          context.getHeader('x-datadog-parent-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Datadog Trace Header',
        type: 'HEADER',
        indicator: 'x-datadog-trace-id',
        matched: true,
        weight: 10,
      });
    }

    if (hasDdScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'Datadog Browser RUM SDK initialization (datadoghq.com / datadogRum)',
        observedValue: 'datadoghq.com',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Datadog RUM SDK',
        type: 'SCRIPT',
        indicator: 'datadoghq.com',
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
      role: `Cloud observability and Real User Monitoring (RUM) for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
