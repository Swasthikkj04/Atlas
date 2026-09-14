import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

/**
 * ADMIN-004: Verify WebAuthn Authentication DTO
 *
 * Transmits the WebAuthn assertion response signed by the enrolled Passkey
 * to establish authenticated Admin identity proof.
 */
export class VerifyWebAuthnAuthenticationDto {
  @ApiProperty({
    description: 'Owner Admin identifier',
    example: 'platform-owner',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiPropertyOptional({
    description:
      'WebAuthn challenge issued during authentication initiation (or auto-resolved from clientDataJSON)',
    example: 'dGhpcy1pcy1hLXNlY3VyZS1jaGFsbGVuZ2U',
  })
  @IsString()
  @IsOptional()
  challenge?: string;

  @ApiProperty({
    description:
      'Standard W3C WebAuthn authentication assertion response from authenticator',
  })
  @IsObject()
  @IsNotEmpty()
  response!: AuthenticationResponseJSON;
}
