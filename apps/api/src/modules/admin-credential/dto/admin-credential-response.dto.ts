import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AdminCredentialType,
  AdminCredentialStatus,
  AdminCredentialPublicDto,
} from '../contracts/admin-credential.contract';

/**
 * ADMIN-002: Admin Credential Public Response DTO
 *
 * Safe non-sensitive metadata representation of an Admin credential.
 * Verifier hashes and sensitive secret materials are NEVER included.
 */
export class AdminCredentialResponseDto implements AdminCredentialPublicDto {
  @ApiProperty({ example: 'c0000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  adminId!: string;

  @ApiProperty({
    enum: AdminCredentialType,
    example: AdminCredentialType.PRIMARY_PASSWORD,
  })
  type!: AdminCredentialType;

  @ApiProperty({
    enum: AdminCredentialStatus,
    example: AdminCredentialStatus.ACTIVE,
  })
  status!: AdminCredentialStatus;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiPropertyOptional({ example: '2026-08-29T20:00:00Z', nullable: true })
  lastUsedAt?: Date | null;

  @ApiProperty({ example: '2026-08-20T00:00:00Z' })
  createdAt!: Date;
}
