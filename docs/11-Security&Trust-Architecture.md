# 11 – Security & Trust Architecture

**Document Version:** 2.0

**Status:** Under Review

**Document Type:** Security Architecture Specification

**Owner:** Atlas Security & Architecture Team

**Last Updated:** July 2026

**Review Trigger:** Major Security or Architectural Change

---

# Purpose

This document defines the security architecture, trust model, and engineering principles that govern the protection of the Atlas platform.

Security within Atlas is not implemented as an isolated feature. Instead, it is integrated into every architectural layer, engineering practice, and operational workflow.

The objective of this document is to establish a consistent security model that protects users, infrastructure, and organizational data while supporting the long-term evolution of Atlas as a production-grade multi-tenant Software-as-a-Service platform.

This document complements the canonical architecture defined in **03 – System Architecture** and the implementation practices defined in **10 – Coding Standards** by defining how security is incorporated throughout the platform.

---

# Scope

This document defines the security principles, trust boundaries, authentication model, authorization strategy, tenant isolation model, secure engineering practices, and operational security requirements for Atlas.

Specifically, this document covers:

- Security philosophy
- Trust model
- Authentication architecture
- Authorization architecture
- Tenant isolation
- Identity management
- Data protection
- Secure communication
- Secure configuration
- Logging and auditing
- Secure software engineering
- Operational security
- Security governance

The following topics are intentionally documented elsewhere.

| Topic | Document |
|--------|----------|
| Product Vision | 01 – Vision |
| Product Requirements | 02 – Product Requirements |
| System Architecture | 03 – System Architecture |
| Database Architecture | 04.1 – Database Architecture |
| API Standards | 05 – API |
| Engineering Decisions | 07 – Decisions |
| Engineering Standards | 10 – Coding Standards |

This document defines **how Atlas establishes trust and protects resources**, not how individual features are implemented.

---

# Security Philosophy

Security is considered a foundational architectural characteristic of Atlas rather than an implementation feature.

Every architectural decision should strengthen the overall security posture of the platform while preserving usability, maintainability, and operational simplicity.

Atlas assumes that security failures are significantly more expensive than implementation effort.

Consequently, security requirements are considered first-order engineering requirements rather than optional enhancements.

---

## Security Objectives

Atlas is designed to provide:

- Confidentiality
- Integrity
- Availability
- Accountability
- Traceability
- Tenant Isolation
- Least Privilege
- Secure Defaults

These objectives guide every security decision throughout the platform.

---

## Security by Default

Security by Default is a core engineering principle.

Every component should begin in the most secure practical configuration.

Examples include:

- Authentication required by default
- Authorization enforced by default
- Input validation enabled by default
- Secure configuration externalized by default
- Least privilege applied by default
- Sensitive data excluded from logs by default

Security should never depend upon optional configuration unless explicitly justified.

---

## Defense in Depth

Atlas adopts a layered security strategy.

Security controls are implemented throughout multiple architectural layers rather than relying on a single defensive mechanism.

Typical layers include:

- Network Security
- Authentication
- Authorization
- Validation
- Business Rules
- Repository Ownership Enforcement
- Database Constraints
- Infrastructure Security
- Monitoring and Auditing

Failure of one control should not automatically compromise the security of the platform.

---

## Least Privilege

Every user, module, service, and infrastructure component should operate with only the permissions necessary to perform its responsibilities.

Privilege escalation should require explicit architectural justification.

Access should always be granted intentionally rather than implicitly.

---

## Zero Trust Mindset

Atlas follows a Zero Trust engineering philosophy.

No request, service, module, or external integration is automatically trusted.

Trust must be established continuously through:

- Authentication
- Authorization
- Ownership verification
- Input validation
- Secure communication

Identity alone does not imply permission.

Every operation must verify both identity and authority.

---

## Shared Responsibility

Security is the responsibility of the entire engineering organization.

Security should not be treated as the responsibility of a single module, engineer, or development phase.

Every contributor is expected to consider the security implications of their implementation decisions.

Architecture, engineering standards, testing, code reviews, and operational monitoring collectively contribute to the overall security posture of Atlas.

---

# Trust Model

Atlas establishes trust through explicit verification rather than implicit assumptions.

Trust relationships exist between:

- Users
- Organizations (future)
- Domains
- Services
- Infrastructure Components
- External Providers

