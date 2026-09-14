import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AdminJwtCryptoService } from './services/admin-jwt-crypto.service';
import { AdminSessionService } from './services/admin-session.service';

/**
 * ADMIN-005: Admin Session & JWT Module
 *
 * Dedicated security boundary module providing Admin session lifecycle management,
 * isolated cryptographic token issuance/verification, and global/individual revocation.
 */
@Module({
  imports: [PrismaModule],
  providers: [AdminJwtCryptoService, AdminSessionService],
  exports: [AdminJwtCryptoService, AdminSessionService],
})
export class AdminSessionModule {}
