/**
 * Authoritative Public Domain API DTO Contracts.
 */

export type DomainStatus = 'ACTIVE' | 'PENDING' | 'ARCHIVED' | 'FAILED';

export interface DomainMetadataDto {
  readonly registrar?: string | null;
  readonly dnsProvider?: string | null;
  readonly apexIp?: string | null;
  readonly nameservers?: readonly string[];
}

export interface DomainDto {
  readonly id: string;
  readonly domainName: string;
  readonly status: DomainStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastScanAt?: string | null;
  readonly lastUnderstoodAt?: string | null;
  readonly understandingStatus?: string | null;
  readonly metadata?: DomainMetadataDto;
  readonly snapshotCount?: number;
  readonly activeFindingCount?: number;
}

export interface CreateDomainRequestDto {
  readonly domainName: string;
}

export interface DomainListResponseDto {
  readonly domains: readonly DomainDto[];
  readonly total: number;
}
