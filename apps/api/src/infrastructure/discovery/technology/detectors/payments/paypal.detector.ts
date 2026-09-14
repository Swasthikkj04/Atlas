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
export class PayPalDetector extends BaseTechnologyDetector {
  readonly id = 'tech-paypal';
  readonly name = 'PayPal';
  readonly category = TechnologyCategory.PAYMENTS;
  readonly description =
    'PayPal online payments system and digital wallet checkout gateway';
  readonly role = 'Payment Gateway & Digital Wallet';
  readonly infrastructureMeaning =
    'The public endpoint provides checkout payment options via PayPal infrastructure.';
  readonly detectionSignals = [
    'HTML containing paypal.com/sdk/js or paypalobjects.com',
  ];
  readonly confidenceRules =
    'HIGH confidence when paypal.com/sdk/js or paypalobjects.com scripts are included in DOM.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasPayPalScript =
      context.hasHtmlPattern('paypal.com/sdk/js') ||
      context.hasHtmlPattern('paypalobjects.com');

    if (hasPayPalScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator:
          'PayPal JS SDK include (paypal.com/sdk/js / paypalobjects.com)',
        observedValue: 'paypal.com/sdk/js',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'PayPal SDK Script',
        type: 'SCRIPT',
        indicator: 'paypal.com/sdk/js',
        matched: true,
        weight: 10,
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
      role: `Payment checkout gateway for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