Every trust relationship must be authenticated, authorized, and auditable.

Trust boundaries should remain explicit throughout the architecture.

---

## Trust Boundaries

Atlas defines several primary trust boundaries.

### External Boundary

Separates public clients from the Atlas platform.

All incoming requests must undergo:

- Authentication
- Authorization
- Validation
- Rate limiting (future)
- Request logging

---

### Application Boundary

Separates business logic from infrastructure concerns.

Business modules interact through defined service contracts.

Internal implementation details remain encapsulated.

---

### Data Boundary

Separates business operations from persistent storage.

All database interactions must occur through approved repository abstractions.

Direct database access from business services is prohibited.

---

### Infrastructure Boundary

Separates Atlas from external providers.

Examples include:

- DNS resolution
- SSL inspection
- HTTP requests
- AI providers
- Email services

External systems should never be assumed to be reliable or trustworthy.

Failures should be anticipated and handled safely.

---

## Design Summary

The Atlas Security & Trust Architecture establishes a layered security model built upon explicit trust, least privilege, tenant isolation, and defense in depth.

Rather than relying on isolated security mechanisms, Atlas integrates security into every architectural layer and engineering practice.

These principles provide the foundation upon which authentication, authorization, data protection, operational security, and future security capabilities are implemented.

---

# 5. Authentication Architecture

## Purpose

Authentication establishes the identity of every principal interacting with the Atlas platform.

Every protected operation begins by verifying identity before any business operation is permitted.

Authentication answers a single architectural question:

> **Who is making this request?**

Authorization, ownership verification, and business permissions are intentionally treated as separate architectural responsibilities.

---

## Authentication Principles

Authentication within Atlas MUST satisfy the following principles:

- Identity MUST be established before protected operations.
- Authentication MUST remain independent from business logic.
- Authentication MUST be centralized.
- Authentication MUST produce a verifiable security context.
- Authentication MUST NOT imply authorization.

Authentication establishes identity.

It does not grant permission.

---

## Authentication Flow

Every protected request follows the high-level authentication sequence.

```text
Client Request

↓

Identity Credentials

↓

Authentication Layer

↓

Identity Verification

↓

Security Context

↓

Authorization

↓

Business Operation
```

Authentication MUST complete successfully before authorization is evaluated.

---

## Authentication Responsibilities

The Authentication Module is responsible for:

- Identity verification
- Credential validation
- Session establishment
- Token issuance
- Token validation
- Authentication lifecycle management

Business modules MUST NOT implement authentication logic.

---

## Security Context

Following successful authentication, Atlas establishes a security context containing the authenticated identity.

The security context MAY include:

- User identifier
- Tenant identifier
- Roles
- Permissions
- Session metadata

Business services consume the security context without needing to understand authentication implementation details.

---

## Design Summary

Authentication establishes trusted identity while remaining isolated from authorization and business logic.

This separation improves maintainability, security, and future extensibility.

---

# 6. Authorization Architecture

## Purpose

Authorization determines whether an authenticated identity is permitted to perform a requested operation.

Authorization is evaluated independently from authentication and MUST be enforced before business operations execute.

Authentication verifies identity.

Authorization verifies permission.

---

## Authorization Principles

Authorization within Atlas MUST:

- Verify ownership
- Enforce least privilege
- Remain explicit
- Be evaluated per request
- Protect every business resource

Authorization MUST NOT rely upon client-provided identifiers alone.

Business ownership MUST always be independently verified.

---

## Ownership-Based Authorization

Atlas primarily adopts an ownership-based authorization model.

Typical authorization checks include:

- Domain ownership
- Infrastructure ownership
- Workspace ownership
- Snapshot ownership
- Brief ownership

Ownership verification MUST occur before business operations modify or expose protected resources.

---

## Authorization Flow

```text
Authenticated User

↓

Requested Resource

↓

Ownership Verification

↓

Permission Evaluation

↓

Business Operation
```

Authorization failures MUST terminate request execution immediately.

---

## Business Responsibility

Authorization belongs to the business layer.

Business services remain responsible for enforcing authorization rules appropriate to their business capability.

Infrastructure components provide supporting mechanisms but MUST NOT determine business permissions.

---

## Design Summary

Authorization protects business resources through explicit ownership verification and least-privilege enforcement.

---

# 7. Tenant Isolation

