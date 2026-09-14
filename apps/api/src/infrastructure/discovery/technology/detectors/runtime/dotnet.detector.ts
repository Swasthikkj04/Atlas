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
export class DotNetDetector extends BaseTechnologyDetector {
  readonly id = 'tech-dotnet';
  readonly name = '.NET';
  readonly category = TechnologyCategory.RUNTIME;
  readonly description =
    '.NET is a software development platform and runtime ecosystem used to execute server-side applications and services';
  readonly role = 'Server-side Application Runtime / .NET Environment';
  readonly infrastructureMeaning =
    'The observed endpoint appears to expose or execute a Microsoft .NET-based server-side application/runtime boundary.';
  readonly detectionSignals = [
    'X-Powered-By response header containing ASP.NET or .NET',
    'Server response header containing Kestrel or ASP.NET Core',
    'x-aspnet-version or x-aspnetmvc-version response headers',
    'Cookies such as .AspNetCore.*, .ASPXAUTH, or ASP.NET_SessionId',
  ];
  readonly confidenceRules =
    'HIGH confidence when explicit .NET/ASP.NET runtime headers, Kestrel server banners, or ASP.NET authentication cookies are observed.';
  readonly whatThisDoesNotProve =
    '.NET presence confirms server-side runtime execution, but does not prove C# specifically, ASP.NET Core, IIS, Kestrel, Azure, Windows Server, SQL Server, Docker, Kubernetes, Entity Framework, Blazor, or any database.';
  readonly defaultImplications = [
    'Application executes within a .NET server-side runtime environment.',
    'Language (C#), web servers (IIS, Kestrel), operating system (Windows/Linux), databases (SQL Server), and cloud hosting (Azure) remain unobserved unless directly evidenced.',
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
    const rawAspNetVer = context.getHeader('x-aspnet-version');
    const rawMvcVer = context.getHeader('x-aspnetmvc-version');
    const rawDotNetVer = context.getHeader('x-dotnet-version');
    const cookieHeader = context.getHeader('set-cookie')?.toLowerCase() ?? '';

    let version: string | undefined;

    // 1. Check X-Powered-By header
    if (xPoweredBy.includes('asp.net') || xPoweredBy.includes('.net')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${rawPoweredBy}`,
        observedValue: rawPoweredBy,
        confidence: 'HIGH',
      });
      signals.push({
        name: '.NET Powered By Header',
        type: 'HEADER',
        indicator: xPoweredBy,
        matched: true,
        weight: 10,
      });

      const poweredMatch = rawPoweredBy.match(
        /(?:asp\.net|net)(?:[\/ ](?:core\/)?)v?([\d.]+)/i,
      );
      if (poweredMatch) {
        version = poweredMatch[1];
      }
    }

    // 2. Check Server header for Kestrel or ASP.NET
    if (server.includes('kestrel') || server.includes('asp.net')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: `Server: ${rawServer}`,
        observedValue: rawServer,
        confidence: 'HIGH',
      });
      signals.push({
        name: '.NET Server Banner',
        type: 'HEADER',
        indicator: server,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const serverVerMatch = rawServer.match(
          /(?:kestrel|asp\.net)(?:[\/ ](?:core\/)?)v?([\d.]+)/i,
        );
        if (serverVerMatch) {
          version = serverVerMatch[1];
        }
      }
    }

    // 3. Check X-AspNet-Version header
    if (rawAspNetVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-aspnet-version',
        indicator: `X-AspNet-Version: ${rawAspNetVer}`,
        observedValue: rawAspNetVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-AspNet-Version Header',
        type: 'HEADER',
        indicator: rawAspNetVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawAspNetVer.replace(/^v?/i, '').trim();
        if (/^[\d.]+$/.test(cleanVer)) {
          version = cleanVer;
        }
      }
    }

    // 4. Check X-AspNetMvc-Version header
    if (rawMvcVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-aspnetmvc-version',
        indicator: `X-AspNetMvc-Version: ${rawMvcVer}`,
        observedValue: rawMvcVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-AspNetMvc-Version Header',
        type: 'HEADER',
        indicator: rawMvcVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawMvcVer.replace(/^v?/i, '').trim();
        if (/^[\d.]+$/.test(cleanVer)) {
          version = cleanVer;
        }
      }
    }

    // 5. Check X-DotNet-Version header
    if (rawDotNetVer) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-dotnet-version',
        indicator: `X-DotNet-Version: ${rawDotNetVer}`,
        observedValue: rawDotNetVer,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'X-DotNet-Version Header',
        type: 'HEADER',
        indicator: rawDotNetVer,
        matched: true,
        weight: 10,
      });

      if (!version) {
        const cleanVer = rawDotNetVer.replace(/^v?/i, '').trim();
        if (/^[\d.]+$/.test(cleanVer)) {
          version = cleanVer;
        }
      }
    }

    // 6. Check ASP.NET / .AspNetCore cookies
    if (
      cookieHeader.includes('.aspnetcore') ||
      cookieHeader.includes('.aspxauth') ||
      cookieHeader.includes('asp.net_sessionid')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: set-cookie',
        indicator: 'ASP.NET / .NET Core runtime cookie signature',
        observedValue: cookieHeader,
        confidence: 'HIGH',
      });
      signals.push({
        name: '.NET Cookie Signature',
        type: 'COOKIE',
        indicator: cookieHeader,
        matched: true,
        weight: 9,
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
      role: `Server-side .NET application runtime for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
      versionEvidence: version
        ? `Extracted .NET version ${version}`
        : undefined,
    });
  }
}
