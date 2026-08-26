import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as https from 'node:https';
import * as http from 'node:http';
import { DomainSecurityValidator } from './domain-security.validator';

export interface ReachabilityResult {
  readonly reachable: boolean;
  readonly normalizedDomain: string;
  readonly reason?: string;
  readonly statusCode?: number;
}

@Injectable()
export class DomainReachabilityService {
  private readonly logger = new Logger(DomainReachabilityService.name);
  readonly timeoutMs = 5000;

  private readonly httpsAgent = new https.Agent({
    keepAlive: false,
    rejectUnauthorized: false, // Accept self-signed / enterprise internal TLS certificates for reachability probe
  });

  private readonly httpAgent = new http.Agent({
    keepAlive: false,
  });

  constructor(private readonly securityValidator: DomainSecurityValidator) {}

  /**
   * Authoritative Domain Reachability Gate (WX-813).
   *
   * Verifies domain syntax, guards against SSRF, and executes a controlled
   * lightweight HTTP/HTTPS probe with strict timeout boundaries.
   */
  async verifyDomainReachability(
    rawDomain: string,
  ): Promise<ReachabilityResult> {
    // 1. Syntax & Normalization
    const syntaxResult =
      this.securityValidator.normalizeAndValidateSyntax(rawDomain);
    if (!syntaxResult.isValid) {
      return {
        reachable: false,
        normalizedDomain: syntaxResult.normalizedDomain,
        reason: 'DOMAIN_INVALID',
      };
    }

    const domain = syntaxResult.normalizedDomain;

    // 2. DNS & SSRF Validation Gate
    const dnsSafety =
      await this.securityValidator.verifyDnsAndSsrfSafety(domain);
    if (!dnsSafety.isSafe) {
      this.logger.debug(
        `Domain ${domain} failed DNS/SSRF safety check: ${dnsSafety.reason}`,
      );
      return {
        reachable: false,
        normalizedDomain: domain,
        reason: 'DOMAIN_UNREACHABLE',
      };
    }

    // 3. Controlled Lightweight Probe (HTTPS preferred, fallback to HTTP)
    const httpsResult = await this.probeUrl(`https://${domain}`);
    if (httpsResult.reachable) {
      return {
        reachable: true,
        normalizedDomain: domain,
        statusCode: httpsResult.statusCode,
      };
    }

    const httpResult = await this.probeUrl(`http://${domain}`);
    if (httpResult.reachable) {
      return {
        reachable: true,
        normalizedDomain: domain,
        statusCode: httpResult.statusCode,
      };
    }

    return {
      reachable: false,
      normalizedDomain: domain,
      reason: 'DOMAIN_UNREACHABLE',
    };
  }

  private async probeUrl(
    url: string,
  ): Promise<{ reachable: boolean; statusCode?: number }> {
    try {
      const isHttps = url.startsWith('https:');
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Nebula-Verification/1.0 (+https://argonion.com)',
          Accept: '*/*',
        },
        httpsAgent: isHttps ? this.httpsAgent : undefined,
        httpAgent: !isHttps ? this.httpAgent : undefined,
        timeout: this.timeoutMs,
        maxRedirects: 5,
        validateStatus: () => true, // ANY HTTP status (200, 301, 302, 401, 403, 500, etc.) indicates reachability
      });

      return {
        reachable: response.status !== undefined && response.status !== null,
        statusCode: response.status,
      };
    } catch {
      return { reachable: false };
    }
  }
}
