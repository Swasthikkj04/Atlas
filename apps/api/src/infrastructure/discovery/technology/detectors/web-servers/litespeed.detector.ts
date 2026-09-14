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
export class LiteSpeedDetector extends BaseTechnologyDetector {
  readonly id = 'tech-litespeed';
  readonly name = 'LiteSpeed Web Server';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'LiteSpeed high-performance, event-driven, Apache-compatible web server';
  readonly role = 'Web Server & Ingress';
  readonly infrastructureMeaning =
    'The public endpoint is served by a LiteSpeed web server.';
  readonly detectionSignals = ['Server header containing litespeed'];
  readonly confidenceRules =
    'HIGH confidence when Server: litespeed header is observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const server = context.getHeader('server')?.toLowerCase() ?? '';

    if (!server.includes('litespeed')) {
      return null;
    }

    const rawServer = context.getHeader('server') ?? '';
    const evidence: TechnologyEvidence[] = [
      {
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      },
    ];

    const signals: TechnologySignal[] = [
      {
        name: 'LiteSpeed Server Banner',
        type: 'HEADER',
        indicator: rawServer,
        matched: true,
        weight: 10,
      },
    ];

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `High-performance event-driven web server for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
