import { CanonicalObservation } from '../contracts/canonical-observation.interface';

export interface CanonicalHttpObservations extends Record<
  string,
  CanonicalObservation<string>
> {
  strictTransportSecurity: CanonicalObservation<string>;
  contentSecurityPolicy: CanonicalObservation<string>;
  xFrameOptions: CanonicalObservation<string>;
  xContentTypeOptions: CanonicalObservation<string>;
  referrerPolicy: CanonicalObservation<string>;
  serverHeader: CanonicalObservation<string>;
}
