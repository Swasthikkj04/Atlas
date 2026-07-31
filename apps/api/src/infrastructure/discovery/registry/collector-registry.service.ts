import { Injectable } from '@nestjs/common';

import { DiscoveryCollector } from '../collector/discovery-collector.interface';

import { DnsDiscoveryService } from '../dns/dns-discovery.service';
import { HttpDiscoveryService } from '../http/http-discovery.service';
import { SslDiscoveryService } from '../ssl/ssl-discovery.service';

@Injectable()
export class CollectorRegistryService {
  constructor(
    private readonly dnsCollector: DnsDiscoveryService,
    private readonly httpCollector: HttpDiscoveryService,
    private readonly sslCollector: SslDiscoveryService,
  ) {}

  collectors(): DiscoveryCollector<unknown>[] {
    return [this.dnsCollector, this.httpCollector, this.sslCollector];
  }
}
