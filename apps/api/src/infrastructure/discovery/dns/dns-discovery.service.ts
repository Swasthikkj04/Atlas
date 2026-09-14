import { Injectable } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { DiscoveryCollector } from '../collector/discovery-collector.interface';

export type DnsLookupStatus =
  'SUCCESS' | 'NODATA' | 'NOT_FOUND' | 'TIMEOUT' | 'SERVFAIL' | 'FAILED';

export interface DnsLookupResult<T> {
  readonly data: T;
  readonly status: DnsLookupStatus;
  readonly error?: string;
}

export type DnssecStatus =
  | 'VALID'
  | 'SECURE'
  | 'INSECURE'
  | 'BOGUS'
  | 'INDETERMINATE'
  | 'UNSIGNED'
  | 'EXPIRED_RRSIG'
  | 'MISCONFIGURED'
  | 'WEAK_ALGORITHM'
  | 'UNSUPPORTED_DIGEST';

export interface CaaRecordEntry {
  critical?: number;
  tag?: string;
  value?: string;
  issuer?: string;
  issue?: string;
  issuewild?: string;
  iodef?: string;
  contactemail?: string;
  contactphone?: string;
}

export interface DnssecRecordData {
  enabled: boolean;
  status: DnssecStatus;
  hasDs?: boolean;
  hasDnskey?: boolean;
  hasRrsig?: boolean;
  keyTags?: number[];
  algorithms?: string[];
  digestTypes?: string[];
  flags?: number[];
  error?: string;
}

export interface DnsDiscoveryResult {
  a: string[];
  aaaa: string[];
  mx: { exchange: string; priority: number }[];
  ns: string[];
  cname: string[];
  txt: string[][];
  dmarc: string[][];
  caa?: CaaRecordEntry[];
  dnssec?: DnssecRecordData;
  status?: {
    a?: DnsLookupStatus;
    aaaa?: DnsLookupStatus;
    mx?: DnsLookupStatus;
    ns?: DnsLookupStatus;
    cname?: DnsLookupStatus;
    txt?: DnsLookupStatus;
    dmarc?: DnsLookupStatus;
    caa?: DnsLookupStatus;
    dnssec?: DnsLookupStatus;
  };
  errors?: Record<string, string>;
  rawRecords?: {
    txt?: string[];
    dmarc?: string[];
    a?: string[];
    aaaa?: string[];
    mx?: string[];
    ns?: string[];
    cname?: string[];
  };
}

export function classifyDnsError(err: unknown): {
  status: DnsLookupStatus;
  error: string;
} {
  if (!err) {
    return { status: 'SUCCESS', error: '' };
  }
  const errorObj = err as { code?: string; message?: string };
  const code = (errorObj.code || '').toUpperCase();
  const message = errorObj.message || String(err);
  const lowerMsg = message.toLowerCase();

  if (code === 'ENODATA' || code === 'NODATA') {
    return {
      status: 'NODATA',
      error: 'No DNS records found for this query type (ENODATA)',
    };
  }
  if (
    code === 'ENOTFOUND' ||
    code === 'NXDOMAIN' ||
    lowerMsg.includes('nxdomain')
  ) {
    return {
      status: 'NOT_FOUND',
      error: 'Domain name not found in DNS (NXDOMAIN/ENOTFOUND)',
    };
  }
  if (
    code === 'ETIMEOUT' ||
    code === 'TIMEOUT' ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('timed out')
  ) {
    return { status: 'TIMEOUT', error: 'DNS resolution timed out' };
  }
  if (
    code === 'ESERVFAIL' ||
    code === 'SERVFAIL' ||
    lowerMsg.includes('servfail')
  ) {
    return { status: 'SERVFAIL', error: 'DNS server returned SERVFAIL' };
  }
  return { status: 'FAILED', error: message || 'DNS query failed' };
}

