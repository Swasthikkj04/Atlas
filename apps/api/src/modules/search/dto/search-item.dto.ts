import { ApiProperty } from '@nestjs/swagger';

export class SearchItemDto {
  @ApiProperty({
    description: 'Unique identifier of the matching entity.',
    example: 'd9b2a1c0-3e4f-5a6b-7c8d-9e0f1a2b3c4d',
  })
  id!: string;

  @ApiProperty({
    description: 'Type of entity matched.',
    example: 'DOMAIN',
  })
  type!: 'DOMAIN' | 'FINDING' | 'TIMELINE' | 'BRIEF' | 'ACTIVITY';

  @ApiProperty({
    description: 'Title of the search result.',
    example: 'example.com',
  })
  title!: string;

  @ApiProperty({
    description: 'Description snippet.',
    example: 'Monitored domain',
  })
  description!: string;

  @ApiProperty({
    description: 'Associated domain name.',
    example: 'example.com',
  })
  domainName!: string;

  @ApiProperty({
    description: 'Calculated relevance score.',
    example: 95,
  })
  relevanceScore!: number;
}
