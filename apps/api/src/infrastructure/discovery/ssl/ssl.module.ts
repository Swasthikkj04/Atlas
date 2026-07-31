import { Module } from '@nestjs/common';

import { SslDiscoveryService } from './ssl-discovery.service';

@Module({
  providers: [SslDiscoveryService],
  exports: [SslDiscoveryService],
})
export class SslModule {}
