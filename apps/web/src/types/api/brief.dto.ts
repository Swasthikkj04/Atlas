/**
 * Authoritative Public Infrastructure Brief API DTO Contracts.
 *
 * The Brief is the backend's synthesized, human-oriented explanation of infrastructure.
 * The frontend renders this synthesized narrative; it never generates its own brief.
 */

export interface BriefHighlightDto {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly severity?: string;
  readonly componentType?: string;
}

export interface InfrastructureBriefDto {
  readonly id: string;
  readonly snapshotId: string;
  readonly domainId: string;
  readonly executiveSummary: string;
  readonly healthScore?: number | null;
  readonly highlights: readonly BriefHighlightDto[];
  readonly stableObservationsCount: number;
  readonly generatedAt: string;
}
