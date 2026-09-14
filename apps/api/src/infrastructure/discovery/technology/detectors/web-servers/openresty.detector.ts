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
export class OpenRestyDetector extends BaseTechnologyDetector {
  readonly id = 'tech-openresty';
  readonly name = 'OpenResty';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'OpenResty full-fledged web platform that integrates Nginx and LuaJIT';
  readonly role = 'Web Gateway & Lua Reverse Proxy';
  readonly infrastructureMeaning =
    'The public endpoint is served by OpenResty (Lua-enabled NGINX reverse proxy).';
  readonly detectionSignals = ['Server header containing openresty'];
  readonly confidenceRules =
    'HIGH confidence when Server: openresty header is observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const server = context.getHeader('server')?.toLowerCase() ?? '';

    if (!server.includes('openresty')) {
      return null;
    }

    const rawServer = context.getHeader('server') ?? '';
    const versionMatch = rawServer.match(/openresty\/([\d.]+)/i);
    const version = versionMatch ? versionMatch[1] : undefined;

    const evidence: TechnologyEvidence[] = [
      {
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      },
    ];

    const signals: TechnologySignal[] = [
      {
        name: 'OpenResty Server Banner',
        type: 'HEADER',
        indicator: rawServer,
        matched: true,
        weight: 10,
      },
    ];

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Lua-enabled reverse proxy for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
    });
  }
}
