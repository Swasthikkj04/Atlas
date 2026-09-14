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
export class NextJsDetector extends BaseTechnologyDetector {
  readonly id = 'tech-nextjs';
  readonly name = 'Next.js';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Next.js full-stack React application and hybrid rendering framework';
  readonly role = 'Application Framework';
  readonly infrastructureMeaning =
    'The public endpoint appears to use the Next.js framework for hybrid client/server-side application delivery and routing.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Next.js',
    'HTML containing __NEXT_DATA__ hydration script tag',
    'HTML containing /_next/static bundle asset chunks',
  ];
  readonly confidenceRules =
    'HIGH confidence when X-Powered-By: Next.js, __NEXT_DATA__, or /_next/static paths are observed.';
  readonly whatThisDoesNotProve =
    'Next.js framework usage does not prove hosting on Vercel; Next.js can be self-hosted on Node.js, Docker, Kubernetes, AWS, or any server without proving backend database or SSR/SSG execution.';
  readonly defaultImplications = [
    'Application utilizes Next.js conventions for frontend component hydration and route handling.',
    'Underlying server hosting (Vercel, custom Node.js, Docker, Kubernetes) remains unobserved unless directly evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawXPoweredBy = context.getHeader('x-powered-by') ?? '';
    const xPoweredBy = rawXPoweredBy.toLowerCase();
    const hasNextData = context.hasHtmlPattern('__NEXT_DATA__');
    const hasNextStatic = context.hasHtmlPattern('/_next/static');

    if (xPoweredBy.includes('next.js') || xPoweredBy.includes('nextjs')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawXPoweredBy}`,
        observedValue: rawXPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Next.js Powered By Header',
        type: 'HEADER',
        indicator: rawXPoweredBy,
        matched: true,
        weight: 10,
      });
    }

    if (hasNextData) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Next.js hydration payload (__NEXT_DATA__)',
        observedValue: '__NEXT_DATA__',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Next.js Hydration Payload',
        type: 'BODY',
        indicator: '__NEXT_DATA__',
        matched: true,
        weight: 10,
      });
    }

    if (hasNextStatic) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Next.js static assets chunk path (/_next/static)',
        observedValue: '/_next/static',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Next.js Static Chunks',
        type: 'BODY',
        indicator: '/_next/static',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `React-based application framework for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
