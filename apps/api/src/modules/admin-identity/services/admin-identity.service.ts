import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  AdminIdentity,
  AdminStatus,
  ADMIN_IDENTITY_INVARIANTS,
} from '../contracts/admin-identity.contract';
import {
  AdminAlreadyProvisionedException,
  AdminNotProvisionedException,
} from '../exceptions/admin-identity.exception';
import { AdminIdentityBoundary } from '../boundaries/admin-identity.boundary';
import { ProvisionAdminIdentityDto } from '../dto/provision-admin-identity.dto';

/**
 * ADMIN-001: Admin Identity Service
 *
 * Authoritative management service for the platform's owner-exclusive Admin identity.
 *
 * Enforces:
 * - Exactly one authorized Admin identity for the entire platform.
 * - Explicit lifecycle transitions (ACTIVE <-> DISABLED).
 * - Immediate fail-closed behavior when disabled.
 * - Zero self-service or unauthorized admin creation pathways.
 */
@Injectable()
export class AdminIdentityService {
  private readonly logger = new Logger(AdminIdentityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Controlled provisioning of the platform's single owner-exclusive Admin identity.
   *
   * Invariant: Fails with 409 Conflict if an Admin identity is already provisioned.
   */
  async provisionAdminIdentity(
    dto: ProvisionAdminIdentityDto,
  ): Promise<AdminIdentity> {
    const existingCount = await this.prisma.adminIdentity.count();
    AdminIdentityBoundary.assertOwnerExclusiveCount(existingCount);

    if (existingCount >= ADMIN_IDENTITY_INVARIANTS.MAX_ADMIN_COUNT) {
      this.logger.warn(
        `Rejected duplicate Admin provisioning attempt for identifier: ${dto.identifier}`,
      );
      throw new AdminAlreadyProvisionedException();
    }

    const created = await this.prisma.adminIdentity.create({
      data: {
        identifier: dto.identifier.trim().toLowerCase(),
        status: AdminStatus.ACTIVE,
        authMetadata: (dto.authMetadata as any) ?? undefined,
      },
    });

    this.logger.log(
      `Owner-exclusive Admin identity successfully provisioned: ${created.identifier} [${created.id}]`,
    );

    return this.mapToDomain(created);
  }

  /**
   * Retrieves the authoritative platform Admin identity, or null if not yet provisioned.
   */
  async getAdminIdentity(): Promise<AdminIdentity | null> {
    const admin = await this.prisma.adminIdentity.findFirst();
    return admin ? this.mapToDomain(admin) : null;
  }

  /**
   * Retrieves the required authoritative platform Admin identity.
   * Throws AdminNotProvisionedException if unprovisioned.
   */
  async getRequiredAdminIdentity(): Promise<AdminIdentity> {
    const admin = await this.getAdminIdentity();
    if (!admin) {
      throw new AdminNotProvisionedException();
    }
    return admin;
  }

  /**
   * Disables the Admin identity.
   * Fails closed: Disabled Admin cannot authenticate or exercise privileges.
   */
  async disableAdminIdentity(
    adminId: string,
    reason?: string,
  ): Promise<AdminIdentity> {
    const existing = await this.prisma.adminIdentity.findUnique({
      where: { id: adminId },
    });

    if (!existing) {
      throw new AdminNotProvisionedException(
        `Admin identity ${adminId} not found.`,
      );
    }

    const updated = await this.prisma.adminIdentity.update({
      where: { id: adminId },
      data: {
        status: AdminStatus.DISABLED,
        disabledAt: new Date(),
        disabledReason: reason || 'Explicitly disabled by platform owner',
      },
    });

    this.logger.warn(
      `Admin identity ${updated.identifier} [${updated.id}] has been DISABLED. Reason: ${updated.disabledReason}`,
    );

    return this.mapToDomain(updated);
  }

  /**
   * Enables / restores the Admin identity to ACTIVE status.
   */
  async enableAdminIdentity(adminId: string): Promise<AdminIdentity> {
    const existing = await this.prisma.adminIdentity.findUnique({
      where: { id: adminId },
    });

    if (!existing) {
      throw new AdminNotProvisionedException(
        `Admin identity ${adminId} not found.`,
      );
    }

    const updated = await this.prisma.adminIdentity.update({
      where: { id: adminId },
      data: {
        status: AdminStatus.ACTIVE,
        disabledAt: null,
        disabledReason: null,
      },
    });

    this.logger.log(
      `Admin identity ${updated.identifier} [${updated.id}] has been RESTORED to ACTIVE status.`,
    );

    return this.mapToDomain(updated);
  }

  /**
   * Validates that the Admin identity exists and is ACTIVE.
   * Fails closed with AdminDisabledException if disabled.
   */
  async validateAuthenticationEligibility(
    adminId?: string,
  ): Promise<AdminIdentity> {
    const admin = adminId
      ? await this.prisma.adminIdentity.findUnique({ where: { id: adminId } })
      : await this.prisma.adminIdentity.findFirst();

    if (!admin) {
      throw new AdminNotProvisionedException();
    }

    const domainAdmin = this.mapToDomain(admin);
    AdminIdentityBoundary.assertAdminAuthenticationEligible(domainAdmin);

    return domainAdmin;
  }

  /**
   * Records a successful administrative authentication timestamp.
   */
  async recordAuthenticationSuccess(adminId: string): Promise<AdminIdentity> {
    const updated = await this.prisma.adminIdentity.update({
      where: { id: adminId },
      data: {
        lastAuthenticatedAt: new Date(),
      },
    });

    return this.mapToDomain(updated);
  }

  /**
   * Updates authentication metadata for subsequent credential phases (ADMIN-002+).
   */
  async updateAuthMetadata(
    adminId: string,
    metadata: Record<string, unknown>,
  ): Promise<AdminIdentity> {
    const existing = await this.prisma.adminIdentity.findUnique({
      where: { id: adminId },
    });

    if (!existing) {
      throw new AdminNotProvisionedException(
        `Admin identity ${adminId} not found.`,
      );
    }

    const updated = await this.prisma.adminIdentity.update({
      where: { id: adminId },
      data: {
        authMetadata: metadata as any,
      },
    });

    return this.mapToDomain(updated);
  }

  private mapToDomain(record: any): AdminIdentity {
    return {
      id: record.id,
      identifier: record.identifier,
      status: record.status as AdminStatus,
      authMetadata: record.authMetadata as Record<string, unknown> | null,
      lastAuthenticatedAt: record.lastAuthenticatedAt,
      disabledAt: record.disabledAt,
      disabledReason: record.disabledReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
