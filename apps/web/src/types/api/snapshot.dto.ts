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

export type DriftChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
export type DriftRiskLevel = 'CLEAN' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface DiffItemDto {
  readonly field: string;
  readonly type: DriftChangeType;
  readonly previousValue?: any;
  readonly currentValue?: any;
  readonly description: string;
  readonly severity: DriftRiskLevel;
}

export interface DnsDriftSummaryDto {
  readonly changes: readonly DiffItemDto[];
  readonly ipShiftDetected: boolean;
  readonly nameserverShiftDetected: boolean;
}

export interface TlsDriftSummaryDto {
  readonly changes: readonly DiffItemDto[];
  readonly daysRemainingPrevious?: number;
  readonly daysRemainingCurrent?: number;
  readonly issuerChanged: boolean;
}

export interface HttpDriftSummaryDto {
  readonly changes: readonly DiffItemDto[];
  readonly previousStatus?: number;
  readonly currentStatus?: number;
  readonly noiseHeadersSuppressed: number;
}

export interface TechDriftSummaryDto {
  readonly changes: readonly DiffItemDto[];
  readonly addedTechnologies: readonly string[];
  readonly removedTechnologies: readonly string[];
}

export interface SnapshotDriftForensicsDto {
  readonly baseSnapshotId: string;
  readonly targetSnapshotId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly baseCapturedAt: string;
  readonly targetCapturedAt: string;
  readonly driftScore: number;
  readonly riskLevel: DriftRiskLevel;
  readonly hasMeaningfulDrift: boolean;
  readonly totalChangesCount: number;
  readonly forensicNarrative: readonly string[];
  readonly dns: DnsDriftSummaryDto;
  readonly tls: TlsDriftSummaryDto;
  readonly http: HttpDriftSummaryDto;
  readonly technology: TechDriftSummaryDto;
}

export type DriftAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type DriftAlertCategory = 'DNS' | 'TLS' | 'HTTP_SECURITY' | 'TECH_STACK' | 'ROUTING';

export interface DriftAlertDto {
  readonly id: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly snapshotId: string;
  readonly previousSnapshotId?: string;
  readonly driftScore: number;
  readonly riskLevel: DriftRiskLevel;
  readonly status: DriftAlertStatus;
  readonly category: DriftAlertCategory;
  readonly title: string;
  readonly summary: string;
  readonly forensicNarrative: readonly string[];
  readonly changes: readonly DiffItemDto[];
  readonly createdAt: string;
  readonly acknowledgedAt?: string;
  readonly acknowledgedBy?: string;
}


