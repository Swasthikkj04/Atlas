import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminIdentityService } from '../../admin-identity/services/admin-identity.service';
import { AdminStatus } from '../../admin-identity/contracts/admin-identity.contract';
import { AdminCredentialCryptoService } from './admin-credential-crypto.service';
import {
  AdminCredential,
  AdminCredentialType,
  AdminCredentialStatus,
  AdminCredentialFailureCategory,
  AdminCredentialVerificationResult,
  ADMIN_CREDENTIAL_POLICY,
} from '../contracts/admin-credential.contract';
import { AdminCredentialBoundary } from '../boundaries/admin-credential.boundary';
import {
  AdminCredentialNotFoundException,
  AdminCredentialInvalidException,
} from '../exceptions/admin-credential.exception';
import { EnrollAdminCredentialDto } from '../dto/enroll-admin-credential.dto';
import { VerifyAdminCredentialDto } from '../dto/verify-admin-credential.dto';

// Placeholder dummy hash for constant-time mitigation when identity is not found
const TIMING_SAFE_DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$c29tZXZlcmlmaWVyZHVtbXl2YWx1ZQ';

@Injectable()
export class AdminCredentialService {
  private readonly logger = new Logger(AdminCredentialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminIdentityService: AdminIdentityService,
    private readonly cryptoService: AdminCredentialCryptoService,
  ) {}

  /**
   * Enrolls a primary password credential for the platform's single owner Admin identity.
   *
   * Invariants:
   * - AdminIdentity must exist and be ACTIVE.
   * - Plaintext password is never stored; hashed with Argon2id.
   * - Superseded credentials of the same type are REVOKED to preserve single active primary credential.
   */
  async enrollPrimaryCredential(
    adminId: string,
    dto: EnrollAdminCredentialDto,
  ): Promise<AdminCredential> {
    // 1. Verify Admin identity exists and is active
    await this.adminIdentityService.validateAuthenticationEligibility(adminId);

    // 2. Enforce complexity & length policy
    AdminCredentialBoundary.assertPasswordPolicy(dto.password);

    // 3. Check for existing primary password credentials
    const existingActive = await this.prisma.adminCredential.findFirst({
      where: {
        adminId,
        type: AdminCredentialType.PRIMARY_PASSWORD,
        status: AdminCredentialStatus.ACTIVE,
      },
      orderBy: { version: 'desc' },
    });

    let version = 1;
    if (existingActive) {
      version = existingActive.version + 1;
      // Revoke the superseded credential version
      await this.prisma.adminCredential.update({
        where: { id: existingActive.id },
        data: {
          status: AdminCredentialStatus.REVOKED,
          revokedAt: new Date(),
          revokedReason: `Superseded by credential version ${version}`,
        },
      });
      this.logger.log(
        `Superseded previous primary credential [${existingActive.id}] for admin [${adminId}]`,
      );
    }

    // 4. Hash password with Argon2id
    const verifierHash = await this.cryptoService.hashPrimaryPassword(
      dto.password,
    );

    // 5. Persist credential
    const created = await this.prisma.adminCredential.create({
      data: {
        adminId,
        type: AdminCredentialType.PRIMARY_PASSWORD,
        verifierHash,
        status: AdminCredentialStatus.ACTIVE,
        version,
        failedAttempts: 0,
      },
    });

    this.logger.log(
      `Primary credential version ${version} enrolled for Admin identity [${adminId}]`,
    );

    return this.mapToDomain(created);
  }

