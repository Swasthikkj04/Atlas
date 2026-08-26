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
    enum: [
      'DOMAIN',
      'FINDING',
      'CHANGE',
      'TIMELINE',
      'INFRASTRUCTURE',
      'BRIEF',
      'INVESTIGATION',
      'ACTIVITY',
    ],
  })
  type!:
    | 'DOMAIN'
    | 'FINDING'
    | 'CHANGE'
    | 'TIMELINE'
    | 'INFRASTRUCTURE'
    | 'BRIEF'
    | 'INVESTIGATION'
    | 'ACTIVITY';

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
    description: 'Optional subtitle for visual hierarchy.',
    example: 'HIGH · example.com',
    required: false,
  })
  subtitle?: string;

  @ApiProperty({
    description: 'Associated domain identifier.',
    example: 'dom-1234-5678',
    required: false,
  })
  domainId?: string;

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

  @ApiProperty({
    description: 'Optional metadata dictionary for technical qualifiers.',
    required: false,
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Canonical destination path for navigation.',
    example: '/workspace?domainId=dom-1234',
    required: false,
  })
  destination?: string;
}
