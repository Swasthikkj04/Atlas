import { Module } from '@nestjs/common';

import { DnsModule } from './dns/dns.module';
import { HttpModule } from './http/http.module';
import { DiscoveryRegistryService } from './registry/discovery-registry.service';
import { SslModule } from './ssl/ssl.module';
import { TechnologyModule } from './technology/technology.module';

@Module({
  imports: [
    DnsModule,
    HttpModule,
    SslModule,
    TechnologyModule,
  ],
  providers: [
    DiscoveryRegistryService,
  ],
  exports: [
    DnsModule,
    HttpModule,
    DiscoveryRegistryService,
    SslModule,
    TechnologyModule,
  ],
})
export class DiscoveryModule {}