import { ApiProperty } from '@nestjs/swagger';

export class FindingsSummaryDto {
  @ApiProperty({
    example: 18,
  })
  total!: number;

  @ApiProperty({
    example: 2,
  })
  critical!: number;

  @ApiProperty({
    example: 4,
  })
  high!: number;

  @ApiProperty({
    example: 7,
  })
  medium!: number;

  @ApiProperty({
    example: 5,
  })
  low!: number;

  @ApiProperty({
    example: 0,
  })
  informational!: number;
}
