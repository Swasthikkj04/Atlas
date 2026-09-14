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
export class GoogleTagManagerDetector extends BaseTechnologyDetector {
  readonly id = 'tech-google-tag-manager';
  readonly name = 'Google Tag Manager';
  readonly category = TechnologyCategory.ANALYTICS;
  readonly description =
    'Google Tag Manager tag management system for tracking tags and marketing code';
  readonly role = 'Tag Management & Marketing Telemetry';
  readonly infrastructureMeaning =
    'The public endpoint loads marketing and telemetry scripts via Google Tag Manager.';
  readonly detectionSignals = [
    'HTML containing googletagmanager.com/gtm.js',
    'HTML containing gtm.start event snippet',
  ];
  readonly confidenceRules =
    'HIGH confidence when googletagmanager.com/gtm.js script is loaded.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasGtmScript = context.hasHtmlPattern('googletagmanager.com/gtm.js');
    const hasGtmStart = context.hasHtmlPattern('gtm.start');

    if (hasGtmScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'Google Tag Manager container script (googletagmanager.com/gtm.js)',
        observedValue: 'googletagmanager.com/gtm.js',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GTM Script Include',
        type: 'SCRIPT',
        indicator: 'googletagmanager.com/gtm.js',
        matched: true,
        weight: 10,
      });
    }

    if (hasGtmStart) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'GTM dataLayer container initialization (gtm.start)',
        observedValue: 'gtm.start',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GTM Initialization',
        type: 'BODY',
        indicator: 'gtm.start',
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
      role: `Tag management and container orchestration for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
