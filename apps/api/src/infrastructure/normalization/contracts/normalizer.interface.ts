import { CanonicalObservation } from './canonical-observation.interface';
import { NormalizationResult } from './normalization-result.interface';

export interface Normalizer<
  TInput = any,
  TOutput extends Record<string, CanonicalObservation<any>> = Record<string, CanonicalObservation<any>>,
> {
  readonly name: string;
  readonly version: string;

  normalize(
    domainId: string,
    evidenceId: string,
    rawPayload: TInput,
  ): NormalizationResult<TOutput>;
}
