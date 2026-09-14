/**
 * Authoritative Public Timeline & Change History API DTO Contracts.
 *
 * All timeline and change events represent immutable historical records.
 */

export type ChangeType =
  | 'ADDED'
  | 'REMOVED'
  | 'MODIFIED'
  | 'CHANGED'
  | 'IMPROVED'
  | 'DEGRADED'
  | 'STABLE'
  | 'UNCHANGED'
  | 'DETECTED'
  | 'RESOLVED'
  | 'REGRESSED'
  | 'DNS_RECORD_ADDED'
  | 'DNS_RECORD_REMOVED'
  | 'DNS_RECORD_MODIFIED'
  | 'TLS_CERT_RENEWED'
  | 'TLS_EXPIRATION_WARNING'
  | 'HTTP_HEADER_MODIFIED'
  | 'INFRASTRUCTURE_DRIFT'
  | 'COMPONENT_DISCOVERED';

export type ChangeSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface TimelineEventDto {
  readonly id: string;
  readonly domainId: string;
  readonly domainName?: string;
  readonly snapshotId?: string;
  readonly previousSnapshotId?: string | null;
  readonly currentSnapshotId?: string | null;
  readonly changeType: ChangeType | string;
  readonly severity: ChangeSeverity | string;
  readonly category?: string;
  readonly title: string;
  readonly description?: string;
  readonly explanation?: string;
  readonly summary?: string;
  readonly impact?: string;
  readonly subject?: string;
  readonly whatThisEstablishes?: string;
  readonly whatThisDoesNotEstablish?: string;
  readonly derivedSummary?: {
    readonly previousLabel?: string;
    readonly currentLabel?: string;
    readonly postureChange?: string;
    readonly directives?: { readonly previous: number; readonly current: number };
    readonly allowedSources?: string;
    readonly browserRestrictions?: string;
    readonly overallPosture?: string;
  } | null;
  readonly confidence?: number;
  readonly findingCount?: number;
  readonly observationCount?: number;
  readonly evidenceCount?: number;
  readonly findingId?: string | null;
  readonly previousValue?: string | null;
  readonly currentValue?: string | null;
  readonly detectedAt?: string;
  readonly timestamp?: string | Date;
  readonly forensicExplanation?: {
    readonly whatChanged?: string;
    readonly whyWeBelieveIt?: string;
    readonly whatItMeans?: string;
    readonly whatWeCannotConclude?: string;
    readonly impact?: string;
    readonly attention?: string;
    readonly attentionRequired?: boolean;
  };
  readonly significance?: 'INFORMATIONAL' | 'NOTABLE' | 'IMPORTANT' | 'CRITICAL' | string;
  readonly blastRadiusLayers?: readonly string[];
}

export interface TimelineQueryDto {
  readonly domainId?: string;
  readonly severity?: ChangeSeverity;
  readonly changeType?: ChangeType;
  readonly category?: string;
  readonly module?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly search?: string;
  readonly limit?: number;
  readonly page?: number;
  readonly cursor?: string;
}

export interface TimelineResponseDto {
  readonly data?: readonly TimelineEventDto[];
  readonly events?: readonly TimelineEventDto[];
  readonly pagination?: {
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
    readonly limit: number;
  };
  readonly nextCursor?: string | null;
  readonly total?: number;
}

export interface TimelineRuleDetailDto {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly name: string;
  readonly description: string;
}

export interface TimelineDetailDto {
  readonly event: TimelineEventDto;
  readonly rule?: TimelineRuleDetailDto | null;
  readonly observations?: readonly unknown[];
  readonly evidence?: readonly unknown[];
  readonly relatedFindings?: readonly unknown[];
  readonly relatedAssets?: readonly unknown[];
  readonly changeDiff?: {
    readonly technologies?: {
      readonly added: readonly string[];
      readonly removed: readonly string[];
      readonly modified: readonly unknown[];
      readonly unchanged: readonly string[];
    };
    readonly dns?: {
      readonly added: readonly string[];
      readonly removed: readonly string[];
      readonly modified: readonly unknown[];
      readonly unchanged: readonly string[];
    };
    readonly headers?: {
      readonly added: readonly unknown[];
      readonly removed: readonly unknown[];
      readonly modified: readonly unknown[];
      readonly unchanged: readonly unknown[];
    };
    readonly certificates?: {
      readonly added: readonly string[];
      readonly removed: readonly string[];
      readonly modified: readonly unknown[];
      readonly unchanged: readonly string[];
    };
    readonly assets?: {
      readonly added: readonly string[];
      readonly removed: readonly string[];
      readonly modified: readonly unknown[];
      readonly unchanged: readonly string[];
    };
  };
  readonly previousSnapshotId?: string | null;
  readonly currentSnapshotId?: string | null;
  readonly previousSnapshot?: unknown;
  readonly currentSnapshot?: unknown;
}
