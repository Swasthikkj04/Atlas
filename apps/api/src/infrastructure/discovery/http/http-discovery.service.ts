import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { DiscoveryCollector } from '../collector/discovery-collector.interface';

export interface HttpDiscoveryResult {
  reachable: boolean;

  url: string;

  finalUrl: string | null;

  protocol: 'http' | 'https' | null;

  statusCode: number | null;

  responseTimeMs: number;

  headers: Record<string, string>;

  redirects: string[];

  error: string | null;
}

@Injectable()
export class HttpDiscoveryService
  implements DiscoveryModule, DiscoveryCollector<unknown>
{
  readonly name = 'http';

  async discover(domainName: string): Promise<HttpDiscoveryResult> {
    const url = `https://${domainName}`;
    const startedAt = Date.now();

    try {
      const response = await axios.get(url, {
        maxRedirects: 10,
        timeout: 10000,
        validateStatus: () => true,
      });

      const responseTimeMs = Date.now() - startedAt;

      const finalUrl =
        response.request?.res?.responseUrl ?? url;

      return {
        reachable: true,

        url,

        finalUrl,

        protocol: finalUrl.startsWith('https')
          ? 'https'
          : 'http',

        statusCode: response.status,

        responseTimeMs,

        headers: response.headers as Record<string, string>,

        redirects: [],

        error: null,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startedAt;

      return {
        reachable: false,

        url,

        finalUrl: null,

        protocol: null,

        statusCode: null,

        responseTimeMs,

        headers: {},

        redirects: [],

        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      };
    }
  }

  async collect(domainName: string): Promise<unknown> {
    return this.discover(domainName);
  }
}