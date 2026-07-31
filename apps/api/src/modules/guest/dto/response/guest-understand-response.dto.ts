import { ApiProperty } from '@nestjs/swagger';

export class GuestSessionMetaDto {
  @ApiProperty({ example: 'gst_550e8400-e29b-41d4-a716-446655440000' })
  sessionToken: string;

  @ApiProperty({ example: '2026-08-01T19:00:00.000Z' })
  expiresAt: Date;
}

export class GuestUnderstandingMetaDto {
  @ApiProperty({ example: 'job-550e8400-e29b-41d4-a716-446655440000' })
  jobId: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;
}

export class GuestUnderstandResponseDto {
  @ApiProperty({ type: GuestSessionMetaDto })
  session: GuestSessionMetaDto;

  @ApiProperty({ type: GuestUnderstandingMetaDto })
  understanding: GuestUnderstandingMetaDto;
}
