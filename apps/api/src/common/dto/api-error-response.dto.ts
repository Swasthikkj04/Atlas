import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'HTTP status text phrase',
    example: 'Bad Request',
  })
  error!: string;

  @ApiProperty({
    description: 'Standardized machine-readable error code',
    example: 'BAD_REQUEST',
  })
  code!: string;

  @ApiProperty({
    description: 'Human-readable error explanation message',
    example: 'Validation failed: email must be a valid email address',
  })
  message!: string;

  @ApiProperty({
    description: 'Detailed validation error constraints or context metadata',
    required: false,
    example: ['email must be an email'],
  })
  details?: any;

  @ApiProperty({
    description:
      'Unique trace identifier for cross-system request correlation and telemetry',
    example: 'corr_8e9d451b9a5b4ea7ba09b42617961a17',
  })
  correlationId!: string;

  @ApiProperty({
    description: 'ISO-8601 UTC timestamp of error occurrence',
    example: '2026-07-25T20:10:45.000Z',
  })
  timestamp!: string;
}
