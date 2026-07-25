import { Injectable } from '@nestjs/common';
import { EvidenceCategory } from '@prisma/client';

import { NormalizationResult } from '../contracts/normalization-result.interface';
import { HttpNormalizerService } from '../normalizers/http-normalizer.service';

@Injectable()
export class NormalizationEngineService {
  constructor(private readonly httpNormalizer: HttpNormalizerService) {}

  normalizeEvidence(
    domainId: string,
    evidenceId: string,
    category: EvidenceCategory,
    rawPayload: any,
  ): NormalizationResult<any> {
    switch (category) {
      case EvidenceCategory.HTTP_RESPONSE:
      case EvidenceCategory.HTTP_HEADERS:
        return this.httpNormalizer.normalize(domainId, evidenceId, rawPayload);

      default:
        // Default to HTTP normalizer for generic payloads if headers exist
        return this.httpNormalizer.normalize(domainId, evidenceId, rawPayload);
    }
  }
}