## Purpose

Atlas is designed as a production-grade multi-tenant Software-as-a-Service platform.

Every tenant must remain completely isolated from every other tenant throughout the architecture.

Tenant isolation is considered a mandatory security requirement.

---

## Isolation Principles

Atlas MUST guarantee that:

- Users access only their own resources.
- Repository queries remain tenant-aware.
- Business services enforce ownership.
- Cross-tenant data access is prohibited.
- Shared infrastructure never bypasses tenant boundaries.

Isolation failures are considered critical security defects.

---

## Repository Enforcement

Repositories MUST enforce tenant-aware persistence.

Preferred query pattern:

```
Find Domain by Domain ID and User ID
```

Avoid:

```
Find Domain by Domain ID
```

Ownership enforcement SHOULD occur as close to persistence as practical.

Business services SHOULD NOT rely solely upon post-query filtering.

---

## Multi-Layer Isolation

Tenant isolation is enforced through multiple architectural layers.

Application Layer

- Authentication (JWT + Session Verification)
- Fail-closed error responses (404 Not Found prevents resource enumeration)

Business Layer

- Authorization and ownership pre-validation
- Zero side effects on unauthorized requests (no mutation/work queued before authorization)

Repository Layer

- Ownership-aware queries (e.g. `findByIdForUser(id, userId)`, `findByDomainForUser(domainId, userId)`)
- Clear separation between User-Facing tenant methods and Internal System Worker routines

Database Layer

- Foreign key constraints with cascade rules
- Tenant-scoped composite unique indexes (`[userId, domainName]`, `[userId, sessionToken]`)

---

## Canonical Resource Ownership Hierarchy

Every protected infrastructure entity resolves ownership through the domain graph:

```
User (userId)
  └── Domain (id, userId)
        └── UnderstandingJob (id, domainId)
              └── InfrastructureSnapshot (id, domainId, jobId)
                    ├── InfrastructureFinding (id, snapshotId)
                    ├── ChangeHistory (id, domainId, previousSnapshotId, currentSnapshotId)
                    ├── RawEvidence (id, domainId, snapshotId)
                    └── InfrastructureBrief (id, snapshotId)
```

Direct lookups by resource ID MUST include database-level tenant scoping:
`WHERE snapshot.id = :snapshotId AND domain.userId = :userId`

---

## Operational and Diagnostic Boundaries

Endpoints providing cluster-wide or infrastructure-wide telemetry (such as `GET /api/v1/queue` and `/api/v1/health`) are decoupled from tenant resources:
- Public unauthenticated access is strictly forbidden for operational telemetry.
- Platform health probes (`/health/live`, `/health/ready`) verify application liveness/readiness without exposing tenant or queue internals.

---

## Future Evolution

Future organizational features MAY introduce:

- Organizations
- Teams
- Role hierarchies
- Delegated administration

The tenant isolation model should evolve without compromising existing ownership guarantees.

---

## Design Summary

Tenant isolation is a foundational architectural characteristic rather than an implementation detail.

Every architectural layer contributes to maintaining strict separation between tenants.

---

# 8. Identity Management

## Purpose

Identity Management governs the lifecycle of authenticated identities within Atlas.

It establishes how identities are created, maintained, verified, and retired while remaining independent from business functionality.

---

## Identity Principles

Atlas identities MUST be:

- Unique
- Verifiable
- Auditable
- Securely managed

Identity lifecycle management MUST preserve security throughout the lifetime of every account.

---

## Identity Lifecycle

Typical lifecycle stages include:

```text
Registration

↓

Verification

↓

Activation

↓

Authentication

↓

Authorization

↓

Credential Update

↓

Deactivation
```

Each stage should be auditable.

---

## Credential Management

Credential management MUST prioritize security over convenience.

Sensitive credentials MUST:

- Never be stored in plaintext.
- Never appear in logs.
- Never be transmitted insecurely.
- Be managed using approved security mechanisms.

Credential implementation details remain outside the scope of this document.

---

## Identity Auditability

Security-sensitive identity events SHOULD be logged.

Examples include:

- Login
- Logout
- Credential changes
- Failed authentication
- Account lockout
- Administrative actions

Audit records improve accountability and operational investigation.

---

## Design Summary

Identity Management provides the trusted foundation upon which authentication and authorization are built while maintaining clear separation from business functionality.

