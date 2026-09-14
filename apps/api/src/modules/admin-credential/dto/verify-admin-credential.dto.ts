import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ADMIN-002: Verify Admin Credential DTO
 *
 * Payload for primary credential verification step.
 */
export class VerifyAdminCredentialDto {
  @ApiProperty({
    description: 'Owner Admin identifier',
    example: 'platform-owner',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    description: 'Primary password secret',
    example: 'Kx9#mQ2$vL8!pZ5@wN4^',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
