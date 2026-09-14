/**
 * Package Source Policy Engine
 *
 * S-10: Dependency & Supply Chain Security
 * Enforces registry trust, private scope isolation, git dependency pinning,
 * and blocks untrusted or arbitrary package sources.
 */

import {
  TRUSTED_REGISTRIES,
  APPROVED_INTERNAL_SCOPES,
} from './dependency-allowlist';

export interface PackageSourceEvaluation {
  allowed: boolean;
  reason?: string;
  failClosedDecision?: string;
  sourceType: 'npm-registry' | 'workspace' | 'git' | 'tarball' | 'unknown';
}

export class PackageSourcePolicyEngine {
  /**
   * Evaluates a registry URL against the trusted allowlist.
   */
  static evaluateRegistry(registryUrl?: string): PackageSourceEvaluation {
    if (!registryUrl) {
      return {
        allowed: false,
        reason: 'Registry URL is missing or undefined',
        failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
        sourceType: 'unknown',
      };
    }

    const normalized = registryUrl.toLowerCase().trim().replace(/\/+$/, '');
    const isTrusted = TRUSTED_REGISTRIES.some(
      (trusted) =>
        normalized === trusted.toLowerCase().replace(/\/+$/, '') ||
        normalized.startsWith(trusted.toLowerCase().replace(/\/+$/, '')),
    );

    if (!isTrusted) {
      return {
        allowed: false,
        reason: `Unapproved registry URL: ${registryUrl}`,
        failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
        sourceType: 'npm-registry',
      };
    }

    return {
      allowed: true,
      sourceType: 'npm-registry',
    };
  }

  /**
   * Validates internal package scopes to prevent Dependency Confusion attacks.
   */
  static evaluatePackageScope(
    packageName: string,
    registryUrl?: string,
    isLocalWorkspace = false,
  ): PackageSourceEvaluation {
    const isInternalScope = APPROVED_INTERNAL_SCOPES.some((scope) =>
      packageName.startsWith(`${scope}/`),
    );

    if (isInternalScope) {
      if (
        !isLocalWorkspace &&
        (!registryUrl || registryUrl.includes('registry.npmjs.org'))
      ) {
        return {
          allowed: false,
          reason: `Internal scope package "${packageName}" must resolve from private workspace or internal registry, not public npm.`,
          failClosedDecision: 'DEPENDENCY_CONFUSION_BLOCKED',
          sourceType: isLocalWorkspace ? 'workspace' : 'npm-registry',
        };
      }
    }

    return {
      allowed: true,
      sourceType: isLocalWorkspace ? 'workspace' : 'npm-registry',
    };
  }

  /**
   * Evaluates Git dependencies. Production must prohibit untrusted/unpinned git repos.
   */
  static evaluateGitSource(gitUrl: string): PackageSourceEvaluation {
    if (!gitUrl || typeof gitUrl !== 'string') {
      return {
        allowed: false,
        reason: 'Git dependency URL is required',
        failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
        sourceType: 'git',
      };
    }

    // Must be git+https or git+ssh, not arbitrary http or git://
    if (gitUrl.startsWith('http://') || gitUrl.startsWith('git://')) {
      return {
        allowed: false,
        reason: `Untrusted insecure git protocol in URL: ${gitUrl}`,
        failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
        sourceType: 'git',
      };
    }

    // Must be pinned to an exact commit hash (40-char SHA), not branch or floating tag
    const commitHashMatch = gitUrl.match(/#([a-f0-9]{40})$/i);
    if (!commitHashMatch) {
      return {
        allowed: false,
        reason: `Git dependency must be pinned to an exact 40-character commit hash: ${gitUrl}`,
        failClosedDecision: 'IMMUTABLE_RESOLUTION_ENFORCED',
        sourceType: 'git',
      };
    }

    return {
      allowed: true,
      sourceType: 'git',
    };
  }

  /**
   * Evaluates arbitrary remote tarball URLs.
   */
  static evaluateTarballSource(tarballUrl: string): PackageSourceEvaluation {
    return {
      allowed: false,
      reason: `Arbitrary remote tarball sources are strictly prohibited in production: ${tarballUrl}`,
      failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
      sourceType: 'tarball',
    };
  }
}
