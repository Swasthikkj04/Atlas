/**
 * S-08 Multi-Tenant & Cross-Plane Cache Isolation Engine
 *
 * Implements S08-I08:
 * - Deterministic, partitioned cache keys: plane:tenantId:principalId:resourceKey
 * - Cross-tenant and cross-plane cache collision defense
 * - Tenant-scoped cache invalidation
 */

export interface CacheKeyContext {
  plane: 'GX' | 'WX' | 'ADMIN';
  tenantId?: string;
  principalId?: string;
  resourceKey: string;
}

export class CacheIsolationEngine {
  private static cacheStore = new Map<
    string,
    { value: any; tenantId?: string; plane: string }
  >();

  /**
   * Generates a fully-isolated composite cache key.
   */
  static buildIsolatedCacheKey(ctx: CacheKeyContext): string {
    const plane = ctx.plane;
    const tenant = ctx.tenantId || 'global';
    const principal = ctx.principalId || 'anon';
    const resource = ctx.resourceKey.trim().toLowerCase();

    return `cache:${plane}:${tenant}:${principal}:${resource}`;
  }

  /**
   * Stores a value into cache with isolation tags.
   */
  static set(ctx: CacheKeyContext, value: any): string {
    const key = this.buildIsolatedCacheKey(ctx);
    this.cacheStore.set(key, {
      value,
      tenantId: ctx.tenantId,
      plane: ctx.plane,
    });
    return key;
  }

  /**
   * Retrieves a cached value, asserting tenant and plane matching.
   */
  static get(ctx: CacheKeyContext): {
    hit: boolean;
    value?: any;
    decision:
      | 'CACHE_HIT'
      | 'CACHE_MISS'
      | 'CROSS_TENANT_COLLISION_BLOCKED'
      | 'CROSS_PLANE_COLLISION_BLOCKED';
  } {
    const key = this.buildIsolatedCacheKey(ctx);
    const entry = this.cacheStore.get(key);

    if (!entry) {
      return { hit: false, decision: 'CACHE_MISS' };
    }

    if (entry.plane !== ctx.plane) {
      return { hit: false, decision: 'CROSS_PLANE_COLLISION_BLOCKED' };
    }

    if (entry.tenantId && ctx.tenantId && entry.tenantId !== ctx.tenantId) {
      return { hit: false, decision: 'CROSS_TENANT_COLLISION_BLOCKED' };
    }

    return { hit: true, value: entry.value, decision: 'CACHE_HIT' };
  }

  /**
   * Invalidates all cache entries for a specific tenant (e.g. upon account deletion).
   */
  static invalidateTenant(tenantId: string): number {
    let count = 0;
    for (const [key, entry] of this.cacheStore.entries()) {
      if (entry.tenantId === tenantId) {
        this.cacheStore.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Resets cache store (for tests).
   */
  static reset(): void {
    this.cacheStore.clear();
  }
}
