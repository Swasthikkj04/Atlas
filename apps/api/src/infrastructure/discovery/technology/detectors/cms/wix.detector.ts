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
export class WixDetector extends BaseTechnologyDetector {
  readonly id = 'tech-wix';
  readonly name = 'Wix';
  readonly category = TechnologyCategory.CMS;
  readonly description =
    'Wix cloud-based web development platform and managed hosting substrate';
  readonly role = 'Website Builder & CMS Platform';
  readonly infrastructureMeaning =
    'The public endpoint is built and hosted on Wix cloud infrastructure.';
  readonly detectionSignals = [
    'x-wix-request-id response header',
    'wix.com or parastorage.com in CNAME records',
    'HTML containing static.parastorage.com or wix.com assets',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-wix-request-id or Wix CDN assets (parastorage.com) are detected.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasWixHeader =
      context.hasHeader('x-wix-request-id') ||
      context.hasHeader('x-wix-renderer-server');
    const hasWixCname = context.hasCname(/wix\.com|wixdns\.net/i);
    const hasParastorage =
      context.hasHtmlPattern('parastorage.com') ||
      context.hasHtmlPattern('static.wixstatic.com');

    if (hasWixHeader) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-wix-request-id',
        indicator: 'Wix infrastructure request identifier header',
        observedValue: context.getHeader('x-wix-request-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Wix Request ID',
        type: 'HEADER',
        indicator: 'x-wix-request-id',
        matched: true,
        weight: 10,
      });
    }

    if (hasWixCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Wix CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) => /wix\.com|wixdns\.net/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Wix CNAME',
        type: 'DNS',
        indicator: 'wixdns.net CNAME',
        matched: true,
        weight: 9,
      });
    }

    if (hasParastorage) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'Wix static asset storage domain (parastorage.com / wixstatic.com)',
        observedValue: 'parastorage.com',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Wix Asset Storage',
        type: 'BODY',
        indicator: 'parastorage.com',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Managed CMS and cloud website builder for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
