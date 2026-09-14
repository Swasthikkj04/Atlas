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
export class AzureDetector extends BaseTechnologyDetector {
  readonly id = 'tech-azure';
  readonly name = 'Microsoft Azure';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'Microsoft Azure cloud infrastructure, Application Gateway, Traffic Manager, Azure DNS, and enterprise hosting services';
  readonly role = 'Cloud Infrastructure & Managed Services';
  readonly infrastructureMeaning =
    'Observable Microsoft Azure cloud infrastructure participates in delivering the public endpoint.';
  readonly detectionSignals = [
    'x-ms-routing-name response header',
    'x-ms-request-id response header',
    'x-ms-version response header',
    'ApplicationGatewayAffinity or ARRAffinity cookies',
    'Server: ApplicationGateway or Microsoft-HTTPAPI response header',
    'Authoritative DNS nameservers (*.azure-dns.com/net/org/info)',
    'CNAME pointing to azurewebsites.net, cloudapp.azure.com, or trafficmanager.net',
    'TLS certificate issued by Microsoft Azure TLS Issuing CA',
  ];
  readonly confidenceRules =
    'HIGH confidence when Azure Application Gateway, Azure DNS, x-ms-* headers, or Azure CNAME records are detected.';
  readonly whatThisDoesNotProve =
    'Observable Azure infrastructure confirms participation of specific Azure-managed components (such as Azure Front Door, Azure Application Gateway, Azure DNS, or Azure Load Balancer), but does not prove the entire application runs on Azure, nor does it establish Azure App Service, Azure Functions, AKS, Azure VM, Azure Container Apps, Windows Server, Linux, IIS, .NET, Azure SQL, SQL Database, Cosmos DB, Azure Cache for Redis, Storage Accounts, private VNet topology, or backend database services without direct evidence.';
  readonly defaultImplications = [
    'Inbound traffic reaches Microsoft Azure-managed infrastructure or ingress gateways.',
    'Cloud routing and load balancing occur within Azure-managed network boundaries.',
    'Origin backend resources remain isolated behind Azure service boundaries.',
  ];

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const via = context.getHeader('via')?.toLowerCase() ?? '';
    const hasMsRoutingName = context.hasHeader('x-ms-routing-name');
    const hasMsRequestId = context.hasHeader('x-ms-request-id');
    const hasMsVersion = context.hasHeader('x-ms-version');
    const hasAppGwCookie =
      context.hasCookie('applicationgatewayaffinity') ||
      context.hasCookie('applicationgatewayaffinitycors');
    const hasArrCookie =
      context.hasCookie('arraffinity') ||
      context.hasCookie('arraffinitysamesite');
    const hasAzureCname = context.hasCname(
      /azurewebsites\.net|cloudapp\.azure\.com|azureedge\.net|trafficmanager\.net|azure-api\.net/i,
    );
    const hasAzureDns = context.dns?.ns?.some((ns) =>
      /azure-dns\.(com|net|org|info)/i.test(ns),
    );

    let isAppGateway = false;
    let isDnsOnly = false;

