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
export class AzureFrontDoorDetector extends BaseTechnologyDetector {
  readonly id = 'tech-azure-frontdoor';
  readonly name = 'Azure Front Door';
  readonly category = TechnologyCategory.CDN_EDGE;
  readonly description =
    'Microsoft Azure Front Door global Anycast edge delivery network, global load balancer, and WAF';
  readonly role = 'Edge Delivery / Global Ingress';
  readonly infrastructureMeaning =
    'The public endpoint appears to use Microsoft Azure Front Door global edge delivery and Anycast routing to deliver and cache traffic before requests reach origin infrastructure.';
  readonly detectionSignals = [
    'x-azure-ref response header',
    'x-azure-fdid response header',
    'x-azure-clientip response header',
    'X-Cache containing Azure Front Door routing indications',
    'CNAME records pointing to *.azurefd.net or *.azureedge.net',
    'Via header containing azure-edge or azurefd',
  ];
  readonly confidenceRules =
    'HIGH confidence when x-azure-ref, x-azure-fdid, or Azure Front Door CNAME records are detected.';
  readonly whatThisDoesNotProve =
    'Azure Front Door edge delivery confirms global edge ingress and caching, but does not prove the origin runs on Azure App Service, Azure Functions, AKS, Azure VM, Azure Container Apps, Windows Server, Linux, IIS, .NET, Azure SQL, or SQL Database; Front Door can front any custom origin server.';
  readonly defaultImplications = [
    'Inbound HTTP/HTTPS traffic is proxied through Microsoft Azure Front Door Anycast global edge network.',
    'TLS termination, edge caching, and global traffic routing occur at Microsoft POPs.',
    'Origin IP addresses may be masked behind Azure Front Door edge infrastructure.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const via = context.getHeader('via')?.toLowerCase() ?? '';
    const xCache = context.getHeader('x-cache')?.toLowerCase() ?? '';
    const hasAzureRef = context.hasHeader('x-azure-ref');
    const hasAzureFdid = context.hasHeader('x-azure-fdid');
    const hasAzureClientIp = context.hasHeader('x-azure-clientip');
    const hasAzureFdCname = context.hasCname(/azurefd\.net|azureedge\.net/i);

    // 1. x-azure-ref Response Header (Front Door Edge Tracking Reference)
    if (hasAzureRef) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-azure-ref',
        indicator: 'Azure Front Door edge reference tracking header',
        observedValue: context.getHeader('x-azure-ref'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Front Door Reference ID',
        type: 'HEADER',
        indicator: 'x-azure-ref',
        matched: true,
        weight: 10,
      });
    }

    // 2. x-azure-fdid Response Header (Front Door Identifier)
    if (hasAzureFdid) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-azure-fdid',
        indicator: 'Azure Front Door profile identifier header',
        observedValue: context.getHeader('x-azure-fdid'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Front Door ID',
        type: 'HEADER',
        indicator: 'x-azure-fdid',
        matched: true,
        weight: 10,
      });
    }

    // 3. x-azure-clientip Response Header
    if (hasAzureClientIp) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-azure-clientip',
        indicator: 'Azure Front Door client IP forwarding header',
        observedValue: context.getHeader('x-azure-clientip'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Front Door Client IP',
        type: 'HEADER',
        indicator: 'x-azure-clientip',
        matched: true,
        weight: 9,
      });
    }

    // 4. CNAME pointing to azurefd.net or azureedge.net
    if (hasAzureFdCname) {
      const cnameMatches = context.dns?.cname
        ?.filter((c) => /azurefd\.net|azureedge\.net/i.test(c))
        .join(', ');
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Azure Front Door CNAME routing target',
        observedValue: cnameMatches,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Front Door CNAME',
        type: 'DNS',
        indicator: 'azurefd.net / azureedge.net CNAME',
        matched: true,
        weight: 10,
      });
    }

    // 5. Via header containing azurefd or azure-edge
    if (via.includes('azurefd') || via.includes('azure-edge')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: 'Azure Front Door proxy signature in Via header',
        observedValue: context.getHeader('via'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Front Door Via Header',
        type: 'HEADER',
        indicator: 'via: azurefd',
        matched: true,
        weight: 8,
      });
    }

    // 6. X-Cache header indicating Azure Front Door edge cache
    if (
      xCache.includes('azure') ||
      (hasAzureRef &&
        (xCache.includes('tcp_hit') || xCache.includes('tcp_miss')))
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-cache',
        indicator: 'Azure Front Door edge cache status',
        observedValue: context.getHeader('x-cache'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Front Door Cache Header',
        type: 'HEADER',
        indicator: 'x-cache: Azure',
        matched: true,
        weight: 7,
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
      role: this.role,
      infrastructureMeaning: this.infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
    });
  }
}
