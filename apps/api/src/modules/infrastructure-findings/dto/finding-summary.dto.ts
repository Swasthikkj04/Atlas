import { ApiProperty } from '@nestjs/swagger';

export class FindingSummaryDto {
  @ApiProperty({ example: 'find-123' })
  id!: string;

  @ApiProperty({ example: '2e5b652d-c186-41de-8c68-144f58308e24' })
  domainId!: string;

  @ApiProperty({ example: 'example.com' })
  domainName!: string;

  @ApiProperty({ example: 'Missing HSTS Header' })
  title!: string;

  @ApiProperty({ example: 'Strict-Transport-Security response header is absent.' })
  description!: string;

  @ApiProperty({ example: 'HIGH' })
  severity!: string;

  @ApiProperty({ example: 'SECURITY_HEADER' })
  category!: string;

  @ApiProperty({ example: 'CERTAIN' })
  confidence!: string;

  @ApiProperty({ example: 'OPEN' })
  state!: string;

  @ApiProperty({ example: '2026-07-24T20:00:00.000Z' })
  createdAt!: Date;
}
