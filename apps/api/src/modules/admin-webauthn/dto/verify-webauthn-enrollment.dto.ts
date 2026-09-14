import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';

/**
 * ADMIN-003: Verify WebAuthn Enrollment DTO
 *
 * Transmits the authenticator registration ceremony response
 * along with the challenge to complete enrollment.
 */
export class VerifyWebAuthnEnrollmentDto {
  @ApiPropertyOptional({
    description:
      'Owner Admin identifier (optional if authenticated with Admin session Bearer token)',
    example: 'platform-owner',
  })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiPropertyOptional({
    description:
      'WebAuthn registration challenge issued during initiation (or auto-resolved from clientDataJSON)',
    example: 'dGhpcy1pcy1hLXNlY3VyZS1jaGFsbGVuZ2U',
  })
  @IsString()
  @IsOptional()
  challenge?: string;

  @ApiProperty({
    description:
      'Standard W3C WebAuthn registration response object from authenticator',
  })
  @IsObject()
  @IsNotEmpty()
  response!: RegistrationResponseJSON;

  @ApiPropertyOptional({
    description:
      'Optional human-readable label for the hardware authenticator / device',
    example: 'YubiKey 5C NFC',
  })
  @IsString()
  @IsOptional()
  deviceLabel?: string;
}
