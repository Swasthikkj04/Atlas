/**
 * S-10 — Dependency & Supply Chain Security Web Contract
 *
 * Phase: Production Security Hardening
 * Priority: P0 — BLOCKING
 * Type: Security / Dependency / Supply Chain / Build / CI / Backend / Frontend / Contract
 * Depends on: S-01 🔒 → S-09 🔒
 * Blocks: S-11 → S-12 and Production Release
 * Status: CERTIFIED_DEPENDENCY_SUPPLY_CHAIN_SECURITY
 */

export const S10_TICKET_ID = 'S-10' as const;
export const S10_PHASE = 'Production Security Hardening' as const;
export const S10_PRIORITY = 'P0 — BLOCKING' as const;
export const S10_TYPE =
  'Security / Dependency / Supply Chain / Build / CI / Backend / Frontend / Contract' as const;
export const S10_STATUS = 'CERTIFIED_DEPENDENCY_SUPPLY_CHAIN_SECURITY' as const;
export const S10_DEPENDS_ON = [
  'S-01',
  'S-02',
  'S-03',
  'S-04',
  'S-05',
  'S-06',
  'S-07',
  'S-08',
  'S-09',
] as const;
export const S10_BLOCKS = ['S-11', 'S-12', 'Production Release'] as const;

export const S10_CERTIFICATION_STATEMENT =
  "Every third-party dependency, package, build artifact, development tool, transitive dependency, and external software component entering Nebula's production supply chain must be identifiable, version-controlled, integrity-verified, vulnerability-assessed, and explicitly governed before it can become part of a production build.";

export const S10_SECONDARY_GATE =
  "Every software dependency entering Nebula's production supply chain is identifiable, integrity-verified, vulnerability-assessed, policy-governed, reproducibly resolved, and continuously subject to security controls. An untrusted or unverifiable dependency cannot enter a production artifact.";

export const S10_FROZEN_PRINCIPLE =
  'Trust the artifact, not the package name.';

export const S10_PRINCIPLES = {
  S10_P01_TRUST_THE_ARTIFACT:
    'Trust the artifact, not the package name. A dependency is not trusted merely because it is popular, open source, has many downloads, or is in package.json.',
  S10_P02_DETERMINISTIC_LOCKFILE_GRAPH:
    'Deterministic Lockfile Graph: Production dependency resolution must strictly utilize the committed lockfile. Floating versions (*, latest) and uncontrolled resolutions are prohibited.',
  S10_P03_COMPLETE_TREE_VISIBILITY:
    'Transitive Dependency Visibility: Security review and vulnerability analysis must encompass direct, transitive, build, and development dependencies without exemption.',
  S10_P04_FAIL_CLOSED_SUPPLY_CHAIN:
    'Fail Closed: If dependency integrity, registry provenance, license policy, or vulnerability status cannot be authoritatively verified, release is blocked.',
} as const;

export interface InvariantDefinition {
  id: string;
  title: string;
  description: string;
  failClosedDecision: string;
}

