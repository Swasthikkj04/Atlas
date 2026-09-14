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
export class ShopifyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-shopify';
  readonly name = 'Shopify';
  readonly category = TechnologyCategory.CMS;
  readonly description =
    'Shopify e-commerce platform and managed cloud storefront infrastructure';
  readonly role = 'E-Commerce Platform & Storefront';
  readonly infrastructureMeaning =
    'The public endpoint is hosted on Shopify managed e-commerce infrastructure.';
  readonly detectionSignals = [
    'x-shopid response header',
    'x-shopify-stage response header',
    'myshopify.com in CNAME records',
    'HTML containing cdn.shopify.com assets',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-shopid header, Shopify CNAME, or Shopify CDN assets are detected.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasShopId = context.hasHeader('x-shopid');
    const hasShopifyStage = context.hasHeader('x-shopify-stage');
    const hasShopifyCname = context.hasCname(/myshopify\.com|shopify\.com/i);
    const hasShopifyCdn = context.hasHtmlPattern('cdn.shopify.com');

    if (hasShopId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-shopid',
        indicator: 'Shopify Store ID tracking header',
        observedValue: context.getHeader('x-shopid'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Shopify Shop ID',
        type: 'HEADER',
        indicator: 'x-shopid',
        matched: true,
        weight: 10,
      });
    }

    if (hasShopifyStage) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-shopify-stage',
        indicator: 'Shopify infrastructure stage header',
        observedValue: context.getHeader('x-shopify-stage'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Shopify Stage Header',
        type: 'HEADER',
        indicator: 'x-shopify-stage',
        matched: true,
        weight: 10,
      });
    }

    if (hasShopifyCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Shopify store CNAME target',
        observedValue: context.dns?.cname
          ?.filter((c) => /myshopify\.com|shopify\.com/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Shopify CNAME',
        type: 'DNS',
        indicator: 'myshopify.com CNAME',
        matched: true,
        weight: 9,
      });
    }

    if (hasShopifyCdn) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Shopify Content Delivery Network assets (cdn.shopify.com)',
        observedValue: 'cdn.shopify.com',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Shopify CDN Assets',
        type: 'BODY',
        indicator: 'cdn.shopify.com',
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
      role: `E-commerce storefront and checkout substrate for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
