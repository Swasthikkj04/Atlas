import { ApiProperty } from '@nestjs/swagger';
import { FindingSummaryDto } from './finding-summary.dto';

export class FindingsListDto {
  @ApiProperty({ type: [FindingSummaryDto] })
  data!: FindingSummaryDto[];

  @ApiProperty({
    example: { page: 1, limit: 20, total: 45, pages: 3 },
  })
  pagination!: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
