/**
 * S-10 — Dependency Vulnerability Audit & Security Gating Engine
 *
 * Scans direct and transitive dependencies for known CVEs, enforces release
 * blocking on Critical/High vulnerabilities, prevents audit bypass in CI,
 * detects abandoned dependencies, and prevents version downgrades to vulnerable states.
 */

import { DependencyClass } from './dependency-policy';

export type VulnerabilitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VulnerabilityRecord {
  cveId: string;
  packageName: string;
  affectedVersions: string;
  fixedVersion?: string;
  severity: VulnerabilitySeverity;
  isTransitive: boolean;
  introducedBy?: string;
  description: string;
}

export interface AuditEvaluationResult {
  passed: boolean;
  decision: string;
  severity?: VulnerabilitySeverity;
  reason?: string;
  details?: Record<string, any>;
}

export class DependencyAuditEngine {
  /**
   * Evaluates a detected vulnerability against the production release gate.
   */
  static evaluateVulnerability(
    vuln: VulnerabilityRecord,
    depClass: DependencyClass = 'DIRECT_RUNTIME',
  ): AuditEvaluationResult {
    if (vuln.isTransitive) {
      if (vuln.severity === 'CRITICAL' || vuln.severity === 'HIGH') {
        return {
          passed: false,
          decision: 'TRANSITIVE_VULNERABILITY_DETECTED',
          severity: vuln.severity,
          reason: `Vulnerable transitive dependency "${vuln.packageName}" (${vuln.cveId}, severity: ${vuln.severity}) introduced by "${vuln.introducedBy || 'unknown'}".`,
        };
      }
      return {
        passed: true,
        decision: 'TRANSITIVE_VULNERABILITY_DETECTED',
        severity: vuln.severity,
        details: { advisory: vuln.cveId },
      };
    }

    if (vuln.severity === 'CRITICAL' || vuln.severity === 'HIGH') {
      return {
        passed: false,
        decision: 'VULNERABILITY_GATE_BLOCKED',
        severity: vuln.severity,
        reason: `Known ${vuln.severity} vulnerable dependency "${vuln.packageName}" (${vuln.cveId}) blocks production release.`,
      };
    }

    return {
      passed: true,
      decision: 'VULNERABILITY_DISPOSITION_ACCEPTED',
      severity: vuln.severity,
      details: { advisory: vuln.cveId },
    };
  }

  /**
   * Enforces that dependency auditing is strictly active in CI and cannot be bypassed.
   */
  static evaluateAuditGate(context: {
    isAuditExecutedInCi: boolean;
    isAuditIgnored: boolean;
    unresolvedCriticalCount: number;
  }): AuditEvaluationResult {
    if (!context.isAuditExecutedInCi) {
      return {
        passed: false,
        decision: 'AUDIT_GATE_REQUIRED',
        reason: 'Dependency audit was disabled or omitted in CI pipeline.',
      };
    }

    if (context.isAuditIgnored && context.unresolvedCriticalCount > 0) {
      return {
        passed: false,
        decision: 'AUDIT_GATE_REQUIRED',
        reason:
          'Security audit results with critical findings were ignored in release pipeline.',
      };
    }

    return {
      passed: true,
      decision: 'AUDIT_GATE_PASSED',
    };
  }

  /**
   * Evaluates version downgrade security to ensure fixes cannot be silently reverted.
   */
  static evaluateVersionDowngrade(context: {
    packageName: string;
    currentVersion: string;
    targetVersion: string;
    isTargetVulnerable: boolean;
    isPatchBypassAttempt: boolean;
  }): AuditEvaluationResult {
    if (context.isPatchBypassAttempt) {
      return {
        passed: false,
        decision: 'SECURITY_PATCH_BYPASS_BLOCKED',
        reason: `Attempt to bypass security patch on "${context.packageName}" was rejected.`,
      };
    }

    if (context.isTargetVulnerable) {
      return {
        passed: false,
        decision: 'VULNERABILITY_DOWNGRADE_BLOCKED',
        reason: `Downgrading "${context.packageName}" from ${context.currentVersion} to vulnerable version ${context.targetVersion} is blocked.`,
      };
    }

    return {
      passed: true,
      decision: 'VERSION_TRANSITION_PERMITTED',
    };
  }

  /**
   * Evaluates abandoned dependencies based on maintenance inactivity and unpatched status.
   */
  static evaluateAbandonedDependency(context: {
    packageName: string;
    daysSinceLastRelease: number;
    hasKnownUnpatchedCve: boolean;
    hasActiveMaintainer: boolean;
  }): AuditEvaluationResult {
    if (context.daysSinceLastRelease > 730 || !context.hasActiveMaintainer) {
      if (context.hasKnownUnpatchedCve) {
        return {
          passed: false,
          decision: 'ABANDONED_DEPENDENCY_DETECTED',
          reason: `Critical dependency "${context.packageName}" is unmaintained (>730 days without release) and contains unpatched vulnerabilities.`,
        };
      }
      return {
        passed: false,
        decision: 'ABANDONED_DEPENDENCY_DETECTED',
        reason: `Dependency "${context.packageName}" is identified as abandoned. Review and replacement required.`,
      };
    }

    return {
      passed: true,
      decision: 'DEPENDENCY_ACTIVE',
    };
  }

  /**
   * Evaluates duplicate conflicting package versions across monorepo tree.
   */
  static evaluateVersionDuplication(
    packageName: string,
    resolvedVersions: string[],
  ): AuditEvaluationResult {
    const uniqueVersions = Array.from(new Set(resolvedVersions));
    if (uniqueVersions.length > 1) {
      return {
        passed: false,
        decision: 'DUPLICATE_VERSION_DETECTED',
        reason: `Multiple conflicting versions of "${packageName}" detected across workspaces: ${uniqueVersions.join(', ')}.`,
        details: { versions: uniqueVersions },
      };
    }

    return {
      passed: true,
      decision: 'VERSION_CONSISTENT',
    };
  }

  /**
   * Evaluates CI actions and build plugins for supply chain trust.
   */
  static evaluateCiTooling(context: {
    toolName: string;
    isVerifiedPublisher: boolean;
    pinnedSha?: string;
    isCustomPlugin: boolean;
    isReviewed: boolean;
  }): AuditEvaluationResult {
    if (context.isCustomPlugin && !context.isReviewed) {
      return {
        passed: false,
        decision: 'UNVERIFIED_BUILD_PLUGIN_BLOCKED',
        reason: `Unverified build plugin "${context.toolName}" must undergo security review before use.`,
      };
    }

    if (!context.isVerifiedPublisher || !context.pinnedSha) {
      return {
        passed: false,
        decision: 'CI_SUPPLY_CHAIN_BLOCKED',
        reason: `CI action or dependency "${context.toolName}" must be from a verified publisher and pinned to an immutable commit SHA.`,
      };
    }

    return {
      passed: true,
      decision: 'CI_TOOLING_VERIFIED',
    };
  }
}
