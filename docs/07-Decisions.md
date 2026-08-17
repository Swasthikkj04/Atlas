# 07 – Engineering Decisions

**Document Version:** 2.0

**Status:** Under Review

**Document Type:** Engineering Decision Record (EDR) Specification

**Owner:** Atlas Architecture Team

**Last Updated:** July 2026

**Review Trigger:** Engineering Governance Evolution

---

# Purpose

This document defines the process by which significant architectural and engineering decisions are proposed, reviewed, approved, documented, and maintained throughout the lifetime of Atlas.

Software architecture evolves through intentional decisions rather than implementation convenience.

Engineering Decision Records (EDRs) provide a permanent, traceable record of the reasoning behind those decisions.

Rather than documenting *what* Atlas is, this document explains *why* Atlas has been designed in its current form.

Every significant engineering decision should be understandable long after the original implementation has evolved.

---

# Scope

This document governs the recording and lifecycle of significant engineering decisions affecting the Atlas platform.

Examples include:

- Architectural decisions
- Engineering standards
- Security decisions
- Database evolution
- API evolution
- Infrastructure strategy
- Product engineering decisions

The following topics are intentionally documented elsewhere.

| Topic | Document |
|--------|----------|
| Product Vision | 01 – Vision |
| Product Requirements | 02 – Product Requirements |
| System Architecture | 03 – System Architecture |
| Database Architecture | 04.1 – Database Architecture |
| API Architecture | 05 – API Architecture |
| Roadmap | 06 – Roadmap |
| Engineering Standards | 10 – Coding Standards |
| Security & Trust Architecture | 11 – Security & Trust Architecture |

This document defines **why engineering decisions are made**, not **how systems are implemented**.

---

# Decision Philosophy

Engineering decisions represent long-term commitments.

Every significant decision should be:

- Intentional
- Traceable
- Reviewable
- Understandable
- Maintainable

Implementation may evolve over time.

The reasoning behind significant decisions should remain preserved.

Atlas therefore treats Engineering Decision Records as first-class engineering artifacts.

---

## Why Engineering Decision Records?

Software inevitably changes.

Without documented reasoning, future engineers risk repeating discussions, reintroducing rejected approaches, or making inconsistent architectural changes.

Engineering Decision Records preserve organizational knowledge by recording:

- The problem being solved
- The context surrounding the decision
- The chosen solution
- Alternatives considered
- Expected consequences

The objective is not merely to record outcomes, but to preserve engineering reasoning.

---

## Engineering Objectives

Engineering Decision Records aim to:

- Preserve architectural knowledge.
- Improve engineering consistency.
- Support future decision-making.
- Reduce repeated architectural discussions.
- Improve onboarding.
- Strengthen documentation governance.

EDRs are considered part of the long-term engineering knowledge base of Atlas.

---

# Engineering Decision Principles

The following principles govern every Engineering Decision Record.

---

## EDR-001 — Decisions Before Implementation

Significant architectural decisions MUST be documented before implementation begins.

Implementation MUST NOT become the source of architectural truth.

---

## EDR-002 — Single Source of Reasoning

Every significant decision SHOULD exist in exactly one Engineering Decision Record.

Duplicate decision records SHOULD be avoided.

---

## EDR-003 — Traceability

Every Engineering Decision Record SHOULD reference the architectural documents affected by the decision.

Likewise, architectural documents SHOULD reference relevant Engineering Decision Records where appropriate.

---

## EDR-004 — Long-Term Perspective

Engineering decisions SHOULD prioritize long-term maintainability over short-term implementation convenience.

---

## EDR-005 — Controlled Evolution

Engineering decisions MAY evolve.

Superseded decisions MUST remain preserved rather than deleted.

Historical reasoning remains valuable.

---

# Design Summary

Engineering Decision Records provide the institutional memory of Atlas.

They preserve the reasoning behind architectural evolution, ensuring that future engineers understand not only what decisions were made, but why those decisions were considered appropriate at the time.

Together with the Vision, Architecture, Engineering Standards, and Security Architecture, Engineering Decision Records complete the governance model of the Atlas platform.

---

# 5. Engineering Decision Lifecycle

## Purpose

Engineering decisions evolve through a controlled lifecycle to ensure that architectural changes are deliberate, reviewed, documented, and traceable.