@Injectable()
export class DnsDiscoveryService
  implements
    DiscoveryModule<DnsDiscoveryResult>,
    DiscoveryCollector<DnsDiscoveryResult>
{
  readonly name = 'dns';

  async discover(domainName: string): Promise<DnsDiscoveryResult> {
    const parts = domainName.split('.');
    const apexDomain =
      parts.length > 2 ? parts.slice(-2).join('.') : domainName;

    const [
      aRes,
      aaaaRes,
      mxInitialRes,
      nsInitialRes,
      cnameRes,
      txtInitialRes,
      dmarcInitialRes,
    ] = await Promise.all([
      this.safeLookupDetailed(() => dns.resolve4(domainName), []),
      this.safeLookupDetailed(() => dns.resolve6(domainName), []),
      this.safeLookupDetailed(() => dns.resolveMx(domainName), []),
      this.safeLookupDetailed(() => dns.resolveNs(domainName), []),
      this.safeLookupDetailed(() => dns.resolveCname(domainName), []),
      this.safeLookupDetailed(() => dns.resolveTxt(domainName), []),
      this.safeLookupDetailed(() => dns.resolveTxt(`_dmarc.${domainName}`), []),
    ]);

    let txtRes = txtInitialRes;
    if (
      txtRes.data.length === 0 &&
      txtRes.status !== 'TIMEOUT' &&
      txtRes.status !== 'SERVFAIL' &&
      txtRes.status !== 'FAILED' &&
      apexDomain !== domainName
    ) {
      txtRes = await this.safeLookupDetailed(
        () => dns.resolveTxt(apexDomain),
        [],
      );
    }

    let dmarcRes = dmarcInitialRes;
    if (
      dmarcRes.data.length === 0 &&
      dmarcRes.status !== 'TIMEOUT' &&
      dmarcRes.status !== 'SERVFAIL' &&
      dmarcRes.status !== 'FAILED' &&
      apexDomain !== domainName
    ) {
      dmarcRes = await this.safeLookupDetailed(
        () => dns.resolveTxt(`_dmarc.${apexDomain}`),
        [],
      );
    }

    let mxRes = mxInitialRes;
    if (
      mxRes.data.length === 0 &&
      mxRes.status !== 'TIMEOUT' &&
      mxRes.status !== 'SERVFAIL' &&
      mxRes.status !== 'FAILED' &&
      apexDomain !== domainName
    ) {
      mxRes = await this.safeLookupDetailed(
        () => dns.resolveMx(apexDomain),
        [],
      );
    }

    let nsRes = nsInitialRes;
    if (
      nsRes.data.length === 0 &&
      nsRes.status !== 'TIMEOUT' &&
      nsRes.status !== 'SERVFAIL' &&
      nsRes.status !== 'FAILED' &&
      apexDomain !== domainName
    ) {
      nsRes = await this.safeLookupDetailed(
        () => dns.resolveNs(apexDomain),
        [],
      );
    }

    const errors: Record<string, string> = {};
    if (aRes.error) errors.a = aRes.error;
    if (aaaaRes.error) errors.aaaa = aaaaRes.error;
    if (mxRes.error) errors.mx = mxRes.error;
    if (nsRes.error) errors.ns = nsRes.error;
    if (cnameRes.error) errors.cname = cnameRes.error;
    if (txtRes.error) errors.txt = txtRes.error;
    if (dmarcRes.error) errors.dmarc = dmarcRes.error;

    const flattenedTxt = txtRes.data.map((r) =>
      Array.isArray(r) ? r.join('') : String(r),
    );
    const flattenedDmarc = dmarcRes.data.map((r) =>
      Array.isArray(r) ? r.join('') : String(r),
    );

    return {
      a: aRes.data,
      aaaa: aaaaRes.data,
      mx: mxRes.data,
      ns: nsRes.data,
      cname: cnameRes.data,
      txt: txtRes.data,
      dmarc: dmarcRes.data,
      status: {
        a: aRes.status,
        aaaa: aaaaRes.status,
        mx: mxRes.status,
        ns: nsRes.status,
        cname: cnameRes.status,
        txt: txtRes.status,
        dmarc: dmarcRes.status,
      },
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      rawRecords: {
        txt: flattenedTxt,
        dmarc: flattenedDmarc,
        a: aRes.data,
        aaaa: aaaaRes.data,
        ns: nsRes.data,
        cname: cnameRes.data,
      },
    };
  }

  async collect(domainName: string): Promise<DnsDiscoveryResult> {
    return this.discover(domainName);
  }

  private async safeLookupDetailed<T>(
    operation: () => Promise<T>,
    fallback: T,
  ): Promise<DnsLookupResult<T>> {
    try {
      const data = await operation();
      return {
        data,
        status: 'SUCCESS',
      };
    } catch (err) {
      const classification = classifyDnsError(err);
      return {
        data: fallback,
        status: classification.status,
        error: classification.error,
      };
    }
  }
}
