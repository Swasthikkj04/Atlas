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
export class GoogleAnalyticsDetector extends BaseTechnologyDetector {
  readonly id = 'tech-google-analytics';
  readonly name = 'Google Analytics';
  readonly category = TechnologyCategory.ANALYTICS;
  readonly description =
    'Google Analytics web analytics service that tracks and reports website traffic';
  readonly role = 'Web Analytics & User Measurement';
  readonly infrastructureMeaning =
    'The public endpoint integrates Google Analytics tracking infrastructure.';
  readonly detectionSignals = [
    'HTML containing google-analytics.com/analytics.js or gtag.js',
    'HTML containing gtag("config", "G-...") or ga("create", "UA-...")',
    '_ga or _gid cookies in Set-Cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when gtag/ga script tags, Google Analytics scripts, or _ga cookies are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasGaScript =
      context.hasHtmlPattern('google-analytics.com/analytics.js') ||
      context.hasHtmlPattern('google-analytics.com/ga.js');
    const hasGtagConfig =
      context.hasHtmlPattern("gtag('config'") ||
      context.hasHtmlPattern('gtag("config"');
    const hasGaCookie = context.hasCookie('_ga') || context.hasCookie('_gid');

    if (hasGaScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Google Analytics client library reference (analytics.js)',
        observedValue: 'google-analytics.com/analytics.js',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GA Script Library',
        type: 'SCRIPT',
        indicator: 'google-analytics.com/analytics.js',
        matched: true,
        weight: 10,
      });
    }

    if (hasGtagConfig) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Google Analytics gtag config initialization snippet',
        observedValue: 'gtag("config")',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GA gtag Configuration',
        type: 'BODY',
        indicator: 'gtag("config")',
        matched: true,
        weight: 10,
      });
    }

    if (hasGaCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'Google Analytics visitor tracking cookie (_ga/_gid)',
        observedValue: '_ga',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GA Visitor Cookie',
        type: 'COOKIE',
        indicator: '_ga',
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
      role: `Web traffic measurement and behavioral telemetry for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
