import { ApiProperty } from '@nestjs/swagger';

import { SearchItemDto } from './search-item.dto';

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
}
