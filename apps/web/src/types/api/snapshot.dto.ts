/**
 * Authoritative Public Infrastructure Snapshot API DTO Contracts.
 *
 * INVARIANT: Snapshots represent immutable observed infrastructure facts.
 * They are read-only and must never be mutated on the client.
 */

export interface SnapshotDnsRecordDto {
  readonly type: string;
  readonly name: string;
  readonly value: string;
  readonly ttl?: number;
}

export interface SnapshotTlsCertificateDto {
  readonly subject: string;
  readonly issuer: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly serialNumber?: string;
  readonly fingerprintSha256?: string;
  readonly sans?: readonly string[];
}

export interface SnapshotHttpObservationDto {
  readonly statusCode: number;
  readonly redirectedTo?: string | null;
  readonly server?: string | null;
  readonly securityHeaders?: Readonly<Record<string, string>>;
}

export interface InfrastructureSnapshotDto {
  readonly id: string;
  readonly domainId: string;
  readonly domainName?: string;
  readonly jobId?: string | null;
  readonly capturedAt?: string;
  readonly createdAt?: string;
  readonly responseTimeMs?: number;
  readonly httpStatus?: number;
  readonly dnsRecords?: readonly SnapshotDnsRecordDto[];
  readonly tlsCertificate?: SnapshotTlsCertificateDto | null;
  readonly httpObservation?: SnapshotHttpObservationDto | null;
  readonly technologies?: readonly string[];
  readonly rawHash?: string;
  readonly previousSnapshotId?: string | null;
  readonly payload?: unknown;
}

export interface SnapshotListResponseDto {
  readonly snapshots?: readonly InfrastructureSnapshotDto[];
  readonly data?: readonly InfrastructureSnapshotDto[];
  readonly total?: number;
  readonly pagination?: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly pages: number;
  };
}

export interface SnapshotLineageDto {
  readonly currentSnapshot: InfrastructureSnapshotDto;
  readonly previousSnapshot?: InfrastructureSnapshotDto | null;
  readonly domainId: string;
  readonly domainName: string;
  readonly changeId?: string | null;
  readonly findingId?: string | null;
  readonly isInitialBaseline?: boolean;
}
