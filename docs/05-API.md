# 05 – API Architecture

**Product:** Atlas

**Version:** v1.0.0-backend

**Status:** Sprint 4.6C Backend Production Certified & Frozen

**Document Type:** API Architecture

**Owner:** Atlas Architecture Team

**Last Updated:** July 25, 2026

**Review Trigger:** API Contract Changes

---

# Purpose

This document defines the architectural principles, conventions, contracts, and interaction patterns of the Atlas API.

The Atlas API serves as the primary interface between clients and the Infrastructure Intelligence Platform. It is responsible for authentication, domain management, asynchronous infrastructure understanding, historical persistence, and future intelligence capabilities.

This document describes the architecture of the API rather than individual endpoint implementations.

---

# API Philosophy

Atlas exposes a resource-oriented REST API designed for long-term stability, predictability, and production operation.

The API is designed around the following principles:

- RESTful resource design
- Stateless communication
- JWT authentication
- Versioned endpoints
- Consistent response contracts
- Asynchronous execution for long-running work
- Immutable historical records
- Multi-tenant isolation
- Forward-compatible evolution

The API is considered a stable product contract and evolves through versioning rather than breaking changes.

---

# Architectural Principles

## Resource-Oriented Design

Endpoints represent business resources rather than actions.

Examples:

```
/users
/domains
/understanding/jobs
/snapshots
/findings
```

rather than:

```
/createUser
/startScan
/runJob
```

---

## Versioning

All endpoints are versioned.

Current version:

```
/api/v1
```

Future versions will coexist without breaking existing integrations.

---

## Stateless Communication

Each request contains all information required for execution.

Server-side sessions are not maintained.

Authentication is provided using JWT access tokens.

---

## Asynchronous Processing

Infrastructure understanding may require several seconds depending on network conditions.

Instead of blocking HTTP requests, Atlas uses asynchronous job execution.

```
Client
    │
    ▼
POST Understanding
    │
    ▼
Job Created
    │
    ▼
202 Accepted
    │
    ▼
Background Worker
    │
    ▼
Understanding Engine
```

This architecture improves responsiveness while enabling scalable processing.

---

## Immutable Historical Records

Infrastructure observations are never modified.

Each Understanding execution produces a new immutable Infrastructure Snapshot.

Historical knowledge is preserved rather than overwritten.

---

# API Layers

The Atlas backend follows layered architecture.

```
HTTP Request
      │
      ▼
Controller
      │
      ▼
Application Service
      │
      ▼
Domain Service
      │
      ▼
Repository
      │
      ▼
Database
```

Responsibilities are clearly separated to preserve maintainability and testability.

---

# Authentication

Authentication is handled using JWT Bearer Tokens.

Workflow:

```
User
   │
   ▼
Login
   │
   ▼
JWT Issued
   │
   ▼
Client Stores Token
   │
   ▼
Authorization Header
   │
   ▼
Protected Endpoint
```

Passwords are never stored in plaintext.

Authentication middleware validates:

- JWT signature
- Token expiration
- User existence
- User ownership

---

# Multi-Tenant Security

Every protected resource belongs to a user.

Ownership validation occurs before any resource is accessed.

Example:

```
User A
    │
    ├── Domain A
    └── Domain B

User B
    │
    └── Domain C
```

Cross-tenant access is never permitted.

Tenant isolation is enforced in the service layer and repository layer.

---

# Current API Modules

Sprint 2 implements the following API modules.

| Module | Status |
|---------|--------|
| Health | ✅ Implemented |
| Authentication | ✅ Implemented |
| Users | ✅ Implemented |
| Domains | ✅ Implemented |
| Understanding | ✅ Implemented |
| Background Worker | ✅ Internal |
| Discovery Framework | ✅ Internal |
| Snapshots | 🚧 Persistence Implemented |
| Findings | ⏳ Planned |
| Briefs | ⏳ Planned |
| Comparison | ⏳ Planned |

---

# Health Module

Purpose:

Provide service health information.

Implemented Endpoint:

```
GET /api/v1/health
```

Response:

```json
{
  "status": "ok",
  "service": "atlas-api",
  "version": "0.2.0",
  "timestamp": "2026-07-16T11:12:56.325Z"
}
```

The endpoint is public and intended for monitoring, orchestration, and deployment verification.

---

# Authentication Module

Purpose:

Manage user identity and authentication.

Implemented Endpoints:

