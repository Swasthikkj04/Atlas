import { Injectable } from '@nestjs/common';
import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { DnsDiscoveryService } from '../dns/dns-discovery.service';
import { HttpDiscoveryService } from '../http/http-discovery.service';
import { SslDiscoveryService } from '../ssl/ssl-discovery.service';
import { TechnologyDiscoveryService } from '../technology/technology-discovery.service';

@Injectable()
export class DiscoveryRegistryService {
  constructor(
    private readonly dns: DnsDiscoveryService,
    private readonly http: HttpDiscoveryService,
    private readonly ssl: SslDiscoveryService,
    private readonly technology: TechnologyDiscoveryService,
  ) {}

  getModules(): readonly DiscoveryModule<any>[] {
    return [
      this.dns,
      this.http,
      this.ssl,
      this.technology,
    ];
  }
}