The lifecycle establishes a consistent governance process for introducing, approving, superseding, and retiring significant engineering decisions.

---

## Lifecycle States

Every Engineering Decision Record progresses through the following lifecycle.

```text
Proposed

↓

Under Review

↓

Accepted

↓

Implemented

↓

Superseded (Optional)

↓

Archived (Optional)
```

---

### Proposed

A decision has been identified but has not yet undergone formal technical review.

The proposal should clearly describe:

- The problem
- The proposed decision
- Initial reasoning

---

### Under Review

The proposal is undergoing architectural and engineering review.

Alternatives should be discussed and documented before acceptance.

Implementation SHOULD NOT begin while an EDR remains under review unless explicitly approved.

---

### Accepted

The proposed decision has been approved.

Accepted decisions become the authoritative engineering reference for the subject they govern.

Related documentation SHOULD be updated before implementation proceeds.

---

### Implemented

The approved decision has been fully implemented.

The EDR remains active as the historical record explaining why the implementation exists.

---

### Superseded

An accepted decision may later be replaced by a newer Engineering Decision Record.

Superseded decisions MUST remain preserved for historical reference.

The replacement EDR SHOULD explicitly reference the superseded record.

---

### Archived

Decisions no longer relevant to the active platform MAY be archived.

Archived decisions remain part of the engineering history of Atlas and SHOULD NOT be deleted.

---

## Design Summary

The Engineering Decision Lifecycle ensures that Atlas evolves through deliberate governance rather than ad hoc implementation.

---

# 6. Decision Governance

Accepted Engineering Decision Records MUST NOT be modified in a way that changes their original intent. New decisions SHOULD supersede existing records rather than rewriting history.

## Purpose

Decision Governance defines who is responsible for engineering decisions and how those decisions become part of the Atlas engineering knowledge base.

Governance ensures that architectural evolution remains intentional, consistent, and traceable.

---

## Governance Principles

Engineering decisions MUST be:

- Documented
- Reviewed
- Approved
- Traceable
- Version controlled

Engineering decisions MUST NOT be introduced solely through implementation.

---

## Decision Authority

Significant engineering decisions SHOULD be reviewed before acceptance.

Review should consider:

- Product alignment
- Architectural consistency
- Engineering standards
- Security implications
- Operational impact
- Long-term maintainability

Implementation convenience alone MUST NOT justify significant engineering decisions.

---

## Documentation Requirements

Accepted Engineering Decision Records SHOULD reference affected documents where applicable.

Examples include:

- System Architecture
- Database Architecture
- API Architecture
- Engineering Standards
- Security Architecture
- Roadmap

Related documents SHOULD also reference applicable Engineering Decision Records where appropriate.

---

## Version Control

Engineering Decision Records MUST remain under version control alongside the source code.

Decision history SHOULD remain transparent.

Historical modifications SHOULD remain discoverable through repository history.

---

## Design Summary

Decision Governance ensures that Atlas evolves through documented engineering reasoning rather than undocumented implementation changes.

---

# 7. Decision Categories

## Purpose

Engineering decisions vary in scope and impact.

Categorizing decisions improves discoverability, review consistency, and long-term maintainability.

---

## Architecture Decisions

Define system-wide architectural direction.

Examples include:

- Architectural style
- Layering
- Module boundaries
- Communication strategy

---

## Engineering Decisions

Define engineering practices.

Examples include:

- Coding standards
- Repository patterns
- Testing strategy
- Documentation governance

---

## Security Decisions

Define security architecture and operational security practices.

Examples include:

- Authentication model
- Authorization strategy
- Tenant isolation
- Secret management

---

## Database Decisions

Define persistence strategy.

Examples include:

- Schema evolution
- Migration strategy
- Transaction model
- Data retention

---

## API Decisions

Define communication contracts.

Examples include:

- Versioning strategy
- Error model
- Asynchronous workflows
- Pagination strategy

---

## Infrastructure Decisions

Define operational and deployment architecture.

Examples include:

- Background processing
- Caching
- Containerization
- Monitoring
- Disaster recovery

---

## Product Engineering Decisions

Define engineering choices that directly influence product capabilities.

Examples include:

- Understanding pipeline
- Infrastructure modules
- AI integration
- Historical comparison

---

## Design Summary

