import { Injectable } from '@nestjs/common';

import { DiscoveryModule } from '../contracts/discovery-module.interface';

export interface DetectedTechnology {
  name: string;
  category: string;
  confidence: number;
}

export interface TechnologyDiscoveryResult {
  technologies: DetectedTechnology[];
}

@Injectable()
export class TechnologyDiscoveryService
  implements DiscoveryModule<TechnologyDiscoveryResult>
{
  readonly name = 'technology';

  async discover(
    domainName: string,
  ): Promise<TechnologyDiscoveryResult> {
    const url = domainName.startsWith('http') ? domainName : `https://${domainName}`;
    const technologies: DetectedTechnology[] = [];

    try {
      // Perform the single HTTP request with a 10-second timeout safety
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Technology-Discovery/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      const headers = response.headers;
      const html = await response.text();

      // --- Rule Engine ---

      // 1. Check for NGINX (via Server header)
      const serverHeader = headers.get('server')?.toLowerCase() ?? '';
      if (serverHeader.includes('nginx')) {
        technologies.push({
          name: 'NGINX',
          category: 'Web Server',
          confidence: 0.99,
        });
      }

      // 2. Check for Next.js (via X-Powered-By header or common HTML markers)
      const xPoweredBy = headers.get('x-powered-by')?.toLowerCase() ?? '';
      if (
        xPoweredBy.includes('next.js') ||
        html.includes('__NEXT_DATA__') ||
        html.includes('/_next/static')
      ) {
        technologies.push({
          name: 'Next.js',
          category: 'Frontend Framework',
          confidence: 0.95,
        });
      }
    } catch (error) {
      // Fail gracefully on network errors/timeouts and return an empty array
    }

    return {
      technologies,
    };
  }
}