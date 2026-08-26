import type { InfrastructureSnapshotDto } from '../../../types/api/snapshot.dto';

/**
 * Authoritative Signal Availability States (WX-702).
 *
 * Distinctly separates verified telemetry from authoritative absence and unavailable categories.
 */
export type SignalAvailabilityState = 'AVAILABLE' | 'ABSENT' | 'UNAVAILABLE' | 'PENDING';

export interface InfrastructureSignalObservation {
  readonly signalKey: string;
  readonly signalName: string;
  readonly state: SignalAvailabilityState;
  readonly summary?: string;
  readonly detail?: string;
}

export interface PartialIntelligenceSummary {
  readonly establishedSignals: readonly InfrastructureSignalObservation[];
  readonly absentSignals: readonly InfrastructureSignalObservation[];
  readonly unavailableSignals: readonly InfrastructureSignalObservation[];
  readonly isPartial: boolean;
  readonly explanation: string;
}

/**
 * Resolves signal coverage for Infrastructure Overview snapshots.
 *
 * Follows strict backend truth:
 * - AVAILABLE: Telemetry was observed and verified.
 * - ABSENT: Authoritatively observed to have no records (e.g. no CDN layer).
 * - UNAVAILABLE: Subsystem was not reachable or telemetry was not captured.
 */
export function resolveOverviewSignalCoverage(
  snapshot: InfrastructureSnapshotDto | null
): PartialIntelligenceSummary {
  if (!snapshot) {
    return {
      establishedSignals: [],
      absentSignals: [],
      unavailableSignals: [],
      isPartial: false,
      explanation: 'No snapshot established.',
    };
  }

  const established: InfrastructureSignalObservation[] = [];
  const absent: InfrastructureSignalObservation[] = [];
  const unavailable: InfrastructureSignalObservation[] = [];

  // 1. DNS & Network
  if (snapshot.dnsRecords && snapshot.dnsRecords.length > 0) {
    established.push({
      signalKey: 'dns',
      signalName: 'DNS & Network',
      state: 'AVAILABLE',
      summary: `${snapshot.dnsRecords.length} records verified`,
    });
  } else if (snapshot.dnsRecords && snapshot.dnsRecords.length === 0) {
    absent.push({
      signalKey: 'dns',
      signalName: 'DNS & Network',
      state: 'ABSENT',
      summary: 'No DNS records observed',
    });
  } else {
    unavailable.push({
      signalKey: 'dns',
      signalName: 'DNS & Network',
      state: 'UNAVAILABLE',
      summary: 'DNS telemetry unavailable during discovery',
    });
  }

  // 2. TLS Certificate
  if (snapshot.tlsCertificate) {
    established.push({
      signalKey: 'tls',
      signalName: 'TLS Certificate',
      state: 'AVAILABLE',
      summary: `Issuer: ${snapshot.tlsCertificate.issuer}`,
      detail: `Valid until ${snapshot.tlsCertificate.validTo}`,
    });
  } else {
    unavailable.push({
      signalKey: 'tls',
      signalName: 'TLS Certificate',
      state: 'UNAVAILABLE',
      summary: 'TLS certificate telemetry unavailable',
    });
  }

  // 3. Web Server & HTTP Observation
  if (snapshot.httpObservation) {
    established.push({
      signalKey: 'http',
      signalName: 'Web Server / HTTP',
      state: 'AVAILABLE',
      summary: `HTTP ${snapshot.httpObservation.statusCode}${snapshot.httpObservation.server ? ` · ${snapshot.httpObservation.server}` : ''}`,
    });
  } else {
    unavailable.push({
      signalKey: 'http',
      signalName: 'Web Server / HTTP',
      state: 'UNAVAILABLE',
      summary: 'HTTP protocol observation unavailable',
    });
  }

  // 4. Technology Discovery
  if (snapshot.technologies && snapshot.technologies.length > 0) {
    established.push({
      signalKey: 'technologies',
      signalName: 'Technology Stack',
      state: 'AVAILABLE',
      summary: snapshot.technologies.join(' · '),
    });
  } else if (snapshot.technologies && snapshot.technologies.length === 0) {
    absent.push({
      signalKey: 'technologies',
      signalName: 'Technology Stack',
      state: 'ABSENT',
      summary: 'No third-party technologies identified',
    });
  } else {
    unavailable.push({
      signalKey: 'technologies',
      signalName: 'Technology Stack',
      state: 'UNAVAILABLE',
      summary: 'Technology fingerprinting telemetry unavailable',
    });
  }

  const isPartial = established.length > 0 && unavailable.length > 0;
  const explanation = isPartial
    ? 'Some infrastructure observations could not be established during discovery. Verified facts remain visible.'
    : established.length > 0
    ? 'All monitored infrastructure signals verified.'
    : 'No infrastructure observations established.';

  return {
    establishedSignals: established,
    absentSignals: absent,
    unavailableSignals: unavailable,
    isPartial,
    explanation,
  };
}

/**
 * Resolves partial evidence coverage for an Investigation.
 */
export function resolveEvidenceSignalCoverage(params: {
  hasFact: boolean;
  hasLineage: boolean;
  hasRawTelemetry: boolean;
}): {
  readonly isPartial: boolean;
  readonly explanation: string;
} {
  const { hasFact, hasLineage, hasRawTelemetry } = params;

  if (hasFact && (!hasLineage || !hasRawTelemetry)) {
    return {
      isPartial: true,
      explanation: 'Observed fact is verified, but deep protocol evidence was not captured during telemetry collection.',
    };
  }

  return {
    isPartial: false,
    explanation: hasFact
      ? 'Complete observation evidence available.'
      : 'No evidence established.',
  };
}
