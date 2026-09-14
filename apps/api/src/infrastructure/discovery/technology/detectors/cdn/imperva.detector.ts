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
export class ImpervaDetector extends BaseTechnologyDetector {
  readonly id = 'tech-imperva';
  readonly name = 'Imperva Incapsula';
  readonly category = TechnologyCategory.CDN_EDGE;
  readonly description =
    'Imperva Incapsula cloud web application firewall (WAF), DDoS protection, and CDN';
  readonly role = 'WAF & Security Gateway';
  readonly infrastructureMeaning =
    'The public endpoint is protected by Imperva Incapsula cloud WAF and security proxy infrastructure.';
  readonly detectionSignals = [
    'x-iinfo response header',
    'x-cdn header containing incapsula',
    'Server header containing incapsula',
    'incap_ses in Set-Cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-iinfo header, Server: incapsula, or Incapsula session cookies are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasIinfo = context.hasHeader('x-iinfo');
    const xCdn = context.getHeader('x-cdn')?.toLowerCase() ?? '';
    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasIncapCookie = context.hasCookie('incap_ses');

    if (hasIinfo) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-iinfo',
        indicator: 'Imperva Incapsula session inspection trace (X-Iinfo)',
        observedValue: context.getHeader('x-iinfo'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Imperva Iinfo Header',
        type: 'HEADER',
        indicator: 'x-iinfo',
        matched: true,
        weight: 10,
      });
    }

    if (xCdn.includes('incapsula')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-cdn',
        indicator: 'Imperva Incapsula CDN identifier',
        observedValue: context.getHeader('x-cdn'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Imperva CDN Header',
        type: 'HEADER',
        indicator: 'x-cdn: incapsula',
        matched: true,
        weight: 10,
      });
    }

    if (server.includes('incapsula')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${context.getHeader('server')}`,
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Imperva Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });
    }

    if (hasIncapCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'Imperva Incapsula session cookie (incap_ses)',
        observedValue: 'incap_ses',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Imperva Session Cookie',
        type: 'COOKIE',
        indicator: 'incap_ses',
        matched: true,
        weight: 10,
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
      role: `Web application firewall (WAF) and DDoS protection for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
