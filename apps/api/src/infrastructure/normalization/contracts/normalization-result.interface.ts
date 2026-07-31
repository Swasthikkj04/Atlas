import { CanonicalObservation } from './canonical-observation.interface';
import { NormalizationDiagnostics } from './normalization-diagnostics.interface';

export interface NormalizationResult<
  T extends Record<string, CanonicalObservation<any>> = Record<
    string,
    CanonicalObservation<any>
  >,
> {
  domainId: string;
  evidenceId: string;
  normalizerName: string;
  normalizerVersion: string;
  normalizedAt: Date;
  observations: T;
  diagnostics: NormalizationDiagnostics;
}
