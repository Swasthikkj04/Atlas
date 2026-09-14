/**
 * S-08 Tenant Data Boundary & Export Engine
 *
 * Implements S08-I03, S08-I14:
 * - Strict tenant isolation for persistent intelligence hierarchy (User -> Domain -> Snapshot -> Finding)
 * - Safe, tenant-scoped export pipeline with size limits and secret scrubbing
 * - Prevention of cross-tenant data leaks in responses, caches, and exports
 */

import { SensitiveFieldPolicy } from './sensitive-field-policy';

export interface TenantScopedEntity {
  id: string;
  userId: string;
  domainId?: string;
  [key: string]: any;
}

export interface ExportRequest {
  requestingUserId: string;
  targetUserId: string;
  includeEvidence?: boolean;
  maxRecords?: number;
}

export interface ExportResult {
  success: boolean;
  tenantId: string;
  recordCount: number;
  data?: any[];
  decision:
    'EXPORT_GENERATED' | 'CROSS_TENANT_EXPORT_BLOCKED' | 'EXPORT_SIZE_EXCEEDED';
}

export const MAX_EXPORT_RECORDS = 5000;

export class TenantDataBoundary {
  /**
   * Enforces that every record returned strictly matches the authenticated tenant.
   */
  static filterTenantRecords<T extends TenantScopedEntity>(
    records: T[],
    authenticatedUserId: string,
  ): T[] {
    if (!authenticatedUserId || !Array.isArray(records)) return [];
    return records.filter((r) => r.userId === authenticatedUserId);
  }

  /**
   * Generates a safe tenant-scoped data export bundle.
   */
  static generateTenantExport(
    request: ExportRequest,
    allRecords: TenantScopedEntity[],
  ): ExportResult {
    // 1. Authorization & Cross-Tenant Check
    if (request.requestingUserId !== request.targetUserId) {
      return {
        success: false,
        tenantId: request.targetUserId,
        recordCount: 0,
        decision: 'CROSS_TENANT_EXPORT_BLOCKED',
      };
    }

    // 2. Tenant filtering
    const tenantRecords = this.filterTenantRecords(
      allRecords,
      request.targetUserId,
    );

    // 3. Size Bounds Check
    const maxAllowed = request.maxRecords || MAX_EXPORT_RECORDS;
    if (tenantRecords.length > maxAllowed) {
      return {
        success: false,
        tenantId: request.targetUserId,
        recordCount: tenantRecords.length,
        decision: 'EXPORT_SIZE_EXCEEDED',
      };
    }

    // 4. Sanitize and strip sensitive DB fields
    const sanitizedData = tenantRecords.map((r) =>
      SensitiveFieldPolicy.sanitizeResponseDto(r),
    );

    return {
      success: true,
      tenantId: request.targetUserId,
      recordCount: sanitizedData.length,
      data: sanitizedData,
      decision: 'EXPORT_GENERATED',
    };
  }
}
