import { Injectable } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { DiscoveryCollector } from '../collector/discovery-collector.interface';

export interface DnsDiscoveryResult {
  a: string[];
  aaaa: string[];
  mx: { exchange: string; priority: number }[];
  ns: string[];
  cname: string[];
  txt: string[][];
  dmarc: string[][];
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

    const [a, aaaa, mxInitial, nsInitial, cname, txtInitial, dmarcInitial] =
      await Promise.all([
        this.safeLookup(() => dns.resolve4(domainName), []),
        this.safeLookup(() => dns.resolve6(domainName), []),
        this.safeLookup(() => dns.resolveMx(domainName), []),
        this.safeLookup(() => dns.resolveNs(domainName), []),
        this.safeLookup(() => dns.resolveCname(domainName), []),
        this.safeLookup(() => dns.resolveTxt(domainName), []),
        this.safeLookup(() => dns.resolveTxt(`_dmarc.${domainName}`), []),
      ]);

    let txt = txtInitial;
    if (txt.length === 0 && apexDomain !== domainName) {
      txt = await this.safeLookup(() => dns.resolveTxt(apexDomain), []);
    }

    let dmarc = dmarcInitial;
    if (dmarc.length === 0 && apexDomain !== domainName) {
      dmarc = await this.safeLookup(
        () => dns.resolveTxt(`_dmarc.${apexDomain}`),
        [],
      );
    }

    let mx = mxInitial;
    if (mx.length === 0 && apexDomain !== domainName) {
      mx = await this.safeLookup(() => dns.resolveMx(apexDomain), []);
    }

    let ns = nsInitial;
    if (ns.length === 0 && apexDomain !== domainName) {
      ns = await this.safeLookup(() => dns.resolveNs(apexDomain), []);
    }

    return {
      a,
      aaaa,
      mx,
      ns,
      cname,
      txt,
      dmarc,
    };
  }

  async collect(domainName: string): Promise<DnsDiscoveryResult> {
    return this.discover(domainName);
  }

  private async safeLookup<T>(
    operation: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    try {
      return await operation();
    } catch {
      return fallback;
    }
  }
}
