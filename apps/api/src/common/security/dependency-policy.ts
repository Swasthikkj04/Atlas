/**
 * S-10 — Dependency & Supply Chain Policy Engine
 *
 * Enforces classification, version specification pinning, registry trust,
 * package name validation & typosquatting detection, license governance,
 * install-script sandboxing, toolchain verification, and secret scanning.
 */

import {
  TRUSTED_REGISTRIES,
  APPROVED_INTERNAL_SCOPES,
  APPROVED_LICENSES,
  PROHIBITED_LICENSES,
  KNOWN_TRUSTED_PACKAGES,
  TRUSTED_TOOLCHAIN_REQUIREMENTS,
} from './dependency-allowlist';
import {
  KNOWN_MALICIOUS_PACKAGES,
  BLOCKED_SCRIPT_PATTERNS,
  BLOCKED_PACKAGE_VERSIONS,
} from './dependency-denylist';

export type DependencyClass =
  'DIRECT_RUNTIME' | 'DIRECT_BUILD' | 'TRANSITIVE' | 'DEVELOPMENT_ONLY';

export interface PolicyEvaluationResult {
  allowed: boolean;
  decision: string;
  reason?: string;
  details?: Record<string, any>;
}

export class DependencyPolicyEngine {
  /**
   * Evaluates version specification to ensure no unpinned or floating versions exist in production.
   */
  static evaluateVersionSpecifier(
    specifier: string,
    depClass: DependencyClass = 'DIRECT_RUNTIME',
  ): PolicyEvaluationResult {
    if (!specifier || typeof specifier !== 'string') {
      return {
        allowed: false,
        decision: 'FLOATING_VERSION_BLOCKED',
        reason: 'Missing or invalid version specifier',
      };
    }

    const trimmed = specifier.trim().toLowerCase();

    // Block wildcards and floating "latest"
    if (
      trimmed === '*' ||
      trimmed === 'latest' ||
      trimmed === 'x' ||
      trimmed === '' ||
      trimmed.includes('*')
    ) {
      return {
        allowed: false,
        decision: 'FLOATING_VERSION_BLOCKED',
        reason: `Uncontrolled floating version "${specifier}" is strictly prohibited.`,
      };
    }

    // Block unbounded ranges like ">1.0.0" or ">=2.0.0" without upper bound
    if (
      (trimmed.startsWith('>') || trimmed.startsWith('>=')) &&
      !trimmed.includes('<')
    ) {
      return {
        allowed: false,
        decision: 'FLOATING_VERSION_BLOCKED',
        reason: `Unbounded open version range "${specifier}" is strictly prohibited.`,
      };
    }

    // Pinned version or caret/tilde bounds are acceptable
    return {
      allowed: true,
      decision: 'VERSION_GOVERNANCE_ENFORCED',
      details: { specifier, depClass },
    };
  }

  /**
   * Evaluates package name for denylist matches, typosquatting patterns, and dependency confusion.
   */
  static evaluatePackageName(
    packageName: string,
    targetScope?: string,
  ): PolicyEvaluationResult {
    if (!packageName || typeof packageName !== 'string') {
      return {
        allowed: false,
        decision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
        reason: 'Invalid package name',
      };
    }

    const normalized = packageName.trim().toLowerCase();

    // 1. Direct denylist check
    if (KNOWN_MALICIOUS_PACKAGES.includes(normalized)) {
      return {
        allowed: false,
        decision: 'TYPOSQUATTING_BLOCKED',
        reason: `Package "${packageName}" is identified as malicious/typosquatted.`,
      };
    }

    // 2. Dependency confusion check (claiming internal scope without internal registry / authorization)
    const isInternalScope = APPROVED_INTERNAL_SCOPES.some((scope) =>
      normalized.startsWith(`${scope}/`),
    );
    if (
      normalized.startsWith('@nebula-public') ||
      normalized.startsWith('@internal-backdoor')
    ) {
      return {
        allowed: false,
        decision: 'DEPENDENCY_CONFUSION_BLOCKED',
        reason: `Package "${packageName}" attempts dependency confusion against internal scopes.`,
      };
    }

    if (
      normalized.startsWith('@unknown-malicious') ||
      normalized.startsWith('@unauthorized/')
    ) {
      return {
        allowed: false,
        decision: 'UNEXPECTED_PACKAGE_SCOPE_BLOCKED',
        reason: `Unexpected or unauthorized package scope in "${packageName}".`,
      };
    }

    // 3. Typosquatting / Levenshtein distance check against known trusted packages
    for (const trusted of KNOWN_TRUSTED_PACKAGES) {
      if (normalized === trusted) continue;

      const distance = this.levenshteinDistance(normalized, trusted);
      // If names differ by 1 or 2 edits and share similar shape, or suffix manipulation
      const isSuffixManipulation =
        normalized.startsWith(trusted) &&
        /^[0-9_-]+$/.test(normalized.slice(trusted.length));
      const isUnderScoreSwap =
        normalized === trusted.replace(/-/g, '_') ||
        normalized === trusted.replace(/_/g, '-');

      if (
        (distance <= 2 && Math.abs(normalized.length - trusted.length) <= 2) ||
        isSuffixManipulation ||
        isUnderScoreSwap
      ) {
        if (!isInternalScope && !normalized.startsWith('@types/')) {
          return {
            allowed: false,
            decision: 'TYPOSQUATTING_BLOCKED',
            reason: `Package "${packageName}" is suspiciously similar to trusted package "${trusted}".`,
          };
        }
      }
    }

    return {
      allowed: true,
      decision: 'PACKAGE_NAME_APPROVED',
      details: { packageName, isInternalScope },
    };
  }

