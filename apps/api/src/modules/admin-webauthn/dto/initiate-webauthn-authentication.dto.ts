import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ADMIN-004: Initiate WebAuthn Authentication DTO
 *
 * Requests an authentication challenge for the owner Admin identity.
 */
export class InitiateWebAuthnAuthenticationDto {
  @ApiProperty({
    description: 'Owner Admin identifier',
    example: 'platform-owner',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;
}
