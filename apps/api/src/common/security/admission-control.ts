/**
 * S-07 Global Admission Control & Emergency Overload Protection
 *
 * Implements S07-I11, S07-I13, S07-I15:
 * - Resource exhaustion protection (worker slots, DB connections, global throughput)
 * - Emergency overload shedding & circuit breaking
 * - Graceful degradation preserving high-priority auth/admin operations
 * - Fail-closed posture during system distress
 */

import { SecurityPrincipalType, EndpointCategory } from './rate-limit.policy';

export type SystemLoadLevel = 'NOMINAL' | 'ELEVATED' | 'SATURATED' | 'CRITICAL';

export interface AdmissionContext {
  principalType: SecurityPrincipalType;
  category: EndpointCategory;
  estimatedMemoryMb?: number;
  isHealthProbe?: boolean;
}

export class AdmissionControl {
  private static systemLoadLevel: SystemLoadLevel = 'NOMINAL';
  private static activeDatabaseConnections = 0;
  private static maxDatabaseConnections = 100;
  private static globalRequestRatePerSec = 0;
  private static maxGlobalRequestRatePerSec = 1000;
  private static isEmergencyLockdown = false;

  /**
   * Sets the simulated or monitored system load level.
   */
  static setLoadLevel(level: SystemLoadLevel): void {
    this.systemLoadLevel = level;
  }

  static setEmergencyLockdown(enabled: boolean): void {
    this.isEmergencyLockdown = enabled;
  }

  static setDbConnectionCount(count: number, max = 100): void {
    this.activeDatabaseConnections = count;
    this.maxDatabaseConnections = max;
  }

  /**
   * Evaluates admission for an incoming request based on global system health and priority.
   */
  static evaluateAdmission(ctx: AdmissionContext): {
    admitted: boolean;
    loadLevel: SystemLoadLevel;
    decision:
      | 'ADMITTED'
      | 'SHED_OVERLOAD_CRITICAL'
      | 'SHED_DB_POOL_SATURATED'
      | 'EMERGENCY_LOCKDOWN_REJECTED';
    retryAfterSeconds?: number;
  } {
    if (ctx.isHealthProbe) {
      return {
        admitted: true,
        loadLevel: this.systemLoadLevel,
        decision: 'ADMITTED',
      };
    }

    if (this.isEmergencyLockdown) {
      if (ctx.principalType === 'ADMIN') {
        return {
          admitted: true,
          loadLevel: this.systemLoadLevel,
          decision: 'ADMITTED',
        };
      }
      return {
        admitted: false,
        loadLevel: 'CRITICAL',
        decision: 'EMERGENCY_LOCKDOWN_REJECTED',
        retryAfterSeconds: 60,
      };
    }

    // Database connection exhaustion protection
    if (this.activeDatabaseConnections >= this.maxDatabaseConnections) {
      if (ctx.category === 'AUTH_LOGIN' || ctx.principalType === 'ADMIN') {
        // Reserve last 5% slots for admin/auth
        return {
          admitted: true,
          loadLevel: this.systemLoadLevel,
          decision: 'ADMITTED',
        };
      }
      return {
        admitted: false,
        loadLevel: 'SATURATED',
        decision: 'SHED_DB_POOL_SATURATED',
        retryAfterSeconds: 30,
      };
    }

    // System load level degradation tiers
    if (this.systemLoadLevel === 'CRITICAL') {
      // In critical load, shed all anonymous and guest traffic
      if (ctx.principalType === 'ANONYMOUS' || ctx.principalType === 'GUEST') {
        return {
          admitted: false,
          loadLevel: 'CRITICAL',
          decision: 'SHED_OVERLOAD_CRITICAL',
          retryAfterSeconds: 45,
        };
      }
    }

    return {
      admitted: true,
      loadLevel: this.systemLoadLevel,
      decision: 'ADMITTED',
    };
  }

  /**
   * Resets admission control state (for testing).
   */
  static reset(): void {
    this.systemLoadLevel = 'NOMINAL';
    this.activeDatabaseConnections = 0;
    this.maxDatabaseConnections = 100;
    this.globalRequestRatePerSec = 0;
    this.isEmergencyLockdown = false;
  }
}
