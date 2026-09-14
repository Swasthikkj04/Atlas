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
export class CloudFrontDetector extends BaseTechnologyDetector {
  readonly id = 'tech-cloudfront';
  readonly name = 'AWS CloudFront';
  readonly category = TechnologyCategory.CDN_EDGE;
  readonly description =
    'Amazon CloudFront global content delivery network and edge caching distribution';
  readonly role = 'Edge / CDN Delivery';
  readonly infrastructureMeaning =
    "The public endpoint appears to use AWS's edge network to deliver and cache traffic before requests reach the origin infrastructure.";
  readonly detectionSignals = [
    'x-amz-cf-id response header',
    'x-amz-cf-pop response header',
    'Via header containing cloudfront.net',
    'Server: CloudFront response header',
    'X-Cache containing CloudFront',
    'cloudfront.net in CNAME records',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-amz-cf-* headers, Server: CloudFront, or CloudFront CNAME records are detected.';
  readonly whatThisDoesNotProve =
    'CloudFront edge delivery does not prove origin hosting on AWS EC2, ECS, EKS, or S3; CloudFront can front any custom origin server.';
  readonly defaultImplications = [
    'Inbound HTTP/HTTPS traffic is proxied through Amazon CloudFront global edge points of presence (POPs).',
    'TLS termination and edge caching occur at CloudFront edge nodes.',
    'Origin IP addresses may be masked behind CloudFront edge infrastructure.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const via = context.getHeader('via')?.toLowerCase() ?? '';
    const xCache = context.getHeader('x-cache')?.toLowerCase() ?? '';
    const hasCfId = context.hasHeader('x-amz-cf-id');
    const hasCfPop = context.hasHeader('x-amz-cf-pop');
    const hasCfCname = context.hasCname(/cloudfront\.net/i);

    if (hasCfId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-amz-cf-id',
        indicator: 'CloudFront request tracking ID (x-amz-cf-id)',
        observedValue: context.getHeader('x-amz-cf-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'CloudFront Request ID',
        type: 'HEADER',
        indicator: 'x-amz-cf-id',
        matched: true,
        weight: 10,
      });
    }

    if (hasCfPop) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-amz-cf-pop',
        indicator:
          'CloudFront edge point-of-presence POP identifier (x-amz-cf-pop)',
        observedValue: context.getHeader('x-amz-cf-pop'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'CloudFront POP Header',
        type: 'HEADER',
        indicator: 'x-amz-cf-pop',
        matched: true,
        weight: 10,
      });
    }

    if (server.includes('cloudfront')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: CloudFront',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Server Header CloudFront',
        type: 'HEADER',
        indicator: 'server: CloudFront',
        matched: true,
        weight: 10,
      });
    }

    if (via.includes('cloudfront.net')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: 'CloudFront proxy signature in Via header',
        observedValue: context.getHeader('via'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'CloudFront Via Header',
        type: 'HEADER',
        indicator: 'via: cloudfront.net',
        matched: true,
        weight: 9,
      });
    }

    if (xCache.includes('cloudfront')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-cache',
        indicator: 'CloudFront cache hit/miss signature in X-Cache header',
        observedValue: context.getHeader('x-cache'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'CloudFront X-Cache Header',
        type: 'HEADER',
        indicator: 'x-cache: CloudFront',
        matched: true,
        weight: 8,
      });
    }

    if (hasCfCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'CloudFront distribution CNAME target (*.cloudfront.net)',
        observedValue: context.dns?.cname
          ?.filter((c) => /cloudfront\.net/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'CloudFront CNAME',
        type: 'DNS',
        indicator: 'cloudfront.net CNAME',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    const confidence = evidence.some((e) => e.confidence === 'HIGH')
      ? 0.99
      : 0.85;

    return this.createResult({
      confidence,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Edge / CDN Delivery for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
