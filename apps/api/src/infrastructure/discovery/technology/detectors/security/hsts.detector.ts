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
export class HstsDetector extends BaseTechnologyDetector {
  readonly id = 'tech-hsts';
  readonly name = 'HTTP Strict Transport Security (HSTS)';
  readonly category = TechnologyCategory.SECURITY;
  readonly description =
    'HTTP Strict Transport Security (HSTS) web security policy mechanism';
  readonly role = 'Security Protocol & HTTPS Enforcement';
  readonly infrastructureMeaning =
    'The public endpoint enforces encrypted HTTPS transport across all client connections via HSTS policy.';
  readonly detectionSignals = [
    'strict-transport-security response header present',
  ];
  readonly confidenceRules =
    'HIGH confidence when strict-transport-security response header is present.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const hasHsts = context.hasHeader('strict-transport-security');

    if (!hasHsts) {
      return null;
    }

    const rawHsts = context.getHeader('strict-transport-security') ?? '';
    const evidence: TechnologyEvidence[] = [
      {
        sourceType: 'HTTP',
        source: 'Response Header: strict-transport-security',
        indicator: `HSTS Policy: ${rawHsts}`,
        observedValue: rawHsts,
        confidence: 'HIGH',
      },
    ];

    const signals: TechnologySignal[] = [
      {
        name: 'HSTS Header',
        type: 'HEADER',
        indicator: 'strict-transport-security',
        matched: true,
        weight: 10,
        details: rawHsts,
      },
    ];

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Enforced encrypted HTTPS transport for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
