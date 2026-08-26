import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmReactivationDto {
  @ApiProperty({
    description: 'Cryptographically random one-time reactivation token',
    example: 'd41d8cd98f00b204e9800998ecf8427e...',
  })
  @IsString({ message: 'Reactivation token must be a valid string.' })
  @IsNotEmpty({ message: 'Reactivation token is required.' })
  token: string;
}
