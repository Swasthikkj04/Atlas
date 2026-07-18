import { Module } from '@nestjs/common';

import { TechnologyDiscoveryService } from './technology-discovery.service';

@Module({
  providers: [TechnologyDiscoveryService],
  exports: [TechnologyDiscoveryService],
})
export class TechnologyModule {}