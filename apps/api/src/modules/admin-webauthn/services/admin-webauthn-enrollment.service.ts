import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminIdentityService } from '../../admin-identity/services/admin-identity.service';
import { AdminCredentialService } from '../../admin-credential/services/admin-credential.service';
import { AdminStatus } from '../../admin-identity/contracts/admin-identity.contract';
import { AdminCredentialStatus } from '../../admin-credential/contracts/admin-credential.contract';
import { AdminSessionContext } from '../../admin-session/contracts/admin-session.contract';
import {
  ADMIN_AUDIT_CATEGORIES,
  ADMIN_AUDIT_RETENTION_CLASSES,
} from '../../admin-audit/contracts/admin-audit.contract';
import { AdminAuditService } from '../../admin-audit/services/admin-audit.service';
import {
  ADMIN_WEBAUTHN_POLICY,
  AdminWebAuthnAuditEvent,
  AdminWebAuthnCredentialDto,
} from '../contracts/admin-webauthn.contract';
import { AdminWebAuthnBoundary } from '../boundaries/admin-webauthn.boundary';
import {
  AdminWebAuthnChallengeExpiredException,
  AdminWebAuthnChallengeInvalidException,
  AdminWebAuthnDuplicateCredentialException,
  AdminWebAuthnVerificationFailedException,
  AdminWebAuthnUnauthorizedException,
} from '../exceptions/admin-webauthn.exception';
import {
  AdminCredentialInvalidException,
  AdminCredentialLockedException,
} from '../../admin-credential/exceptions/admin-credential.exception';
import { InitiateWebAuthnEnrollmentDto } from '../dto/initiate-webauthn-enrollment.dto';
import { VerifyWebAuthnEnrollmentDto } from '../dto/verify-webauthn-enrollment.dto';

@Injectable()
export class AdminWebAuthnEnrollmentService {
  private readonly logger = new Logger(AdminWebAuthnEnrollmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminIdentityService: AdminIdentityService,
    private readonly adminCredentialService: AdminCredentialService,
    @Optional() private readonly auditService?: AdminAuditService,
  ) {}

  /**
   * Step 1: Initiates WebAuthn Passkey registration ceremony for the owner Admin identity.
   *
   * Invariants:
   * - Proves possession of existing primary Admin password credential or active authenticated Admin session.
   * - Validates active passkey count < maxAdminPasskeys (5).
   * - Issues cryptographically secure, single-use, 5-minute challenge.
   * - Emits ADMIN_WEBAUTHN_ENROLLMENT_STARTED audit event.
   */
  async initiateEnrollment(
    dto: InitiateWebAuthnEnrollmentDto,
    authenticatedAdmin?: AdminSessionContext,
  ): Promise<{
    options: PublicKeyCredentialCreationOptionsJSON;
    challenge: string;
  }> {
    let admin: any = null;

    if (authenticatedAdmin) {
      admin = await this.prisma.adminIdentity.findUnique({
        where: { id: authenticatedAdmin.adminId },
      });
      if (
        dto.identifier &&
        dto.identifier.trim().toLowerCase() !==
          authenticatedAdmin.identifier.toLowerCase()
      ) {
        throw new AdminWebAuthnUnauthorizedException(
          'Mismatched admin identifier for authenticated session.',
        );
      }
    } else if (dto.identifier && dto.password) {
      // Authoritative primary credential verification
      const credVerification =
        await this.adminCredentialService.verifyPrimaryCredential({
          identifier: dto.identifier,
          password: dto.password,
        });

      if (!credVerification.success) {
        if (credVerification.failureCategory === 'CREDENTIAL_LOCKED') {
          throw new AdminCredentialLockedException(
            credVerification.lockedUntil,
          );
        }
        throw new AdminCredentialInvalidException(
          'Admin primary credential verification failed.',
        );
      }

      const normalizedIdentifier = dto.identifier.trim().toLowerCase();
      admin = await this.prisma.adminIdentity.findUnique({
        where: { identifier: normalizedIdentifier },
      });
    } else {
      throw new AdminWebAuthnUnauthorizedException(
        'WebAuthn enrollment requires an authenticated Admin session or valid primary credentials.',
      );
    }

    if (!admin || admin.status !== AdminStatus.ACTIVE) {
      throw new AdminWebAuthnUnauthorizedException(
        'Admin identity is inactive or does not exist.',
      );
    }

    // 3. Check passkey count against policy limit (5 max)
    const existingPasskeys = await this.prisma.adminWebAuthnCredential.findMany(
      {
        where: {
          adminId: admin.id,
          status: AdminCredentialStatus.ACTIVE,
        },
      },
    );

    AdminWebAuthnBoundary.assertPasskeyLimit(existingPasskeys.length);

    // 4. Build excludeCredentials list to prevent re-registering existing authenticators
    const excludeCredentials = existingPasskeys.map((p) => ({
      id: p.credentialId,
      transports: (p.transports || []) as any,
    }));

    // 5. Generate registration options via @simplewebauthn/server
    const options = await generateRegistrationOptions({
      rpName: ADMIN_WEBAUTHN_POLICY.rpName,
      rpID: ADMIN_WEBAUTHN_POLICY.rpId,
      userID: new TextEncoder().encode(admin.id),
      userName: admin.identifier,
      userDisplayName: `Nebula Admin (${admin.identifier})`,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
      supportedAlgorithmIDs: ADMIN_WEBAUTHN_POLICY.supportedAlgorithms,
    });

    // 6. Persist single-use registration challenge
    await this.prisma.adminWebAuthnChallenge.create({
      data: {
        adminId: admin.id,
        challenge: options.challenge,
        purpose: 'ENROLLMENT',
        expiresAt: new Date(Date.now() + ADMIN_WEBAUTHN_POLICY.challengeTtlMs),
      },
    });

    // 7. Audit log
    if (this.auditService) {
      await this.auditService.recordEvent({
        adminId: admin.id,
        action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_STARTED,
        category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
        retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
        targetType: 'AdminWebAuthnCredential',
        outcome: 'SUCCESS',
        metadata: {
          identifier: admin.identifier,
          deviceLabel: dto.deviceLabel || 'Admin Hardware Key',
        },
      });
    }

    this.logger.log(
      `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_STARTED}] Admin identity [${admin.id}] initiated Passkey enrollment.`,
    );

    return {
      options,
      challenge: options.challenge,
    };
  }

