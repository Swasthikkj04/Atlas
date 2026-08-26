import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Raw stateful refresh token returned during login/refresh (optional when passed via HTTP-Only cookie)',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
