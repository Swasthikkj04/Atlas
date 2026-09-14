import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ADMIN-003: Initiate WebAuthn Enrollment DTO
 *
 * Requires owner Admin identifier + existing primary password credential
 * to authorize issuance of a single-use registration challenge.
 */
export class InitiateWebAuthnEnrollmentDto {
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
      'Primary password proving possession of existing Admin credential (optional if authenticated with Admin session Bearer token)',
    example: 'Kx9#mQ2$vL8!pZ5@wN4^',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Optional device label for the hardware key',
    example: 'MacBook Touch ID',
  })
  @IsString()
  @IsOptional()
  deviceLabel?: string;
}
