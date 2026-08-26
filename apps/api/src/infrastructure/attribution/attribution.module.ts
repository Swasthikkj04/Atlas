import { Module } from '@nestjs/common';
import { ProviderAttributionService } from './services/provider-attribution.service';

@Module({
  providers: [ProviderAttributionService],
  exports: [ProviderAttributionService],
})
export class AttributionModule {}
