# 05 – API Architecture

**Document Version:** 2.0

**Status:** Under Review

**Document Type:** API Architecture Specification

**Owner:** Atlas Architecture Team

**Last Updated:** July 2026

**Review Trigger:** Major API or Architectural Change

---

# Purpose

This document defines the architectural principles, communication standards, and governance model for all Application Programming Interfaces (APIs) exposed by Atlas.

Rather than documenting individual endpoints, this document establishes the design philosophy and implementation standards that ensure every Atlas API remains secure, consistent, predictable, and maintainable throughout the evolution of the platform.

API specifications generated through OpenAPI (Swagger) are considered implementation artifacts.

This document defines the architectural rules those specifications must follow.

---

# Scope

This document applies to every externally exposed API within Atlas, including:

- Public REST APIs
- Administrative APIs
- Internal service APIs
- Future webhook interfaces
- Future event-driven interfaces

The following topics are documented separately.

| Topic | Document |
|--------|----------|
| Product Vision | 01 – Vision |
| Product Requirements | 02 – Product Requirements |
| System Architecture | 03 – System Architecture |
| Database Architecture | 04.1 – Database Architecture |
| Engineering Decisions | 07 – Decisions |
| Engineering Standards | 10 – Coding Standards |
| Security & Trust Architecture | 11 – Security & Trust Architecture |

This document defines **how Atlas communicates**, not **what business features are available**.

---

# API Philosophy

The Atlas API is designed as a stable communication contract between the platform and its consumers.

Consumers should be able to rely on API behavior without needing knowledge of the platform's internal implementation.

The API represents the public surface of Atlas.

Internal implementation may evolve freely provided that the public contract remains stable or follows the documented versioning strategy.

API design should prioritize:

- Consistency
- Predictability
- Simplicity
- Security
- Backward compatibility
- Long-term maintainability

The API should express business capabilities rather than implementation details.

---

## API Objectives

Atlas APIs are designed to be:

- Consistent
- Discoverable
- Secure
- Versioned
- Observable
- Idempotent where appropriate
- Self-documenting
- Backward compatible whenever practical

Every API exposed by Atlas should reinforce these objectives.

---

# API Design Principles

The following principles govern all Atlas APIs.

---

## API-001 — Resource-Oriented Design

APIs SHOULD represent business resources rather than technical operations.

Preferred:

```
/domains
```

Avoid:

```
/getDomainData
```

Resource-oriented APIs improve consistency and discoverability.

---

## API-002 — Consistency

Similar operations MUST behave consistently throughout the platform.

Naming conventions, response structures, error handling, pagination, filtering, and authentication SHOULD follow common patterns.

Consistency is considered a usability feature.

---

## API-003 — Stable Contracts

Published API contracts SHOULD remain stable.

Breaking changes MUST undergo architectural review and follow the documented versioning strategy.

Clients should not be forced to change unnecessarily.

---

## API-004 — Explicit Communication

APIs MUST communicate intent clearly.

Requests SHOULD be unambiguous.

Responses SHOULD provide sufficient information for clients to understand the outcome of an operation.

Hidden behavior SHOULD be avoided.

---

## API-005 — Security by Default

Every protected endpoint MUST enforce authentication and authorization according to the Security & Trust Architecture.

Security requirements MUST remain consistent across all APIs.

Public endpoints SHOULD be explicitly documented.

---

## API-006 — Technology Independence

The API contract MUST remain independent of internal implementation technologies.

Consumers should never depend upon:

- Database schema
- Internal module structure
- Framework-specific behavior
- Infrastructure implementation

Implementation details remain private.

---

## API-007 — Backward Compatibility

Whenever practical, API evolution SHOULD preserve compatibility with existing clients.

Breaking changes MUST be deliberate, documented, and versioned.

---

## API-008 — Documentation First

Public APIs MUST be documented before release.

Documentation forms part of the Definition of Done.

API documentation SHOULD remain synchronized with implementation throughout the product lifecycle.

---

# API Governance

The Atlas API is governed using the same engineering discipline applied throughout the platform.

Major API changes SHOULD follow the standard engineering workflow.

```text
API Proposal

↓

Architecture Discussion

↓

Engineering Decision Record (EDR)

↓

API Documentation

↓

Implementation

↓

Testing

↓

Review

↓

Release
```

API implementation SHOULD follow approved documentation.

Documentation MUST remain the authoritative source of API behavior.

---

## Design Summary

The Atlas API Architecture establishes the communication principles that govern every external interaction with the platform.

Rather than documenting individual endpoints, this specification defines the architectural standards that ensure Atlas APIs remain secure, consistent, stable, and maintainable throughout the evolution of the platform.

These principles provide the foundation upon which detailed API specifications and implementation artifacts are built.

