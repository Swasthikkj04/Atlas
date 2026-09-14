import { Module } from '@nestjs/common';
import { BgpRpkiDiscoveryService } from './services/bgp-rpki-discovery.service';

@Module({
  providers: [BgpRpkiDiscoveryService],
  exports: [BgpRpkiDiscoveryService],
})
export class RoutingModule {}