```
POST /api/v1/auth/register

POST /api/v1/auth/login

GET /api/v1/auth/me
```

### POST /api/v1/auth/register

**Description:**
Registers a new user account with full name, email, and password.

**Request Body (`RegisterDto`):**
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SuperSecurePassword123!"
}
```

**Success Response (`201 Created` - `RegisterResponseDto`):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "createdAt": "2026-07-25T19:46:15.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failure (invalid email, password < 8 characters, fullName < 2 characters, or missing fields).
- `409 Conflict`: Email is already registered.
- `429 Too Many Requests`: Rate limit exceeded (5 requests / hour).

*Note: Registration does not issue JWT access/refresh tokens or automatically log the user in. The user must authenticate via `POST /api/v1/auth/login` to obtain access tokens.*

Capabilities:

- User Registration
- User Login
- JWT Authentication
- Password Hashing
- Current User Retrieval
- Protected Routes

Authentication is the entry point for all protected Atlas functionality.

---

# API Improvement Register

The API Improvement Register records foundational upgrades, contract hardenings, and non-breaking enhancements to the Atlas API surface.

| Entry ID | Endpoint(s) | Modification Summary | Previous Contract | Hardened Contract | Rationale & Security Safeguards | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AIR-001** | `POST /api/v1/auth/register` | Structured success response payload | `201 Created` with empty body (`void`) | `201 Created` returning `RegisterResponseDto` (`message`, `user: { id, fullName, email, createdAt }`) | Confirms registration and returns non-sensitive user identity. Excludes `passwordHash` and prevents auto-login token leaks. | **Completed** |
| **AIR-002** | `/snapshots/:snapshotId/brief`<br>`/domains/:domainId/snapshots`<br>`/findings/snapshots/:snapshotId/findings` | Multi-tenant security guard hardening | Unprotected public routes | Enforced `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` across all Tier B controllers | Prevents unauthenticated access to internal infrastructure snapshots, briefs, and findings. | **Completed** |
| **AIR-003** | `POST /api/v1/domains`<br>`POST /api/v1/domains/:domainId/understand`<br>`POST /api/v1/snapshots/:snapshotId/brief` | RFC 7231 `Location` header emission | Missing `Location` header on resource creation | Emits standard `Location` response header (e.g., `Location: /api/v1/domains/:id`) | Complies with REST standards and improves API discoverability for client consumers. | **Completed** |
| **AIR-004** | `POST /api/v1/domains/:domainId/understand` | Asynchronous status code semantic alignment | `201 Created` on background job trigger | `@HttpCode(HttpStatus.ACCEPTED)` (`202 Accepted`) | Correctly signals that background discovery processing is queued asynchronously rather than completed synchronously. | **Completed** |
| **AIR-005** | `DomainsController`<br>`UnderstandingController`<br>`InfrastructureBriefController`<br>`SnapshotController` | OpenAPI / Swagger specification backfill | Undocumented API routes | Added `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiResponse` across all controllers | Provides 100% Swagger UI testability and accurate API documentation at `/api/docs`. | **Completed** |

---


# Domain Module

Purpose:

Manage infrastructure assets owned by authenticated users.

Implemented Endpoints:

```
POST /api/v1/domains

GET /api/v1/domains
```

Capabilities:

- Register Domain
- List User Domains
- Ownership Validation
- Duplicate Prevention
- Multi-tenant Isolation

Each domain acts as the root entity for Infrastructure Understanding.

---

# Understanding Module

## Purpose

Coordinate asynchronous infrastructure understanding requests.

Unlike traditional scanners that perform work during the HTTP request, Atlas separates request acceptance from infrastructure processing.

This design enables reliable execution, improved scalability, and better user experience.

---

## Implemented Endpoints

```
POST /api/v1/understanding

GET /api/v1/understanding/jobs

GET /api/v1/understanding/jobs/{jobId}
```

---

## Capabilities

- Create Understanding Jobs
- Retrieve Job History
- Retrieve Job Details
- Asynchronous Processing
- Job Status Tracking
- Historical Execution Records

---

## Understanding Workflow

```
Client
    │
    ▼
POST Understanding
    │
    ▼
Understanding Job Created
    │
    ▼
HTTP 202 Accepted
    │
    ▼
Background Worker
    │
    ▼
Understanding Engine
    │
    ▼
Discovery Registry
    │
    ▼
Discovery Modules
    │
    ▼
Infrastructure Snapshot
    │
    ▼
