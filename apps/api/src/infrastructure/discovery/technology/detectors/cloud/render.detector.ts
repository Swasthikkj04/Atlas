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
export class RenderDetector extends BaseTechnologyDetector {
  readonly id = 'tech-render';
  readonly name = 'Render';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Render unified cloud application and database hosting platform';
  readonly role = 'Cloud Application Hosting';
  readonly infrastructureMeaning =
    'The public endpoint is hosted on Render cloud infrastructure.';
  readonly detectionSignals = [
    'x-render-origin-server response header',
    'Server: Render response header',
    'onrender.com in CNAME records',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-render-origin-server or onrender.com CNAME is observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasRenderHeader = context.hasHeader('x-render-origin-server');
    const hasRenderCname = context.hasCname(/onrender\.com/i);

    if (hasRenderHeader) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-render-origin-server',
        indicator: 'Render origin routing header',
        observedValue: context.getHeader('x-render-origin-server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Render Header',
        type: 'HEADER',
        indicator: 'x-render-origin-server',
        matched: true,
        weight: 10,
      });
    }

    if (server.includes('render')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: Render',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Render Server Header',
        type: 'HEADER',
        indicator: 'server: render',
        matched: true,
        weight: 9,
      });
    }

    if (hasRenderCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Render CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) => /onrender\.com/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Render CNAME',
        type: 'DNS',
        indicator: 'onrender.com CNAME',
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
      role: `Cloud application hosting substrate for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
