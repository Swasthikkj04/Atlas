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
export class PostHogDetector extends BaseTechnologyDetector {
  readonly id = 'tech-posthog';
  readonly name = 'PostHog';
  readonly category = TechnologyCategory.ANALYTICS;
  readonly description =
    'PostHog open-source product analytics, session recording, and feature flagging platform';
  readonly role = 'Product Analytics & Feature Flags';
  readonly infrastructureMeaning =
    'The public endpoint captures telemetry and session analytics via PostHog.';
  readonly detectionSignals = [
    'HTML containing app.posthog.com or posthog-js',
    'HTML containing posthog.init snippet',
    'ph_ cookie in Set-Cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when posthog.init script or PostHog CDN references are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasPostHogScript =
      context.hasHtmlPattern('app.posthog.com') ||
      context.hasHtmlPattern('posthog.js') ||
      context.hasHtmlPattern('posthog.init');
    const hasPhCookie =
      context.hasCookie('ph_') || context.hasCookie('posthog');

    if (hasPostHogScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'PostHog client analytics script reference (posthog.js / posthog.init)',
        observedValue: 'posthog.init',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'PostHog Script Reference',
        type: 'SCRIPT',
        indicator: 'posthog.js',
        matched: true,
        weight: 10,
      });
    }

    if (hasPhCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'PostHog distinct ID session cookie (ph_*)',
        observedValue: 'ph_*',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'PostHog Cookie',
        type: 'COOKIE',
        indicator: 'ph_*',
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
      role: `Product analytics and session recording for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
