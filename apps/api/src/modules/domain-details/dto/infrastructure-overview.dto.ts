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

  @ApiProperty({
    description: 'Authoritative hosting provider attribution',
    example: 'Replit',
    nullable: true,
  })
  hostingProvider?: string | null;

  @ApiProperty({
    description: 'Attribution decision state',
    example: 'CONFIRMED',
    enum: ['CONFIRMED', 'STRONGLY_INFERRED', 'INFERRED', 'POSSIBLE', 'UNKNOWN', 'CONFLICTED'],
    nullable: true,
  })
  hostingDecision?: string | null;

  @ApiProperty({
    description: 'Attribution confidence level',
    example: 'HIGH',
    enum: ['HIGH', 'MEDIUM', 'LOW', 'INCONCLUSIVE'],
    nullable: true,
  })
  hostingConfidence?: string | null;

  @ApiProperty({
    description: 'Attribution reasoning and signal summary',
    example: 'Authoritatively confirmed deployment on Replit via correlated DNS CNAME and Replit HTTP headers.',
    nullable: true,
  })
  hostingExplanation?: string | null;

  @ApiProperty({
    description: 'Edge / CDN provider attribution',
    example: 'Cloudflare',
    nullable: true,
  })
  edgeProvider?: string | null;

  @ApiProperty({
    description: 'Edge / CDN confidence level',
    example: 'HIGH',
    nullable: true,
  })
  edgeConfidence?: string | null;

  @ApiProperty({
    description: 'Authoritative DNS provider attribution',
    example: 'Cloudflare',
    nullable: true,
  })
  dnsProvider?: string | null;

  @ApiProperty({
    description: 'DNS provider confidence level',
    example: 'HIGH',
    nullable: true,
  })
  dnsConfidence?: string | null;

  @ApiProperty({
    description: 'Full multi-signal provider attribution map',
    nullable: true,
  })
  attribution?: any;
}
