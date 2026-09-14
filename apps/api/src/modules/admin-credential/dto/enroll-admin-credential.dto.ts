import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ADMIN-002: Enroll Primary Admin Credential DTO
 *
 * Controlled payload used strictly within isolated provisioning contexts.
 */
export class EnrollAdminCredentialDto {
  @ApiProperty({
    description:
      'High-entropy primary password for owner Admin (>= 16 characters)',
    example: 'Kx9#mQ2$vL8!pZ5@wN4^',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(16, {
    message: 'Admin password must be at least 16 characters long.',
  })
  password!: string;
}
