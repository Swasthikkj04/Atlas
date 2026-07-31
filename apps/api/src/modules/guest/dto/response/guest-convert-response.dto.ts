import { ApiProperty } from '@nestjs/swagger';
import { GuestNextActionDto } from './guest-understanding-status.dto';

export class GuestUserMetaDto {
  @ApiProperty({ example: 'usr-550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;
}

export class GuestWorkspaceMetaDto {
  @ApiProperty({ example: 'wsp-550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: "Jane's Workspace" })
  name: string;
}

export class GuestAuthMetaDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' })
  refreshToken: string;
}

export class GuestConvertResponseDto {
  @ApiProperty({ type: GuestUserMetaDto })
  user: GuestUserMetaDto;

  @ApiProperty({ type: GuestWorkspaceMetaDto })
  workspace: GuestWorkspaceMetaDto;

  @ApiProperty({ type: GuestAuthMetaDto })
  authentication: GuestAuthMetaDto;

  @ApiProperty({ type: GuestNextActionDto })
  next: GuestNextActionDto;
}
