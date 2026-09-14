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
export class F5BigIpDetector extends BaseTechnologyDetector {
  readonly id = 'tech-f5-bigip';
  readonly name = 'F5 BIG-IP';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'F5 BIG-IP enterprise application delivery controller and load balancer';
  readonly role = 'Enterprise Load Balancer & Ingress Gateway';
  readonly infrastructureMeaning =
    'The public endpoint is fronted by an F5 BIG-IP application delivery and load balancing appliance.';
  readonly detectionSignals = [
    'Server header containing big-ip or bigip',
    'x-cnection response header',
    'bigipserver in Set-Cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: BIG-IP header, x-cnection, or BIG-IP cookies are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasCnection = context.hasHeader('x-cnection');
    const hasBigIpCookie = context.hasCookie('bigipserver');

    if (server.includes('big-ip') || server.includes('bigip')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${context.getHeader('server')}`,
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'BIG-IP Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });
    }

    if (hasCnection) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-cnection',
        indicator: 'F5 BIG-IP X-CNECTION header',
        observedValue: context.getHeader('x-cnection'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'F5 CNECTION Header',
        type: 'HEADER',
        indicator: 'x-cnection',
        matched: true,
        weight: 9,
      });
    }

    if (hasBigIpCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'BIG-IP session persistence cookie (BigIPServer*)',
        observedValue: 'BIGipServer',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'BIG-IP Cookie',
        type: 'COOKIE',
        indicator: 'bigipserver',
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
      role: `Enterprise application delivery and load balancing for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
