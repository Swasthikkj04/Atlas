import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class ReactivationResponseDto {
  @ApiProperty({
    description: 'Human-readable confirmation message',
    example: 'Your account has been successfully reactivated.',
  })
  message: string;

  @ApiProperty({
    description: 'Access JWT token for immediate authentication',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    description: 'Refresh token for session persistence',
    required: false,
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'Reactivated user profile',
    required: false,
    type: () => UserResponseDto,
  })
  user?: UserResponseDto;
}
