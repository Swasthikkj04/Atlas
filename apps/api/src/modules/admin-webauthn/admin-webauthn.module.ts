import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AdminIdentityModule } from '../admin-identity/admin-identity.module';
import { AdminCredentialModule } from '../admin-credential/admin-credential.module';
import { AdminSessionModule } from '../admin-session/admin-session.module';
import { AdminWebAuthnEnrollmentService } from './services/admin-webauthn-enrollment.service';
import { AdminWebAuthnAuthenticationService } from './services/admin-webauthn-authentication.service';
import { AdminAuthController } from './controllers/admin-auth.controller';

/**
 * ADMIN-003, ADMIN-004 & ADMIN-009: Admin WebAuthn Module
 *
 * Dedicated security boundary module providing WebAuthn Passkey registration ceremony,
 * challenge management, authenticator assertion verification, and authentication HTTP endpoints for the owner Admin.
 */
@Module({
  imports: [
    PrismaModule,
    AdminIdentityModule,
    AdminCredentialModule,
    AdminSessionModule,
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminWebAuthnEnrollmentService,
    AdminWebAuthnAuthenticationService,
  ],
  exports: [AdminWebAuthnEnrollmentService, AdminWebAuthnAuthenticationService],
})
export class AdminWebAuthnModule {}