    // 1. Azure Application Gateway Routing Header
    if (hasMsRoutingName) {
      isAppGateway = true;
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-ms-routing-name',
        indicator:
          'Azure Application Gateway / Traffic Manager routing slot header',
        observedValue: context.getHeader('x-ms-routing-name'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Routing Name',
        type: 'HEADER',
        indicator: 'x-ms-routing-name',
        matched: true,
        weight: 10,
      });
    }

    // 2. Azure Request ID
    if (hasMsRequestId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-ms-request-id',
        indicator: 'Microsoft Azure resource request ID tracking header',
        observedValue: context.getHeader('x-ms-request-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Request ID',
        type: 'HEADER',
        indicator: 'x-ms-request-id',
        matched: true,
        weight: 9,
      });
    }

    // 3. Azure API Version
    if (hasMsVersion) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-ms-version',
        indicator: 'Azure Service Management / Storage API version header',
        observedValue: context.getHeader('x-ms-version'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure API Version',
        type: 'HEADER',
        indicator: 'x-ms-version',
        matched: true,
        weight: 8,
      });
    }

    // 4. Server Header: ApplicationGateway or Microsoft-HTTPAPI
    if (server.includes('applicationgateway')) {
      isAppGateway = true;
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Azure Application Gateway reverse proxy server banner',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure App Gateway Server',
        type: 'HEADER',
        indicator: 'server: ApplicationGateway',
        matched: true,
        weight: 10,
      });
    } else if (server.includes('microsoft-httpapi')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Microsoft HTTP API server stack banner',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Microsoft HTTPAPI Server',
        type: 'HEADER',
        indicator: 'server: Microsoft-HTTPAPI',
        matched: true,
        weight: 8,
      });
    }

    // 5. Azure Application Gateway Affinity Cookies
    if (hasAppGwCookie) {
      isAppGateway = true;
      const cookieVal =
        context.getCookie('ApplicationGatewayAffinity') ||
        context.getCookie('ApplicationGatewayAffinityCORS') ||
        'present';
      evidence.push({
        sourceType: 'COOKIE',
        source: 'Cookie: ApplicationGatewayAffinity',
        indicator: 'Azure Application Gateway sticky session routing cookie',
        observedValue: cookieVal,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure App Gateway Affinity Cookie',
        type: 'COOKIE',
        indicator: 'ApplicationGatewayAffinity',
        matched: true,
        weight: 10,
      });
    }

    // 6. Azure App Service / ARR Affinity Cookies
    if (hasArrCookie) {
      const arrVal =
        context.getCookie('ARRAffinity') ||
        context.getCookie('ARRAffinitySameSite') ||
        'present';
      evidence.push({
        sourceType: 'COOKIE',
        source: 'Cookie: ARRAffinity',
        indicator:
          'Azure App Service Application Request Routing (ARR) sticky session cookie',
        observedValue: arrVal,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure ARR Affinity Cookie',
        type: 'COOKIE',
        indicator: 'ARRAffinity',
        matched: true,
        weight: 9,
      });
    }

    // 7. CNAME Records
    if (hasAzureCname) {
      const cnameMatches = context.dns?.cname
        ?.filter((c) =>
          /azurewebsites\.net|cloudapp\.azure\.com|azureedge\.net|trafficmanager\.net|azure-api\.net/i.test(
            c,
          ),
        )
        .join(', ');
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'Microsoft Azure infrastructure CNAME target',
        observedValue: cnameMatches,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure CNAME',
        type: 'DNS',
        indicator: 'azurewebsites.net CNAME',
        matched: true,
        weight: 9,
      });
    }

    // 8. Authoritative DNS (Azure DNS)
    if (hasAzureDns) {
      const azureNs = context.dns?.ns
        ?.filter((ns) => /azure-dns\.(com|net|org|info)/i.test(ns))
        .join(', ');
      evidence.push({
        sourceType: 'DNS',
        source: 'Authoritative Nameservers',
        indicator: 'Microsoft Azure DNS authoritative nameservers',
        observedValue: azureNs,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure DNS Nameservers',
        type: 'DNS',
        indicator: 'azure-dns.com NS',
        matched: true,
        weight: 9,
      });
      if (evidence.length === 1) {
        isDnsOnly = true;
      }
    }

    // 9. TLS Certificate Issuer (Microsoft Azure TLS Issuing CA)
    if (context.hasCertIssuer(/microsoft azure|microsoft corporation/i)) {
      const issuerStr =
        typeof context.ssl?.certificate?.issuer === 'string'
          ? context.ssl.certificate.issuer
          : typeof context.ssl?.certificate?.issuer === 'object'
            ? (context.ssl.certificate.issuer as any).organization ||
              JSON.stringify(context.ssl.certificate.issuer)
            : (context.ssl as any)?.issuer || 'Microsoft Azure TLS Issuing CA';

      evidence.push({
        sourceType: 'TLS',
        source: 'TLS Certificate Issuer',
        indicator: 'Microsoft Azure TLS certificate authority',
        observedValue: issuerStr,
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure TLS CA',
        type: 'TLS',
        indicator: 'Microsoft Azure TLS CA',
        matched: true,
        weight: 7,
      });
    }

    // 10. Via header containing azure
    if (
      via.includes('azure') &&
      !via.includes('azurefd') &&
      !via.includes('azure-edge')
    ) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: via',
        indicator: 'Azure proxy signature in Via header',
        observedValue: context.getHeader('via'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'Azure Via Header',
        type: 'HEADER',
        indicator: 'via: azure',
        matched: true,
        weight: 8,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    // Dynamic role specialization
    let role = this.role;
    let infrastructureMeaning = this.infrastructureMeaning;

    if (isAppGateway) {
      role = 'Application Gateway / Reverse Proxy';
      infrastructureMeaning =
        'Azure Application Gateway manages ingress routing, SSL termination, and reverse proxying to backend services.';
    } else if (isDnsOnly) {
      role = 'Authoritative DNS (Azure DNS)';
      infrastructureMeaning =
        'Microsoft Azure DNS hosts authoritative domain name resolution for the public endpoint.';
    }

    return this.createResult({
      confidence: 0.98,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role,
      infrastructureMeaning,
      whatThisDoesNotProve: this.whatThisDoesNotProve,
    });
  }
}
