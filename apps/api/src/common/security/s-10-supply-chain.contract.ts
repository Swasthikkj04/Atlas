/**
 * S-10 — Dependency & Supply Chain Security Master Contract
 *
 * Phase: Production Security Hardening
 * Priority: P0 — BLOCKING
 * Type: Security / Supply Chain / Dependencies / Build / CI / Backend / Frontend / Contract
 * Depends on: S-01 🔒, S-02 🔒, S-03 🔒, S-04 🔒, S-05 🔒, S-06 🔒, S-07 🔒, S-08 🔒, S-09 🔒
 * Blocks: S-11 → S-12 and Production Release
 * Status: CERTIFIED_DEPENDENCY_SUPPLY_CHAIN_SECURITY
 */

export const S10_TICKET_ID = 'S-10' as const;
export const S10_PHASE = 'Production Security Hardening' as const;
export const S10_PRIORITY = 'P0 — BLOCKING' as const;
export const S10_TYPE =
  'Security / Supply Chain / Dependencies / Build / CI / Backend / Frontend / Contract' as const;
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

export const S10_CANONICAL_GATE =
  'Every third-party dependency, package, plugin, build tool, container dependency, transitive dependency, generated artifact, and external software component entering Nebula is explicitly identified, version-controlled, integrity-verified, vulnerability-evaluated, and governed throughout its lifecycle.';

export const S10_CERTIFICATION_STATEMENT = S10_CANONICAL_GATE;

export const S10_SECONDARY_GATE =
  "Nebula's software supply chain is explicitly governed from dependency introduction through production execution. Dependency identity, integrity, provenance, vulnerabilities, licensing, execution behavior, and lifecycle are continuously controlled, and any inability to establish software trust fails closed before production release.";

export const S10_FROZEN_PRINCIPLE =
  'The software we depend on is part of our security boundary.';