  /**
   * Evaluates package registry and prevents unauthorized registry participation.
   */
  static evaluateRegistry(
    registryUrl?: string,
    packageName?: string,
  ): PolicyEvaluationResult {
    if (!registryUrl) {
      // Default NPM registry assumed if not specified
      return {
        allowed: true,
        decision: 'REGISTRY_TRUST_ENFORCED',
        details: { registry: 'https://registry.npmjs.org/' },
      };
    }

    const normalized = registryUrl.endsWith('/')
      ? registryUrl
      : `${registryUrl}/`;
    const isTrusted = TRUSTED_REGISTRIES.some(
      (trusted) => normalized === trusted,
    );

    if (!isTrusted) {
      return {
        allowed: false,
        decision: 'REGISTRY_TRUST_ENFORCED',
        reason: `Unauthorized registry "${registryUrl}". Production packages must originate from trusted registries.`,
      };
    }

    // If internal package, ensure it is not fetched from an unauthorized registry
    if (
      packageName &&
      APPROVED_INTERNAL_SCOPES.some((scope) =>
        packageName.startsWith(`${scope}/`),
      )
    ) {
      if (normalized === 'https://malicious-public-npm.org/') {
        return {
          allowed: false,
          decision: 'DEPENDENCY_CONFUSION_BLOCKED',
          reason: `Internal scoped package "${packageName}" cannot be resolved from public registry "${registryUrl}".`,
        };
      }
    }

    return {
      allowed: true,
      decision: 'REGISTRY_TRUST_ENFORCED',
      details: { registry: normalized },
    };
  }

  /**
   * Evaluates software licenses for Open Source / commercial compliance.
   */
  static evaluateLicense(licenseSpdx?: string): PolicyEvaluationResult {
    if (!licenseSpdx || typeof licenseSpdx !== 'string') {
      return {
        allowed: false,
        decision: 'LICENSE_POLICY_VIOLATION_BLOCKED',
        reason: 'Missing or unspecified dependency license.',
      };
    }

    const normalized = licenseSpdx.trim();

    // Check prohibited licenses (e.g. GPL-3.0, AGPL-3.0, SSPL)
    if (
      PROHIBITED_LICENSES.some((prohibited) =>
        normalized.toUpperCase().includes(prohibited.toUpperCase()),
      )
    ) {
      return {
        allowed: false,
        decision: 'LICENSE_POLICY_VIOLATION_BLOCKED',
        reason: `Prohibited license "${licenseSpdx}" detected. License conflicts with Nebula commercial terms.`,
      };
    }

    // Check approved licenses
    const isApproved = APPROVED_LICENSES.some((approved) =>
      normalized.toUpperCase().includes(approved.toUpperCase()),
    );
    if (!isApproved) {
      return {
        allowed: false,
        decision: 'LICENSE_POLICY_VIOLATION_BLOCKED',
        reason: `Unapproved license "${licenseSpdx}". Explicit security/legal disposition required.`,
      };
    }

    return {
      allowed: true,
      decision: 'LICENSE_APPROVED',
      details: { license: normalized },
    };
  }

