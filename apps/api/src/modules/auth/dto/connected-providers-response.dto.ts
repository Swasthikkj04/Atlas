import { ApiProperty } from '@nestjs/swagger';

export class ConnectedProviderDto {
  @ApiProperty({ enum: ['google', 'github'], example: 'google' })
  provider: 'google' | 'github';

  @ApiProperty({ example: 'Google' })
  name: string;

  @ApiProperty({ example: true })
  connected: boolean;

  @ApiProperty({ example: 's•••••@gmail.com', required: false, nullable: true })
  accountLabel?: string | null;

  @ApiProperty({ example: true })
  canDisconnect: boolean;
}

export class ConnectedProvidersResponseDto {
  @ApiProperty({ type: [ConnectedProviderDto] })
  providers: ConnectedProviderDto[];
}
