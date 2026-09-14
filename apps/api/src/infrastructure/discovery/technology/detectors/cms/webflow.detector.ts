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
export class WebflowDetector extends BaseTechnologyDetector {
  readonly id = 'tech-webflow';
  readonly name = 'Webflow';
  readonly category = TechnologyCategory.CMS;
  readonly description =
    'Webflow visual web development platform and managed hosting infrastructure';
  readonly role = 'Visual Web CMS & Hosting';
  readonly infrastructureMeaning =
    'The public endpoint is designed and hosted on Webflow cloud infrastructure.';
  readonly detectionSignals = [
    'HTML containing data-wf-page or data-wf-site attributes',
    'HTML containing webflow.js script',
    'proxy.webflow.com in CNAME records',
  ];
  readonly confidenceRules =
    'HIGH confidence when data-wf-page attributes or Webflow CNAMEs are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasWfPage =
      context.hasHtmlPattern('data-wf-page') ||
      context.hasHtmlPattern('data-wf-site');
    const hasWfJs = context.hasHtmlPattern('webflow.js');
    const hasWfCname = context.hasCname(/webflow\.com/i);

    if (hasWfPage) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'Webflow site/page identifier attributes (data-wf-page / data-wf-site)',
        observedValue: 'data-wf-page',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Webflow Data Attributes',
        type: 'BODY',
        indicator: 'data-wf-page',
        matched: true,
        weight: 10,
      });
    }

    if (hasWfJs) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Webflow client runtime script (webflow.js)',
        observedValue: 'webflow.js',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Webflow JS Runtime',
        type: 'SCRIPT',
        indicator: 'webflow.js',
        matched: true,
        weight: 9,
      });
    }

    if (hasWfCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Webflow proxy CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) => /webflow\.com/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Webflow CNAME',
        type: 'DNS',
        indicator: 'webflow.com CNAME',
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
      role: `Visual CMS and managed web hosting for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
