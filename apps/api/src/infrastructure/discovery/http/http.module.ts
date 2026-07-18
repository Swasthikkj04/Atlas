import { Module } from '@nestjs/common';

import { HttpDiscoveryService } from './http-discovery.service';

@Module({
  providers: [HttpDiscoveryService],
  exports: [HttpDiscoveryService],
})
export class HttpModule {}