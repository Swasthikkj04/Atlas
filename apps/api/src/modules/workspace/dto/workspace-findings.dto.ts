import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceFindingsDto {
  @ApiProperty({
    description: 'Total number of findings across the workspace.',
    example: 51,
  })
  total!: number;

  @ApiProperty({
    description: 'Number of unresolved findings.',
    example: 18,
  })
  unresolved!: number;

  @ApiProperty({
    description: 'Number of resolved findings.',
    example: 33,
  })
  resolved!: number;
}
