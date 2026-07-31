import { ApiProperty } from '@nestjs/swagger';
import { IsFQDN, IsNotEmpty } from 'class-validator';

export class GuestUnderstandRequestDto {
  @ApiProperty({
    description: 'Fully qualified domain name target for guest infrastructure understanding',
    example: 'github.com',
  })
  @IsNotEmpty()
  @IsFQDN()
  target: string;
}
