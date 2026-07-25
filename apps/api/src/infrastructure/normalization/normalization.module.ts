import { Module } from '@nestjs/common';

import { HttpNormalizerService } from './normalizers/http-normalizer.service';
import { NormalizationEngineService } from './services/normalization-engine.service';

@Module({
  providers: [HttpNormalizerService, NormalizationEngineService],
  exports: [HttpNormalizerService, NormalizationEngineService],
})
export class NormalizationModule {}
