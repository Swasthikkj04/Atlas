import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SearchItemDto } from './search-item.dto';

export class SearchFacetsDto {
  @ApiPropertyOptional({
    description: 'Counts by entity type.',
    example: { DOMAIN: 2, FINDING: 5, CHANGE: 1 },
  })
  types?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Counts by finding severity.',
    example: { HIGH: 3, MEDIUM: 2 },
  })
  severities?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Counts by domain identifier.',
    example: { 'dom-1': 5, 'dom-2': 3 },
  })
  domains?: Record<string, number>;
}

export class SearchResponseDto {
  @ApiProperty({
    description: 'Search query performed.',
    example: 'example',
  })
  query!: string;

  @ApiProperty({
    description: 'Total results found.',
    example: 5,
  })
  total!: number;

  @ApiProperty({
    description:
      'Matching search results ordered by relevance score descending.',
    type: [SearchItemDto],
  })
  data!: SearchItemDto[];

  @ApiPropertyOptional({
    description: 'Contextual facet counts across matched entities.',
    type: SearchFacetsDto,
  })
  facets?: SearchFacetsDto;
}
