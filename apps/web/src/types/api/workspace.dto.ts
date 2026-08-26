import type { DomainDto } from './domain.dto';
import type { InfrastructureBriefDto } from './brief.dto';
import type { InfrastructureFindingDto } from './finding.dto';
import type { InfrastructureSnapshotDto } from './snapshot.dto';
import type { TimelineEventDto } from './timeline.dto';

/**
 * Purpose-Built Workspace Overview API DTO Contract.
 *
 * Implements the Workspace Bible requirement for synthesized Workspace intelligence
 * instead of requiring the frontend to assemble disparate endpoints.
 */
export interface WorkspaceQuietStatusDto {
  readonly isQuiet: boolean;
  readonly lastVerifiedAt: string;
  readonly stableComponentsCount: number;
}

export interface WorkspaceOverviewDto {
  readonly domain: DomainDto;
  readonly executiveBrief?: InfrastructureBriefDto | null;
  readonly primaryStory?: InfrastructureFindingDto | null;
  readonly secondaryStories: readonly InfrastructureFindingDto[];
  readonly latestSnapshot?: InfrastructureSnapshotDto | null;
  readonly recentChanges: readonly TimelineEventDto[];
  readonly quietStatus: WorkspaceQuietStatusDto;
}
