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
export class RubyOnRailsDetector extends BaseTechnologyDetector {
  readonly id = 'tech-ruby-on-rails';
  readonly name = 'Ruby on Rails';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Ruby on Rails full-stack web application framework written in Ruby';
  readonly role = 'Web Application Framework';
  readonly infrastructureMeaning =
    'The public endpoint application backend is built on Ruby on Rails.';
  readonly detectionSignals = [
    '_session_id cookie in Set-Cookie',
    'X-Powered-By header containing Phusion Passenger',
    'HTML containing csrf-param meta tag (authenticity_token)',
  ];
  readonly confidenceRules =
    'HIGH confidence when Phusion Passenger header, Rails session cookies, or authenticity_token meta tags are observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const xPoweredBy = context.getHeader('x-powered-by')?.toLowerCase() ?? '';
    const hasPassenger =
      xPoweredBy.includes('passenger') || xPoweredBy.includes('phusion');
    const hasRailsCsrf =
      context.hasHtmlPattern('csrf-param') &&
      context.hasHtmlPattern('authenticity_token');
    const hasSessionCookie = context.hasCookie('_session_id');

    if (hasPassenger) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `Phusion Passenger / Rails Application Server (${context.getHeader('x-powered-by')})`,
        observedValue: context.getHeader('x-powered-by'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Passenger App Server Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });
    }

    if (hasRailsCsrf) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'Ruby on Rails authenticity_token CSRF protection metadata',
        observedValue: 'authenticity_token',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Rails CSRF Meta Tag',
        type: 'BODY',
        indicator: 'authenticity_token',
        matched: true,
        weight: 10,
      });
    }

    if (hasSessionCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'Rails standard session cookie (_session_id)',
        observedValue: '_session_id',
        confidence: 'MEDIUM',
      });
      signals.push({
        name: 'Rails Session Cookie',
        type: 'COOKIE',
        indicator: '_session_id',
        matched: true,
        weight: 7,
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
      role: `Ruby on Rails web application backend for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