---

# 9. Data Protection

## Purpose

Data Protection defines how Atlas safeguards information throughout its lifecycle.

Every layer of the platform is responsible for protecting the confidentiality, integrity, and availability of business data while minimizing unnecessary exposure.

Data protection applies to information both at rest and in transit.

---

## Data Protection Principles

Atlas MUST protect data according to the following principles:

- Collect only necessary information.
- Protect sensitive information throughout its lifecycle.
- Minimize unnecessary data exposure.
- Apply least privilege to data access.
- Preserve data integrity.
- Maintain auditability.

Data protection is considered a platform-wide architectural responsibility.

---

## Data Classification

Atlas data should be classified according to its sensitivity.

Typical classifications include:

### Public

Information intended for public consumption.

Examples:

- Public documentation
- Marketing content

---

### Internal

Operational information used by Atlas.

Examples:

- Application configuration
- Internal metrics
- Diagnostic information

---

### Confidential

Business information owned by tenants.

Examples:

- Domains
- Infrastructure findings
- Snapshots
- Infrastructure briefs
- Historical intelligence

Confidential information MUST remain isolated between tenants.

---

### Sensitive

Information requiring the highest level of protection.

Examples:

- Password hashes
- Authentication secrets
- Encryption keys
- API credentials
- Session identifiers

Sensitive information MUST receive additional protection and MUST NEVER be exposed through logs or API responses.

---

## Data Retention

Business data SHOULD remain available according to product requirements.

Temporary operational data SHOULD be retained only as long as necessary.

Deletion strategies should preserve referential integrity while supporting future compliance requirements.

---

## Design Summary

Data protection extends beyond encryption.

Atlas protects information through architectural boundaries, ownership enforcement, secure engineering practices, and disciplined operational controls.

---

# 10. Secure Communication

## Purpose

Every communication channel within Atlas must preserve confidentiality, integrity, and authenticity.

Communication security applies to:

- Client communication
- Service communication
- External integrations
- Administrative operations

---

## Communication Principles

Atlas communications MUST:

- Authenticate participants where appropriate.
- Preserve message integrity.
- Prevent unauthorized disclosure.
- Protect against tampering.

Communication channels MUST be secured before sensitive information is exchanged.

---

## Internal Communication

Business modules communicate through exported services.

Modules MUST NOT bypass architectural boundaries through shared persistence or undocumented interfaces.

Internal communication should remain explicit, predictable, and auditable.

---

## External Communication

Atlas communicates with external systems including:

- DNS infrastructure
- HTTP services
- SSL endpoints
- AI providers
- Email providers

External systems MUST be treated as untrusted.

Input received from external providers MUST be validated before entering business workflows.

Failures MUST be handled gracefully.

---

## Future Evolution

Future distributed services MUST preserve the same trust principles established within the Modular Monolith.

Service extraction MUST NOT weaken security guarantees.

---

## Design Summary

Secure communication protects trust relationships while preserving architectural boundaries.

---

# 11. Secure Configuration

## Purpose

Configuration represents one of the most sensitive operational assets within Atlas.

Improper configuration management can compromise the entire platform regardless of application correctness.

---

## Configuration Principles

Sensitive configuration MUST remain external to application source code.

Business logic MUST remain independent of configuration storage mechanisms.

Configuration SHOULD remain environment-specific.

---

## Sensitive Configuration

Examples include:

- Database credentials
- Authentication secrets
- Encryption keys
- API credentials
- SMTP credentials
- Cloud provider credentials

Sensitive configuration MUST:

- Never be committed to version control.
- Never appear in logs.
- Never be hardcoded.
- Be rotated when required.

---

## Environment Separation

Development, testing, staging, and production SHOULD maintain independent configuration.

Production configuration MUST remain isolated from non-production environments.

---

## Secret Management

Secrets SHOULD be managed using approved secret management solutions appropriate to the deployment environment.

Application modules MUST consume secrets through the Configuration Layer rather than direct environment access.

---

## Design Summary

Secure configuration minimizes operational risk while supporting maintainable and portable deployments.

---

# 12. Logging and Auditing

## Purpose

Operational visibility is essential for maintaining security, reliability, and accountability.

Logging and auditing provide the evidence required to investigate incidents, understand system behaviour, and demonstrate operational integrity.

---

## Logging Principles

Security logs MUST be:

