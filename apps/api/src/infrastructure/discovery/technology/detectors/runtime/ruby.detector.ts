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
export class RubyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-ruby';
  readonly name = 'Ruby';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    'Ruby is a dynamic programming language and server-side runtime commonly used to execute web applications and APIs';
  readonly role = 'Server-side Application Runtime / Ruby Environment';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose or execute a Ruby-based server-side application/runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing Ruby or Phusion Passenger with Ruby',
    'Server response header containing Ruby, WEBrick, Puma, or Passenger',
    'Custom runtime headers such as x-ruby-version',
  ];
  readonly confidenceRules =
    'HIGH confidence when explicit Ruby runtime headers, Server banners containing Ruby/WEBrick/Puma/Passenger, or Ruby runtime identifiers are observed.';
  readonly whatThisDoesNotProve =
    'Ruby presence confirms server-side runtime execution, but does not prove Ruby on Rails, Sinatra, Hanami, Rack, Puma, Passenger, Linux, Docker, Kubernetes, AWS, GCP, Azure, Heroku, or any database (PostgreSQL, MySQL, MariaDB, SQLite, Redis).';
  readonly defaultImplications = [
    'Application executes within a Ruby server-side runtime environment.',
    'Application frameworks (Rails, Sinatra), web servers/gateways (NGINX), databases, and cloud hosting remain unobserved unless directly evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawPoweredBy = context.getHeader('x-powered-by') ?? '';
    const xPoweredBy = rawPoweredBy.toLowerCase();
    const rawServer = context.getHeader('server') ?? '';
    const server = rawServer.toLowerCase();
    const rawRubyVer = context.getHeader('x-ruby-version');

    let version: string | undefined;

    // 1. Check X-Powered-By header
    if (xPoweredBy.includes('ruby')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Ruby Powered By Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const rubyVerMatch = rawPoweredBy.match(/ruby[\/ ]v?([\d.]+)/i);
      if (rubyVerMatch) {
        version = rubyVerMatch[1];
      }
    }

    // 2. Check Server header for Ruby, WEBrick, Puma, Passenger
    if (
      server.includes('ruby') ||
      server.includes('webrick') ||
      server.includes('puma') ||
      server.includes('passenger')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Ruby Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(/ruby[\/ ]v?([\d.]+)/i);
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check X-Ruby-Version header
    if (rawRubyVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-ruby-version',
        indicator: `X-Ruby-Version: ${rawRubyVer}`,
        observedValue: rawRubyVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-Ruby-Version Header',
        type: 'HEADER',
        indicator: rawRubyVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawRubyVer.replace(/^v/i, '').trim();
        if (/^[\d.]+$/.test(cleanVer)) {
          version = cleanVer;
        }
      }
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Server-side Ruby application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Extracted Ruby version ${version}`
        : undefined,
    });
  }
}