  /**
   * Step 2: Verifies authenticator registration response and persists the public credential material.
   *
   * Invariants:
   * - Challenge must exist, belong to Admin, be unconsumed, and unexpired.
   * - Challenge is atomically consumed immediately to prevent replay attacks.
   * - Server-side cryptographic signature & attestation verification.
   * - Origin and RP ID validated against server policy.
   * - Private keys never stored.
   * - Emits ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED or ADMIN_WEBAUTHN_ENROLLMENT_FAILED.
   */
  async verifyAndRegisterEnrollment(
    dto: VerifyWebAuthnEnrollmentDto,
    authenticatedAdmin?: AdminSessionContext,
  ): Promise<AdminWebAuthnCredentialDto> {
    let admin: any = null;

    if (authenticatedAdmin) {
      admin = await this.prisma.adminIdentity.findUnique({
        where: { id: authenticatedAdmin.adminId },
      });
      if (
        dto.identifier &&
        dto.identifier.trim().toLowerCase() !==
          authenticatedAdmin.identifier.toLowerCase()
      ) {
        throw new AdminWebAuthnUnauthorizedException(
          'Mismatched admin identifier for authenticated session.',
        );
      }
    } else if (dto.identifier) {
      const normalizedIdentifier = dto.identifier.trim().toLowerCase();
      admin = await this.prisma.adminIdentity.findUnique({
        where: { identifier: normalizedIdentifier },
      });
    } else {
      throw new AdminWebAuthnUnauthorizedException(
        'Admin identifier or authenticated session required for WebAuthn verification.',
      );
    }

    if (!admin || admin.status !== AdminStatus.ACTIVE) {
      throw new AdminWebAuthnUnauthorizedException(
        'Admin identity is inactive or does not exist.',
      );
    }

    // Assert candidate is not standard user credential
    AdminWebAuthnBoundary.assertNotUserWebAuthnCredential(dto.response);

    // 2. Lookup single-use challenge
    let rawChallenge = dto.challenge;
    const clientDataB64 =
      (dto.response as any)?.response?.clientDataJSON ||
      (dto.response as any)?.clientDataJSON;
    if (!rawChallenge && clientDataB64) {
      try {
        const parsed = JSON.parse(
          Buffer.from(clientDataB64, 'base64url').toString('utf-8'),
        );
        rawChallenge = parsed.challenge;
        if (parsed.origin) {
          AdminWebAuthnBoundary.assertValidOrigin(parsed.origin);
        }
      } catch (e) {
        if (e instanceof AdminWebAuthnVerificationFailedException) {
          if (this.auditService) {
            await this.auditService.recordEvent({
              adminId: admin.id,
              action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
              category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
              retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
              targetType: 'AdminWebAuthnCredential',
              outcome: 'FAILURE',
              metadata: { error: 'Invalid Origin in clientDataJSON' },
            });
          }
          throw e;
        }
      }
    }

    let challengeRecord = rawChallenge
      ? await this.prisma.adminWebAuthnChallenge.findUnique({
          where: { challenge: rawChallenge },
        })
      : null;

    if (!challengeRecord) {
      challengeRecord = await this.prisma.adminWebAuthnChallenge.findFirst({
        where: {
          adminId: admin.id,
          purpose: 'ENROLLMENT',
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!challengeRecord || challengeRecord.adminId !== admin.id) {
      this.logger.warn(`WebAuthn challenge mismatch for Admin [${admin.id}]`);
      if (this.auditService) {
        await this.auditService.recordEvent({
          adminId: admin.id,
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
          retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
          targetType: 'AdminWebAuthnCredential',
          outcome: 'FAILURE',
          metadata: { reason: 'Challenge not found or mismatched' },
        });
      }
      throw new AdminWebAuthnChallengeInvalidException(
        'Registration challenge not found or mismatched.',
      );
    }

    if (challengeRecord.consumedAt !== null) {
      this.logger.warn(
        `Attempted replay of already consumed challenge for Admin [${admin.id}]`,
      );
      if (this.auditService) {
        await this.auditService.recordEvent({
          adminId: admin.id,
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
          retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
          targetType: 'AdminWebAuthnCredential',
          outcome: 'FAILURE',
          metadata: { reason: 'Challenge already consumed' },
        });
      }
      throw new AdminWebAuthnChallengeInvalidException(
        'Challenge has already been consumed.',
      );
    }

    if (challengeRecord.expiresAt < new Date()) {
      this.logger.warn(`Expired WebAuthn challenge for Admin [${admin.id}]`);
      if (this.auditService) {
        await this.auditService.recordEvent({
          adminId: admin.id,
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
          retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
          targetType: 'AdminWebAuthnCredential',
          outcome: 'FAILURE',
          metadata: { reason: 'Challenge expired' },
        });
      }
      throw new AdminWebAuthnChallengeExpiredException(
        'Registration challenge has expired.',
      );
    }

    // 3. Atomically consume challenge immediately (Single-use replay defense)
    await this.prisma.adminWebAuthnChallenge.update({
      where: { id: challengeRecord.id },
      data: { consumedAt: new Date() },
    });

    // 4. Duplicate credential check
    const existingCred = await this.prisma.adminWebAuthnCredential.findUnique({
      where: { credentialId: dto.response.id },
    });

    if (existingCred) {
      if (this.auditService) {
        await this.auditService.recordEvent({
          adminId: admin.id,
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
          retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
          targetType: 'AdminWebAuthnCredential',
          outcome: 'FAILURE',
          metadata: { reason: 'Duplicate credential' },
        });
      }
      throw new AdminWebAuthnDuplicateCredentialException(
        'This WebAuthn passkey credential has already been registered.',
      );
    }

    // 5. Cryptographic verification via @simplewebauthn/server
    let verification: any;
    try {
      verification = await verifyRegistrationResponse({
        response: dto.response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: ADMIN_WEBAUTHN_POLICY.origins,
        expectedRPID: ADMIN_WEBAUTHN_POLICY.rpId,
        requireUserVerification: ADMIN_WEBAUTHN_POLICY.requireUserVerification,
      });
    } catch (err: any) {
      this.logger.error(
        `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED}] Cryptographic verification failed for Admin [${admin.id}]: ${err?.message}`,
      );
      if (this.auditService) {
        await this.auditService.recordEvent({
          adminId: admin.id,
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
          retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
          targetType: 'AdminWebAuthnCredential',
          outcome: 'FAILURE',
          metadata: { error: err?.message || 'Verification failed' },
        });
      }
      throw new AdminWebAuthnVerificationFailedException(
        `WebAuthn verification failed: ${err?.message || 'Invalid attestation'}`,
      );
    }

    if (!verification.verified || !verification.registrationInfo) {
      this.logger.error(
        `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED}] Registration unverified for Admin [${admin.id}]`,
      );
      if (this.auditService) {
        await this.auditService.recordEvent({
          adminId: admin.id,
          action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_FAILED,
          category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
          retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
          targetType: 'AdminWebAuthnCredential',
          outcome: 'FAILURE',
          metadata: { error: 'Registration unverified' },
        });
      }
      throw new AdminWebAuthnVerificationFailedException(
        'Authenticator registration could not be verified.',
      );
    }

    const { credential, aaguid, credentialBackedUp } =
      verification.registrationInfo;

    // 6. Persist public credential material only (Private key never stored)
    const created = await this.prisma.adminWebAuthnCredential.create({
      data: {
        adminId: admin.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: dto.response.response?.transports || [],
        aaguid: aaguid || null,
        deviceLabel: dto.deviceLabel || 'Admin Hardware Key',
        status: AdminCredentialStatus.ACTIVE,
        backedUp: credentialBackedUp || false,
      },
    });

    // Zero-leakage verification
    AdminWebAuthnBoundary.assertNoSecretLeakage({
      credentialId: created.credentialId,
      deviceLabel: created.deviceLabel,
      transports: created.transports,
    });

    // 7. Audit log
    if (this.auditService) {
      await this.auditService.recordEvent({
        adminId: admin.id,
        credentialId: created.id,
        action: AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED,
        category: ADMIN_AUDIT_CATEGORIES.AUTHENTICATION,
        retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.AUTHENTICATION,
        targetType: 'AdminWebAuthnCredential',
        targetId: created.id,
        outcome: 'SUCCESS',
        metadata: {
          credentialId: created.credentialId,
          deviceLabel: created.deviceLabel,
          transports: created.transports,
          backedUp: created.backedUp,
        },
      });
    }

    this.logger.log(
      `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED}] Admin identity [${admin.id}] successfully enrolled Passkey [${created.id}] (device: ${created.deviceLabel}).`,
    );

    return this.mapToDto(created);
  }

  /**
   * Disables an enrolled Admin Passkey.
   */
  async disablePasskey(
    adminId: string,
    credentialId: string,
  ): Promise<AdminWebAuthnCredentialDto> {
    const updated = await this.prisma.adminWebAuthnCredential.update({
      where: { id: credentialId, adminId },
      data: { status: AdminCredentialStatus.DISABLED },
    });

    this.logger.log(
      `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_CREDENTIAL_DISABLED}] Passkey [${credentialId}] disabled for Admin [${adminId}]`,
    );

    return this.mapToDto(updated);
  }

  /**
   * Permanently revokes an enrolled Admin Passkey.
   */
  async revokePasskey(
    adminId: string,
    credentialId: string,
    reason?: string,
  ): Promise<AdminWebAuthnCredentialDto> {
    const updated = await this.prisma.adminWebAuthnCredential.update({
      where: { id: credentialId, adminId },
      data: {
        status: AdminCredentialStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason || 'Revoked by owner',
      },
    });

    this.logger.log(
      `[AuditEvent: ${AdminWebAuthnAuditEvent.ADMIN_WEBAUTHN_CREDENTIAL_REVOKED}] Passkey [${credentialId}] REVOKED for Admin [${adminId}]. Reason: ${reason || 'Owner action'}`,
    );

    return this.mapToDto(updated);
  }

  /**
   * Lists all Passkeys enrolled for the Admin identity (Safe metadata only).
   */
  async listPasskeys(adminId: string): Promise<AdminWebAuthnCredentialDto[]> {
    const records = await this.prisma.adminWebAuthnCredential.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(record: any): AdminWebAuthnCredentialDto {
    return {
      id: record.id,
      adminId: record.adminId,
      credentialId: record.credentialId,
      deviceLabel: record.deviceLabel,
      transports: record.transports || [],
      status: record.status as AdminCredentialStatus,
      lastUsedAt: record.lastUsedAt,
      createdAt: record.createdAt,
    };
  }
}