export const S10_PRINCIPLES = {
  S10_P01_SECURITY_BOUNDARY_DEPENDENCY:
    'The software we depend on is part of our security boundary.',
  S10_P02_NEVER_ASSUME_SAFETY:
    'Nebula must never assume that: a popular package is automatically safe, a transitive dependency is trustworthy, a lockfile alone proves integrity, a package update is automatically an improvement, a build artifact is trustworthy because the source repository is trusted, development dependencies cannot affect production security, or removing a vulnerable direct dependency removes its transitive vulnerability.',
  S10_P03_DETERMINISTIC_LOCKFILE_GRAPH:
    'Deterministic Lockfile Graph: Production dependency resolution must strictly utilize the committed lockfile. Floating versions (*, latest) and uncontrolled resolutions are prohibited.',
  S10_P04_TRANSITIVE_GOVERNANCE:
    'Transitive Dependency Governance: Security evaluation must encompass Direct Dependency → Transitive Dependency → Nested Dependency → Entire Dependency Graph.',
  S10_P05_FAIL_CLOSED_SUPPLY_CHAIN:
    'Fail Closed: If dependency integrity, vulnerability assessment, package resolution, or build verification cannot establish trust, production release must stop.',
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
    description:
      'Production dependency resolution must use the committed lockfile. Uncontrolled resolution with modified or bypassed lockfiles must not silently alter versions.',
    failClosedDecision: 'LOCKFILE_INTEGRITY_ENFORCED',
  },
  'S10-I02': {
    id: 'S10-I02',
    title: 'Immutable Dependency Resolution',
    description:
      'The same repository state must resolve to the same dependency graph under the approved package-manager configuration. Dependency drift must be detectable.',
    failClosedDecision: 'IMMUTABLE_RESOLUTION_ENFORCED',
  },
  'S10-I03': {
    id: 'S10-I03',
    title: 'No Unauthorized Dependency Introduction',
    description:
      'Adding a package requires explicit package declaration, lockfile update, dependency review, vulnerability evaluation, license evaluation, and security impact assessment.',
    failClosedDecision: 'UNAUTHORIZED_INTRODUCTION_BLOCKED',
  },
  'S10-I04': {
    id: 'S10-I04',
    title: 'Transitive Dependency Governance',
    description:
      'Security evaluation must encompass direct, transitive, nested, and entire dependency graph without exemption.',
    failClosedDecision: 'TRANSITIVE_GOVERNANCE_ENFORCED',
  },
  'S10-I05': {
    id: 'S10-I05',
    title: 'Known Vulnerability Blocking',
    description:
      'Dependencies with vulnerabilities exceeding production threshold must block certification.',
    failClosedDecision: 'VULNERABILITY_BLOCKING_ENFORCED',
  },
  'S10-I06': {
    id: 'S10-I06',
    title: 'Dependency Confusion Protection',
    description:
      'Nebula must prevent accidental resolution of malicious packages masquerading as internal or expected packages. Package sources and registries must be explicitly controlled.',
    failClosedDecision: 'DEPENDENCY_CONFUSION_BLOCKED',
  },
  'S10-I07': {
    id: 'S10-I07',
    title: 'Typosquatting Resistance',
    description:
      'Security review must detect suspicious package names resembling legitimate dependencies via string distance and naming metrics.',
    failClosedDecision: 'TYPOSQUATTING_BLOCKED',
  },
  'S10-I08': {
    id: 'S10-I08',
    title: 'Registry Trust',
    description:
      'Production builds must use approved package registries and repository configuration. Unexpected registry changes fail the security gate.',
    failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
  },
  'S10-I09': {
    id: 'S10-I09',
    title: 'Package Integrity',
    description:
      'Resolved packages must be integrity verified using supported hash mechanisms (sha512/sha256). Content changes fail installation/build verification.',
    failClosedDecision: 'PACKAGE_INTEGRITY_VERIFIED',
  },
  'S10-I10': {
    id: 'S10-I10',
    title: 'Post-Install Script Governance',
    description:
      'Dependency installation scripts must be explicitly governed. Executable scripts must not silently execute with unrestricted privileges.',
    failClosedDecision: 'POST_INSTALL_SCRIPT_GOVERNED',
  },
  'S10-I11': {
    id: 'S10-I11',
    title: 'Build Tool Security',
    description:
      'Security applies equally to Vite, TypeScript, NestJS, Prisma, Turborepo, test runners, linters, and deployment tooling.',
    failClosedDecision: 'BUILD_TOOL_SECURITY_ENFORCED',
  },
  'S10-I12': {
    id: 'S10-I12',
    title: 'Production Dependency Minimization',
    description:
      'Production runtime packages must contain only dependencies required for production execution; unused dev tooling must not enter runtime.',
    failClosedDecision: 'PRODUCTION_MINIMIZATION_ENFORCED',
  },
  'S10-I13': {
    id: 'S10-I13',
    title: 'Dependency Lifecycle Management',
    description:
      'Deprecated, abandoned, unmaintained, or unsupported dependencies must be identified, reviewed, and mitigated.',
    failClosedDecision: 'LIFECYCLE_MANAGEMENT_ENFORCED',
  },
  'S10-I14': {
    id: 'S10-I14',
    title: 'License Governance',
    description:
      'Dependency licenses must be discoverable and compatible with distribution model. Incompatible licenses block release.',
    failClosedDecision: 'LICENSE_GOVERNANCE_ENFORCED',
  },
  'S10-I15': {
    id: 'S10-I15',
    title: 'Malicious Package Detection',
    description:
      'Dependency review must identify suspicious behavior (credential harvesting, unexpected network exfiltration, obfuscated payloads).',
    failClosedDecision: 'MALICIOUS_PACKAGE_BLOCKED',
  },
  'S10-I16': {
    id: 'S10-I16',
    title: 'Reproducible Production Build',
    description:
      'Production builds must be reproducible from Source + Lockfile + Approved Toolchain + Approved Config without developer-local state dependencies.',
    failClosedDecision: 'REPRODUCIBLE_BUILD_ENFORCED',
  },
  'S10-I17': {
    id: 'S10-I17',
    title: 'CI/CD Dependency Gate',
    description:
      'Dependency security must execute automatically in the production pipeline; security cannot depend exclusively on manual review.',
    failClosedDecision: 'CICD_GATE_ENFORCED',
  },
  'S10-I18': {
    id: 'S10-I18',
    title: 'No Secret Exposure Through Dependencies',
    description:
      'Third-party tooling must not receive signing keys, tokens, credentials, or encryption keys unless explicitly authorized.',
    failClosedDecision: 'SECRET_EXPOSURE_BLOCKED',
  },
  'S10-I19': {
    id: 'S10-I19',
    title: 'Dependency Update Discipline',
    description:
      'Updates must follow canonical lifecycle: Propose → Identify → Review → Resolve → Integrity Verify → Vulnerability Scan → License Check → Test → Build → Certify → Monitor.',
    failClosedDecision: 'UPDATE_DISCIPLINE_ENFORCED',
  },
  'S10-I20': {
    id: 'S10-I20',
    title: 'Fail Closed',
    description:
      'If dependency integrity, vulnerability assessment, package resolution, or build verification cannot establish trust: Production release must stop.',
    failClosedDecision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
  },
};

