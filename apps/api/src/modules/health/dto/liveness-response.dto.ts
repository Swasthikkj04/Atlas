import { ApiProperty } from '@nestjs/swagger';

export class LivenessResponseDto {
  @ApiProperty({ example: 'UP', description: 'Process liveness status.' })
  status!: string;

  @ApiProperty({ example: 'atlas-api', description: 'Application service identifier.' })
  service!: string;

  @ApiProperty({ example: '1.0.0', description: 'Application version.' })
  version!: string;

  @ApiProperty({ example: '2026-07-26T08:10:11.542Z', description: 'Timestamp of check.' })
  timestamp!: string;

  @ApiProperty({ example: 18452, description: 'Process uptime in seconds.' })
  uptimeSeconds!: number;
}
