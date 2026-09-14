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
export class GoogleCloudCdnDetector extends BaseTechnologyDetector {
  readonly id = 'tech-google-cloud-cdn';
  readonly name = 'Google Cloud CDN';
  readonly category = TechnologyCategory.CDN_EDGE;
  readonly description =
    'Google Cloud CDN global Anycast content delivery network, edge caching, and Cloud Armor edge security';
  readonly role = 'Edge Delivery / CDN Ingress';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Google Cloud CDN edge points of presence (POPs) to deliver and cache traffic globally before requests reach origin infrastructure.';
  readonly detectionSignals = [
    'Via header containing google (e.g. 1.1 google, 2.0 google)',
    'x-goog-generation / x-goog-metageneration / x-goog-hash response headers',
    'x-guploader-uploadid response header',
    'CNAME records pointing to c.storage.googleapis.com or cdn.googlehosted.com',
    'Age header with Google Frontend server banner indicating cached edge delivery',
  ];
  readonly confidenceRules =
    'HIGH confidence when Via: google proxy headers, x-goog-generation headers, or Google Cloud Storage CDN CNAME records are detected.';
  readonly whatThisDoesNotProve =
    'Google Cloud CDN edge delivery confirms global edge ingress and caching, but does not prove the origin runs on Google Cloud Storage, Cloud Run, GKE, or Compute Engine VMs; Cloud CDN can front any custom external origin server.';
  readonly defaultImplications = [
    'Inbound HTTP/HTTPS traffic is proxied through Google global edge points of presence (POPs).',
    'TLS termination and edge caching occur at Google edge proxies.',
    'Origin IP addresses may be masked behind Google Cloud CDN edge infrastructure.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const via = context.getHeader('via')?.toLowerCase() ?? '';
    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasGoogGen = context.hasHeader('x-goog-generation');
    const hasGoogMetaGen = context.hasHeader('x-goog-metageneration');
    const hasGoogHash = context.hasHeader('x-goog-hash');
    const hasGuploader = context.hasHeader('x-guploader-uploadid');
    const hasCdnCname = context.hasCname(
      /c\.storage\.googleapis\.com|storage\.googleapis\.com|cdn\.googlehosted\.com/i,
    );
    const age = context.getHeader('age');

    // 1. Via Header: google
    if (via.includes('google')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator:
          'Google Cloud CDN / Google Frontend edge proxy in Via header',
        observedValue: context.getHeader('via'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Google CDN Via Header',
        type: 'HEADER',
        indicator: 'via: google',
        matched: true,
        weight: 9,
      });
    }

    // 2. Google Cloud Storage / CDN Object Headers
    if (hasGoogGen || hasGoogMetaGen || hasGoogHash || hasGuploader) {
      const headerNames: string[] = [];
      if (hasGoogGen) headerNames.push('x-goog-generation');
      if (hasGoogMetaGen) headerNames.push('x-goog-metageneration');
      if (hasGoogHash) headerNames.push('x-goog-hash');
      if (hasGuploader) headerNames.push('x-guploader-uploadid');

      evidence.push({
        sourceType: 'HTTP',
        source: `Response Headers: ${headerNames.join(', ')}`,
        indicator: 'Google Cloud CDN / Cloud Storage edge metadata headers',
        observedValue: headerNames
          .map((h) => `${h}: ${context.getHeader(h)}`)
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Google Cloud Storage / CDN Headers',
        type: 'HEADER',
        indicator: headerNames.join(', '),
        matched: true,
        weight: 9,
      });
    }

    // 3. Google CDN / Storage CNAME
    if (hasCdnCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Google Cloud CDN / Storage CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) =>
            /c\.storage\.googleapis\.com|storage\.googleapis\.com|cdn\.googlehosted\.com/i.test(
              c,
            ),
          )
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Google CDN CNAME',
        type: 'DNS',
        indicator: 'storage.googleapis.com / cdn.googlehosted.com CNAME',
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
      role: 'Edge Delivery / CDN Ingress',
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
    });
  }
}
