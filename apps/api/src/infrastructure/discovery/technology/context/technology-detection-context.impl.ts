import { TechnologyDetectionContext } from '../contracts/technology-detection-context.interface';
import type { DnsDiscoveryResult } from '../../dns/dns-discovery.service';
import type { HttpDiscoveryResult } from '../../http/http-discovery.service';
import type { SslDiscoveryResult } from '../../ssl/ssl-discovery.service';

export interface CreateTechnologyDetectionContextOptions {
  domainName: string;
  dns?: DnsDiscoveryResult;
  http?: HttpDiscoveryResult;
  ssl?: SslDiscoveryResult;
  htmlBody?: string;
  headers?: Record<string, string>;
}

export class TechnologyDetectionContextImpl implements TechnologyDetectionContext {
  readonly domainName: string;
  readonly dns?: DnsDiscoveryResult;
  readonly http?: HttpDiscoveryResult;
  readonly ssl?: SslDiscoveryResult;
  readonly htmlBody?: string;
  readonly headers?: Record<string, string>;

  private readonly normalizedHeaders: Map<string, string>;
  private readonly cookies: Map<string, string>;

  constructor(options: CreateTechnologyDetectionContextOptions) {
    this.domainName = options.domainName;
    this.dns = options.dns;
    this.http = options.http;
    this.ssl = options.ssl;
    this.htmlBody =
      options.htmlBody ||
      (options.http as any)?.bodySnippet ||
      (options.http as any)?.body ||
      (options.http as any)?.htmlBody;
    this.headers = options.headers || options.http?.headers || {};

    this.normalizedHeaders = new Map<string, string>();
    for (const [key, value] of Object.entries(this.headers)) {
      this.normalizedHeaders.set(key.toLowerCase(), String(value));
    }

    this.cookies = new Map<string, string>();
    const rawSetCookie = this.getHeader('set-cookie');
    if (rawSetCookie) {
      const parts = rawSetCookie.split(/;|,/);
      for (const part of parts) {
        const [cookieKey, ...valParts] = part.trim().split('=');
        if (cookieKey && valParts.length > 0) {
          this.cookies.set(cookieKey.toLowerCase(), valParts.join('='));
        }
      }
    }
    const httpCookies = (options.http as any)?.cookies;
    if (httpCookies && typeof httpCookies === 'object') {
      for (const [k, v] of Object.entries(httpCookies)) {
        this.cookies.set(k.toLowerCase(), String(v));
      }
    }
  }

  getHeader(headerName: string): string | undefined {
    return this.normalizedHeaders.get(headerName.toLowerCase());
  }

  hasHeader(headerName: string): boolean {
    return this.normalizedHeaders.has(headerName.toLowerCase());
  }

  hasHeaderContaining(headerName: string, substring: string): boolean {
    const val = this.getHeader(headerName);
    if (!val) return false;
    return val.toLowerCase().includes(substring.toLowerCase());
  }

  getCookie(cookieName: string): string | undefined {
    return this.cookies.get(cookieName.toLowerCase());
  }

  hasCookie(cookieName: string): boolean {
    return this.cookies.has(cookieName.toLowerCase());
  }

  hasCname(pattern: string | RegExp): boolean {
    const cnames = this.dns?.cname || [];
    if (typeof pattern === 'string') {
      const lower = pattern.toLowerCase();
      return cnames.some((c) => String(c).toLowerCase().includes(lower));
    }
    return cnames.some((c) => pattern.test(String(c)));
  }

  hasNs(pattern: string | RegExp): boolean {
    const nsRecords = this.dns?.ns || [];
    if (typeof pattern === 'string') {
      const lower = pattern.toLowerCase();
      return nsRecords.some((n) => String(n).toLowerCase().includes(lower));
    }
    return nsRecords.some((n) => pattern.test(String(n)));
  }

  hasARecord(ip: string): boolean {
    const aRecords = this.dns?.a || [];
    return aRecords.includes(ip);
  }

  hasCertIssuer(pattern: string | RegExp): boolean {
    const rawIssuer =
      (this.ssl as any)?.issuer || this.ssl?.certificate?.issuer || '';
    const issuer =
      typeof rawIssuer === 'object'
        ? JSON.stringify(rawIssuer)
        : String(rawIssuer);
    if (!issuer) return false;
    if (typeof pattern === 'string') {
      return issuer.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(issuer);
  }

  hasCertSan(pattern: string | RegExp): boolean {
    const rawSan =
      (this.ssl as any)?.san || this.ssl?.certificate?.subjectAltName || '';
    const san = Array.isArray(rawSan)
      ? rawSan.join(' ')
      : typeof rawSan === 'object'
        ? JSON.stringify(rawSan)
        : String(rawSan);
    if (!san) return false;
    if (typeof pattern === 'string') {
      return san.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(san);
  }

  hasHtmlPattern(pattern: string | RegExp): boolean {
    if (!this.htmlBody) return false;
    if (typeof pattern === 'string') {
      return this.htmlBody.includes(pattern);
    }
    return pattern.test(this.htmlBody);
  }
}

export function createTechnologyDetectionContext(
  options: CreateTechnologyDetectionContextOptions,
): TechnologyDetectionContext {
  return new TechnologyDetectionContextImpl(options);
}
