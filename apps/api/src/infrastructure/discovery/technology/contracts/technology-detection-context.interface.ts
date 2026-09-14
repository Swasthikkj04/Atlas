import type { DnsDiscoveryResult } from '../../dns/dns-discovery.service';
import type { HttpDiscoveryResult } from '../../http/http-discovery.service';
import type { SslDiscoveryResult } from '../../ssl/ssl-discovery.service';

export interface TechnologyDetectionContext {
  readonly domainName: string;
  readonly dns?: DnsDiscoveryResult;
  readonly http?: HttpDiscoveryResult;
  readonly ssl?: SslDiscoveryResult;
  readonly htmlBody?: string;
  readonly headers?: Record<string, string>;

  getHeader(headerName: string): string | undefined;
  hasHeader(headerName: string): boolean;
  hasHeaderContaining(headerName: string, substring: string): boolean;
  getCookie(cookieName: string): string | undefined;
  hasCookie(cookieName: string): boolean;
  hasCname(pattern: string | RegExp): boolean;
  hasNs(pattern: string | RegExp): boolean;
  hasARecord(ip: string): boolean;
  hasCertIssuer(pattern: string | RegExp): boolean;
  hasCertSan(pattern: string | RegExp): boolean;
  hasHtmlPattern(pattern: string | RegExp): boolean;
}
