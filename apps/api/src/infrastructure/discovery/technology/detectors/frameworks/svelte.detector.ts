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
export class SvelteDetector extends BaseTechnologyDetector {
  readonly id = 'tech-svelte';
  readonly name = 'Svelte';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Svelte cybernetically enhanced web application compiler and framework';
  readonly role = 'Compiled Frontend UI Framework';
  readonly infrastructureMeaning =
    'The client interface is compiled and served using Svelte / SvelteKit.';
  readonly detectionSignals = [
    'HTML containing svelte- scoped classes or attributes',
    'HTML containing __svelte internal markers',
  ];
  readonly confidenceRules =
    'HIGH confidence when svelte- class hashes or __svelte properties are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasSvelteClass =
      context.hasHtmlPattern(/class="[^"]*svelte-[a-z0-9]+/i) ||
      context.hasHtmlPattern('svelte-');
    const hasSvelteInternal = context.hasHtmlPattern('__svelte');

    if (hasSvelteClass) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Svelte scoped CSS class pattern (svelte-*)',
        observedValue: 'svelte-*',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Svelte Scoped Class',
        type: 'BODY',
        indicator: 'svelte-',
        matched: true,
        weight: 10,
      });
    }

    if (hasSvelteInternal) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Svelte runtime internal property (__svelte)',
        observedValue: '__svelte',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Svelte Runtime Marker',
        type: 'BODY',
        indicator: '__svelte',
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
      role: `Compiled reactive web UI for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
