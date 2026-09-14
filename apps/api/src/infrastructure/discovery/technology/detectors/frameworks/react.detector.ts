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
export class ReactDetector extends BaseTechnologyDetector {
  readonly id = 'tech-react';
  readonly name = 'React';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'React is a JavaScript UI library used to build component-based web interfaces';
  readonly role = 'Client UI & Presentation Layer';
  readonly infrastructureMeaning =
    'The public endpoint appears to use React for its browser-facing presentation layer, while keeping server-side architecture separate.';
  readonly detectionSignals = [
    'HTML containing data-reactroot or data-reactid attributes',
    'HTML containing _reactListening, __reactFiber, or __reactProps runtime markers',
    'HTML or scripts referencing react-dom bundle packages',
  ];
  readonly confidenceRules =
    'HIGH confidence when React DOM root markers, fiber runtime properties, or react-dom bundles are observed.';
  readonly whatThisDoesNotProve =
    'React presence confirms client-side UI rendering, but does not prove Next.js, Vercel, Node.js backend, SSR/SSG execution, or underlying cloud hosting provider.';
  readonly defaultImplications = [
    'Client-side user interface components are structured and rendered via React.',
    'Browser runtime executes React DOM reconciliation and client event listeners.',
    'Backend application logic and server runtime operate independently behind web responses.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasReactRoot =
      context.hasHtmlPattern('data-reactroot') ||
      context.hasHtmlPattern('data-reactid');
    const hasReactInternal =
      context.hasHtmlPattern('_reactListening') ||
      context.hasHtmlPattern('__reactFiber') ||
      context.hasHtmlPattern('__reactProps');
    const hasReactDom = context.hasHtmlPattern('react-dom');

    if (hasReactRoot) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'React root DOM attribute (data-reactroot/data-reactid)',
        observedValue: 'data-reactroot',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'React Root Attribute',
        type: 'BODY',
        indicator: 'data-reactroot',
        matched: true,
        weight: 10,
      });
    }

    if (hasReactInternal) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'React fiber internal runtime properties (__reactFiber)',
        observedValue: '__reactFiber',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'React Fiber Properties',
        type: 'BODY',
        indicator: '__reactFiber',
        matched: true,
        weight: 10,
      });
    }

    if (hasReactDom) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'react-dom client runtime package reference',
        observedValue: 'react-dom',
        confidence: 'MEDIUM',
      });
      signals.push({
        name: 'React DOM Package',
        type: 'SCRIPT',
        indicator: 'react-dom',
        matched: true,
        weight: 7,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    const confidence = evidence.some((e) => e.confidence === 'HIGH')
      ? 0.95
      : 0.85;

    return this.createResult({
      confidence,
      confidenceLevel: confidence >= 0.9 ? 'HIGH' : 'MEDIUM',
      evidence,
      signals,
      role: `Client-side UI rendering for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