export const S10_INVARIANTS: Record<string, InvariantDefinition> = {
  'S10-I01': {
    id: 'S10-I01',
    title: 'Lockfile Integrity',
    description: 'Production dependency resolution must use the committed lockfile; uncommitted or mutated lockfiles fail the gate.',
    failClosedDecision: 'LOCKFILE_INTEGRITY_ENFORCED',
  },
  'S10-I02': {
    id: 'S10-I02',
    title: 'No Uncontrolled Floating Versions',
    description: 'Production dependencies must not use uncontrolled version ranges (*, latest, unbounded ranges).',
    failClosedDecision: 'FLOATING_VERSION_BLOCKED',
  },
  'S10-I03': {
    id: 'S10-I03',
    title: 'Transitive Dependency Visibility',
    description: 'Complete dependency tree visibility; transitive dependencies must be audited and disclosed.',
    failClosedDecision: 'TRANSITIVE_VISIBILITY_ENFORCED',
  },
  'S10-I04': {
    id: 'S10-I04',
    title: 'Vulnerability Gate',
    description: 'Known security vulnerabilities in production dependencies are detected; critical/high vulnerabilities block release.',
    failClosedDecision: 'VULNERABILITY_GATE_BLOCKED',
  },
  'S10-I05': {
    id: 'S10-I05',
    title: 'Dependency Integrity',
    description: 'Integrity hashes (sha512/sha256) must match metadata; mismatches fail the dependency gate.',
    failClosedDecision: 'DEPENDENCY_INTEGRITY_ENFORCED',
  },
  'S10-I06': {
    id: 'S10-I06',
    title: 'Registry Trust',
    description: 'Explicitly trusted package registries; unauthorized registries are blocked from participating in dependency resolution.',
    failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
  },
  'S10-I07': {
    id: 'S10-I07',
    title: 'Dependency Confusion Defense',
    description: 'Internal package scopes (@nebula, @atlas) are strictly protected against substitution by malicious public packages.',
    failClosedDecision: 'DEPENDENCY_CONFUSION_BLOCKED',
  },
  'S10-I08': {
    id: 'S10-I08',
    title: 'Typosquatting Resistance',
    description: 'Package identity review and Levenshtein similarity detection against trusted sets prevent typosquatting attacks.',
    failClosedDecision: 'TYPOSQUATTING_BLOCKED',
  },
  'S10-I09': {
    id: 'S10-I09',
    title: 'Install Script Control',
    description: 'Lifecycle scripts (preinstall, postinstall, install) are governed; unauthorized execution or remote downloads are blocked.',
    failClosedDecision: 'INSTALL_SCRIPT_GOVERNED',
  },
  'S10-I10': {
    id: 'S10-I10',
    title: 'Build Toolchain Integrity',
    description: 'Controlled toolchain versions for Node.js, pnpm, TypeScript, Vite, NestJS, Prisma, and Turborepo.',
    failClosedDecision: 'TOOLCHAIN_INTEGRITY_ENFORCED',
  },
  'S10-I11': {
    id: 'S10-I11',
    title: 'No Secret-Bearing Dependency Configuration',
    description: 'Dependency manifests, lockfiles, build artifacts, source maps, and CI logs must never contain secrets.',
    failClosedDecision: 'DEPENDENCY_SECRET_BLOCKED',
  },
  'S10-I12': {
    id: 'S10-I12',
    title: 'Dependency Removal',
    description: 'Unused dependencies are cleanly removable without hidden production coupling; minimal dependency graph.',
    failClosedDecision: 'DEPENDENCY_MINIMIZATION_ENFORCED',
  },
  'S10-I13': {
    id: 'S10-I13',
    title: 'Dependency Provenance',
    description: 'Every package, version, origin registry, introducing parent, and approval metadata is authoritatively tracked.',
    failClosedDecision: 'PROVENANCE_TRACKED',
  },
  'S10-I14': {
    id: 'S10-I14',
    title: 'Build Reproducibility',
    description: 'Controlled source revision and lockfile state produce deterministic equivalent production builds.',
    failClosedDecision: 'REPRODUCIBLE_BUILD_ENFORCED',
  },
  'S10-I15': {
    id: 'S10-I15',
    title: 'Fail Closed',
    description: 'If dependency integrity, registry provenance, or license validity cannot be established, build and release are blocked.',
    failClosedDecision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
  },
};

export interface AttackVectorDefinition {
  id: string;
  description: string;
  expectedDecision: string;
}

