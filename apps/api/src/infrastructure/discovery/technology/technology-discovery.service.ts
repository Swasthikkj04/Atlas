import { Injectable } from '@nestjs/common';

import { DiscoveryModule } from '../contracts/discovery-module.interface';

export interface DetectedTechnology {
  name: string;
  category: string;
  confidence: number;
  role?: string;
  evidenceCount?: number;
}

export interface TechnologyDiscoveryResult {
  technologies: DetectedTechnology[];
}

@Injectable()
export class TechnologyDiscoveryService implements DiscoveryModule<TechnologyDiscoveryResult> {
  readonly name = 'technology';

  async discover(domainName: string): Promise<TechnologyDiscoveryResult> {
    const rawUrl = domainName.startsWith('http')
      ? domainName
      : `https://${domainName}`;
    const technologies: DetectedTechnology[] = [];

    try {
      // Try HTTPS first, fall back to HTTP if initial attempt fails
      let response: Response;
      try {
        response = await fetch(rawUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Technology-Discovery/1.0',
          },
          signal: AbortSignal.timeout(8000),
        });
      } catch {
        const httpUrl = `http://${domainName.replace(/^https?:\/\//, '')}`;
        response = await fetch(httpUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Technology-Discovery/1.0',
          },
          signal: AbortSignal.timeout(8000),
        });
      }

      const headers = response.headers;
      let html = '';
      try {
        html = await response.text();
      } catch {
        html = '';
      }

      const serverHeader = headers.get('server')?.toLowerCase() ?? '';
      const viaHeader = headers.get('via')?.toLowerCase() ?? '';
      const xPoweredBy = headers.get('x-powered-by')?.toLowerCase() ?? '';
      const setCookie = headers.get('set-cookie')?.toLowerCase() ?? '';

      // --- 1. Cloud & Edge Platforms ---

      // Cloudflare
      if (
        serverHeader.includes('cloudflare') ||
        headers.has('cf-ray') ||
        headers.has('cf-cache-status')
      ) {
        technologies.push({
          name: 'Cloudflare',
          category: 'CDN / Security Gateway',
          confidence: 0.99,
          role: `Global edge network and DDoS protection for ${domainName}`,
          evidenceCount: 3,
        });
      }

      // Akamai
      if (
        serverHeader.includes('akamaighost') ||
        serverHeader.includes('akamai') ||
        viaHeader.includes('akamai') ||
        headers.has('x-akamai-transformed') ||
        headers.has('x-akamai-request-id') ||
        headers.has('akamai-grn')
      ) {
        technologies.push({
          name: 'Akamai Edge Network',
          category: 'CDN / Security Gateway',
          confidence: 0.99,
          role: `Enterprise edge distribution and security for ${domainName}`,
          evidenceCount: 3,
        });
      }

      // AWS CloudFront / S3 / ALB
      if (
        viaHeader.includes('cloudfront.net') ||
        headers.has('x-amz-cf-id') ||
        serverHeader.includes('amazons3') ||
        serverHeader.includes('awselb') ||
        headers.has('x-amzn-trace-id')
      ) {
        technologies.push({
          name: 'Amazon Web Services (AWS)',
          category: 'Cloud Substrate',
          confidence: 0.98,
          role: `Cloud content distribution and routing for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Microsoft Azure
      if (
        headers.has('x-azure-ref') ||
        headers.has('x-ms-request-id') ||
        headers.has('x-ms-version') ||
        viaHeader.includes('azure')
      ) {
        technologies.push({
          name: 'Microsoft Azure',
          category: 'Cloud Substrate',
          confidence: 0.98,
          role: `Enterprise cloud infrastructure for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Vercel
      if (serverHeader.includes('vercel') || headers.has('x-vercel-id')) {
        technologies.push({
          name: 'Vercel',
          category: 'Cloud Substrate',
          confidence: 0.99,
          role: `Edge deployment substrate for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Fastly
      if (headers.has('x-fastly-request-id') || headers.has('fastly-debug-digest') || viaHeader.includes('varnish')) {
        technologies.push({
          name: 'Fastly',
          category: 'CDN / Security Gateway',
          confidence: 0.98,
          role: `Edge cloud delivery network for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Imperva / Incapsula
      if (headers.has('x-iinfo') || headers.has('x-cdn') || serverHeader.includes('incapsula') || setCookie.includes('incap_ses')) {
        technologies.push({
          name: 'Imperva Incapsula',
          category: 'WAF / Security Gateway',
          confidence: 0.98,
          role: `Web application firewall and DDoS protection for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Google Infrastructure Gateway (GFE / GWS)
      if (
        serverHeader.includes('gws') ||
        serverHeader.includes('gse') ||
        serverHeader.includes('esf') ||
        serverHeader.includes('google') ||
        viaHeader.includes('google')
      ) {
        technologies.push({
          name: 'Google Infrastructure Gateway',
          category: 'Cloud Gateway',
          confidence: 0.95,
          role: `Edge routing gateway for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // GitHub Pages
      if (
        serverHeader.includes('github-pages') ||
        headers.has('x-github-pages-state')
      ) {
        technologies.push({
          name: 'GitHub Pages',
          category: 'Web Hosting',
          confidence: 0.99,
          role: `Static web hosting infrastructure for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // --- 2. Web Servers & Gateways ---

      // Microsoft IIS
      if (
        serverHeader.includes('microsoft-iis') ||
        serverHeader.includes('iis') ||
        xPoweredBy.includes('asp.net') ||
        headers.has('x-aspnet-version') ||
        headers.has('x-aspnetmvc-version') ||
        setCookie.includes('asp.net_sessionid') ||
        setCookie.includes('aspsessionid')
      ) {
        technologies.push({
          name: 'Microsoft IIS',
          category: 'Web Server',
          confidence: 0.99,
          role: `Enterprise Windows web server serving ${domainName}`,
          evidenceCount: 2,
        });
      }

      // NGINX
      if (serverHeader.includes('nginx')) {
        technologies.push({
          name: 'NGINX',
          category: 'Web Server',
          confidence: 0.99,
          role: `Reverse proxy and web gateway for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Apache HTTP Server
      if (serverHeader.includes('apache') && !serverHeader.includes('coyote')) {
        technologies.push({
          name: 'Apache HTTP Server',
          category: 'Web Server',
          confidence: 0.99,
          role: `Origin web server serving ${domainName}`,
          evidenceCount: 2,
        });
      }

      // F5 BIG-IP
      if (
        serverHeader.includes('big-ip') ||
        serverHeader.includes('bigip') ||
        headers.has('x-cnection') ||
        setCookie.includes('bigipserver')
      ) {
        technologies.push({
          name: 'F5 BIG-IP',
          category: 'Load Balancer / Gateway',
          confidence: 0.98,
          role: `Enterprise application delivery and load balancing for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // OpenResty
      if (serverHeader.includes('openresty')) {
        technologies.push({
          name: 'OpenResty',
          category: 'Web Gateway',
          confidence: 0.99,
          role: `Lua-enabled reverse proxy for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // LiteSpeed
      if (serverHeader.includes('litespeed')) {
        technologies.push({
          name: 'LiteSpeed Web Server',
          category: 'Web Server',
          confidence: 0.99,
          role: `High-performance event-driven web server for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Envoy Proxy
      if (serverHeader.includes('envoy') || headers.has('x-envoy-upstream-service-time')) {
        technologies.push({
          name: 'Envoy Proxy',
          category: 'Cloud Gateway',
          confidence: 0.98,
          role: `Service proxy and ingress gateway for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // Java Application Server (Tomcat / WebLogic / WebSphere / Jetty)
      if (
        serverHeader.includes('coyote') ||
        serverHeader.includes('tomcat') ||
        serverHeader.includes('weblogic') ||
        serverHeader.includes('websphere') ||
        serverHeader.includes('jetty') ||
        xPoweredBy.includes('servlet') ||
        xPoweredBy.includes('jsp') ||
        setCookie.includes('jsessionid')
      ) {
        technologies.push({
          name: 'Java Enterprise / Application Server',
          category: 'Application Server',
          confidence: 0.95,
          role: `Java enterprise application runtime for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // --- 3. Frontend & Application Frameworks ---

      // Next.js
      if (
        xPoweredBy.includes('next.js') ||
        html.includes('__NEXT_DATA__') ||
        html.includes('/_next/static')
      ) {
        technologies.push({
          name: 'Next.js',
          category: 'Frontend Framework',
          confidence: 0.95,
          role: `React-based framework rendering ${domainName}`,
          evidenceCount: 2,
        });
      }

      // React
      if (
        html.includes('data-reactroot') ||
        html.includes('data-reactid') ||
        html.includes('_reactListening') ||
        html.includes('__reactFiber') ||
        html.includes('__reactProps') ||
        html.includes('react-dom')
      ) {
        technologies.push({
          name: 'React',
          category: 'Frontend Library',
          confidence: 0.85,
          role: `Client-side UI rendering for ${domainName}`,
          evidenceCount: 1,
        });
      }

      // Angular
      if (html.includes('ng-version') || html.includes('ng-app') || html.includes('data-ng-')) {
        technologies.push({
          name: 'Angular',
          category: 'Frontend Framework',
          confidence: 0.90,
          role: `Enterprise web application framework for ${domainName}`,
          evidenceCount: 1,
        });
      }

      // Vue.js
      if (html.includes('data-v-') || html.includes('v-bind') || html.includes('v-for')) {
        technologies.push({
          name: 'Vue.js',
          category: 'Frontend Framework',
          confidence: 0.90,
          role: `Progressive JavaScript UI framework for ${domainName}`,
          evidenceCount: 1,
        });
      }

      // ASP.NET
      if (
        xPoweredBy.includes('asp.net') ||
        headers.has('x-aspnet-version') ||
        headers.has('x-aspnetmvc-version') ||
        html.includes('__VIEWSTATE') ||
        html.includes('__EVENTVALIDATION')
      ) {
        technologies.push({
          name: 'ASP.NET',
          category: 'Application Framework',
          confidence: 0.95,
          role: `Microsoft .NET enterprise backend for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // PHP
      if (xPoweredBy.includes('php') || setCookie.includes('phpsessid')) {
        technologies.push({
          name: 'PHP',
          category: 'Programming Language',
          confidence: 0.95,
          role: `Server-side scripting environment for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // HSTS
      if (headers.has('strict-transport-security')) {
        technologies.push({
          name: 'HTTP Strict Transport Security (HSTS)',
          category: 'Security Protocol',
          confidence: 0.99,
          role: `Enforced encrypted HTTPS transport for ${domainName}`,
          evidenceCount: 2,
        });
      }
    } catch {
      // Fail gracefully on network errors/timeouts and return empty array
    }

    return {
      technologies,
    };
  }
}
