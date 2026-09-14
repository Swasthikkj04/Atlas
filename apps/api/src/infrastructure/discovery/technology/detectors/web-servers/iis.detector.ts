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
export class IisDetector extends BaseTechnologyDetector {
  readonly id = 'tech-microsoft-iis';
  readonly name = 'Microsoft IIS';
  readonly category = TechnologyCategory.WEB_SERVER;
  readonly description =
    'Microsoft Internet Information Services (IIS) enterprise Windows web server';
  readonly role = 'Enterprise Web Server';
  readonly infrastructureMeaning =
    'The public endpoint is served by Microsoft IIS enterprise web server infrastructure.';
  readonly detectionSignals = [
    'Server header containing microsoft-iis or iis',
    'x-aspnet-version response header',
    'x-aspnetmvc-version response header',
    'asp.net_sessionid or aspsessionid in Set-Cookie',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: Microsoft-IIS, ASP.NET headers, or ASP session cookies are observed.';

  readonly whatThisDoesNotProve =
    'Microsoft-IIS presence indicates IIS web server software, but does not prove Windows Server version, Azure hosting, or backend database.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const rawServer = context.getHeader('server') ?? '';
    const server = rawServer.toLowerCase();
    const hasIisServer =
      server.includes('microsoft-iis') ||
      (server.includes('iis') && !server.includes('kestrel'));

    if (!hasIisServer) {
      return null;
    }

    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const hasAspNetVersion = context.hasHeader('x-aspnet-version');
    const hasMvcVersion = context.hasHeader('x-aspnetmvc-version');
    const hasAspCookie =
      context.hasCookie('asp.net_sessionid') ||
      context.hasCookie('aspsessionid');

    evidence.push({
      sourceType: 'HTTP',
      source: 'Response Header: server',
      indicator: `Server: ${context.getHeader('server')}`,
      observedValue: context.getHeader('server'),
      confidence: 'HIGH',
    });
    signals.push({
      name: 'IIS Server Banner',
      type: 'HEADER',
      indicator: server,
      matched: true,
      weight: 10,
    });

    if (hasAspNetVersion) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-aspnet-version',
        indicator: 'ASP.NET Framework runtime header',
        observedValue: context.getHeader('x-aspnet-version'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET Version',
        type: 'HEADER',
        indicator: 'x-aspnet-version',
        matched: true,
        weight: 9,
      });
    }

    if (hasMvcVersion) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-aspnetmvc-version',
        indicator: 'ASP.NET MVC version header',
        observedValue: context.getHeader('x-aspnetmvc-version'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET MVC Version',
        type: 'HEADER',
        indicator: 'x-aspnetmvc-version',
        matched: true,
        weight: 9,
      });
    }

    if (hasAspCookie) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'ASP.NET session state cookie',
        observedValue: 'ASP.NET_SessionId',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET Cookie',
        type: 'COOKIE',
        indicator: 'asp.net_sessionid',
        matched: true,
        weight: 8,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    const versionMatch = rawServer.match(/microsoft-iis\/([\d.]+)/i);
    const version = versionMatch ? versionMatch[1] : undefined;

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Enterprise Windows web server serving ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
    });
  }
}
