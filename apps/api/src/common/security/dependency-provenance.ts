/**
 * S-10 — Dependency Provenance & Tree Visibility Engine
 *
 * Tracks the complete provenance lifecycle of all packages: package name,
 * version, origin registry, introducing parent, artifact destinations, approval metadata,
 * and enables complete transitive dependency graph reconstruction.
 */

import { DependencyClass } from './dependency-policy';

export interface DependencyProvenanceRecord {
  packageName: string;
  version: string;
  registry: string;
  introducedBy: string; // 'DIRECT' or parent package name
  artifactDestination: ('api' | 'web' | 'cli' | 'shared')[];
  approvedAt: string;
  approvedBy: string;
  dependencyClass: DependencyClass;
  integrityHash?: string;
}

export interface ProvenanceEvaluationResult {
  verified: boolean;
  decision: string;
  reason?: string;
  record?: DependencyProvenanceRecord;
}

export class DependencyProvenanceEngine {
  private static registryStore = new Map<string, DependencyProvenanceRecord>();

  /**
   * Registers a dependency into the provenance catalog.
   */
  static registerDependency(record: DependencyProvenanceRecord): void {
    const key = `${record.packageName}@${record.version}`;
    this.registryStore.set(key, record);
  }

  /**
   * Retrieves provenance record by package and version.
   */
  static getProvenance(
    packageName: string,
    version: string,
  ): DependencyProvenanceRecord | undefined {
    return this.registryStore.get(`${packageName}@${version}`);
  }

  /**
   * Verifies provenance completeness. Fails closed if unknown provenance is encountered.
   */
  static verifyProvenance(
    packageName: string,
    version?: string,
  ): ProvenanceEvaluationResult {
    if (!packageName || typeof packageName !== 'string') {
      return {
        verified: false,
        decision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
        reason: 'Missing package name for provenance verification.',
      };
    }

    if (!version) {
      // Find any registered version
      let found: DependencyProvenanceRecord | undefined;
      for (const [key, val] of this.registryStore.entries()) {
        if (key.startsWith(`${packageName}@`)) {
          found = val;
          break;
        }
      }

      if (!found) {
        return {
          verified: false,
          decision: 'PROVENANCE_TRACKED',
          reason: `Unknown provenance for package "${packageName}". Source origin could not be verified.`,
        };
      }

      return {
        verified: true,
        decision: 'PROVENANCE_TRACKED',
        record: found,
      };
    }

    const record = this.getProvenance(packageName, version);
    if (!record) {
      return {
        verified: false,
        decision: 'PROVENANCE_TRACKED',
        reason: `Package "${packageName}@${version}" has no registered provenance. Release blocked.`,
      };
    }

    return {
      verified: true,
      decision: 'PROVENANCE_TRACKED',
      record,
    };
  }

  /**
   * Evaluates transitive dependency visibility and prevents stealth introduction.
   */
  static evaluateTransitiveIntroduction(context: {
    packageName: string;
    parentPackage: string;
    isDisclosedInLockfile: boolean;
    isAudited: boolean;
  }): ProvenanceEvaluationResult {
    if (!context.isDisclosedInLockfile || !context.isAudited) {
      return {
        verified: false,
        decision: 'TRANSITIVE_VISIBILITY_ENFORCED',
        reason: `Transitive package "${context.packageName}" introduced by "${context.parentPackage}" must be explicitly visible in the lockfile and audited.`,
      };
    }

    return {
      verified: true,
      decision: 'TRANSITIVE_VISIBILITY_ENFORCED',
    };
  }

  /**
   * Evaluates package substitution/replacement changes.
   */
  static evaluatePackageReplacement(context: {
    originalPackage: string;
    replacementPackage: string;
    isSecurityReviewed: boolean;
    isApproved: boolean;
  }): ProvenanceEvaluationResult {
    if (!context.isSecurityReviewed || !context.isApproved) {
      return {
        verified: false,
        decision: 'PACKAGE_REPLACEMENT_BLOCKED',
        reason: `Replacing "${context.originalPackage}" with "${context.replacementPackage}" without explicit security review is prohibited.`,
      };
    }

    return {
      verified: true,
      decision: 'PACKAGE_REPLACEMENT_APPROVED',
    };
  }

  /**
   * Evaluates package updates to detect compromised releases.
   */
  static evaluatePackageUpdate(context: {
    packageName: string;
    fromVersion: string;
    toVersion: string;
    isKnownCompromisedVersion: boolean;
  }): ProvenanceEvaluationResult {
    if (context.isKnownCompromisedVersion) {
      return {
        verified: false,
        decision: 'COMPROMISED_PACKAGE_UPDATE_BLOCKED',
        reason: `Update of "${context.packageName}" to version ${context.toVersion} is blocked due to detected compromise.`,
      };
    }

    return {
      verified: true,
      decision: 'PACKAGE_UPDATE_PERMITTED',
    };
  }

  /**
   * Clears the in-memory catalog (useful for testing).
   */
  static clearCatalog(): void {
    this.registryStore.clear();
  }
}