Job Completed
```

The API immediately returns after job creation while processing continues independently.

---

# Background Worker

## Purpose

Execute Understanding Jobs outside the request lifecycle.

The worker continuously polls for pending work, claims jobs atomically, executes infrastructure discovery, and records execution results.

The worker is an internal service and does not expose public REST endpoints.

---

## Worker Lifecycle

```
Pending
    │
    ▼
Claimed
    │
    ▼
Running
    │
    ▼
Discovery
    │
    ▼
Snapshot Persisted
    │
    ▼
Completed
```

If execution fails:

```
Running
    │
    ▼
Failed
```

The worker records:

- Start Time
- Completion Time
- Execution Duration
- Failure Reason (if applicable)
- Final Job Status

---

# Discovery Framework

## Purpose

Provide a modular and extensible infrastructure discovery architecture.

Rather than embedding discovery logic inside the Understanding Engine, Atlas delegates infrastructure observation to independently developed discovery modules.

This approach allows new discovery capabilities to be added without modifying the orchestration pipeline.

---

## Discovery Pipeline

```
Understanding Engine
        │
        ▼
Discovery Registry
        │
        ├──────────────┐
        ▼              ▼
DNS Discovery     HTTP Discovery
        │              │
        └──────┬───────┘
               ▼
        SSL Discovery
               │
               ▼
Technology Detection
               │
               ▼
Discovery Snapshot
```

Each module contributes observations to a shared Discovery Snapshot.

---

## Implemented Discovery Modules

### DNS Discovery

Collects DNS-related infrastructure information.

Examples:

- IP Addresses
- Name Servers
- DNS Records

---

### HTTP Discovery

Collects HTTP characteristics.

Examples:

- Response Status
- Redirect Chain
- HTTP Headers
- Server Metadata

---

### SSL Discovery

Collects TLS and certificate information.

Examples:

- Certificate Issuer
- Expiration Date
- Supported TLS Versions
- Certificate Metadata

---

### Technology Detection

Detects technologies powering the target infrastructure.

Examples:

- Web Servers
- Frameworks
- CDNs
- Reverse Proxies
- Hosting Providers

---

# Infrastructure Snapshot

## Purpose

Persist the complete observed infrastructure state produced by a successful Understanding execution.

Snapshots represent immutable historical records.

They are never modified after creation.

---

## Snapshot Creation

```
Discovery Modules
        │
        ▼
Discovery Snapshot
        │
        ▼
Infrastructure Snapshot
        │
        ▼
Database
```

Every successful Understanding execution produces exactly one Infrastructure Snapshot.

---

## Stored Information

An Infrastructure Snapshot includes:

- Domain Reference
- Understanding Job Reference
- Discovery Timestamp
- Canonical Discovery Payload
- Response Metadata
- Technology Information
- DNS Information
- HTTP Information
- SSL Information

The snapshot forms the historical memory of Atlas.

---

# Infrastructure Intelligence Pipeline

Sprint 2 establishes the data collection layer that future intelligence capabilities build upon.

```
Infrastructure Discovery
        │
        ▼
Discovery Snapshot
        │
        ▼
Infrastructure Snapshot
        │
        ▼
Infrastructure Findings
        │
        ▼
Infrastructure Brief
        │
        ▼