---

# 5. API Versioning Strategy

## Purpose

API versioning enables Atlas to evolve without unnecessarily disrupting existing clients.

Versioning provides a structured mechanism for introducing improvements while preserving backward compatibility wherever practical.

Versioning is considered an architectural responsibility rather than an implementation detail.

---

## Versioning Principles

Atlas APIs MUST follow a documented versioning strategy.

API versions MUST:

- Be explicit.
- Be predictable.
- Be documented.
- Remain stable throughout their supported lifecycle.

Breaking changes MUST be introduced through a new API version.

---

## Versioning Model

Atlas adopts URI-based versioning.

Example:

```
/api/v1/domains
```

Future versions will follow the same structure.

```
/api/v2/domains
```

Only one major API version should be actively developed unless product requirements dictate otherwise.

---

## Backward Compatibility

Whenever practical, changes SHOULD preserve compatibility with existing clients.

Examples of non-breaking changes include:

- Adding optional fields
- Introducing new endpoints
- Expanding response metadata

Examples of breaking changes include:

- Removing fields
- Renaming resources
- Changing response structures
- Changing endpoint semantics

Breaking changes MUST undergo architectural review.

---

## API Lifecycle

Each API version progresses through the following lifecycle.

```text
Preview

↓

Stable

↓

Deprecated

↓

Retired
```

Deprecated versions SHOULD provide adequate migration guidance before retirement.

---

## Design Summary

Versioning enables Atlas to evolve predictably while protecting client integrations.

---

# 6. Resource Design

## Purpose

Atlas APIs expose business resources rather than implementation details.

Resources represent stable business concepts independent of internal architecture.

---

## Resource Principles

Resources SHOULD:

- Represent business entities.
- Use plural nouns.
- Remain stable.
- Avoid implementation terminology.

Examples:

```
/domains
/users
/workspaces
/jobs
```

Avoid:

```
/domainManager
/getInfrastructureData
/runAnalyzer
```

---

## Resource Hierarchy

Hierarchical relationships SHOULD be expressed naturally.

Example:

```
/domains/{domainId}/snapshots
```

Nested resources SHOULD represent ownership rather than arbitrary hierarchy.

---

## Resource Identity

Every resource SHOULD expose a stable identifier.

Identifiers MUST remain immutable.

Internal persistence identifiers SHOULD NOT dictate public API design.

---

## Design Summary

Resource-oriented design improves API discoverability and long-term maintainability.

---

# 7. Request Standards

## Purpose

Consistent request structures improve predictability and simplify client integration.

Every request should communicate intent clearly while remaining independent of internal implementation.

---

## Request Principles

Requests MUST:

- Use appropriate HTTP methods.
- Validate all external input.
- Follow documented schemas.
- Remain deterministic.

Unexpected request behavior SHOULD be avoided.

---

## HTTP Methods

Atlas follows standard HTTP semantics.

| Method | Purpose |
|---------|---------|
| GET | Retrieve resources |
| POST | Create resources or initiate operations |
| PUT | Replace resources |
| PATCH | Partially update resources |
| DELETE | Remove resources |

HTTP semantics MUST remain consistent across the platform.

---

## Request Validation

Every request MUST undergo validation before business logic executes.

Validation includes:

- Required fields
- Data types
- Format constraints
- Business-independent validation

Business validation remains the responsibility of application services.

---

## Idempotency

Operations that modify state SHOULD be designed with idempotency where practical.

Idempotent behavior improves reliability during retries and network failures.

Long-running operations SHOULD expose idempotent submission semantics whenever feasible.

---

## Design Summary

Consistent request handling improves reliability, security, and developer experience.

---

# 8. Response Standards

## Purpose

Responses provide the public representation of Atlas business operations.

Every response should remain predictable, self-explanatory, and independent of internal implementation.

---

## Response Principles

Responses MUST:

- Be consistent.
- Be documented.
- Avoid exposing implementation details.
- Return appropriate HTTP status codes.

Response formats SHOULD remain stable across API versions.

---

## Success Responses

Successful responses SHOULD provide:

- Requested data
- Relevant metadata
- Links or identifiers where appropriate

Example response structure:

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

---

## Empty Responses

Operations that do not return business data SHOULD return appropriate HTTP status codes without unnecessary payloads.

---

## Metadata

Metadata MAY include:

- Pagination information
- Processing timestamps
- Correlation identifiers
- API version
- Request identifiers

Metadata SHOULD remain optional unless explicitly required.

---

## Design Summary

Consistent responses simplify client development while preserving flexibility for future platform evolution.

---

# 9. Error Model

## Purpose

Errors should communicate failures consistently without exposing internal implementation details.

A standardized error model improves developer experience while supporting operational observability.