- Structured
- Timestamped
- Searchable
- Consistent
- Protected against unauthorized modification

Logs SHOULD support both operational diagnostics and security investigations.

---

## Audit Events

Security-sensitive operations SHOULD generate audit records.

Examples include:

- Authentication
- Authorization failures
- User management
- Domain ownership changes
- Administrative operations
- Security configuration changes

Audit records SHOULD remain tamper-evident where practical.

---

## Sensitive Information

Security logs MUST NOT contain:

- Passwords
- Secrets
- Authentication tokens
- Encryption keys
- Personally identifiable information unless operationally required

Operational usefulness MUST never compromise confidentiality.

---

## Correlation

Security events SHOULD include correlation identifiers to enable end-to-end tracing across requests and background workflows.

Correlation significantly improves incident investigation and operational observability.

---

## Design Summary

Logging and auditing strengthen operational trust while supporting incident response and regulatory readiness.

---

# 13. Secure Software Engineering

## Purpose

Security is incorporated throughout the software development lifecycle.

Secure software engineering ensures that security is considered during design, implementation, testing, deployment, and maintenance.

---

## Engineering Principles

Every implementation MUST:

- Follow the canonical architecture.
- Follow Atlas Engineering Standards.
- Validate external input.
- Enforce authorization.
- Preserve tenant isolation.
- Protect sensitive information.

Security is considered a shared engineering responsibility.

---

## Dependency Management

Third-party dependencies SHOULD be:

- Actively maintained.
- Regularly reviewed.
- Updated responsibly.
- Removed when unsupported.

Dependencies introducing unacceptable security risk SHOULD be replaced.

---

## Security Reviews

Significant architectural changes SHOULD undergo security review before implementation.

Examples include:

- Authentication changes
- Authorization changes
- External integrations
- Infrastructure changes
- Multi-tenant behaviour
- Public API changes

---

## Continuous Improvement

Security practices SHOULD evolve through Engineering Decision Records (EDRs).

Security improvements should remain proactive rather than reactive.

---

## Design Summary

Secure software engineering ensures that Atlas continuously improves its security posture throughout the product lifecycle rather than relying on isolated security initiatives.

---
# 14. Operational Security

## Purpose

Operational Security defines the practices required to maintain the security of Atlas throughout its operational lifecycle.

Security does not end with deployment. Continuous monitoring, maintenance, incident response, and operational discipline are essential to preserving the integrity of the platform.

---

## Operational Principles

Atlas operations MUST prioritize:

- Availability
- Reliability
- Observability
- Recoverability
- Continuous monitoring
- Secure operational practices

Operational security is considered an ongoing engineering responsibility.

---

## Monitoring

Production systems SHOULD be continuously monitored for:

- Service health
- Authentication failures
- Authorization failures
- Infrastructure failures
- External dependency failures
- Unexpected system behaviour

Monitoring SHOULD enable proactive identification of operational issues before they impact users.

---

## Incident Response

Security incidents MUST follow a documented response process.

Typical phases include:

```text
Detection

↓

Assessment

↓

Containment

↓

Eradication

↓

Recovery

↓

Post-Incident Review
```

Lessons learned from security incidents SHOULD result in Engineering Decision Records (EDRs) or security improvements where appropriate.

---

## Backup and Recovery

Critical business data SHOULD be protected through reliable backup strategies.

Recovery procedures SHOULD be regularly validated.

Backup strategies MUST preserve:

- Data integrity
- Tenant isolation
- Confidentiality

Recovery planning is considered part of production readiness.

---

## Operational Reviews

Security posture SHOULD be reviewed periodically.

Reviews MAY include:

- Dependency audits
- Access reviews
- Secret rotation
- Configuration validation
- Security logging verification

Continuous review reduces long-term operational risk.

---

## Design Summary

Operational security ensures that Atlas remains secure throughout its production lifecycle rather than only during software development.

---

# 15. Security Governance

## Purpose

Security Governance defines how security decisions are introduced, reviewed, approved, and maintained throughout the lifetime of Atlas.

Security governance ensures that implementation remains aligned with approved architectural principles.

---

## Governance Principles

Security decisions MUST be:

- Intentional
- Reviewed
- Documented
- Traceable
- Maintainable

Security MUST evolve through disciplined engineering rather than ad hoc implementation.

---

## Security Review Process

