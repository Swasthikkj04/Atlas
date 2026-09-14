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
export class FlyIoDetector extends BaseTechnologyDetector {
  readonly id = 'tech-flyio';
  readonly name = 'Fly.io';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Fly.io distributed application execution substrate and global edge proxy';
  readonly role = 'Global Distributed Runtime';
  readonly infrastructureMeaning =
    'The public endpoint runs on Fly.io distributed edge infrastructure.';
  readonly detectionSignals = [
    'fly-request-id response header',
    'Server: Fly.io response header',
    'fly.dev in CNAME records',
  ];
  readonly confidenceRules =
    'HIGH confidence when fly-request-id header or fly.dev CNAME is observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasFlyRequestId = context.hasHeader('fly-request-id');
    const hasFlyCname = context.hasCname(/fly\.dev/i);

    if (hasFlyRequestId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: fly-request-id',
        indicator: 'Fly.io request trace header',
        observedValue: context.getHeader('fly-request-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Fly Request ID',
        type: 'HEADER',
        indicator: 'fly-request-id',
        matched: true,
        weight: 10,
      });
    }

    if (server.includes('fly.io') || server === 'fly') {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: Fly.io',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Fly Server Header',
        type: 'HEADER',
        indicator: 'server: fly.io',
        matched: true,
        weight: 9,
      });
    }

    if (hasFlyCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Fly.io CNAME routing target',
        observedValue: context.dns?.cname
          ?.filter((c) => /fly\.dev/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Fly CNAME',
        type: 'DNS',
        indicator: 'fly.dev CNAME',
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
      role: `Global distributed application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
