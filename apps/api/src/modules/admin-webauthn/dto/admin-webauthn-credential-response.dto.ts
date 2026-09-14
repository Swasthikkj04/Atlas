import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminCredentialStatus } from '../../admin-credential/contracts/admin-credential.contract';
import { AdminWebAuthnCredentialDto } from '../contracts/admin-webauthn.contract';

/**
 * ADMIN-003: Admin WebAuthn Credential Response DTO
 *
 * Safe public representation of an enrolled Admin passkey.
 * Private keys are NEVER stored or returned.
 */
export class AdminWebAuthnCredentialResponseDto implements AdminWebAuthnCredentialDto {
  @ApiProperty({ example: 'w0000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  adminId!: string;

  @ApiProperty({ example: 'base64url-credential-id-string' })
  credentialId!: string;

  @ApiPropertyOptional({ example: 'YubiKey 5C NFC', nullable: true })
  deviceLabel?: string | null;

  @ApiProperty({ example: ['internal', 'usb', 'hybrid'] })
  transports!: string[];

  @ApiProperty({
    enum: AdminCredentialStatus,
    example: AdminCredentialStatus.ACTIVE,
  })
  status!: AdminCredentialStatus;

  @ApiPropertyOptional({ example: '2026-08-29T21:00:00Z', nullable: true })
  lastUsedAt?: Date | null;

  @ApiProperty({ example: '2026-08-29T20:00:00Z' })
  createdAt!: Date;
}