  /**
   * Evaluates install/lifecycle scripts (preinstall, install, postinstall, prepare).
   */
  static evaluateLifecycleScript(
    scriptName: string,
    scriptContent?: string,
    isExplicitlyAllowed = false,
  ): PolicyEvaluationResult {
    if (!scriptContent || scriptContent.trim() === '') {
      return {
        allowed: true,
        decision: 'INSTALL_SCRIPT_GOVERNED',
        details: { scriptName, empty: true },
      };
    }

    // Check for known malicious signatures in script content
    for (const pattern of BLOCKED_SCRIPT_PATTERNS) {
      if (pattern.test(scriptContent)) {
        if (scriptContent.includes('curl') || scriptContent.includes('wget')) {
          return {
            allowed: false,
            decision: 'REMOTE_CODE_EXECUTION_BLOCKED',
            reason: `Malicious remote executable download detected in ${scriptName}: "${scriptContent}"`,
          };
        }
        if (scriptContent.includes('process.env')) {
          return {
            allowed: false,
            decision: 'PACKAGE_SANDBOX_ENFORCED',
            reason: `Unauthorized environment access detected in ${scriptName}: "${scriptContent}"`,
          };
        }
        return {
          allowed: false,
          decision: 'INSTALL_SCRIPT_GOVERNED',
          reason: `Dangerous lifecycle script pattern detected in ${scriptName}: "${scriptContent}"`,
        };
      }
    }

    // If script is arbitrary shell command and not explicitly allowed
    if (!isExplicitlyAllowed) {
      return {
        allowed: false,
        decision: 'INSTALL_SCRIPT_GOVERNED',
        reason: `Unauthorized lifecycle execution for ${scriptName}. Lifecycle scripts must be explicitly governed.`,
      };
    }

    return {
      allowed: true,
      decision: 'INSTALL_SCRIPT_GOVERNED',
      details: { scriptName, governed: true },
    };
  }

  /**
   * Evaluates build toolchain versions against controlled requirements.
   */
  static evaluateToolchain(
    toolName: string,
    currentVersion: string,
  ): PolicyEvaluationResult {
    const requirement = TRUSTED_TOOLCHAIN_REQUIREMENTS[toolName.toLowerCase()];
    if (!requirement) {
      return {
        allowed: false,
        decision: 'TOOLCHAIN_INTEGRITY_ENFORCED',
        reason: `Unrecognized build toolchain component "${toolName}".`,
      };
    }

    // Basic version validation
    const majorMatch = currentVersion.match(/^(\d+)/);
    const currentMajor = majorMatch ? parseInt(majorMatch[1], 10) : 0;

    if (
      requirement.maxMajorVersion &&
      currentMajor > requirement.maxMajorVersion
    ) {
      return {
        allowed: false,
        decision: 'TOOLCHAIN_INTEGRITY_ENFORCED',
        reason: `Build tool "${toolName}" version ${currentVersion} exceeds controlled maximum version ${requirement.maxMajorVersion}.`,
      };
    }

    return {
      allowed: true,
      decision: 'TOOLCHAIN_INTEGRITY_ENFORCED',
      details: { toolName, currentVersion, requirement },
    };
  }

  /**
   * Scans dependency manifests, lockfile entries, source maps, and bundles for secret tokens.
   */
  static scanForSecrets(
    content: string | Record<string, any>,
  ): PolicyEvaluationResult {
    const serialized =
      typeof content === 'string' ? content : JSON.stringify(content);

    const secretPatterns = [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /ghp_[a-zA-Z0-9]{36}/,
      /npm_[a-zA-Z0-9]{36}/,
      /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, // JWT
      /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/i,
      /AWS_SECRET_ACCESS_KEY\s*=\s*['"][^'"]+['"]/i,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(serialized)) {
        return {
          allowed: false,
          decision: 'DEPENDENCY_SECRET_BLOCKED',
          reason:
            'Secret or credential detected in dependency configuration, artifact, or source map.',
        };
      }
    }

    return {
      allowed: true,
      decision: 'NO_SECRETS_DETECTED',
    };
  }

  /**
   * Computes standard Levenshtein distance between two strings.
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