Categorizing Engineering Decision Records improves discoverability while ensuring that decisions receive appropriate review based on their impact.

---
# 8. Engineering Decision Record Template

## Purpose

Every Engineering Decision Record (EDR) follows a standardized structure.

A consistent format improves readability, simplifies future reviews, and ensures that engineering reasoning is preserved regardless of who authors the decision.

Every accepted Engineering Decision Record SHOULD follow this template.

---

## Standard Template

### EDR Identifier

Every Engineering Decision Record MUST have a unique identifier.

Example:

```
EDR-001
```

Identifiers MUST remain permanent and MUST NOT be reused.

---

### Title

Every decision MUST have a concise, descriptive title.

Example:

```
Adopt Modular Monolith Architecture
```

Titles SHOULD describe the decision rather than the implementation.

---

### Status

Every Engineering Decision Record MUST specify its current lifecycle state.

Possible values include:

- Proposed
- Under Review
- Accepted
- Implemented
- Superseded
- Archived

---

### Date

Every Engineering Decision Record MUST record the acceptance date.

---

### Owners

The responsible engineering owner(s) SHOULD be identified.

Ownership improves accountability and future clarification.

---

### Context

The Context section describes the engineering problem requiring a decision.

This section SHOULD explain:

- Existing situation
- Constraints
- Business requirements
- Engineering concerns

The objective is to help future engineers understand why the decision became necessary.

---

### Decision

The Decision section records the chosen solution.

The decision SHOULD be stated clearly and unambiguously.

This section represents the authoritative outcome of the Engineering Decision Record.

---

### Alternatives Considered

Significant alternatives SHOULD be documented.

Examples include:

- Alternative architectures
- Alternative technologies
- Alternative implementation approaches

Recording alternatives preserves valuable engineering reasoning.

---

### Consequences

Every Engineering Decision Record SHOULD describe expected consequences.

Examples include:

Positive

- Simpler architecture
- Better maintainability
- Improved scalability

Negative

- Migration effort
- Increased implementation complexity
- Operational trade-offs

Engineering decisions inevitably involve trade-offs.

Those trade-offs should remain documented.

---

### Related Documents

Engineering Decision Records SHOULD reference affected documentation.

Examples include:

- 03 – System Architecture
- 04.1 – Database Architecture
- 05 – API Architecture
- 10 – Engineering Standards
- 11 – Security & Trust Architecture

---

### Related Decisions

Engineering Decision Records SHOULD reference earlier decisions where appropriate.

Example:

```
Supersedes:

EDR-004

Related:

EDR-009
```

This creates a traceable engineering history.

---

## Design Summary

A consistent Engineering Decision Record template improves maintainability, discoverability, and long-term architectural governance.

---

# 9. Initial Engineering Decision Index

## Purpose

The Engineering Decision Index provides a centralized view of the significant engineering decisions that shape Atlas.

Each Engineering Decision Record documents the reasoning behind an architectural choice and serves as the authoritative reference for future engineering work.

As Atlas evolves, new Engineering Decision Records will be added while preserving the historical context of earlier decisions.

---

## Foundational Decisions

| ID | Title | Status |
|----|-------|--------|
| EDR-001 | Adopt Documentation-First Development | Accepted |
| EDR-002 | Adopt Product-First Engineering | Accepted |
| EDR-003 | Adopt Infrastructure Intelligence Platform | Accepted |
| EDR-004 | Adopt Modular Monolith Architecture | Accepted |
| EDR-005 | Adopt Clean Architecture | Accepted |
| EDR-006 | Adopt Repository Pattern | Accepted |
| EDR-007 | Adopt Multi-Tenant SaaS Architecture | Accepted |
| EDR-008 | Adopt Security by Default | Accepted |
| EDR-009 | Adopt PostgreSQL + Prisma | Accepted |
| EDR-010 | Adopt Versioned REST API | Accepted |

---

## Sprint 2 Engineering Decisions

| ID | Title | Status |
|----|-------|--------|
| EDR-011 | Adopt Asynchronous Understanding Jobs | Implemented |
| EDR-012 | Adopt Background Worker Processing | Implemented |
| EDR-013 | Adopt Discovery Registry Architecture | Implemented |
| EDR-014 | Adopt Modular Discovery Framework | Implemented |
| EDR-015 | Adopt Immutable Infrastructure Snapshots | Implemented |
| EDR-016 | Adopt Canonical JSON Snapshot Persistence | Implemented |
| EDR-017 | Adopt Infrastructure Snapshot as Source of Truth | Implemented |
| EDR-018 | Adopt Infrastructure Intelligence Pipeline | Accepted |