---

## Error Principles

Errors MUST:

- Be predictable.
- Be documented.
- Be actionable where appropriate.
- Protect sensitive information.

Errors MUST NOT expose:

- Stack traces
- Database details
- Internal implementation
- Security-sensitive information

---

## Standard Error Structure

Error responses SHOULD follow a consistent structure.

Example:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Requested resource could not be found.",
    "correlationId": "..."
  }
}
```

Future versions MAY adopt standardized error specifications where appropriate.

---

## HTTP Status Codes

HTTP status codes SHOULD accurately represent request outcomes.

Examples include:

- 200 OK
- 201 Created
- 202 Accepted
- 204 No Content
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 500 Internal Server Error

Status codes MUST remain semantically correct.

---

## Correlation

Every error response SHOULD include a correlation identifier.

Correlation identifiers improve operational diagnostics and incident investigation.

---

## Design Summary

A standardized error model improves consistency, security, and operational visibility across the Atlas platform.

---

# 10. Authentication & Authorization

## Purpose

Authentication and authorization protect Atlas APIs by ensuring that only authenticated and authorized principals may perform protected operations.

Authentication establishes identity.

Authorization verifies permission.

Both are mandatory security requirements for protected resources.

Detailed security architecture is defined in **11 – Security & Trust Architecture**.

---

## Authentication

Protected endpoints MUST require authenticated identities.

Authentication MUST occur before request processing begins.

Unauthenticated requests MUST be rejected before reaching business logic.

Public endpoints MUST be explicitly documented.

---

## Authorization

Authorization MUST verify ownership before business operations execute.

Authorization decisions MUST be based upon the authenticated security context rather than client-supplied identifiers.

Business services remain responsible for enforcing authorization rules appropriate to their business capability.

---

## Security Context

Business modules MUST consume the authenticated security context established by the Authentication Layer.

Business modules MUST NOT reconstruct user identity from request payloads, query parameters, headers, or other client-provided information.

Identity is established once and propagated throughout request processing.

---

## Design Summary

Authentication establishes trusted identity.

Authorization protects business resources.

Together they form the security foundation of every protected Atlas API.

---

# 11. Pagination, Filtering & Sorting

## Purpose

Atlas APIs should remain efficient and predictable regardless of dataset size.

Collection endpoints should provide standardized mechanisms for limiting, filtering, and ordering results.

---

## Pagination

Large collections SHOULD support pagination.

Pagination responses SHOULD provide sufficient metadata to enable client navigation.

Example metadata:

- Current page
- Page size
- Total records
- Total pages

Pagination strategy SHOULD remain consistent across the platform.

---

## Filtering

Collection resources MAY support filtering using documented query parameters.

Filtering SHOULD represent business concepts rather than database implementation.

Example:

```
GET /domains?status=active
```

Filtering behavior MUST be deterministic and documented.

---

## Sorting

Collections MAY support sorting.

Sorting SHOULD remain explicit.

Example:

```
GET /domains?sort=name
```

Default ordering SHOULD remain stable and documented.

---

## Search

Future API versions MAY expose dedicated search capabilities where business requirements justify additional complexity.

Search behavior SHOULD remain independent of underlying persistence technologies.

---

## Design Summary

Standardized pagination, filtering, and sorting improve scalability while maintaining a predictable developer experience.

---

# 12. Long-Running Operations

## Purpose

Certain Atlas operations require significant processing time and therefore cannot be completed within a standard synchronous request-response lifecycle.

Examples include infrastructure understanding, large-scale analysis, and future AI-assisted workflows.

These operations follow an asynchronous execution model.

---

## Architectural Principle

Long-running operations MUST NOT block client requests unnecessarily.

Instead, clients receive acknowledgement that processing has begun while work continues independently.

This approach improves scalability, reliability, and user experience.

---

## Standard Execution Model

Long-running operations follow the standard lifecycle.

```text
Client Request

↓

Validation

↓

Authentication

↓

Authorization

↓

Job Creation

↓

202 Accepted

↓

Background Processing

↓

Completion

↓

Result Available
```

The initial request acknowledges receipt rather than waiting for processing to complete.

---

## Job Resources

Long-running operations SHOULD expose a job resource representing processing state.

Typical lifecycle:

```text
Queued

↓

Running

↓

Completed
```

Possible terminal states include:

- Completed
- Failed
- Cancelled

Job state transitions SHOULD remain observable.

---

## Idempotent Submission

Clients SHOULD be able to safely retry long-running requests where practical.

Duplicate submissions SHOULD NOT produce unintended duplicate processing.

Idempotency strategies remain implementation-specific.

---

## Partial Failure

Background processing SHOULD tolerate partial failures whenever practical.

Failure of an individual processing component SHOULD NOT invalidate the entire operation unless required by business rules.

Partial completion is preferable to complete failure where meaningful results remain available.

---

## Result Retrieval

Completed operations SHOULD expose results through standard resource endpoints.

Example workflow:

```
POST /domains/{id}/understand

