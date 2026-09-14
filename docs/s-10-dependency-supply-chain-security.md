# S-10 — Dependency & Supply Chain Security

**Ticket ID:** `S-10`  
**Phase:** Production Security Hardening  
**Priority:** P0 — BLOCKING  
**Type:** Security / Dependency / Supply Chain / Build / CI / Backend / Frontend / Contract  
**Depends on:** S-01 🔒 → S-09 🔒  
**Blocks:** S-11 → S-12 and Production Release  
**Status:** 🔒 **`CERTIFIED_DEPENDENCY_SUPPLY_CHAIN_SECURITY`**

---

## 1. Canonical Certification Gate & Statement

> **Canonical Certification Statement:**  
> *"Every third-party dependency, package, build artifact, development tool, transitive dependency, and external software component entering Nebula's production supply chain must be identifiable, version-controlled, integrity-verified, vulnerability-assessed, and explicitly governed before it can become part of a production build."*

> **Secondary Certification Gate:**  
> *"Every software dependency entering Nebula's production supply chain is identifiable, integrity-verified, vulnerability-assessed, policy-governed, reproducibly resolved, and continuously subject to security controls. An untrusted or unverifiable dependency cannot enter a production artifact."*

### Frozen Principle: "Trust the artifact, not the package name."
A dependency is not trusted merely because it is popular, open source, has many downloads, is in package.json, passed a previous audit, is a transitive dependency of a trusted package, or comes from a known registry. Trust must be established through verifiable evidence.

---

## 2. Supply Chain Architecture & Trust Pipeline

```
          DEVELOPMENT & CI INPUT
                     │
                     ▼
       ┌───────────────────────────┐
       │     Lockfile Gate         │ (S10-I01, S10-I02)
       │ (pnpm-lock.yaml committed)│
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │   Registry & Scope Gate   │ (S10-I06, S10-I07, S10-I08)
       │  (Allowlist, Confusion,   │
       │   Typosquatting Defense)  │
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ Cryptographic Integrity   │ (S10-I05, S10-I14)
       │    (sha512 / sha256)      │
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │   Script Governance Gate  │ (S10-I09)
       │  (Sandbox, No curl|bash)  │
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │    Vulnerability Gate     │ (S10-I04, S10-I03)
       │ (Critical/High Blocked,   │
       │    Transitive Visibility) │
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │  Secret & License Audit   │ (S10-I11, S10-I12)
       │ (No Tokens in Artifacts,  │
       │     Approved Licenses)    │
       └─────────────┬─────────────┘
                     │
                     ▼
         PRODUCTION BUILD ARTIFACT
```

---

## 3. P0 Security Invariants (`S10-I01` to `S10-I15`)

| Invariant | Title | Description | Fail-Closed Decision |
|---|---|---|---|
| `S10-I01` | **Lockfile Integrity** | Production dependency resolution must strictly use the committed lockfile; uncommitted or out-of-band modified lockfiles fail the release gate. | `LOCKFILE_INTEGRITY_ENFORCED` |
| `S10-I02` | **No Floating Versions** | Uncontrolled floating versions (`*`, `latest`, `>1.0.0` unbounded) are prohibited in production manifests. | `FLOATING_VERSION_BLOCKED` |
| `S10-I03` | **Transitive Dependency Visibility** | Complete dependency tree visibility; transitive vulnerabilities cannot be hidden or ignored. | `TRANSITIVE_VISIBILITY_ENFORCED` |
| `S10-I04` | **Vulnerability Gate** | Known security vulnerabilities are detected; Critical/High vulnerabilities block release unless explicitly dispositioned. | `VULNERABILITY_GATE_BLOCKED` |
| `S10-I05` | **Dependency Integrity** | Cryptographic package integrity hashes (sha512/sha256) must match lockfile metadata. | `DEPENDENCY_INTEGRITY_ENFORCED` |
| `S10-I06` | **Registry Trust** | Explicitly trusted registries (`registry.npmjs.org`, approved internal endpoints); unauthorized registries blocked. | `REGISTRY_TRUST_ENFORCED` |
| `S10-I07` | **Dependency Confusion Defense** | Internal package scopes (`@nebula/*`, `@atlas/*`) are strictly mapped to private repositories/workspaces. | `DEPENDENCY_CONFUSION_BLOCKED` |
| `S10-I08` | **Typosquatting Resistance** | Package identity review and Levenshtein distance checks against trusted packages prevent typosquatting attacks. | `TYPOSQUATTING_BLOCKED` |
| `S10-I09` | **Install Script Control** | Lifecycle scripts (`preinstall`, `install`, `postinstall`, `prepare`) are strictly governed and sandboxed against arbitrary execution. | `INSTALL_SCRIPT_GOVERNED` |
| `S10-I10` | **Build Toolchain Integrity** | Strict version controls for Node.js, pnpm, TypeScript, Vite, NestJS, Prisma, and Turborepo. | `TOOLCHAIN_INTEGRITY_ENFORCED` |
| `S10-I11` | **No Secret-Bearing Configuration** | Manifests, lockfiles, build artifacts, source maps, and CI logs must never contain secrets, tokens, or credentials. | `DEPENDENCY_SECRET_BLOCKED` |
| `S10-I12` | **Dependency Removal** | Unused dependencies are cleanly removed without hidden production coupling, ensuring minimal surface area. | `DEPENDENCY_MINIMIZATION_ENFORCED` |
| `S10-I13` | **Dependency Provenance** | Every package, version, registry origin, parent introducer, artifact destination, and approval metadata is authoritatively tracked. | `PROVENANCE_TRACKED` |
| `S10-I14` | **Build Reproducibility** | Controlled source revision and lockfile state produce deterministic equivalent production builds. | `REPRODUCIBLE_BUILD_ENFORCED` |
| `S10-I15` | **Fail Closed** | Inability to authoritatively verify dependency integrity, origin, or license blocks the build immediately. | `FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED` |

