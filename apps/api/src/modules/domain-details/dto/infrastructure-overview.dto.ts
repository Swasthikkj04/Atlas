import { ApiProperty } from '@nestjs/swagger';

export class InfrastructureOverviewDto {
  @ApiProperty({
    description: 'Resolved IPv4 addresses',
    type: [String],
    example: ['93.184.216.34'],
  })
  ipv4Addresses!: string[];

  @ApiProperty({
    description: 'Resolved IPv6 addresses',
    type: [String],
    example: [],
  })
  ipv6Addresses!: string[];

  @ApiProperty({
    description: 'Detected web server',
    example: 'nginx',
    nullable: true,
  })
  webServer!: string | null;

  @ApiProperty({
    description: 'Detected CDN',
    example: 'Cloudflare',
    nullable: true,
  })
  cdn!: string | null;

  @ApiProperty({
    description: 'TLS certificate is currently valid',
    example: true,
  })
  sslValid!: boolean;

  @ApiProperty({
    description: 'TLS certificate expiry date',
    nullable: true,
  })
  sslExpiresAt!: Date | null;

  @ApiProperty({
    description: 'Detected technologies',
    type: [String],
    example: ['React', 'Node.js', 'Cloudflare'],
  })
  technologies!: string[];

  @ApiProperty({
    description: 'Latest HTTP status code',
    example: 200,
  })
  httpStatus!: number;

  @ApiProperty({
    description: 'Latest response time in milliseconds',
    example: 145,
  })
  responseTimeMs!: number;
}
