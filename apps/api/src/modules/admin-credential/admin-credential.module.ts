import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AdminIdentityModule } from '../admin-identity/admin-identity.module';
import { AdminCredentialCryptoService } from './services/admin-credential-crypto.service';
import { AdminCredentialService } from './services/admin-credential.service';

/**
 * ADMIN-002: Admin Credential Module
 *
 * Dedicated security boundary module providing cryptographic credential verification,
 * lifecycle state transitions, and lockout protection for the owner Admin identity.
 */
@Module({
  imports: [PrismaModule, AdminIdentityModule],
  providers: [AdminCredentialCryptoService, AdminCredentialService],
  exports: [AdminCredentialCryptoService, AdminCredentialService],
})
export class AdminCredentialModule {}
