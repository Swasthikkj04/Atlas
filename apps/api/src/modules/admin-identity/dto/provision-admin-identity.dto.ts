import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ADMIN-001: Provision Admin Identity DTO
 *
 * Dedicated controlled provisioning payload for the single owner-exclusive Admin identity.
 */
export class ProvisionAdminIdentityDto {
  @ApiProperty({
    description:
      'Unique immutable identifier for the platform owner Admin identity',
    example: 'platform-owner',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.-]{3,64}$/, {
    message:
      'Admin identifier must be 3-64 characters and contain only alphanumeric characters, underscores, hyphens, or dots.',
  })
  identifier!: string;

  @ApiPropertyOptional({
    description:
      'Initial authentication and credential metadata (reserved for ADMIN-002+)',
  })
  @IsOptional()
  @IsObject()
  authMetadata?: Record<string, unknown>;
}