Significant security changes SHOULD follow the standard governance process.

```text
Security Proposal

↓

Architecture Discussion

↓

Security Review

↓

Engineering Decision Record (EDR)

↓

Documentation Update

↓

Implementation

↓

Testing

↓

Release
```

Security architecture MUST precede implementation.

---

## Review Triggers

Security review SHOULD be performed when introducing:

- Authentication changes
- Authorization changes
- New external integrations
- Cryptographic mechanisms
- Multi-tenant behaviour
- Public APIs
- Infrastructure changes
- Identity providers

These changes have platform-wide security implications.

---

## Compliance with Engineering Standards

Security governance complements the engineering practices defined in **10 – Coding Standards**.

Security requirements MUST be incorporated into:

- Architecture reviews
- Code reviews
- Testing
- Documentation
- Release readiness

Security is not a separate phase.

It is integrated throughout the engineering lifecycle.

---

## Design Summary

Security governance ensures that Atlas maintains a consistent security posture as the platform evolves.

---

# 16. Future Security Evolution

Atlas is intentionally designed to support future security capabilities without requiring fundamental architectural redesign.

Potential future enhancements include:

- Multi-Factor Authentication (MFA)
- Single Sign-On (SSO)
- Enterprise Identity Providers
- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC)
- Organization and Team Management
- Customer-Managed Encryption Keys
- Audit Log Export
- Security Analytics
- Policy-Based Access Management

These capabilities should integrate into the existing security architecture while preserving the core principles defined within this document.

Future enhancements MUST strengthen, rather than replace, the established trust model.

---

# 17. Security Summary

The Atlas Security & Trust Architecture defines the principles, trust model, and engineering practices that collectively protect the platform, its users, and their data.

Security within Atlas is achieved through:

- Security by Default
- Defense in Depth
- Zero Trust
- Least Privilege
- Tenant Isolation
- Secure Engineering
- Operational Security
- Continuous Governance

These principles are reinforced throughout the architecture, engineering standards, and operational workflows.

Security is therefore treated as an architectural characteristic rather than an isolated implementation concern.

As Atlas evolves, new security capabilities may be introduced, but they should always remain consistent with the trust model and engineering principles established by this document.

---

# 18. Production Configuration & Environment Hardening (REFINEMENT-003)

## Centralized Environment Validation

Atlas implements centralized, fail-fast configuration validation at bootstrap before any network socket or database pool is initialized.

### Core Validation Invariants

| Configuration Key | Development Default | Production Invariant |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Must be `production` |
| `PORT` | `3000` | Valid port number `1-65535` |
| `DATABASE_URL` | `postgresql://atlas:atlas@localhost:5432/atlas` | Explicit PostgreSQL URI. Cannot contain `localhost`, `127.0.0.1`, or default credentials. |
| `JWT_ACCESS_SECRET` | `atlas-development-access-secret` | Required $\ge 32$ character high-entropy secret. Development/example fallbacks rejected. |
| `JWT_REFRESH_SECRET` | `atlas-development-refresh-secret` | Required $\ge 32$ character high-entropy secret. Must be cryptographically distinct from access secret. |
| `FRONTEND_URL` | `http://localhost:5173` | Explicit production domain. Cannot point to `localhost` / `127.0.0.1`. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Explicit list of trusted frontend origins. Wildcard (`*`) strictly disallowed with credentials. |
| `EMAIL_PROVIDER` | `development` (Mailpit) | Production transport required (`smtp`, `ses`, `sendgrid`, `resend`, `postmark`). `development`/`mailpit` rejected. |
| `GOOGLE_OAUTH_ENABLED` | `false` | When enabled, valid non-placeholder `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` required. Callback URL cannot be localhost. |
| `GITHUB_OAUTH_ENABLED` | `false` | When enabled, valid non-placeholder `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` required. Callback URL cannot be localhost. |

---

# Document Status

| Property | Value |
|----------|-------|
| **Document** | 11 – Security & Trust Architecture |
| **Version** | 2.1 |
| **Status** | **Approved (Frozen)** |
| **Classification** | Security Architecture Specification |
| **Owner** | Atlas Security & Architecture Team |
| **Last Updated** | August 2026 |
| **Next Review Trigger** | Major Security or Architectural Change |
| **Review Process** | Engineering Decision Record (EDR) Required |

---
