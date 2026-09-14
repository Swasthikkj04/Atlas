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
export class AngularDetector extends BaseTechnologyDetector {
  readonly id = 'tech-angular';
  readonly name = 'Angular';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Angular enterprise web application platform and TypeScript framework';
  readonly role = 'Enterprise Frontend Framework';
  readonly infrastructureMeaning =
    'The public endpoint uses Google Angular framework for client-side execution.';
  readonly detectionSignals = [
    'HTML containing ng-version attribute',
    'HTML containing ng-app or data-ng- attributes',
    'HTML containing _nghost or _ngcontent styling attributes',
  ];
  readonly confidenceRules =
    'HIGH confidence when ng-version or _ngcontent/_nghost attributes are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasNgVersion = context.hasHtmlPattern('ng-version');
    const hasNgApp =
      context.hasHtmlPattern('ng-app') || context.hasHtmlPattern('data-ng-');
    const hasNgHost =
      context.hasHtmlPattern('_nghost') || context.hasHtmlPattern('_ngcontent');

    if (hasNgVersion) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Angular version root attribute (ng-version)',
        observedValue: 'ng-version',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Angular ng-version',
        type: 'BODY',
        indicator: 'ng-version',
        matched: true,
        weight: 10,
      });
    }

    if (hasNgApp) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'AngularJS / Angular bootstrap attribute (ng-app / data-ng-)',
        observedValue: 'ng-app',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Angular Bootstrap Attribute',
        type: 'BODY',
        indicator: 'ng-app',
        matched: true,
        weight: 9,
      });
    }

    if (hasNgHost) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'Angular view encapsulation attribute (_ngcontent / _nghost)',
        observedValue: '_ngcontent',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Angular View Encapsulation',
        type: 'BODY',
        indicator: '_ngcontent',
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
      role: `Enterprise web application framework for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