Workspace Intelligence
```

Infrastructure Findings and Infrastructure Brief generation are introduced in Sprint 3.

---

# Current Implementation Status

| Capability | Status |
|------------|--------|
| Authentication | ✅ Implemented |
| Domain Management | ✅ Implemented |
| Understanding Jobs | ✅ Implemented |
| Background Worker | ✅ Implemented |
| Discovery Registry | ✅ Implemented |
| DNS Discovery | ✅ Implemented |
| HTTP Discovery | ✅ Implemented |
| SSL Discovery | ✅ Implemented |
| Technology Detection | ✅ Implemented |
| Infrastructure Snapshot Persistence | ✅ Implemented |
| Infrastructure Findings | ⏳ Planned |
| Infrastructure Briefs | ⏳ Planned |
| Snapshot Comparison | ⏳ Planned |
| Historical Timeline | ⏳ Planned |

---
# Request Conventions

Atlas APIs follow consistent request conventions to simplify client integration and improve long-term maintainability.

---

## HTTP Methods

| Method | Purpose |
|---------|----------|
| GET | Retrieve resources |
| POST | Create resources or initiate asynchronous operations |
| PUT | Replace an existing resource |
| PATCH | Partially update a resource |
| DELETE | Remove a resource |

---

## Request Headers

Authenticated requests include:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

Public endpoints do not require an Authorization header.

---

## Request Validation

Incoming requests are validated before entering the application layer.

Validation includes:

- Required fields
- Data types
- String length
- Enum values
- URL and domain validation
- Business rule validation

Invalid requests are rejected before any business logic executes.

---

# Response Conventions

Atlas returns predictable JSON responses using standard HTTP status codes.

Successful responses return the requested resource or operation result.

Example:

```json
{
  "id": "job_123",
  "status": "PENDING",
  "createdAt": "2026-07-18T08:30:00Z"
}
```

---

## Asynchronous Operations

Long-running operations return **HTTP 202 Accepted**.

Example:

```json
{
  "jobId": "job_123",
  "status": "PENDING"
}
```

Clients should monitor job status using the Understanding Job endpoints.

---

# Error Handling & Canonical Error Specification

All error responses across the Atlas API surface strictly conform to a single canonical error payload format (`ApiErrorResponseDto`). Centralized exception catching, correlation ID tracing, validation error formatting, and database error translation are handled globally by `AllExceptionsFilter`.

### Canonical Error Payload Contract (`ApiErrorResponseDto`)

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "code": "BAD_REQUEST",
  "message": "email must be an email; password must be longer than or equal to 8 characters",
  "details": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "correlationId": "corr_8e9d451b9a5b4ea7ba09b42617961a17",
  "timestamp": "2026-07-25T20:10:45.000Z"
}
```

### Field Definitions

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `statusCode` | `number` | Standard HTTP status code | `400` |
| `error` | `string` | Human-readable HTTP status phrase | `"Bad Request"` |
| `code` | `string` | Deterministic machine-readable SNAKE_CASE error code | `"BAD_REQUEST"` |
| `message` | `string` | Human-readable error explanation message | `"Validation failed: email must be a valid email address"` |
| `details` | `array / object` *(optional)* | Detailed validation constraints or contextual metadata | `["email must be an email"]` |
| `correlationId` | `string` | Unique request correlation ID for cross-system telemetry & logs | `"corr_8e9d451b9a5b4ea7ba09b42617961a17"` |
| `timestamp` | `string` | ISO-8601 UTC timestamp of error occurrence | `"2026-07-25T20:10:45.000Z"` |

---

### Canonical Error Category Mapping

| HTTP Status | Category | Machine Error Code (`code`) | Trigger Condition | Canonical Message Example |
| :--- | :--- | :--- | :--- | :--- |
| **400** | Validation Failure | `BAD_REQUEST` / `DATABASE_VALIDATION_ERROR` | `ValidationPipe` DTO failure or malformed input payload | `"email must be an email; password must be at least 8 characters"` |
| **401** | Authentication Failure | `UNAUTHORIZED` | Invalid, expired, or missing JWT Bearer token or invalid login credentials | `"Invalid email or password."` / `"Unauthorized access."` |
| **403** | Authorization Failure | `FORBIDDEN` | Authenticated user attempting cross-tenant resource access | `"Cross-tenant access denied."` |
| **404** | Resource Not Found | `NOT_FOUND` / `RESOURCE_NOT_FOUND` | Target domain, snapshot, finding, or timeline event does not exist (or Prisma P2025) | `"The requested resource was not found."` |
| **409** | Resource Conflict | `CONFLICT` / `RESOURCE_EXISTS_CONFLICT` | Duplicate user registration or duplicate domain ownership (or Prisma P2002) | `"Email is already registered."` |
| **429** | Rate Limiting | `TOO_MANY_REQUESTS` | Rate limit threshold exceeded (e.g. >5 registration requests/hr) | `"Rate limit exceeded. Please try again later."` |
| **500** | Internal Error | `INTERNAL_SERVER_ERROR` | Unhandled runtime exception or infrastructure failure | `"An unexpected server error occurred."` |

---

---

# Security & Bootstrap Hardening Specification

The Atlas API follows a defense-in-depth security model enforced at application bootstrap (`main.ts`), middleware execution (`SecurityHeadersMiddleware`, `CorrelationIdMiddleware`), global exception filters (`AllExceptionsFilter`), and route guards (`JwtAuthGuard`).

