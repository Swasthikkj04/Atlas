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
export class AspNetCoreDetector extends BaseTechnologyDetector {
  readonly id = 'tech-aspnet-core';
  readonly name = 'ASP.NET Core';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'ASP.NET Core is an open-source, cross-platform framework for building modern, cloud-enabled, Internet-connected applications';
  readonly role = 'Server-side Web Application Framework';
  readonly infrastructureMeaning =
    'The observed endpoint appears to use ASP.NET Core as a server-side web application framework.';
  readonly detectionSignals = [
    'X-Powered-By header containing ASP.NET Core',
    'Set-Cookie containing .AspNetCore.* session, antiforgery, or identity tokens',
    'Explicit ASP.NET Core runtime / framework response headers',
  ];
  readonly confidenceRules =
    'HIGH confidence when explicit ASP.NET Core headers or .AspNetCore.* cookies are observed.';
  readonly whatThisDoesNotProve =
    'ASP.NET Core presence indicates a server-side web application framework, but does not prove IIS, Windows Server, Azure, SQL Server, Docker, Kubernetes, Entity Framework, or hosting environment.';
  readonly defaultImplications = [
    'Application is built using the ASP.NET Core server-side framework.',
    'Underlying host OS (Windows/Linux), database, containerization, and cloud infrastructure remain unobserved unless directly evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const rawPoweredBy = context.getHeader('x-powered-by') ?? '';
    const xPoweredBy = rawPoweredBy.toLowerCase();
    const cookieHeader = context.getHeader('set-cookie')?.toLowerCase() ?? '';
    const rawServer = context.getHeader('server') ?? '';
    const server = rawServer.toLowerCase();

    let version: string | undefined;

    // 1. Check X-Powered-By header for ASP.NET Core
    if (
      xPoweredBy.includes('asp.net core') ||
      xPoweredBy.includes('aspnetcore') ||
      xPoweredBy.includes('aspnet-core')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET Core Powered By Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const verMatch = rawPoweredBy.match(
        /(?:asp\.net\s*core|aspnetcore)[/ ]?v?([\d.]+)/i,
      );
      if (verMatch) {
        version = verMatch[1];
      }
    }

    // 2. Check for .AspNetCore.* cookies
    if (cookieHeader.includes('.aspnetcore')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Set-Cookie Header',
        indicator: 'ASP.NET Core authentication / antiforgery / session cookie',
        observedValue: context.getHeader('set-cookie') ?? '',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET Core Cookie Signature',
        type: 'COOKIE',
        indicator: cookieHeader,
        matched: true,
        weight: 10,
      });
    }

    // 3. Explicit ASP.NET Core server banner (e.g., Server: Kestrel with ASP.NET Core headers)
    if (server.includes('asp.net core') || server.includes('aspnetcore')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET Core Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(
          /(?:asp\.net\s*core|aspnetcore)[/ ]?v?([\d.]+)/i,
        );
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Server-side web application framework for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Extracted ASP.NET Core version ${version}`
        : undefined,
    });
  }
}
