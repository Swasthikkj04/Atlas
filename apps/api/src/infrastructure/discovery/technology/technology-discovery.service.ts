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
    const url = domainName.startsWith('http')
      ? domainName
      : `https://${domainName}`;
    const technologies: DetectedTechnology[] = [];

    try {
      // Perform HTTP request with timeout safety
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Technology-Discovery/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      const headers = response.headers;
      const html = await response.text();
      const serverHeader = headers.get('server')?.toLowerCase() ?? '';
      const viaHeader = headers.get('via')?.toLowerCase() ?? '';
      const xPoweredBy = headers.get('x-powered-by')?.toLowerCase() ?? '';

      // --- Evidence-Based Rule Engine ---

      // 1. Cloudflare CDN / Edge
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

      // 2. Vercel Cloud Platform
      if (serverHeader.includes('vercel') || headers.has('x-vercel-id')) {
        technologies.push({
          name: 'Vercel',
          category: 'Cloud Substrate',
          confidence: 0.99,
          role: `Edge deployment substrate for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // 3. AWS CloudFront / S3
      if (
        viaHeader.includes('cloudfront.net') ||
        headers.has('x-amz-cf-id') ||
        serverHeader.includes('amazons3')
      ) {
        technologies.push({
          name: 'Amazon Web Services (CloudFront / S3)',
          category: 'Cloud Substrate',
          confidence: 0.98,
          role: `Cloud content distribution for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // 4. GitHub Pages
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

      // 5. Google Frontend (GFE / GWS)
      if (
        serverHeader.includes('gws') ||
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

      // 6. NGINX
      if (serverHeader.includes('nginx')) {
        technologies.push({
          name: 'NGINX',
          category: 'Web Server',
          confidence: 0.99,
          role: `Reverse proxy and web gateway for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // 7. Apache HTTP Server
      if (serverHeader.includes('apache')) {
        technologies.push({
          name: 'Apache HTTP Server',
          category: 'Web Server',
          confidence: 0.99,
          role: `Origin web server serving ${domainName}`,
          evidenceCount: 2,
        });
      }

      // 8. OpenResty
      if (serverHeader.includes('openresty')) {
        technologies.push({
          name: 'OpenResty',
          category: 'Web Gateway',
          confidence: 0.99,
          role: `Lua-enabled reverse proxy for ${domainName}`,
          evidenceCount: 2,
        });
      }

      // 9. Next.js
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

      // 10. React
      if (
        html.includes('data-reactroot') ||
        html.includes('data-reactid') ||
        html.includes('_reactListening') ||
        html.includes('__reactFiber') ||
        html.includes('__reactProps') ||
        html.includes('react-dom')
      ) {
        technologies.push({
          name: 'React UI Library',
          category: 'Frontend Library',
          confidence: 0.85,
          role: `Client-side UI rendering for ${domainName}`,
          evidenceCount: 1,
        });
      }

      // 11. HSTS & Modern TLS Security
      if (headers.has('strict-transport-security')) {
        technologies.push({
          name: 'HTTP Strict Transport Security (HSTS)',
          category: 'Security Protocol',
          confidence: 0.99,
          role: `Enforced encrypted HTTPS transport for ${domainName}`,
          evidenceCount: 2,
        });
      }
    } catch (error) {
      // Fail gracefully on network errors/timeouts and return empty array
    }

    return {
      technologies,
    };
  }
}
