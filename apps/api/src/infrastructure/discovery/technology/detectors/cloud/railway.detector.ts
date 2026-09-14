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
export class RailwayDetector extends BaseTechnologyDetector {
  readonly id = 'tech-railway';
  readonly name = 'Railway';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Railway PaaS application deployment and database hosting infrastructure';
  readonly role = 'Cloud Application Platform';
  readonly infrastructureMeaning =
    'The public endpoint is deployed on Railway cloud infrastructure.';
  readonly detectionSignals = [
    'x-railway-request-id response header',
    'railway.app in CNAME records',
    'Server: Railway response header',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-railway-request-id header or railway.app CNAME is observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasRailwayHeader = context.hasHeader('x-railway-request-id');
    const hasRailwayCname = context.hasCname(/railway\.app/i);

    if (hasRailwayHeader) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-railway-request-id',
        indicator: 'Railway request identifier header',
        observedValue: context.getHeader('x-railway-request-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Railway Request ID',
        type: 'HEADER',
        indicator: 'x-railway-request-id',
        matched: true,
        weight: 10,
      });
    }

    if (server.includes('railway')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: Railway',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Railway Server Header',
        type: 'HEADER',
        indicator: 'server: railway',
        matched: true,
        weight: 9,
      });
    }

    if (hasRailwayCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Railway CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) => /railway\.app/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Railway CNAME',
        type: 'DNS',
        indicator: 'railway.app CNAME',
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
      role: `PaaS application deployment substrate for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
