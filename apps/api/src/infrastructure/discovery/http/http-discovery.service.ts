import { Injectable } from '@nestjs/common';
import * as https from 'node:https';
import axios, { AxiosError } from 'axios';
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

  redirectCount: number;

  error: string | null;
}

@Injectable()
export class HttpDiscoveryService
  implements
    DiscoveryModule<HttpDiscoveryResult>,
    DiscoveryCollector<HttpDiscoveryResult>
{
  readonly name = 'http';

  private readonly httpsAgent = new https.Agent({
    keepAlive: true,
  });

  async discover(domainName: string): Promise<HttpDiscoveryResult> {
    const url = `https://${domainName}`;
    const startedAt = Date.now();

    try {
      const response = await this.executeRequest(url);
      const responseTimeMs = Date.now() - startedAt;

      const finalUrl =
        response.request?.res?.responseUrl ?? url;

      let protocol: 'http' | 'https' | null = null;
      try {
        const parsed = new URL(finalUrl);
        protocol = parsed.protocol === 'https:' ? 'https' : 'http';
      } catch {
        protocol = finalUrl.startsWith('https') ? 'https' : 'http';
      }

      const normalizedHeaders = Object.fromEntries(
        Object.entries(response.headers).map(([key, value]) => [
          key.toLowerCase(),
          Array.isArray(value) ? value.join(', ') : String(value),
        ]),
      );

      return {
        reachable: true,

        url,

        finalUrl,

        protocol,

        statusCode: response.status,

        responseTimeMs,

        headers: normalizedHeaders,

        redirects: finalUrl !== url ? [finalUrl] : [],

        redirectCount: finalUrl !== url ? 1 : 0,

        error: null,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startedAt;
      const axiosError = error as AxiosError;

      const errorMessage = axiosError.code
        ? `${axiosError.code}: ${axiosError.message}`
        : axiosError.message || 'Unknown error';

      return {
        reachable: false,

        url,

        finalUrl: null,

        protocol: null,

        statusCode: null,

        responseTimeMs,

        headers: {},

        redirects: [],

        redirectCount: 0,

        error: errorMessage,
      };
    }
  }

  async collect(domainName: string): Promise<HttpDiscoveryResult> {
    return this.discover(domainName);
  }

  private async executeRequest(url: string, retries = 1) {
    try {
      return await axios.get(url, {
        httpsAgent: this.httpsAgent,
        maxRedirects: 10,
        timeout: 10000,
        validateStatus: () => true,
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNRESET' && retries > 0) {
        return this.executeRequest(url, retries - 1);
      }
      throw error;
    }
  }
}