### Application Bootstrap Hardening (`main.ts`)
- **Express Server Fingerprint Suppression**: `app.getHttpAdapter().getInstance().disable('x-powered-by')` explicitly disables the `X-Powered-By: Express` header to prevent technology fingerprinting by unauthorized scanners.

### Security Response Headers Matrix

| Header Name | Enforcement Strategy | Value / Policy Specification | Rationale & Protection |
| :--- | :--- | :--- | :--- |
| **`X-Powered-By`** | Stripped / Disabled | *(Removed)* | Prevents server technology fingerprinting. |
| **`Strict-Transport-Security`** (HSTS) | Production / HTTPS Requests | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS transport for 1 year with subdomains & preload registration. |
| **`Content-Security-Policy`** (CSP) | All Routes (Env / Prod) | Non-docs: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none';`<br>Swagger Docs (`/api/docs`): Allows inline UI rendering. | Restricts script/style execution and prevents XSS and data injection attacks. |
| **`X-Frame-Options`** | Global Middleware | `DENY` | Prevents clickjacking attacks via `<iframe>` embedding. |
| **`X-Content-Type-Options`** | Global Middleware | `nosniff` | Prevents MIME type sniffing. |
| **`Referrer-Policy`** | Global Middleware | `strict-origin-when-cross-origin` | Protects privacy by stripping referrer path details on cross-origin requests. |
| **`Permissions-Policy`** | Global Middleware | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()` | Disables sensitive browser API access. |
| **`X-Correlation-ID`** | Global Middleware / Filter | `corr_<uuid>` (or client-propagated `X-Correlation-ID`) | Enables end-to-end request tracing across microservices, logs, and telemetry. |
| **`X-Request-ID`** | Global Middleware / Filter | `req_<uuid>` (or client-propagated `X-Request-ID`) | Unique per-request execution identifier. |

---

# API Evolution

Atlas APIs evolve through additive versioning.

Breaking changes are avoided within a major API version.

Future functionality will be introduced as additional resources rather than modifying existing contracts.

Examples include:

```
/snapshots

/findings

/briefs

/changes

/recommendations
```

This approach preserves backward compatibility for existing clients.

---

# Future API Modules

The following modules are planned beyond Sprint 2.

## Infrastructure Findings

Purpose:

Expose normalized infrastructure observations.

Example endpoints:

```
GET /api/v1/findings

GET /api/v1/findings/{findingId}
```

---

## Infrastructure Briefs

Purpose:

Provide concise human-readable summaries of infrastructure state and changes.

Example endpoints:

```
GET /api/v1/briefs

GET /api/v1/briefs/{briefId}
```

---

## Historical Comparison

Purpose:

Compare historical Infrastructure Snapshots and identify meaningful changes.

Example endpoints:

```
GET /api/v1/compare

GET /api/v1/changes
```

---

## Recommendations

Purpose:

Provide actionable guidance based on historical infrastructure understanding.

Example endpoints:

```
GET /api/v1/recommendations
```

---

# API Lifecycle

The Atlas API follows a predictable execution model.

```
Client Request
        │
        ▼
Authentication
        │
        ▼
Validation
        │
        ▼
Controller
        │
        ▼
Application Service
        │
        ▼
Domain Service
        │
        ▼
Repository
        │
        ▼
Database
        │
        ▼
JSON Response
```

For asynchronous operations:

```
Client
    │
    ▼
Create Understanding Job
    │
    ▼
202 Accepted
    │
    ▼
Background Worker
    │
    ▼
Discovery Pipeline
    │
    ▼
Infrastructure Snapshot
    │
    ▼
Job Completed
```

This architecture separates request handling from infrastructure execution while preserving reliability and scalability.

---

# Summary

The Atlas API is designed as the stable contract between clients and the Infrastructure Intelligence Platform.

Sprint 2 establishes the complete backend execution pipeline, including authentication, domain management, asynchronous Understanding jobs, modular discovery, and immutable Infrastructure Snapshot persistence.

Future releases extend this foundation with Infrastructure Findings, Infrastructure Briefs, historical comparison, and intelligent recommendations without introducing breaking API changes.

---

# Document Status

| Property | Value |
|----------|-------|
| **Document** | 05 – API Architecture |
| **Version** | **2.0** |
| **Status** | **Approved (Frozen)** |
| **Classification** | Canonical Architecture Document |
| **Owner** | Atlas Architecture Team |
| **Last Updated** | July 2026 |
| **Next Review Trigger** | API Contract Changes |
| **Review Process** | Architecture Review Required |

---