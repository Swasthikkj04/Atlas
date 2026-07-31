import { Module } from '@nestjs/common';
import { DnsDiscoveryService } from './dns-discovery.service';

@Module({
  providers: [DnsDiscoveryService],
  exports: [DnsDiscoveryService],
})
export class DnsModule {}