  /**
   * Authoritative server-side primary credential verification.
   *
   * Invariants:
   * - Frontend never asserts validity.
   * - Constant-time dummy verification if identity not found.
   * - Enforces fail-closed on DISABLED/REVOKED states.
   * - Enforces progressive lockout on repeated failures.
   */
  async verifyPrimaryCredential(
    dto: VerifyAdminCredentialDto,
  ): Promise<AdminCredentialVerificationResult> {
    const normalizedIdentifier = dto.identifier.trim().toLowerCase();

    // 1. Lookup Admin Identity
    const admin = await this.prisma.adminIdentity.findUnique({
      where: { identifier: normalizedIdentifier },
    });

    if (!admin) {
      // Mitigate timing side-channels with dummy verify
      await this.cryptoService.verifyPrimaryPassword(
        TIMING_SAFE_DUMMY_HASH,
        dto.password,
      );
      this.logger.warn(
        `Failed verification: Admin identifier '${normalizedIdentifier}' not found.`,
      );
      return {
        success: false,
        failureCategory: AdminCredentialFailureCategory.IDENTITY_NOT_FOUND,
      };
    }

    if (admin.status !== AdminStatus.ACTIVE) {
      this.logger.warn(
        `Failed verification: Admin identity [${admin.id}] is ${admin.status}.`,
      );
      return {
        success: false,
        failureCategory: AdminCredentialFailureCategory.IDENTITY_DISABLED,
      };
    }

    // 2. Lookup primary credential
    const credential = await this.prisma.adminCredential.findFirst({
      where: {
        adminId: admin.id,
        type: AdminCredentialType.PRIMARY_PASSWORD,
      },
      orderBy: { version: 'desc' },
    });

    if (!credential) {
      await this.cryptoService.verifyPrimaryPassword(
        TIMING_SAFE_DUMMY_HASH,
        dto.password,
      );
      this.logger.warn(
        `Failed verification: No primary credential enrolled for Admin [${admin.id}].`,
      );
      return {
        success: false,
        failureCategory: AdminCredentialFailureCategory.INVALID_CREDENTIALS,
      };
    }

    // 3. Status checks
    if (credential.status === AdminCredentialStatus.DISABLED) {
      return {
        success: false,
        credentialId: credential.id,
        failureCategory: AdminCredentialFailureCategory.CREDENTIAL_DISABLED,
      };
    }

    if (credential.status === AdminCredentialStatus.REVOKED) {
      return {
        success: false,
        credentialId: credential.id,
        failureCategory: AdminCredentialFailureCategory.CREDENTIAL_REVOKED,
      };
    }

    // 4. Lockout check
    const now = new Date();
    if (credential.lockedUntil && credential.lockedUntil > now) {
      this.logger.warn(
        `Failed verification: Credential [${credential.id}] is LOCKED until ${credential.lockedUntil.toISOString()}`,
      );
      return {
        success: false,
        credentialId: credential.id,
        failureCategory: AdminCredentialFailureCategory.CREDENTIAL_LOCKED,
        lockedUntil: credential.lockedUntil,
        remainingAttempts: 0,
      };
    }

    // 5. Verify Argon2id hash
    const isValid = await this.cryptoService.verifyPrimaryPassword(
      credential.verifierHash,
      dto.password,
    );

    if (!isValid) {
      const nextFailedAttempts = credential.failedAttempts + 1;
      const willLock =
        nextFailedAttempts >= ADMIN_CREDENTIAL_POLICY.MAX_FAILED_ATTEMPTS;
      const lockedUntil = willLock
        ? new Date(Date.now() + ADMIN_CREDENTIAL_POLICY.LOCKOUT_DURATION_MS)
        : null;

      await this.prisma.adminCredential.update({
        where: { id: credential.id },
        data: {
          failedAttempts: nextFailedAttempts,
          lockedUntil,
        },
      });

      this.logger.warn(
        `Failed primary credential attempt #${nextFailedAttempts} for Admin [${admin.id}]. Locked=${willLock}`,
      );

      return {
        success: false,
        credentialId: credential.id,
        failureCategory: willLock
          ? AdminCredentialFailureCategory.CREDENTIAL_LOCKED
          : AdminCredentialFailureCategory.INVALID_CREDENTIALS,
        lockedUntil,
        remainingAttempts: Math.max(
          0,
          ADMIN_CREDENTIAL_POLICY.MAX_FAILED_ATTEMPTS - nextFailedAttempts,
        ),
      };
    }

    // 6. Success: Reset failure counters and record lastUsedAt
    await this.prisma.adminCredential.update({
      where: { id: credential.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastUsedAt: now,
      },
    });

    this.logger.log(
      `Primary credential verification successful for Admin [${admin.id}]`,
    );

    return {
      success: true,
      credentialId: credential.id,
    };
  }

  /**
   * Disables an Admin credential.
   */
  async disableCredential(credentialId: string): Promise<AdminCredential> {
    const updated = await this.prisma.adminCredential.update({
      where: { id: credentialId },
      data: { status: AdminCredentialStatus.DISABLED },
    });
    return this.mapToDomain(updated);
  }

  /**
   * Revokes an Admin credential permanently.
   */
  async revokeCredential(
    credentialId: string,
    reason?: string,
  ): Promise<AdminCredential> {
    const updated = await this.prisma.adminCredential.update({
      where: { id: credentialId },
      data: {
        status: AdminCredentialStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason || 'Revoked by owner action',
      },
    });
    return this.mapToDomain(updated);
  }

  /**
   * Unlocks an Admin credential (resets lockout & failed counters).
   */
  async unlockCredential(credentialId: string): Promise<AdminCredential> {
    const updated = await this.prisma.adminCredential.update({
      where: { id: credentialId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
    return this.mapToDomain(updated);
  }

  /**
   * Retrieves all credentials for an Admin identity (metadata only).
   */
  async getCredentialsForAdmin(adminId: string): Promise<AdminCredential[]> {
    const records = await this.prisma.adminCredential.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapToDomain(r));
  }

  private mapToDomain(record: any): AdminCredential {
    return {
      id: record.id,
      adminId: record.adminId,
      type: record.type as AdminCredentialType,
      verifierHash: record.verifierHash,
      status: record.status as AdminCredentialStatus,
      version: record.version,
      failedAttempts: record.failedAttempts,
      lockedUntil: record.lockedUntil,
      lastUsedAt: record.lastUsedAt,
      revokedAt: record.revokedAt,
      revokedReason: record.revokedReason,
      metadata: record.metadata as Record<string, unknown> | null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
