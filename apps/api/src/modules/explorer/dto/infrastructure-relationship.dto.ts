import { ApiProperty } from '@nestjs/swagger';

export class InfrastructureRelationshipDto {
  @ApiProperty({
    example: 'rel-123',
    description: 'Unique relationship connection ID.',
  })
  id!: string;

  @ApiProperty({
    example: 'HOSTED_ON',
    description: 'Relationship predicate type (HOSTED_ON, SECURED_BY, SERVED_BY, APPLIES_TO, DEPENDS_ON).',
  })
  type!: string;

  @ApiProperty({
    example: 'asset-tls-google-com',
    description: 'Target asset ID.',
  })
  targetId!: string;

  @ApiProperty({
    example: 'Google TLS Certificate',
    description: 'Target asset display name.',
  })
  targetName!: string;

  @ApiProperty({
    example: 'TLS',
    description: 'Target asset category.',
  })
  targetCategory!: string;

  @ApiProperty({
    example: 'Secures HTTPS traffic for google.com',
    description: 'Relationship human-readable description.',
  })
  description!: string;
}
