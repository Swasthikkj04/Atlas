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
export class StripeDetector extends BaseTechnologyDetector {
  readonly id = 'tech-stripe';
  readonly name = 'Stripe';
  readonly category = TechnologyCategory.PAYMENTS;
  readonly description =
    'Stripe global online payment processing and merchant infrastructure';
  readonly role = 'Payment Processing Gateway';
  readonly infrastructureMeaning =
    'The public endpoint integrates Stripe for payment checkout and processing.';
  readonly detectionSignals = [
    'HTML containing js.stripe.com/v3 or Stripe Elements',
    '__stripe_mid or __stripe_sid cookies in Set-Cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when js.stripe.com/v3 script or Stripe fraud prevention cookies are observed.';
  readonly whatThisDoesNotProve =
    'Client-side Stripe integration does not expose or prove backend payment gateway architecture or merchant banking endpoints.';
  readonly defaultImplications = [
    'Client-side checkout and payment card telemetry are processed via Stripe Elements / API.',
    'PCI compliance burden is shifted away from origin application servers.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasStripeScript =
      context.hasHtmlPattern('js.stripe.com') ||
      context.hasHtmlPattern('checkout.stripe.com');
    const hasStripeCookie =
      context.hasCookie('__stripe_mid') || context.hasCookie('__stripe_sid');

    if (hasStripeScript) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Stripe JS client library include (js.stripe.com/v3)',
        observedValue: 'js.stripe.com',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Stripe JS Library',
        type: 'SCRIPT',
        indicator: 'js.stripe.com',
        matched: true,
        weight: 10,
      });
    }

    if (hasStripeCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator:
          'Stripe fraud detection cookie (__stripe_mid / __stripe_sid)',
        observedValue: '__stripe_mid',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Stripe Machine ID Cookie',
        type: 'COOKIE',
        indicator: '__stripe_mid',
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
      role: `Payment processing gateway and checkout integration for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
