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
export class VueDetector extends BaseTechnologyDetector {
  readonly id = 'tech-vue';
  readonly name = 'Vue.js';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Vue.js progressive JavaScript framework for building user interfaces';
  readonly role = 'Frontend UI Framework';
  readonly infrastructureMeaning =
    'The public endpoint uses Vue.js framework for frontend rendering.';
  readonly detectionSignals = [
    'HTML containing data-v- scope attributes',
    'HTML containing v-bind, v-for, or v-if directives',
    'HTML containing __vue__ DOM properties',
  ];
  readonly confidenceRules =
    'HIGH confidence when data-v- or Vue template directives are observed in the markup.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasDataV = context.hasHtmlPattern('data-v-');
    const hasVueDirectives =
      context.hasHtmlPattern('v-bind') ||
      context.hasHtmlPattern('v-for') ||
      context.hasHtmlPattern('v-if') ||
      context.hasHtmlPattern('v-model');
    const hasVueGlobal = context.hasHtmlPattern('__vue__');

    if (hasDataV) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Vue scoped CSS attribute (data-v-*)',
        observedValue: 'data-v-',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vue Scoped CSS',
        type: 'BODY',
        indicator: 'data-v-',
        matched: true,
        weight: 10,
      });
    }

    if (hasVueDirectives) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Vue template directive (v-bind/v-for/v-if/v-model)',
        observedValue: 'v-directive',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vue Directives',
        type: 'BODY',
        indicator: 'v-bind / v-for',
        matched: true,
        weight: 9,
      });
    }

    if (hasVueGlobal) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Vue instance global attachment (__vue__)',
        observedValue: '__vue__',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Vue Global Instance',
        type: 'BODY',
        indicator: '__vue__',
        matched: true,
        weight: 10,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.92,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Progressive JavaScript UI framework for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
