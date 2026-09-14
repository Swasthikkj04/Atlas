import { ApiProperty } from '@nestjs/swagger';

export class ArchitecturePathSegmentDto {
  @ApiProperty({ description: 'Hop index in request path', example: 0 })
  hop!: number;

  @ApiProperty({ description: 'Layer in topology', example: 'EDGE' })
  layer!: string;

  @ApiProperty({
    description: 'Technology identifier',
    example: 'tech-cloudflare',
  })
  technologyId!: string;

  @ApiProperty({
    description: 'Technology display name',
    example: 'Cloudflare',
  })
  technologyName!: string;

  @ApiProperty({
    description: 'Infrastructure role',
    example: 'Edge / CDN delivery',
  })
  role!: string;

  @ApiProperty({
    description: 'Relationship type to downstream component',
    example: 'FORWARDS_TO',
    nullable: true,
  })
  relationshipType?: string | null;
}

export class TechnologyArchitectureSummaryDto {
  @ApiProperty({ description: 'Technology identifier', example: 'tech-nextjs' })
  technologyId!: string;

  @ApiProperty({ description: 'Technology name', example: 'Next.js' })
  name!: string;

  @ApiProperty({ description: 'Technology category', example: 'Frameworks' })
  category!: string;

  @ApiProperty({
    description: 'Detected software version',
    example: '14.2.0',
    nullable: true,
  })
  version?: string | null;

  @ApiProperty({ description: 'Topology layer', example: 'APPLICATION' })
  layer!: string;

  @ApiProperty({
    description: 'Functional role',
    example: 'Web Application Framework',
  })
  role!: string;

  @ApiProperty({
    description: 'Derived infrastructure meaning',
    example: 'Handles server-side rendering and frontend routing',
  })
  infrastructureMeaning!: string;

  @ApiProperty({
    description: 'Why this was detected',
    example: 'Observed Next.js headers',
  })
  whyDetected!: string;

  @ApiProperty({
    description: 'What this presence does NOT prove',
    nullable: true,
  })
  whatThisDoesNotProve?: string | null;

  @ApiProperty({ description: 'Detection confidence score', example: 0.95 })
  confidence!: number;

  @ApiProperty({ description: 'Confidence level', example: 'HIGH' })
  confidenceLevel!: string;

  @ApiProperty({
    description: 'Evidence items supporting this detection',
    type: [Object],
  })
  evidence!: any[];
}

export class ArchitectureLayerSummaryDto {
  @ApiProperty({ description: 'Layer name', example: 'EDGE' })
  layer!: string;

  @ApiProperty({
    description: 'Observation state',
    example: 'OBSERVED',
    enum: ['OBSERVED', 'UNOBSERVED', 'MASKED', 'UNKNOWN'],
  })
  state!: 'OBSERVED' | 'UNOBSERVED' | 'MASKED' | 'UNKNOWN';

  @ApiProperty({
    description: 'Confidence level for this layer',
    example: 'HIGH',
  })
  confidenceLevel!: string;

  @ApiProperty({
    description: 'Technologies present in this layer',
    type: [TechnologyArchitectureSummaryDto],
  })
  technologies!: TechnologyArchitectureSummaryDto[];
}

export class ArchitectureUnknownDto {
  @ApiProperty({
    description: 'Infrastructure dimension',
    example: 'Origin Cloud Provider',
  })
  dimension!: string;

  @ApiProperty({
    description: 'Uncertainty status',
    example: 'MASKED',
    enum: ['MASKED', 'UNOBSERVED', 'UNKNOWN'],
  })
  status!: 'MASKED' | 'UNOBSERVED' | 'UNKNOWN';

  @ApiProperty({
    description: 'Explanation for uncertainty',
    example:
      'Origin infrastructure is masked behind Cloudflare Anycast proxies',
  })
  explanation!: string;

  @ApiProperty({
    description: 'Technical rationale',
    example: 'Anycast edge proxies terminate public client connections',
  })
  whyUnknown!: string;
}

export class ClaimBoundaryDto {
  @ApiProperty({
    description: 'Technology identifier',
    example: 'tech-cloudflare',
  })
  technologyId!: string;

  @ApiProperty({ description: 'Technology name', example: 'Cloudflare' })
  technologyName!: string;

  @ApiProperty({
    description: 'Anti-overreach claim boundary statement',
    example:
      'Cloudflare edge presence does not confirm origin hosting provider',
  })
  boundary!: string;
}

export class ArchitectureConfidenceSummaryDto {
  @ApiProperty({ description: 'Overall confidence level', example: 'HIGH' })
  overallLevel!: string;

  @ApiProperty({ description: 'Overall confidence score', example: 0.95 })
  overallScore!: number;

  @ApiProperty({ description: 'Layer confidence mapping' })
  layerConfidence!: Record<string, string>;

  @ApiProperty({
    description: 'Confidence rationale',
    example:
      'High confidence derived from authoritative HTTP and DNS evidence across all tiers',
  })
  rationale!: string;

  @ApiProperty({
    description: 'Count of confirmed graph relationships',
    example: 2,
  })
  confirmedRelationshipsCount!: number;

  @ApiProperty({
    description: 'Count of supported graph relationships',
    example: 1,
  })
  supportedRelationshipsCount!: number;

  @ApiProperty({
    description: 'Count of inferred graph relationships',
    example: 0,
  })
  inferredRelationshipsCount!: number;
}

export class TechnologyArchitectureOverviewDto {
  @ApiProperty({
    description: 'Synthesized architectural executive summary narrative',
    example:
      'The public endpoint appears to be delivered through Cloudflare edge infrastructure before requests reach Next.js.',
  })
  architectureSummary!: string;

  @ApiProperty({
    description: 'Multi-hop linear request ingress path',
    type: [ArchitecturePathSegmentDto],
  })
  ingressPath!: ArchitecturePathSegmentDto[];

  @ApiProperty({
    description: 'Structured breakdown of all 7 architectural layers',
    type: [ArchitectureLayerSummaryDto],
  })
  layers!: ArchitectureLayerSummaryDto[];

  @ApiProperty({
    description: 'All detected key technologies with role and meaning',
    type: [TechnologyArchitectureSummaryDto],
  })
  keyTechnologies!: TechnologyArchitectureSummaryDto[];

  @ApiProperty({
    description:
      'External third-party service integrations (e.g. Sentry, Stripe)',
    type: [TechnologyArchitectureSummaryDto],
  })
  integrations!: TechnologyArchitectureSummaryDto[];

  @ApiProperty({
    description: 'First-class known unknowns and uncertainty states',
    type: [ArchitectureUnknownDto],
  })
  knownUnknowns!: ArchitectureUnknownDto[];

  @ApiProperty({
    description: 'Anti-overreach claim boundaries',
    type: [ClaimBoundaryDto],
  })
  claimBoundaries!: ClaimBoundaryDto[];

  @ApiProperty({
    description: 'Multi-dimensional confidence scoring',
    type: ArchitectureConfidenceSummaryDto,
  })
  confidence!: ArchitectureConfidenceSummaryDto;
}