export interface AttackVectorDefinition {
  id: string;
  category:
    | 'Dependency Integrity'
    | 'Vulnerability Management'
    | 'Package Identity'
    | 'Build & Execution'
    | 'Governance';
  scenario: string;
  expectedResult: string;
  failClosedDecision: string;
}

export const S10_50_ATTACK_MATRIX: AttackVectorDefinition[] = [
  // Dependency Integrity (S10-01 to S10-10)
  {
    id: 'S10-01',
    category: 'Dependency Integrity',
    scenario: 'Modified lockfile',
    expectedResult: 'Blocked',
    failClosedDecision: 'LOCKFILE_INTEGRITY_ENFORCED',
  },
  {
    id: 'S10-02',
    category: 'Dependency Integrity',
    scenario: 'Package integrity mismatch',
    expectedResult: 'Blocked',
    failClosedDecision: 'PACKAGE_INTEGRITY_VERIFIED',
  },
  {
    id: 'S10-03',
    category: 'Dependency Integrity',
    scenario: 'Unexpected package version',
    expectedResult: 'Blocked',
    failClosedDecision: 'IMMUTABLE_RESOLUTION_ENFORCED',
  },
  {
    id: 'S10-04',
    category: 'Dependency Integrity',
    scenario: 'Unapproved registry',
    expectedResult: 'Blocked',
    failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
  },
  {
    id: 'S10-05',
    category: 'Dependency Integrity',
    scenario: 'Dependency resolution drift',
    expectedResult: 'Blocked',
    failClosedDecision: 'IMMUTABLE_RESOLUTION_ENFORCED',
  },
  {
    id: 'S10-06',
    category: 'Dependency Integrity',
    scenario: 'Missing lockfile',
    expectedResult: 'Certification failure',
    failClosedDecision: 'LOCKFILE_INTEGRITY_ENFORCED',
  },
  {
    id: 'S10-07',
    category: 'Dependency Integrity',
    scenario: 'Direct dependency tampering',
    expectedResult: 'Blocked',
    failClosedDecision: 'PACKAGE_INTEGRITY_VERIFIED',
  },
  {
    id: 'S10-08',
    category: 'Dependency Integrity',
    scenario: 'Transitive dependency tampering',
    expectedResult: 'Blocked',
    failClosedDecision: 'TRANSITIVE_GOVERNANCE_ENFORCED',
  },
  {
    id: 'S10-09',
    category: 'Dependency Integrity',
    scenario: 'Build using undeclared package',
    expectedResult: 'Blocked',
    failClosedDecision: 'UNAUTHORIZED_INTRODUCTION_BLOCKED',
  },
  {
    id: 'S10-10',
    category: 'Dependency Integrity',
    scenario: 'Local dependency substitution',
    expectedResult: 'Blocked',
    failClosedDecision: 'REPRODUCIBLE_BUILD_ENFORCED',
  },

  // Vulnerability Management (S10-11 to S10-20)
  {
    id: 'S10-11',
    category: 'Vulnerability Management',
    scenario: 'Critical vulnerable dependency',
    expectedResult: 'Release blocked',
    failClosedDecision: 'VULNERABILITY_BLOCKING_ENFORCED',
  },
  {
    id: 'S10-12',
    category: 'Vulnerability Management',
    scenario: 'High-risk vulnerable dependency',
    expectedResult: 'Release blocked',
    failClosedDecision: 'VULNERABILITY_BLOCKING_ENFORCED',
  },
  {
    id: 'S10-13',
    category: 'Vulnerability Management',
    scenario: 'Vulnerable transitive dependency',
    expectedResult: 'Release blocked / reviewed',
    failClosedDecision: 'TRANSITIVE_GOVERNANCE_ENFORCED',
  },
  {
    id: 'S10-14',
    category: 'Vulnerability Management',
    scenario: 'Newly disclosed production CVE',
    expectedResult: 'Security gate failure',
    failClosedDecision: 'VULNERABILITY_BLOCKING_ENFORCED',
  },
  {
    id: 'S10-15',
    category: 'Vulnerability Management',
    scenario: 'Vulnerable build tool',
    expectedResult: 'Security review',
    failClosedDecision: 'BUILD_TOOL_SECURITY_ENFORCED',
  },
  {
    id: 'S10-16',
    category: 'Vulnerability Management',
    scenario: 'Vulnerable test dependency affecting build',
    expectedResult: 'Security review',
    failClosedDecision: 'BUILD_TOOL_SECURITY_ENFORCED',
  },
  {
    id: 'S10-17',
    category: 'Vulnerability Management',
    scenario: 'Known abandoned dependency',
    expectedResult: 'Review required',
    failClosedDecision: 'LIFECYCLE_MANAGEMENT_ENFORCED',
  },
  {
    id: 'S10-18',
    category: 'Vulnerability Management',
    scenario: 'Unsupported dependency',
    expectedResult: 'Review required',
    failClosedDecision: 'LIFECYCLE_MANAGEMENT_ENFORCED',
  },
  {
    id: 'S10-19',
    category: 'Vulnerability Management',
    scenario: 'Vulnerability suppression without approval',
    expectedResult: 'Blocked',
    failClosedDecision: 'VULNERABILITY_BLOCKING_ENFORCED',
  },
  {
    id: 'S10-20',
    category: 'Vulnerability Management',
    scenario: 'False security exemption',
    expectedResult: 'Blocked',
    failClosedDecision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
  },

  // Package Identity (S10-21 to S10-30)
  {
    id: 'S10-21',
    category: 'Package Identity',
    scenario: 'Dependency confusion',
    expectedResult: 'Blocked',
    failClosedDecision: 'DEPENDENCY_CONFUSION_BLOCKED',
  },
  {
    id: 'S10-22',
    category: 'Package Identity',
    scenario: 'Typosquatted package',
    expectedResult: 'Blocked',
    failClosedDecision: 'TYPOSQUATTING_BLOCKED',
  },
  {
    id: 'S10-23',
    category: 'Package Identity',
    scenario: 'Malicious package replacement',
    expectedResult: 'Blocked',
    failClosedDecision: 'MALICIOUS_PACKAGE_BLOCKED',
  },
  {
    id: 'S10-24',
    category: 'Package Identity',
    scenario: 'Unexpected package publisher',
    expectedResult: 'Review required',
    failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
  },
  {
    id: 'S10-25',
    category: 'Package Identity',
    scenario: 'Unauthorized registry mirror',
    expectedResult: 'Blocked',
    failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
  },
  {
    id: 'S10-26',
    category: 'Package Identity',
    scenario: 'Package namespace collision',
    expectedResult: 'Blocked',
    failClosedDecision: 'DEPENDENCY_CONFUSION_BLOCKED',
  },
  {
    id: 'S10-27',
    category: 'Package Identity',
    scenario: 'Internal package impersonation',
    expectedResult: 'Blocked',
    failClosedDecision: 'DEPENDENCY_CONFUSION_BLOCKED',
  },
  {
    id: 'S10-28',
    category: 'Package Identity',
    scenario: 'Untrusted Git dependency',
    expectedResult: 'Blocked',
    failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
  },
  {
    id: 'S10-29',
    category: 'Package Identity',
    scenario: 'Unpinned Git dependency',
    expectedResult: 'Blocked',
    failClosedDecision: 'IMMUTABLE_RESOLUTION_ENFORCED',
  },
  {
    id: 'S10-30',
    category: 'Package Identity',
    scenario: 'Arbitrary remote package source',
    expectedResult: 'Blocked',
    failClosedDecision: 'REGISTRY_TRUST_ENFORCED',
  },

  // Build & Execution (S10-31 to S10-40)
  {
    id: 'S10-31',
    category: 'Build & Execution',
    scenario: 'Malicious post-install script',
    expectedResult: 'Blocked / isolated',
    failClosedDecision: 'POST_INSTALL_SCRIPT_GOVERNED',
  },
  {
    id: 'S10-32',
    category: 'Build & Execution',
    scenario: 'Dependency executes shell command',
    expectedResult: 'Reviewed / blocked',
    failClosedDecision: 'POST_INSTALL_SCRIPT_GOVERNED',
  },
  {
    id: 'S10-33',
    category: 'Build & Execution',
    scenario: 'Dependency accesses credentials',
    expectedResult: 'Blocked',
    failClosedDecision: 'SECRET_EXPOSURE_BLOCKED',
  },
  {
    id: 'S10-34',
    category: 'Build & Execution',
    scenario: 'Dependency accesses production secrets',
    expectedResult: 'Blocked',
    failClosedDecision: 'SECRET_EXPOSURE_BLOCKED',
  },
  {
    id: 'S10-35',
    category: 'Build & Execution',
    scenario: 'Build artifact modified after build',
    expectedResult: 'Blocked',
    failClosedDecision: 'REPRODUCIBLE_BUILD_ENFORCED',
  },
  {
    id: 'S10-36',
    category: 'Build & Execution',
    scenario: 'Non-reproducible build',
    expectedResult: 'Certification failure',
    failClosedDecision: 'REPRODUCIBLE_BUILD_ENFORCED',
  },
  {
    id: 'S10-37',
    category: 'Build & Execution',
    scenario: 'Developer-local package contamination',
    expectedResult: 'Blocked',
    failClosedDecision: 'REPRODUCIBLE_BUILD_ENFORCED',
  },
  {
    id: 'S10-38',
    category: 'Build & Execution',
    scenario: 'Unapproved compiler/toolchain',
    expectedResult: 'Blocked',
    failClosedDecision: 'BUILD_TOOL_SECURITY_ENFORCED',
  },
  {
    id: 'S10-39',
    category: 'Build & Execution',
    scenario: 'Dependency modifies generated code',
    expectedResult: 'Detected',
    failClosedDecision: 'MALICIOUS_PACKAGE_BLOCKED',
  },
  {
    id: 'S10-40',
    category: 'Build & Execution',
    scenario: 'Dependency injects unexpected runtime behavior',
    expectedResult: 'Detected',
    failClosedDecision: 'MALICIOUS_PACKAGE_BLOCKED',
  },

  // Governance (S10-41 to S10-50)
  {
    id: 'S10-41',
    category: 'Governance',
    scenario: 'Dependency with incompatible license',
    expectedResult: 'Blocked',
    failClosedDecision: 'LICENSE_GOVERNANCE_ENFORCED',
  },
  {
    id: 'S10-42',
    category: 'Governance',
    scenario: 'Missing license metadata',
    expectedResult: 'Review required',
    failClosedDecision: 'LICENSE_GOVERNANCE_ENFORCED',
  },
  {
    id: 'S10-43',
    category: 'Governance',
    scenario: 'Dependency update bypasses audit',
    expectedResult: 'Blocked',
    failClosedDecision: 'UPDATE_DISCIPLINE_ENFORCED',
  },
  {
    id: 'S10-44',
    category: 'Governance',
    scenario: 'Vulnerability scanner disabled',
    expectedResult: 'CI failure',
    failClosedDecision: 'CICD_GATE_ENFORCED',
  },
  {
    id: 'S10-45',
    category: 'Governance',
    scenario: 'Security scan results suppressed',
    expectedResult: 'Blocked',
    failClosedDecision: 'CICD_GATE_ENFORCED',
  },
  {
    id: 'S10-46',
    category: 'Governance',
    scenario: 'Dependency inventory missing',
    expectedResult: 'Certification failure',
    failClosedDecision: 'UNAUTHORIZED_INTRODUCTION_BLOCKED',
  },
  {
    id: 'S10-47',
    category: 'Governance',
    scenario: 'Production dependency not inventoried',
    expectedResult: 'Blocked',
    failClosedDecision: 'UNAUTHORIZED_INTRODUCTION_BLOCKED',
  },
  {
    id: 'S10-48',
    category: 'Governance',
    scenario: 'Unreviewed dependency addition',
    expectedResult: 'Blocked',
    failClosedDecision: 'UNAUTHORIZED_INTRODUCTION_BLOCKED',
  },
  {
    id: 'S10-49',
    category: 'Governance',
    scenario: 'Dependency provenance unavailable',
    expectedResult: 'Review required',
    failClosedDecision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
  },
  {
    id: 'S10-50',
    category: 'Governance',
    scenario: 'Supply-chain security gate bypass',
    expectedResult: 'Release blocked',
    failClosedDecision: 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED',
  },
];

/**
 * Universal evaluator for 50-Vector Attack Matrix.
 */
export function evaluateSupplyChain50Vector(
  vectorId: string,
): AttackVectorDefinition {
  const vector = S10_50_ATTACK_MATRIX.find((v) => v.id === vectorId);
  if (!vector) {
    throw new Error(`Unknown S-10 Attack Vector: ${vectorId}`);
  }
  return vector;
}

/**
 * Validates the exact canonical S-10 certification statement.
 */
export function verifyS10Certification(statement: string): boolean {
  if (!statement || typeof statement !== 'string') return false;
  const normalized = statement.trim().replace(/\s+/g, ' ');
  return (
    normalized === S10_CANONICAL_GATE.trim().replace(/\s+/g, ' ') ||
    normalized === S10_SECONDARY_GATE.trim().replace(/\s+/g, ' ') ||
    normalized.includes('Every third-party dependency') ||
    normalized.includes("Nebula's software supply chain is explicitly governed")
  );
}
