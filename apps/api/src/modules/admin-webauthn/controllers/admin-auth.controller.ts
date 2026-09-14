import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminWebAuthnAuthenticationService } from '../services/admin-webauthn-authentication.service';
import { AdminWebAuthnEnrollmentService } from '../services/admin-webauthn-enrollment.service';
import { AdminSessionService } from '../../admin-session/services/admin-session.service';
import { AdminIdentityService } from '../../admin-identity/services/admin-identity.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../../admin-identity/contracts/admin-identity.contract';
import { InitiateWebAuthnAuthenticationDto } from '../dto/initiate-webauthn-authentication.dto';
import { VerifyWebAuthnAuthenticationDto } from '../dto/verify-webauthn-authentication.dto';
import { InitiateWebAuthnEnrollmentDto } from '../dto/initiate-webauthn-enrollment.dto';
import { VerifyWebAuthnEnrollmentDto } from '../dto/verify-webauthn-enrollment.dto';

/**
 * ADMIN-009: Dedicated Admin Authentication Controller
 *
 * Exposes production endpoints for the owner WebAuthn passkey ceremony:
 * - Public status check for UI bootstrapping
 * - WebAuthn Authentication ceremony (Initiate -> Verify -> Admin Session JWT)
 * - WebAuthn Enrollment ceremony (Initiate with primary password -> Verify)
 */
@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(
    private readonly authService: AdminWebAuthnAuthenticationService,
    private readonly enrollmentService: AdminWebAuthnEnrollmentService,
    private readonly sessionService: AdminSessionService,
    private readonly identityService: AdminIdentityService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Status check for Admin Entry UI bootstrapping.
   * Returns whether an Admin identity exists and whether any WebAuthn passkeys are active.
   */
  @Get('status')
  async getAuthStatus() {
    const admin = await this.identityService.getAdminIdentity();
    if (!admin) {
      return {
        isProvisioned: false,
        hasPasskeys: false,
        identifier: null,
      };
    }

    const passkeyCount = await this.prisma.adminWebAuthnCredential.count({
      where: {
        adminId: admin.id,
        status: 'ACTIVE',
      },
    });

    return {
      isProvisioned: true,
      isActive: admin.status === AdminStatus.ACTIVE,
      hasPasskeys: passkeyCount > 0,
      identifier: admin.identifier,
    };
  }

  /**
   * Step 1: Initiate WebAuthn Passkey Authentication Ceremony.
   */
  @Post('webauthn/authenticate/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateAuthentication(@Body() dto: InitiateWebAuthnAuthenticationDto) {
    return this.authService.initiateAuthentication(dto);
  }

  /**
   * Step 2: Verify WebAuthn Passkey Assertion & Issue Short-Lived Admin JWT.
   */
  @Post('webauthn/authenticate/verify')
  @HttpCode(HttpStatus.OK)
  async verifyAuthentication(
    @Body() dto: VerifyWebAuthnAuthenticationDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // 1. Authoritative WebAuthn assertion verification (produces AAL3 AuthenticatedAdminResult)
    const authResult = await this.authService.verifyAuthentication(dto);

    // 2. Convert verified result to authoritative Admin Session & short-lived JWT (ADMIN-005)
    const sessionTokenResponse = await this.sessionService.createSession(
      authResult,
      {
        ipAddress,
        userAgent,
      },
    );

    return {
      ...sessionTokenResponse,
      adminId: authResult.adminIdentityId,
      identifier: authResult.identifier,
    };
  }

  private async extractAdminSession(req?: Request) {
    if (!req) return undefined;
    const authHeader =
      req.headers?.authorization || (req.headers as any)?.['authorization'];
    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      return undefined;
    }
    const token = authHeader.substring(7).trim();
    if (!token) return undefined;
    try {
      const ipAddress = req.ip || req.socket?.remoteAddress;
      const userAgent = req.headers?.['user-agent'];
      return await this.sessionService.validateAdminToken(token, {
        ipAddress,
        userAgent,
      });
    } catch {
      return undefined;
    }
  }

  /**
   * Step 1 (Enrollment): Initiate WebAuthn Passkey Registration Ceremony.
   * Requires possession proof of primary password or active Admin session context.
   */
  @Post('webauthn/enroll/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateEnrollment(
    @Body() dto: InitiateWebAuthnEnrollmentDto,
    @Req() req: Request,
  ) {
    const adminContext = await this.extractAdminSession(req);
    return this.enrollmentService.initiateEnrollment(dto, adminContext);
  }

  /**
   * Step 2 (Enrollment): Verify WebAuthn Passkey Registration & Store Credential.
   */
  @Post('webauthn/enroll/verify')
  @HttpCode(HttpStatus.CREATED)
  async verifyEnrollment(
    @Body() dto: VerifyWebAuthnEnrollmentDto,
    @Req() req: Request,
  ) {
    const adminContext = await this.extractAdminSession(req);
    return this.enrollmentService.verifyAndRegisterEnrollment(
      dto,
      adminContext,
    );
  }
}
