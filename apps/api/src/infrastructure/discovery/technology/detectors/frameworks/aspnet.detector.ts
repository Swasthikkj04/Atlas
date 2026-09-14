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
export class AspNetDetector extends BaseTechnologyDetector {
  readonly id = 'tech-aspnet';
  readonly name = 'ASP.NET';
  readonly category = TechnologyCategory.FRAMEWORK;
  readonly description =
    'Microsoft ASP.NET enterprise web application framework and runtime';
  readonly role = 'Enterprise Application Framework';
  readonly infrastructureMeaning =
    'The public endpoint is powered by Microsoft .NET / ASP.NET backend application architecture.';
  readonly detectionSignals = [
    'X-Powered-By header containing ASP.NET (non-Core)',
    'x-aspnet-version or x-aspnetmvc-version response headers',
    'HTML containing __VIEWSTATE or __EVENTVALIDATION form fields',
  ];
  readonly confidenceRules =
    'HIGH confidence when ASP.NET response headers or ViewState markup signatures are observed.';
  readonly whatThisDoesNotProve =
    'ASP.NET presence indicates a server-side web application framework, but does not prove Windows Server, Azure hosting, IIS, SQL Server, or backend database.';
  readonly defaultImplications = [
    'Application is built using Microsoft ASP.NET framework.',
    'Underlying operating system, database, and cloud infrastructure remain unobserved unless directly evidenced.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const xPoweredBy = context.getHeader('x-powered-by')?.toLowerCase() ?? '';
    const isCore =
      xPoweredBy.includes('asp.net core') || xPoweredBy.includes('aspnetcore');
    const hasAspNetVersion = context.hasHeader('x-aspnet-version');
    const hasMvcVersion = context.hasHeader('x-aspnetmvc-version');
    const hasViewState = context.hasHtmlPattern('__VIEWSTATE');
    const hasEventVal = context.hasHtmlPattern('__EVENTVALIDATION');

    if (xPoweredBy.includes('asp.net') && !isCore) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-powered-by',
        indicator: `X-Powered-By: ${context.getHeader('x-powered-by')}`,
        observedValue: context.getHeader('x-powered-by'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET Powered By',
        type: 'HEADER',
        indicator: 'x-powered-by: asp.net',
        matched: true,
        weight: 10,
      });
    }

    if (hasAspNetVersion) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-aspnet-version',
        indicator: 'ASP.NET framework version header',
        observedValue: context.getHeader('x-aspnet-version'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET Version Header',
        type: 'HEADER',
        indicator: 'x-aspnet-version',
        matched: true,
        weight: 10,
      });
    }

    if (hasMvcVersion) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-aspnetmvc-version',
        indicator: 'ASP.NET MVC runtime version header',
        observedValue: context.getHeader('x-aspnetmvc-version'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET MVC Version',
        type: 'HEADER',
        indicator: 'x-aspnetmvc-version',
        matched: true,
        weight: 10,
      });
    }

    if (hasViewState || hasEventVal) {
      evidence.push({
        sourceType: 'HTML',
        source: 'HTML Body',
        indicator: 'ASP.NET WebForms ViewState / EventValidation state fields',
        observedValue: '__VIEWSTATE',
        confidence: 'HIGH',
      });
      signals.push({
        name: 'ASP.NET ViewState Form State',
        type: 'BODY',
        indicator: '__VIEWSTATE',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    const version =
      context.getHeader('x-aspnet-version') ||
      context.getHeader('x-aspnetmvc-version') ||
      undefined;

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Microsoft .NET enterprise backend for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
      version,
    });
  }
}
