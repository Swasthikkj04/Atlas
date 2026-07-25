import { ApiProperty } from '@nestjs/swagger';

export class QuickActionDto {
  @ApiProperty({
    example: 'understand_now',
    description: 'Unique action identifier.',
  })
  id!: string;

  @ApiProperty({
    example: 'Understand Now',
    description: 'Human-readable action label.',
  })
  label!: string;

  @ApiProperty({
    example: 'UNDERSTAND',
    description: 'Action type code.',
  })
  action!: string;

  @ApiProperty({
    example: '/api/v1/domains/:id/understand',
    description: 'API endpoint for action execution.',
  })
  endpoint!: string;

  @ApiProperty({
    example: 'POST',
    description: 'HTTP method used for the action.',
  })
  method!: string;
}
