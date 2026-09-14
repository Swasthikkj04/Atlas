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
export class SentryDetector extends BaseTechnologyDetector {
  readonly id = 'tech-sentry';
  readonly name = 'Sentry';
  readonly category = TechnologyCategory.ANALYTICS;
  readonly description =
    'Sentry application monitoring, error tracking, and performance tracing platform';
  readonly role = 'Application Performance Monitoring (APM) & Error Tracking';
  readonly infrastructureMeaning =
    'The public endpoint sends error reports and distributed trace telemetry to Sentry.';
  readonly detectionSignals = [
    'sentry-trace response header',
    'HTML containing sentry.io or @sentry/browser package references',
    'HTML containing Sentry.init snippet',
  ];
  readonly confidenceRules =
    'HIGH confidence when sentry-trace header or Sentry SDK initialization is detected.';
  readonly whatThisDoesNotProve =
    'Client-side Sentry error tracking does not prove backend APM monitoring setup or server-side logging pipeline.';
  readonly defaultImplications = [
    'Client-side exceptions and distributed trace headers are captured for error triage.',
    'Application monitoring telemetry is exported to Sentry.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasSentryTrace = context.hasHeader('sentry-trace');
    const hasSentryScript =
      context.hasHtmlPattern('browser.sentry-cdn.com') ||
      context.hasHtmlPattern('sentry.io') ||
      context.hasHtmlPattern('Sentry.init');

    if (hasSentryTrace) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: sentry-trace',
        indicator: 'Sentry distributed tracing header',
        observedValue: context.getHeader('sentry-trace'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Sentry Trace Header',
        type: 'HEADER',
        indicator: 'sentry-trace',
        matched: true,
        weight: 10,
      });
    }

    if (hasSentryScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'Sentry JavaScript error monitoring SDK (Sentry.init / sentry-cdn)',
        observedValue: 'sentry.io',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Sentry SDK Init',
        type: 'SCRIPT',
        indicator: 'sentry.io',
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
      role: `Error monitoring and performance telemetry for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
