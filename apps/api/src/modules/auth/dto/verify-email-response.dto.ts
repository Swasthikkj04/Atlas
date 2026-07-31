import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({ example: 'Email verified successfully. Your account is now active.' })
  message: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}