↓

202 Accepted

↓

GET /jobs/{jobId}

↓

Completed

↓

GET /domains/{id}/brief
```

Clients interact with business resources rather than internal processing mechanisms.

---

## Design Summary

Asynchronous execution enables Atlas to perform complex infrastructure intelligence while maintaining responsive APIs and supporting future distributed processing architectures.

---

# 13. API Documentation

## Purpose

API documentation forms part of the public contract between Atlas and its consumers.

Documentation is considered an engineering artifact rather than supplementary material.

---

## Documentation Principles

Public APIs MUST be documented before release.

Documentation MUST remain synchronized with implementation.

Undocumented public endpoints SHOULD NOT be considered production-ready.

---

## OpenAPI Specification

Atlas adopts the OpenAPI Specification as the canonical machine-readable API description.

Generated OpenAPI documentation SHOULD accurately reflect the implemented API contract.

Manual modifications to generated specifications SHOULD be avoided.

---

## Interactive Documentation

Interactive API documentation SHOULD be available during development and administrative environments.

Production exposure SHOULD follow organizational security policies.

---

## Documentation Quality

API documentation SHOULD include:

- Endpoint purpose
- Authentication requirements
- Request schema
- Response schema
- Error responses
- Example requests
- Example responses

Documentation should enable consumers to integrate successfully without relying on implementation knowledge.

---

## Design Summary

Comprehensive API documentation improves developer experience while ensuring that API contracts remain transparent, discoverable, and maintainable.

---

# 14. API Governance

## Purpose

API Governance defines how Atlas APIs evolve while preserving consistency, stability, and long-term maintainability.

Every API exposed by Atlas is considered part of the product contract.

Changes to public APIs must therefore follow the same engineering discipline applied to architecture, security, and implementation.

---

## Governance Principles

Atlas APIs MUST be:

- Intentional
- Consistent
- Versioned
- Reviewed
- Documented
- Testable

API evolution MUST occur through approved engineering decisions rather than implementation convenience.

---

## API Review Process

Significant API changes SHOULD follow the standard engineering workflow.

```text
API Proposal

↓

Architecture Discussion

↓

API Review

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

API contracts SHOULD be approved before implementation begins.

---

## Review Triggers

Architectural API review SHOULD be performed when introducing:

- Breaking API changes
- New public resources
- Authentication changes
- Authorization changes
- Long-running workflows
- External integrations
- Webhooks
- Event-driven communication
- Public SDK support

These changes affect the public contract of Atlas.

---

## API Compatibility

Public APIs SHOULD evolve conservatively.

Breaking changes MUST:

- Be versioned.
- Be documented.
- Include migration guidance.
- Be announced before retirement where practical.

Stable APIs are considered product commitments.

---

## Design Summary

API governance ensures that Atlas evolves predictably while maintaining trust with API consumers.

---

# 15. Future API Evolution

Atlas is intentionally designed to support future communication capabilities without requiring fundamental redesign.

Potential future enhancements include:

- Webhooks
- Server-Sent Events (SSE)
- WebSocket APIs
- GraphQL Gateway
- Public SDKs
- Event-driven integrations
- Organization APIs
- Plugin APIs
- Public Developer Portal

Future capabilities SHOULD integrate into the existing API architecture while preserving the principles defined within this document.

New communication mechanisms MUST complement rather than replace the canonical REST API unless approved through an Engineering Decision Record.

---

# 16. API Summary

The Atlas API Architecture defines the communication principles that govern every interaction between the platform and its consumers.

Atlas APIs are designed around:

- Resource-oriented design
- Stable contracts
- Consistent request and response models
- Security by default
- Versioned evolution
- Asynchronous processing for long-running operations
- Comprehensive documentation
- Engineering governance

These principles ensure that Atlas APIs remain predictable, maintainable, and resilient as the platform evolves.

The API is more than an interface.

It is a long-term product contract between Atlas and its consumers.

Every future API should strengthen that contract through consistency, clarity, and disciplined engineering.

---

# Document Status

| Property | Value |
|----------|-------|
| **Document** | 05 – API Architecture |
| **Version** | 2.0 |
| **Status** | **Approved (Frozen)** |
| **Classification** | API Architecture Specification |
| **Owner** | Atlas Architecture Team |
| **Last Updated** | July 2026 |
| **Next Review Trigger** | Major API or Architectural Change |
| **Review Process** | Engineering Decision Record (EDR) Required |

---