export const S10_ATTACK_MATRIX: AttackVectorDefinition[] = [
  { id: 'S10-01', description: 'Uncommitted lockfile used in production', expectedDecision: 'LOCKFILE_INTEGRITY_ENFORCED' },
  { id: 'S10-02', description: 'Lockfile modified unexpectedly', expectedDecision: 'LOCKFILE_INTEGRITY_ENFORCED' },
  { id: 'S10-03', description: 'Floating latest production dependency', expectedDecision: 'FLOATING_VERSION_BLOCKED' },
  { id: 'S10-04', description: 'Wildcard dependency version', expectedDecision: 'FLOATING_VERSION_BLOCKED' },
  { id: 'S10-05', description: 'Known critical vulnerable dependency', expectedDecision: 'VULNERABILITY_GATE_BLOCKED' },
  { id: 'S10-06', description: 'Known high vulnerable dependency', expectedDecision: 'VULNERABILITY_GATE_BLOCKED' },
  { id: 'S10-07', description: 'Vulnerable transitive dependency', expectedDecision: 'TRANSITIVE_VULNERABILITY_DETECTED' },
  { id: 'S10-08', description: 'Dependency integrity mismatch', expectedDecision: 'DEPENDENCY_INTEGRITY_ENFORCED' },
  { id: 'S10-09', description: 'Unauthorized registry', expectedDecision: 'REGISTRY_TRUST_ENFORCED' },
  { id: 'S10-10', description: 'Dependency confusion attempt', expectedDecision: 'DEPENDENCY_CONFUSION_BLOCKED' },
  { id: 'S10-11', description: 'Typosquatted package introduction', expectedDecision: 'TYPOSQUATTING_BLOCKED' },
  { id: 'S10-12', description: 'Unexpected package scope', expectedDecision: 'UNEXPECTED_PACKAGE_SCOPE_BLOCKED' },
  { id: 'S10-13', description: 'Malicious postinstall script', expectedDecision: 'INSTALL_SCRIPT_GOVERNED' },
  { id: 'S10-14', description: 'Unauthorized lifecycle script', expectedDecision: 'INSTALL_SCRIPT_GOVERNED' },
  { id: 'S10-15', description: 'Package replacement without review', expectedDecision: 'PACKAGE_REPLACEMENT_BLOCKED' },
  { id: 'S10-16', description: 'Transitive package introduced silently', expectedDecision: 'TRANSITIVE_VISIBILITY_ENFORCED' },
  { id: 'S10-17', description: 'Dependency graph unexpectedly changes', expectedDecision: 'DEPENDENCY_GRAPH_DRIFT_BLOCKED' },
  { id: 'S10-18', description: 'Build tool version drift', expectedDecision: 'TOOLCHAIN_INTEGRITY_ENFORCED' },
  { id: 'S10-19', description: 'CI action dependency compromise', expectedDecision: 'CI_SUPPLY_CHAIN_BLOCKED' },
  { id: 'S10-20', description: 'Unverified build plugin', expectedDecision: 'UNVERIFIED_BUILD_PLUGIN_BLOCKED' },
  { id: 'S10-21', description: 'Dependency contains secret', expectedDecision: 'DEPENDENCY_SECRET_BLOCKED' },
  { id: 'S10-22', description: 'Secret-bearing lockfile entry', expectedDecision: 'DEPENDENCY_SECRET_BLOCKED' },
  { id: 'S10-23', description: 'Malicious package attempts environment access', expectedDecision: 'PACKAGE_SANDBOX_ENFORCED' },
  { id: 'S10-24', description: 'Dependency executes arbitrary shell command', expectedDecision: 'INSTALL_SCRIPT_GOVERNED' },
  { id: 'S10-25', description: 'Package downloads remote executable', expectedDecision: 'REMOTE_CODE_EXECUTION_BLOCKED' },
  { id: 'S10-26', description: 'Compromised package update', expectedDecision: 'COMPROMISED_PACKAGE_UPDATE_BLOCKED' },
  { id: 'S10-27', description: 'Dependency downgrade to vulnerable version', expectedDecision: 'VULNERABILITY_DOWNGRADE_BLOCKED' },
  { id: 'S10-28', description: 'Security patch intentionally bypassed', expectedDecision: 'SECURITY_PATCH_BYPASS_BLOCKED' },
  { id: 'S10-29', description: 'Dependency audit disabled in CI', expectedDecision: 'AUDIT_GATE_REQUIRED' },
  { id: 'S10-30', description: 'Audit result ignored', expectedDecision: 'AUDIT_GATE_REQUIRED' },
  { id: 'S10-31', description: 'Unknown package provenance', expectedDecision: 'PROVENANCE_TRACKED' },
  { id: 'S10-32', description: 'Abandoned critical dependency', expectedDecision: 'ABANDONED_DEPENDENCY_DETECTED' },
  { id: 'S10-33', description: 'License policy violation', expectedDecision: 'LICENSE_POLICY_VIOLATION_BLOCKED' },
  { id: 'S10-34', description: 'Dependency introduces GPL/license conflict', expectedDecision: 'LICENSE_POLICY_VIOLATION_BLOCKED' },
  { id: 'S10-35', description: 'Duplicate conflicting package versions', expectedDecision: 'DUPLICATE_VERSION_DETECTED' },
  { id: 'S10-36', description: 'Production bundle contains unexpected package', expectedDecision: 'PRODUCTION_BUNDLE_POLLUTION_BLOCKED' },
  { id: 'S10-37', description: 'Source map contains dependency secret', expectedDecision: 'DEPENDENCY_SECRET_BLOCKED' },
  { id: 'S10-38', description: 'Reproducible build mismatch', expectedDecision: 'REPRODUCIBLE_BUILD_ENFORCED' },
  { id: 'S10-39', description: 'Direct API bypass using vulnerable component', expectedDecision: 'VULNERABILITY_GATE_BLOCKED' },
  { id: 'S10-40', description: 'Dependency trust cannot be established', expectedDecision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED' },
];

/**
 * Validates the exact canonical S-10 certification statement.
 */
export function verifyS10Certification(statement: string): boolean {
  if (!statement || typeof statement !== 'string') return false;
  const normalized = statement.trim().replace(/\s+/g, ' ');
  return (
    normalized === S10_CERTIFICATION_STATEMENT.trim().replace(/\s+/g, ' ') ||
    normalized === S10_SECONDARY_GATE.trim().replace(/\s+/g, ' ')
  );
}
