import { ApiProperty } from '@nestjs/swagger';
import { InfrastructureAssetDto } from './infrastructure-asset.dto';

export class InfrastructureExplorerDto {
  @ApiProperty({ type: [InfrastructureAssetDto] })
  data!: InfrastructureAssetDto[];

  @ApiProperty({
    example: { page: 1, limit: 20, total: 15, pages: 1 },
  })
  pagination!: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
