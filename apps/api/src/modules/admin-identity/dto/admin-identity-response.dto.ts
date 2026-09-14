import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AdminStatus,
  AdminIdentityPublicDto,
} from '../contracts/admin-identity.contract';

/**
 * ADMIN-001: Admin Identity Response DTO
 */
export class AdminIdentityResponseDto implements AdminIdentityPublicDto {
  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'platform-owner' })
  identifier!: string;

  @ApiProperty({ enum: AdminStatus, example: AdminStatus.ACTIVE })
  status!: AdminStatus;

  @ApiPropertyOptional({ example: '2026-08-20T00:00:00Z', nullable: true })
  lastAuthenticatedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-08-20T00:00:00Z', nullable: true })
  disabledAt?: Date | null;

  @ApiPropertyOptional({ example: 'Security review pending', nullable: true })
  disabledReason?: string | null;

  @ApiProperty({ example: '2026-08-20T00:00:00Z' })
  createdAt!: Date;
}