## Decision Status Definitions

Engineering Decision Records use the following lifecycle states:

| Status | Meaning |
|---------|---------|
| **Proposed** | Decision identified but not yet reviewed. |
| **Under Review** | Architectural review in progress. |
| **Accepted** | Approved and adopted as the engineering direction. |
| **Implemented** | Fully implemented in the production codebase. |
| **Superseded** | Replaced by a newer Engineering Decision Record. |
| **Archived** | Preserved for historical reference but no longer active. |

The status of an Engineering Decision Record reflects its engineering maturity rather than the maturity of the surrounding feature.

## Sprint 3.5.1 Engineering Decisions
## Sprint 3.5.1 Engineering Decisions

| ID | Title | Status |
|----|-------|--------|
| EDR-019 | Adopt Deterministic Rule Engine Execution | Implemented |
| EDR-020 | Adopt Structured Application Logging | Implemented |
| EDR-021 | Adopt Type-Safe Backend Engineering Standards | Implemented |
| EDR-022 | Adopt Sensitive Data Logging Restrictions | Implemented |
| EDR-023 | Adopt Lineage-Preserving Guest Understanding Claim Bridge | Implemented |
| EDR-024 | Adopt Immediate Authenticated Session Establishment upon Email Verification | Implemented |

---

## Planned Decision Areas

Future Engineering Decision Records are expected for topics including:

- Infrastructure Findings architecture
- Change History generation
- Infrastructure Brief generation
- Historical comparison engine
- Recommendation engine
- AI-assisted Infrastructure Intelligence
- Workspace architecture
- Event-driven processing
- Caching strategy
- Plugin ecosystem
- Organization and team management
- Deployment architecture
- Observability and monitoring strategy

These decisions will be documented as they progress through the Engineering Decision lifecycle.

---

## Decision Numbering

Engineering Decision Records use sequential identifiers.

Identifiers:

- MUST remain permanent.
- MUST NOT be reused.
- SHOULD preserve historical continuity even when decisions are superseded.

Example:

```text
EDR-018
      ↓
EDR-019
      ↓
EDR-020
```

Maintaining stable identifiers improves traceability across architecture documents, implementation, pull requests, and release history.

---

## Design Summary

The Engineering Decision Index provides a concise overview of Atlas' architectural evolution while preserving the reasoning behind every significant engineering choice.

As Atlas grows, this index will continue to expand, documenting the decisions that shape the platform and providing a permanent engineering knowledge base.

---
---
---
# 10. Engineering Decision Governance

## Purpose

Engineering Decision Governance ensures that Atlas evolves through deliberate, transparent, and well-documented engineering decisions.

Governance protects the architectural integrity of the platform by ensuring that significant changes are reviewed before implementation and permanently recorded for future reference.

Engineering decisions are considered long-term engineering assets.

---

## Governance Principles

Engineering Decision Records MUST:

- Be reviewed before acceptance.
- Be version controlled.
- Be traceable.
- Be preserved permanently.
- Remain understandable without implementation context.

Engineering knowledge is considered part of the product itself.

---

## Decision Review Process

Every significant engineering decision SHOULD follow the standard governance workflow.

```text
Problem Identified

↓

Engineering Discussion

↓

Architecture Review

↓

Engineering Decision Record

↓

Documentation Update

↓

Implementation

↓

Verification

↓

Release
```

Implementation SHOULD follow accepted Engineering Decision Records.

Engineering decisions SHOULD NOT be created retrospectively except when documenting historical architectural choices.

---

## Decision Ownership

Every Engineering Decision Record SHOULD identify one or more responsible owners.

Owners are responsible for:

- Maintaining decision accuracy
- Reviewing future modifications
- Approving superseding decisions
- Ensuring related documentation remains consistent

Ownership improves long-term accountability without restricting collaborative engineering.

---

## Superseding Decisions

Engineering knowledge evolves.

When a decision is replaced:

- The original Engineering Decision Record MUST remain preserved.
- The new Engineering Decision Record MUST reference the superseded decision.
- Historical reasoning MUST remain accessible.

Engineering history MUST never be rewritten.

Evolution should remain transparent.

---

## Cross-Document Consistency

Accepted Engineering Decision Records SHOULD trigger review of related documentation.

Affected documents MAY include:

- Vision
- Product Requirements
- System Architecture
- Database Architecture
- API Architecture
- Security Architecture
- Engineering Standards
- Roadmap

Documentation should remain synchronized with accepted engineering decisions.

---

## Design Summary

Engineering Decision Governance ensures that Atlas evolves predictably while preserving institutional knowledge and architectural consistency.

---

## EDR-023 — Adopt Lineage-Preserving Guest Understanding Claim Bridge

### Context
Guests explore domain intelligence anonymously on Nebula. Upon deciding to preserve this understanding ("Create Workspace"), the system must securely transfer the guest session's immutable understanding lineage (`Domain`, `UnderstandingJob`, `InfrastructureSnapshot`, `InfrastructureFinding`, `InfrastructureBrief`, `RawEvidence`, `InfrastructureVerification`) to the newly registered or authenticated `User.id` without duplicating records or corrupting the multi-tenant ownership model.

### Decision
1. Implement canonical `POST /api/v1/guest/claim` endpoint requiring authenticated JWT context.
2. Transfer domain associations inside an atomic PostgreSQL transaction.
3. Enforce strict security guards:
   - **Replay & Cross-Account Defense**: Once marked `CONVERTED`, a guest session cannot be claimed by another user (`403 Forbidden`).
   - **Idempotency**: Repeated claim calls by the owning user return `200 OK` with existing domain pointers.
   - **Expiry Enforcement**: Expired sessions reject claims (`400 Bad Request`).
   - **Lineage Integrity**: Snapshots, raw evidence hashes, and finding timestamps remain strictly immutable.
4. Bridge frontend guest state via URL query params and resilient browser enclave storage (`sessionStorage.nebula_guest_claim`).

### Status
Implemented

---

## EDR-024 — Adopt Immediate Authenticated Session Establishment upon Email Verification

### Context
When a user signs up, the account is created in `PENDING_VERIFICATION` status. Upon clicking the cryptographic activation link in their email, requiring the user to re-enter their credentials on a separate login page introduced unnecessary friction and broke the continuous transition from Guest Understanding → Register → Workspace.

### Decision
1. Extend `POST /api/v1/auth/verify-email` so that valid token verification:
   - Validates single-use token and marks it consumed.
   - Transitions account status from `PENDING_VERIFICATION` to `ACTIVE`.
   - Immediately creates a stateful session in `UserSessionService`.
   - Signs and returns the access JWT while attaching secure HTTP-Only cookies (`nebula_access_token`, `nebula_refresh_token`).
2. Update `VerifyEmailPage.tsx` to automatically hydrate the `useAuth()` application context and execute any pending `checkAndClaimGuestSession()` operation before smoothly routing the authenticated user to `/dashboard` / FMX.
3. Preserve all security boundaries: single-use token consumption, zero token exposure to React/client storage, HTTP-Only cookies, and strict verification-before-session guarantees.

### Status
Implemented

---

# 11. Decision Summary

Engineering Decision Records preserve the reasoning behind the evolution of Atlas.

Unlike implementation artifacts, Engineering Decision Records explain **why** architectural and engineering choices were made.

Together with the Vision, Product Requirements, System Architecture, Engineering Standards, Security Architecture, and API Architecture, this document completes the governance framework of the platform.

As Atlas evolves, new Engineering Decision Records will document significant architectural, engineering, security, infrastructure, and product decisions while preserving the historical context that led to each outcome.

Engineering excellence is achieved not only through good implementation, but through deliberate, well-reasoned, and well-documented decisions.

---

# Document Status

| Property | Value |
|----------|-------|
| **Document** | 07 – Engineering Decisions |
| **Version** | **2.1** |
| **Status** | **Approved (Frozen)** |
| **Classification** | Engineering Decision Record (EDR) Specification |
| **Owner** | Atlas Architecture Team |
| **Last Updated** | July 2026 |
| **Review Trigger** | Acceptance of new Engineering Decisions |
| **Review Process** | Architecture Review Required |

---

---