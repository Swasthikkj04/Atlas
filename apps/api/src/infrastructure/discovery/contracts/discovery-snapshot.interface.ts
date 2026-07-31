import type { DnsDiscoveryResult } from '../dns/dns-discovery.service';
import type { HttpDiscoveryResult } from '../http/http-discovery.service';
import type { SslDiscoveryResult } from '../ssl/ssl-discovery.service';
import type { TechnologyDiscoveryResult } from '../technology/technology-discovery.service';

export interface DiscoverySnapshot {
  dns?: DnsDiscoveryResult;
  http?: HttpDiscoveryResult;
  ssl?: SslDiscoveryResult;
  technology?: TechnologyDiscoveryResult;
}
