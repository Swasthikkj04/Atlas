import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimGuestSessionDto {
  @ApiProperty({
    description: 'Guest session token identifier to claim',
    example: 'ses_1723456789_xyz789',
  })
  @IsNotEmpty({ message: 'Session token is required' })
  @IsString({ message: 'Session token must be a string' })
  sessionToken!: string;
}

export class ClaimGuestSessionResponseDto {
  @ApiProperty({
    description: 'Success status of claim operation',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Confirmation message',
    example: 'Guest understanding successfully claimed.',
  })
  message!: string;

  @ApiProperty({
    description: 'Domain ID associated with user account',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  domainId!: string;

  @ApiProperty({
    description: 'Domain name claimed',
    example: 'github.com',
  })
  domainName!: string;

  @ApiProperty({
    description: 'Claimed understanding job ID',
    example: 'gst_job_1723456789_abc123',
  })
  jobId!: string;
}
