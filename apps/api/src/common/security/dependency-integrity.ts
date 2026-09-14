/**
 * S-10 — Dependency Integrity & Lockfile Verification Engine
 *
 * Enforces lockfile presence, deterministic resolution, cryptographic integrity
 * hash verification (sha512/sha256), dependency graph consistency, and build reproducibility.
 */

export interface IntegrityEvaluationResult {
  valid: boolean;
  decision: string;
  reason?: string;
  details?: Record<string, any>;
}

export class DependencyIntegrityEngine {
  /**
   * Verifies that the production release uses a committed, immutable lockfile.
   */
  static verifyLockfile(context: {
    hasLockfile: boolean;
    isCommitted: boolean;
    isModifiedOutOfBand: boolean;
    lockfileType?: 'pnpm-lock.yaml' | 'package-lock.json' | 'yarn.lock';
  }): IntegrityEvaluationResult {
    if (!context.hasLockfile) {
      return {
        valid: false,
        decision: 'LOCKFILE_INTEGRITY_ENFORCED',
        reason:
          'Missing lockfile. Production builds must use a deterministic committed lockfile.',
      };
    }

    if (!context.isCommitted) {
      return {
        valid: false,
        decision: 'LOCKFILE_INTEGRITY_ENFORCED',
        reason: 'Uncommitted lockfile detected in production build pipeline.',
      };
    }

    if (context.isModifiedOutOfBand) {
      return {
        valid: false,
        decision: 'LOCKFILE_INTEGRITY_ENFORCED',
        reason:
          'Lockfile was modified unexpectedly during build execution. Gate failed.',
      };
    }

    return {
      valid: true,
      decision: 'LOCKFILE_INTEGRITY_ENFORCED',
      details: { lockfileType: context.lockfileType || 'pnpm-lock.yaml' },
    };
  }

  /**
   * Verifies cryptographic integrity hash of a downloaded dependency archive.
   */
  static verifyPackageIntegrity(
    packageName: string,
    expectedHash: string,
    actualHash: string,
  ): IntegrityEvaluationResult {
    if (!expectedHash || !actualHash) {
      return {
        valid: false,
        decision: 'DEPENDENCY_INTEGRITY_ENFORCED',
        reason: `Missing integrity metadata for package "${packageName}".`,
      };
    }

    const cleanExpected = expectedHash.trim();
    const cleanActual = actualHash.trim();

    if (cleanExpected !== cleanActual) {
      return {
        valid: false,
        decision: 'DEPENDENCY_INTEGRITY_ENFORCED',
        reason: `Cryptographic integrity mismatch for package "${packageName}". Expected ${cleanExpected}, got ${cleanActual}.`,
      };
    }

    return {
      valid: true,
      decision: 'DEPENDENCY_INTEGRITY_ENFORCED',
      details: { packageName, integrityMatched: true },
    };
  }

  /**
   * Verifies the consistency of the resolved dependency graph to prevent stealth drift.
   */
  static verifyDependencyGraph(
    expectedGraphFingerprint: string,
    actualGraphFingerprint: string,
  ): IntegrityEvaluationResult {
    if (!expectedGraphFingerprint || !actualGraphFingerprint) {
      return {
        valid: false,
        decision: 'DEPENDENCY_GRAPH_DRIFT_BLOCKED',
        reason: 'Missing dependency graph fingerprint.',
      };
    }

    if (expectedGraphFingerprint !== actualGraphFingerprint) {
      return {
        valid: false,
        decision: 'DEPENDENCY_GRAPH_DRIFT_BLOCKED',
        reason:
          'Dependency graph changed unexpectedly without an approved change review.',
      };
    }

    return {
      valid: true,
      decision: 'DEPENDENCY_GRAPH_CONSISTENT',
    };
  }

  /**
   * Verifies reproducible build artifact hashes against reference baseline.
   */
  static verifyReproducibleBuild(
    expectedArtifactHash: string,
    actualArtifactHash: string,
  ): IntegrityEvaluationResult {
    if (
      !expectedArtifactHash ||
      !actualArtifactHash ||
      expectedArtifactHash !== actualArtifactHash
    ) {
      return {
        valid: false,
        decision: 'REPRODUCIBLE_BUILD_ENFORCED',
        reason:
          'Reproducible build mismatch detected. Artifact output drifted from deterministic baseline.',
      };
    }

    return {
      valid: true,
      decision: 'REPRODUCIBLE_BUILD_ENFORCED',
      details: { hash: actualArtifactHash },
    };
  }

  /**
   * Scans production bundle to verify no unexpected or dev-only packages leaked into production.
   */
  static verifyProductionBundle(
    bundlePackages: string[],
    approvedRuntimePackages: string[],
  ): IntegrityEvaluationResult {
    for (const pkg of bundlePackages) {
      if (!approvedRuntimePackages.includes(pkg)) {
        return {
          valid: false,
          decision: 'PRODUCTION_BUNDLE_POLLUTION_BLOCKED',
          reason: `Production bundle contains unexpected package "${pkg}".`,
        };
      }
    }

    return {
      valid: true,
      decision: 'PRODUCTION_BUNDLE_VERIFIED',
    };
  }
}
