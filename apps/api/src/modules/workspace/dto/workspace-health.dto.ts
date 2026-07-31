import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceHealthDto {
  @ApiProperty({
    description: 'Overall workspace health score (0-100).',
    example: 87,
    minimum: 0,
    maximum: 100,
  })
  score!: number;

  @ApiProperty({
    description: 'Infrastructure health letter grade (A, B, C, D, F).',
    example: 'B',
  })
  grade!: string;

  @ApiProperty({
    description: 'Health trend direction (STABLE, IMPROVING, DEGRADED).',
    example: 'STABLE',
  })
  trend!: string;

  @ApiProperty({
    description: 'Number of critical findings.',
    example: 2,
  })
  critical!: number;

  @ApiProperty({
    description: 'Number of high severity findings.',
    example: 5,
  })
  high!: number;

  @ApiProperty({
    description: 'Number of medium severity findings.',
    example: 9,
  })
  medium!: number;

  @ApiProperty({
    description: 'Number of low severity findings.',
    example: 14,
  })
  low!: number;

  @ApiProperty({
    description: 'Number of informational findings.',
    example: 21,
  })
  informational!: number;
}
