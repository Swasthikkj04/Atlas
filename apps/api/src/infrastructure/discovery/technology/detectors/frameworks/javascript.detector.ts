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
export class JavaScriptDetector extends BaseTechnologyDetector {
  readonly id = 'tech-javascript';
  readonly name = 'JavaScript';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'JavaScript is a client-side programming/runtime language used to provide browser-executed application behavior and interactive web functionality';
  readonly role = 'Client-side Application / Presentation Runtime';
  readonly infrastructureMeaning =
    'The observed endpoint delivers JavaScript that participates in browser-side application behavior.';
  readonly detectionSignals = [
    'HTML containing <script> tags or script asset references (.js)',
    'HTML containing module scripts (type="module") or inline JavaScript execution',
    'HTTP Content-Type header containing application/javascript or text/javascript',
  ];
  readonly confidenceRules =
    'HIGH confidence when script elements, JavaScript bundle assets (.js), or JavaScript MIME types are observed in endpoint responses.';
  readonly whatThisDoesNotProve =
    'JavaScript presence confirms client-side execution, but does not prove Node.js, Bun, Deno, React, Next.js, Vue, Angular, a JavaScript backend, SSR, SSG, SPA, MPA, hydration, Webpack, Vite, Rollup, esbuild, Turbopack, or any cloud provider.';
  readonly defaultImplications = [
    'Endpoint delivers client-side scripts executed by modern web browsers.',
    'Backend application logic and server runtime operate independently behind HTTP responses.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasScriptTag =
      context.hasHtmlPattern('<script') || context.hasHtmlPattern('</script>');
    const hasJsAsset =
      context.hasHtmlPattern('.js"') ||
      context.hasHtmlPattern(".js'") ||
      context.hasHtmlPattern('.js?');
    const hasModuleScript =
      context.hasHtmlPattern('type="module"') ||
      context.hasHtmlPattern("type='module'") ||
      context.hasHtmlPattern('type="text/javascript"') ||
      context.hasHtmlPattern("type='text/javascript'");
    const contentType = context.getHeader('content-type')?.toLowerCase() ?? '';
    const hasJsContentType =
      contentType.includes('javascript') ||
      contentType.includes('application/x-javascript');

    if (hasScriptTag || hasJsAsset || hasModuleScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Document',
        indicator: 'Client-side script assets and execution tags (<script>)',
        observedValue: '<script>',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'JavaScript Script Elements',
        type: 'BODY',
        indicator: '<script>',
        matched: true,
        weight: 10,
      });
    }

    if (hasJsContentType) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: content-type',
        indicator: `Content-Type: ${context.getHeader('content-type')}`,
        observedValue: context.getHeader('content-type'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'JavaScript MIME Type',
        type: 'HEADER',
        indicator: contentType,
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
      role: `Client-side application presentation runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version: undefined, // Version intentionally omitted to prevent fabrication
    });
  }
}