---

## 4. Complete 40-Vector Attack Matrix

| ID | Attack Vector / Scenario | Defense / Invariant | Certified Decision |
|---|---|---|---|
| `S10-01` | Uncommitted lockfile used in production | S10-I01 Lockfile Integrity | `LOCKFILE_INTEGRITY_ENFORCED` |
| `S10-02` | Lockfile modified unexpectedly | S10-I01 Lockfile Integrity | `LOCKFILE_INTEGRITY_ENFORCED` |
| `S10-03` | Floating latest production dependency | S10-I02 No Floating Versions | `FLOATING_VERSION_BLOCKED` |
| `S10-04` | Wildcard dependency version | S10-I02 No Floating Versions | `FLOATING_VERSION_BLOCKED` |
| `S10-05` | Known critical vulnerable dependency | S10-I04 Vulnerability Gate | `VULNERABILITY_GATE_BLOCKED` |
| `S10-06` | Known high vulnerable dependency | S10-I04 Vulnerability Gate | `VULNERABILITY_GATE_BLOCKED` |
| `S10-07` | Vulnerable transitive dependency | S10-I03 Transitive Visibility | `TRANSITIVE_VULNERABILITY_DETECTED` |
| `S10-08` | Dependency integrity mismatch | S10-I05 Dependency Integrity | `DEPENDENCY_INTEGRITY_ENFORCED` |
| `S10-09` | Unauthorized registry | S10-I06 Registry Trust | `REGISTRY_TRUST_ENFORCED` |
| `S10-10` | Dependency confusion attempt | S10-I07 Confusion Defense | `DEPENDENCY_CONFUSION_BLOCKED` |
| `S10-11` | Typosquatted package introduction | S10-I08 Typosquatting Resistance | `TYPOSQUATTING_BLOCKED` |
| `S10-12` | Unexpected package scope | S10-I07 Confusion Defense | `UNEXPECTED_PACKAGE_SCOPE_BLOCKED` |
| `S10-13` | Malicious postinstall script | S10-I09 Install Script Control | `INSTALL_SCRIPT_GOVERNED` |
| `S10-14` | Unauthorized lifecycle script | S10-I09 Install Script Control | `INSTALL_SCRIPT_GOVERNED` |
| `S10-15` | Package replacement without review | S10-I13 Dependency Provenance | `PACKAGE_REPLACEMENT_BLOCKED` |
| `S10-16` | Transitive package introduced silently | S10-I03 Transitive Visibility | `TRANSITIVE_VISIBILITY_ENFORCED` |
| `S10-17` | Dependency graph unexpectedly changes | S10-I01 / S10-I14 Integrity | `DEPENDENCY_GRAPH_DRIFT_BLOCKED` |
| `S10-18` | Build tool version drift | S10-I10 Toolchain Integrity | `TOOLCHAIN_INTEGRITY_ENFORCED` |
| `S10-19` | CI action dependency compromise | S10-I10 Toolchain Integrity | `CI_SUPPLY_CHAIN_BLOCKED` |
| `S10-20` | Unverified build plugin | S10-I10 Toolchain Integrity | `UNVERIFIED_BUILD_PLUGIN_BLOCKED` |
| `S10-21` | Dependency contains secret | S10-I11 No Secret Config | `DEPENDENCY_SECRET_BLOCKED` |
| `S10-22` | Secret-bearing lockfile entry | S10-I11 No Secret Config | `DEPENDENCY_SECRET_BLOCKED` |
| `S10-23` | Malicious package attempts env access | S10-I09 Sandbox Control | `PACKAGE_SANDBOX_ENFORCED` |
| `S10-24` | Dependency executes arbitrary shell cmd | S10-I09 Script Control | `INSTALL_SCRIPT_GOVERNED` |
| `S10-25` | Package downloads remote executable | S10-I09 Script Control | `REMOTE_CODE_EXECUTION_BLOCKED` |
| `S10-26` | Compromised package update | S10-I13 Provenance Engine | `COMPROMISED_PACKAGE_UPDATE_BLOCKED` |
| `S10-27` | Dependency downgrade to vulnerable version | S10-I04 Vulnerability Gate | `VULNERABILITY_DOWNGRADE_BLOCKED` |
| `S10-28` | Security patch intentionally bypassed | S10-I04 Vulnerability Gate | `SECURITY_PATCH_BYPASS_BLOCKED` |
| `S10-29` | Dependency audit disabled in CI | S10-I04 / S10-I15 Fail Closed | `AUDIT_GATE_REQUIRED` |
| `S10-30` | Audit result ignored | S10-I04 / S10-I15 Fail Closed | `AUDIT_GATE_REQUIRED` |
| `S10-31` | Unknown package provenance | S10-I13 Provenance Engine | `PROVENANCE_TRACKED` |
| `S10-32` | Abandoned critical dependency | S10-I04 / S10-I12 Minimization | `ABANDONED_DEPENDENCY_DETECTED` |
| `S10-33` | License policy violation | S10-I15 License Compliance | `LICENSE_POLICY_VIOLATION_BLOCKED` |
| `S10-34` | Dependency introduces GPL/license conflict | S10-I15 License Compliance | `LICENSE_POLICY_VIOLATION_BLOCKED` |
| `S10-35` | Duplicate conflicting package versions | S10-I01 / S10-I12 Minimization | `DUPLICATE_VERSION_DETECTED` |
| `S10-36` | Production bundle contains unexpected package | S10-I14 Bundle Integrity | `PRODUCTION_BUNDLE_POLLUTION_BLOCKED` |
| `S10-37` | Source map contains dependency secret | S10-I11 No Secret Config | `DEPENDENCY_SECRET_BLOCKED` |
| `S10-38` | Reproducible build mismatch | S10-I14 Reproducibility | `REPRODUCIBLE_BUILD_ENFORCED` |
| `S10-39` | Direct API bypass using vulnerable component | S10-I04 Vulnerability Gate | `VULNERABILITY_GATE_BLOCKED` |
| `S10-40` | Dependency trust cannot be established | S10-I15 Fail Closed | `FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED` |

---

## 5. Implementation Verification Summary

- **Backend Unified Contract:** `apps/api/src/common/security/s-10-dependency-supply-chain.contract.ts`
- **Backend Policy Engine:** `apps/api/src/common/security/dependency-policy.ts`
- **Backend Integrity Engine:** `apps/api/src/common/security/dependency-integrity.ts`
- **Backend Audit Engine:** `apps/api/src/common/security/dependency-audit.ts`
- **Backend Provenance Engine:** `apps/api/src/common/security/dependency-provenance.ts`
- **Backend Allowlist / Denylist:** `apps/api/src/common/security/dependency-allowlist.ts` & `dependency-denylist.ts`
- **Backend Contract Test Suite:** `apps/api/src/common/security/s-10-dependency-supply-chain.contract.spec.ts` (56/56 passing)
- **Frontend Unified Contract:** `apps/web/src/features/security/contracts/s-10-dependency-supply-chain.contract.ts`
- **Frontend Contract Test Suite:** `apps/web/src/features/security/contracts/s-10-dependency-supply-chain.contract.spec.ts` (Passing across Node test runner)
- **Zero Regression Monorepo Verification:** 232 API test suites (1901 tests) passed; 1002 Web test suites (1639 tests) passed.
