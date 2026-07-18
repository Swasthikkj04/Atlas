# 03 – System Architecture

**Product:** Atlas

**Version:** v2.1

**Status:** Sprint 2 Complete

**Document Type:** System Architecture

**Owner:** Atlas Architecture Team

**Last Updated:** July 2026

**Review Trigger:** Major Architectural Change

---

# Purpose

This document defines the canonical system architecture of Atlas.

Atlas is designed as an **Infrastructure Intelligence Platform**, not merely an infrastructure scanner or monitoring solution. Its architecture is centered around collecting infrastructure observations, preserving historical knowledge, understanding change over time, and presenting meaningful intelligence to users.

The architecture emphasizes long-term maintainability, production readiness, security by default, and incremental evolution.

This document serves as the primary architectural reference for all engineering decisions and implementation work.

---

# Architecture Vision

Atlas transforms infrastructure data into actionable intelligence.

Rather than simply reporting the current state of infrastructure, Atlas answers questions such as:

- What changed?
- When did it change?
- Why does it matter?
- What should be done next?

To achieve this, Atlas separates infrastructure discovery from infrastructure intelligence.

Infrastructure discovery focuses on collecting observations.

Infrastructure intelligence focuses on interpreting those observations, identifying meaningful changes, and communicating them through concise human-readable summaries.

This layered approach allows Atlas to evolve without requiring architectural redesign.

---

# Architectural Principles

Atlas is built upon several foundational principles.

## Product First

Every architectural decision must strengthen Atlas as an Infrastructure Intelligence Platform.

Technology choices support product goals rather than define them.

---

## Documentation First

Architecture is documented before implementation.

Canonical documentation serves as the source of truth for engineering decisions.

Implementation must remain synchronized with approved documentation.

---

## Production First

Every completed sprint should produce deployable, production-quality software.

Temporary implementations, experimental code, and architectural shortcuts are not permitted within production branches.

---

## Security by Default

Security is a cross-cutting concern rather than an optional feature.

Authentication, authorization, validation, tenant isolation, and secure defaults are applied consistently across the platform.

---

## Incremental Evolution

Atlas evolves through small, stable improvements.

Rather than introducing disruptive rewrites, new capabilities extend the existing architecture while preserving compatibility and maintainability.

---

# High-Level Architecture

Atlas follows a layered architecture that separates presentation, application orchestration, infrastructure understanding, persistence, and future intelligence generation.

```
                User
                  │
                  ▼
        React Web Application
                  │
                  ▼
          REST API (NestJS)
                  │
                  ▼
      Authentication & Authorization
                  │
                  ▼
          Domain Management
                  │
                  ▼
         Understanding Service
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
      ┌───────────┴───────────┐
      ▼           ▼           ▼
     DNS        HTTP        SSL
                  │
                  ▼
        Technology Detection
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
        Change History
                  │
                  ▼
     Infrastructure Brief
                  │
                  ▼
     Workspace Intelligence
```

The upper portion of the architecture is responsible for authenticated request processing and infrastructure understanding.

The lower portion transforms historical observations into infrastructure intelligence, enabling Atlas to explain infrastructure evolution rather than simply report infrastructure state.

---

# Architecture Layers

Atlas is organized into five primary architectural layers.

| Layer | Responsibility |
|--------|----------------|
| Presentation Layer | User interface and client interaction |
| Application Layer | API endpoints, orchestration, and business workflows |
| Understanding Layer | Infrastructure discovery and observation |
| Persistence Layer | Historical infrastructure storage |
| Intelligence Layer | Findings, comparisons, summaries, and recommendations |

Each layer owns a distinct responsibility and communicates only through well-defined interfaces.

This separation preserves maintainability, enables independent evolution, and supports future platform growth without architectural redesign.

---
# Application Layer

## Purpose

The Application Layer provides the primary interface between clients and Atlas.

It is responsible for:

- Request validation
- Authentication
- Authorization
- Business orchestration
- Response generation
- Delegating infrastructure understanding

The Application Layer does **not** perform infrastructure discovery directly. Instead, it coordinates work between domain services and the Understanding Engine.

---

# API Layer

Atlas exposes a RESTful API implemented using NestJS.

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

Controllers remain intentionally lightweight.

Business logic resides inside services, while persistence is delegated to repositories.

This separation improves maintainability, testing, and long-term scalability.

---

# Authentication Architecture

Authentication secures every protected Atlas capability.

Atlas uses JWT Bearer Authentication.

Authentication workflow:

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
Protected API
```

Authentication responsibilities include:

- User Registration
- User Login
- Password Hashing
- JWT Validation
- Current User Resolution
- Route Protection

Authentication is implemented as a cross-cutting concern and applies consistently across all protected endpoints.

---

# Multi-Tenant Architecture

Atlas is designed as a multi-tenant SaaS platform.

Every business resource belongs to a user through domain ownership.

```
User
 │
 ├────────────┐
 ▼            ▼
Domain A   Domain B
 │            │
 ▼            ▼
Snapshots   Snapshots
```

Tenant isolation is enforced through:

- JWT identity
- Ownership validation
- Repository filtering
- Foreign-key relationships

Cross-tenant access is never permitted.

This architecture enables multiple organizations to analyze the same public infrastructure independently while preserving complete data isolation.

---

# Domain Management

## Purpose

The Domain module represents the infrastructure assets managed by Atlas.

Every Understanding execution originates from a Domain.

Responsibilities include:

- Domain registration
- Ownership validation
- Duplicate prevention
- Monitoring configuration
- Historical grouping

Relationship:

```
User
    │
    ▼
Domain
    │
    ▼
Understanding Jobs
```

The Domain serves as the root aggregate for infrastructure intelligence.

---

# Understanding Service

## Purpose

The Understanding Service coordinates infrastructure analysis requests.

Rather than performing infrastructure discovery synchronously, it creates an Understanding Job and immediately returns control to the client.

```
Client
    │
    ▼
Create Understanding
    │
    ▼
Understanding Job
    │
    ▼
HTTP 202 Accepted
```

This asynchronous architecture improves responsiveness and enables Atlas to scale independently of infrastructure discovery duration.

Responsibilities include:

- Job creation
- Job validation
- Job retrieval
- Job history
- Execution orchestration

---

# Background Worker

## Purpose

The Background Worker executes Understanding Jobs independently of incoming HTTP requests.

It continuously polls for pending jobs, claims them atomically, executes infrastructure discovery, and records execution results.

Worker lifecycle:

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

- Execution duration
- Completion timestamp
- Failure reason
- Final job status

The worker architecture enables reliable background processing while preventing duplicate execution.

---

# Understanding Engine

## Purpose

The Understanding Engine orchestrates infrastructure discovery.

It contains no discovery logic itself.

Instead, it coordinates specialized discovery modules through the Discovery Registry.

```
Understanding Engine
        │
        ▼
Discovery Registry
        │
        ▼
Discovery Modules
```

Responsibilities include:

- Discovery orchestration
- Pipeline execution
- Snapshot assembly
- Error propagation
- Result aggregation

The Understanding Engine serves as the central coordinator of Atlas' infrastructure understanding process.

---

# Discovery Registry

## Purpose

The Discovery Registry manages all infrastructure discovery modules.

Rather than hardcoding discovery behavior, the registry dynamically executes registered modules in a controlled sequence.

```
Discovery Registry
        │
 ┌──────┼───────────────┐
 ▼      ▼               ▼
DNS   HTTP            SSL
        │
        ▼
Technology
```

Benefits include:

- Modular architecture
- Extensibility
- Independent module development
- Consistent execution ordering
- Simplified orchestration

New discovery modules can be added without modifying the Understanding Engine.

---

# Discovery Modules

Atlas currently implements four discovery modules.

## DNS Discovery

Collects DNS infrastructure information.

Examples:

- A Records
- AAAA Records
- Name Servers
- DNS Resolution

---

## HTTP Discovery

Collects HTTP characteristics.

Examples:

- Response Status
- Redirect Chain
- HTTP Headers
- Server Metadata
- Response Time

---

## SSL Discovery

Collects TLS and certificate information.

Examples:

- Certificate Issuer
- Certificate Expiration
- TLS Versions
- Certificate Metadata

---

## Technology Detection

Identifies technologies powering the target infrastructure.

Examples:

- Web Servers
- Frameworks
- CDNs
- Reverse Proxies
- Hosting Platforms

Each module contributes structured observations to the shared Discovery Snapshot, allowing Atlas to build a comprehensive view of the target infrastructure.

---
# Understanding Pipeline

Atlas transforms infrastructure observations into historical knowledge through a structured processing pipeline.

Each stage has a single responsibility and produces well-defined outputs for the next stage.

```
Understanding Request
        │
        ▼
Understanding Job
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
 ┌──────┴───────────────┐
 ▼                      ▼
Discovery Modules   Discovery Modules
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
Change History
        │
        ▼
Infrastructure Brief
        │
        ▼
Workspace Intelligence
```

Sprint 2 completes the pipeline through **Infrastructure Snapshot persistence**.

The remaining stages represent the future intelligence capabilities introduced in Sprint 3 and beyond.

---

# Discovery Snapshot

## Purpose

The Discovery Snapshot is an in-memory representation of everything observed during infrastructure discovery.

It exists only during Understanding execution and is not directly persisted.

Each discovery module contributes observations to this shared structure.

```
DNS Discovery
        │
HTTP Discovery
        │
SSL Discovery
        │
Technology Detection
        │
        ▼
Discovery Snapshot
```

The Discovery Snapshot serves as the aggregation point for all discovery modules before persistence.

---

# Persistence Layer

## Purpose

The Persistence Layer stores historical infrastructure knowledge.

Unlike traditional monitoring systems that overwrite previous observations, Atlas preserves every successful Understanding execution as a permanent historical record.

```
Understanding Engine
        │
        ▼
Infrastructure Snapshot
        │
        ▼
Database
```

This design enables historical comparison, trend analysis, and future intelligence generation.

---

# Infrastructure Snapshot

Infrastructure Snapshots represent the historical memory of Atlas.

Every completed Understanding execution produces exactly one immutable snapshot.

Each snapshot contains:

- Domain reference
- Understanding Job reference
- Discovery timestamp
- Response metadata
- Canonical discovery payload
- HTTP metadata
- DNS observations
- SSL observations
- Technology observations

Snapshots are never modified after creation.

This append-only approach preserves historical integrity and simplifies future comparison.

---

# Intelligence Layer

The Intelligence Layer transforms historical observations into meaningful understanding.

Rather than exposing raw infrastructure data, this layer explains infrastructure evolution.

```
Infrastructure Snapshot
        │
        ▼
Infrastructure Findings
        │
        ▼
Change History
        │
        ▼
Infrastructure Brief
```

Sprint 2 establishes the persistence foundation required for this layer.

Implementation begins in Sprint 3.

---

# Infrastructure Findings

## Purpose

Infrastructure Findings normalize observations extracted from Infrastructure Snapshots.

Examples include:

- Cloudflare detected
- HTTP/3 enabled
- Missing HSTS header
- TLS 1.3 supported
- nginx detected

Findings provide structured knowledge that can be searched, categorized, compared, and summarized.

---

# Change History

## Purpose

Change History compares Infrastructure Snapshots across time.

Rather than exposing raw differences, Atlas records meaningful infrastructure evolution.

Examples include:

- CDN Changed
- Certificate Renewed
- Security Header Removed
- HTTP Version Updated
- DNS Provider Changed

This historical timeline becomes the basis for notifications, recommendations, and trend analysis.

---

# Infrastructure Brief

## Purpose

Infrastructure Briefs translate technical observations into concise human-readable summaries.

Example:

> While you were away...

> Cloudflare remains active.

> HTTP/3 is now enabled.

> Certificate renewed successfully.

> Recommendation:
> Enable HSTS.

Infrastructure Briefs become the primary communication mechanism between Atlas and its users.

---

# Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| Authentication | Identity and access control |
| Domain Management | Infrastructure ownership |
| Understanding Service | Job orchestration |
| Background Worker | Asynchronous execution |
| Understanding Engine | Pipeline coordination |
| Discovery Registry | Discovery orchestration |
| Discovery Modules | Infrastructure observation |
| Infrastructure Snapshot | Historical persistence |
| Infrastructure Findings | Normalized intelligence |
| Change History | Historical comparison |
| Infrastructure Brief | Human-readable summaries |
| Workspace | User experience |

Every component owns a single responsibility and communicates only through well-defined interfaces.

---

# Current Production Boundary (Sprint 2)

The overall architecture describes Atlas' long-term design.

The current production implementation ends at Infrastructure Snapshot persistence.

## Implemented

```
User
    │
    ▼
Authentication
    │
    ▼
Domain
    │
    ▼
Understanding Job
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
```

---

## Planned (Sprint 3+)

```
Infrastructure Snapshot
        │
        ▼
Infrastructure Findings
        │
        ▼
Change History
        │
        ▼
Infrastructure Brief
        │
        ▼
Workspace Intelligence
```

This implementation boundary clearly separates the production-ready backend completed in Sprint 2 from the intelligence capabilities planned for future releases while preserving the integrity of the overall architecture.

---
# Security Architecture

Security is a foundational architectural concern within Atlas.

Rather than existing as a separate subsystem, security is integrated into every layer of the platform.

```
Presentation
      │
      ▼
Authentication
      │
      ▼
Authorization
      │
      ▼
Validation
      │
      ▼
Business Logic
      │
      ▼
Persistence
```

Security responsibilities include:

- Authentication
- Authorization
- Tenant Isolation
- Input Validation
- Secure Password Storage
- Immutable Historical Records
- Secure Error Handling

Future releases will extend security through:

- Refresh Tokens
- API Keys
- Rate Limiting
- Audit Logging
- Security Monitoring

---

# Multi-Tenant Architecture

Atlas is designed as a true multi-tenant SaaS platform.

Each user operates within an isolated ownership boundary.

```
User A
   │
   ├──────────────┐
   ▼              ▼
Domain A      Domain B

User B
   │
   ▼
Domain C
```

All downstream resources inherit ownership through the associated Domain.

```
Domain
    │
    ▼
Understanding Jobs
    │
    ▼
Infrastructure Snapshots
    │
    ▼
Future Intelligence
```

Tenant isolation is enforced through:

- JWT identity
- Ownership validation
- Repository filtering
- Foreign-key relationships
- Service-level authorization

No cross-tenant data access is permitted.

---

# Reliability

Atlas is designed around reliable asynchronous execution.

Long-running infrastructure operations are isolated from HTTP request processing.

```
Client
    │
    ▼
Create Job
    │
    ▼
202 Accepted
    │
    ▼
Background Worker
    │
    ▼
Infrastructure Processing
```

This architecture provides:

- Improved responsiveness
- Retry capability
- Fault isolation
- Controlled execution
- Better scalability

Failures within discovery do not affect API responsiveness.

---

# Error Handling

Atlas handles failures at the appropriate architectural layer.

```
Presentation
        │
Validation Errors
        │
Application Errors
        │
Discovery Errors
        │
Persistence Errors
```

Examples include:

- Authentication failures
- Validation failures
- Network timeouts
- DNS resolution failures
- SSL negotiation failures
- Database exceptions

Errors are:

- Logged
- Classified
- Returned using consistent API contracts
- Prevented from leaking internal implementation details

Background workers record execution failures without compromising historical data integrity.

---

# Scalability Strategy

Atlas is designed to evolve without requiring architectural redesign.

Horizontal scalability is supported by separating synchronous request handling from asynchronous infrastructure processing.

```
             API
              │
      ┌───────┴────────┐
      ▼                ▼
API Instance     API Instance
      │                │
      └───────┬────────┘
              ▼
      Shared PostgreSQL
              │
              ▼
      Background Workers
```

Future scaling strategies include:

- Multiple Worker Processes
- Read Replicas
- Database Partitioning
- Distributed Queues
- Horizontal API Scaling
- Snapshot Archiving

The modular architecture allows these enhancements without altering business logic.

---

# Observability

Production systems require operational visibility.

Atlas is designed with observability as a first-class concern.

Operational information includes:

- Request Logging
- Worker Activity
- Job Execution Duration
- Discovery Module Performance
- Infrastructure Errors
- API Errors
- Database Performance

Future releases may integrate:

- OpenTelemetry
- Prometheus
- Grafana
- Centralized Logging
- Distributed Tracing

Observability supports operational reliability without changing application architecture.

---

# Deployment Architecture

Atlas is deployed as a modular monolith.

```
                Internet
                    │
                    ▼
             Reverse Proxy
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 React Frontend          NestJS API
                                 │
                                 ▼
                       Background Worker
                                 │
                                 ▼
                           PostgreSQL
```

Current deployment characteristics:

- Single backend application
- Shared PostgreSQL database
- Internal background worker
- Stateless API
- JWT Authentication

The deployment architecture intentionally remains simple while supporting future horizontal scaling.

---

# Architectural Decisions

Several key architectural decisions shape Atlas.

## Modular Monolith

Atlas is implemented as a modular monolith.

Benefits include:

- Clear module ownership
- Simpler deployment
- Strong architectural boundaries
- Easier testing
- Lower operational complexity

Future extraction into microservices remains possible because module boundaries are already well defined.

---

## Asynchronous Understanding

Infrastructure discovery executes outside the request lifecycle.

Benefits include:

- Faster API responses
- Improved scalability
- Better fault tolerance
- Reliable execution

---

## Immutable Historical Storage

Infrastructure observations are never overwritten.

Benefits include:

- Historical comparison
- Change detection
- Trend analysis
- AI reasoning
- Auditability

---

## Discovery Module Architecture

Infrastructure discovery is implemented as independently developed modules.

Benefits include:

- Extensibility
- Maintainability
- Independent testing
- Future module expansion

Examples of future modules include:

- Performance Discovery
- WHOIS Discovery
- Security Header Analysis
- Certificate Transparency
- IPv6 Analysis
- CDN Intelligence

The architecture remains open for future expansion without requiring changes to the Understanding Engine.

---
# Current Implementation Status

The following table summarizes the implementation status of the Atlas architecture following Sprint 2.

| Component | Status |
|------------|--------|
| React Frontend | ✅ Implemented |
| NestJS Backend | ✅ Implemented |
| PostgreSQL | ✅ Implemented |
| Prisma ORM | ✅ Implemented |
| Authentication | ✅ Implemented |
| JWT Authorization | ✅ Implemented |
| User Management | ✅ Implemented |
| Domain Management | ✅ Implemented |
| Understanding Jobs | ✅ Implemented |
| Background Worker | ✅ Implemented |
| Understanding Engine | ✅ Implemented |
| Discovery Registry | ✅ Implemented |
| DNS Discovery | ✅ Implemented |
| HTTP Discovery | ✅ Implemented |
| SSL Discovery | ✅ Implemented |
| Technology Detection | ✅ Implemented |
| Infrastructure Snapshot Persistence | ✅ Implemented |
| Infrastructure Findings | 🚧 Planned |
| Change History | 🚧 Planned |
| Infrastructure Brief | 🚧 Planned |
| Snapshot Comparison | 🚧 Planned |
| Historical Timeline | 🚧 Planned |
| Workspace Intelligence | ⏳ Planned |
| Recommendation Engine | ⏳ Planned |

---

# Architecture Evolution

Atlas evolves incrementally while preserving architectural stability.

## Sprint 1

### Foundation

Delivered:

- Development Environment
- Monorepo
- React
- NestJS
- PostgreSQL
- Prisma ORM
- Initial API
- Initial Schema

Atlas became a deployable engineering platform.

---

## Sprint 2

### Understanding Platform

Delivered:

- Authentication
- Domain Management
- Understanding Jobs
- Background Worker
- Understanding Engine
- Discovery Registry
- DNS Discovery
- HTTP Discovery
- SSL Discovery
- Technology Detection
- Infrastructure Snapshot Persistence

Atlas now observes and preserves infrastructure history.

---

## Sprint 3

### Infrastructure Intelligence

Planned capabilities include:

- Infrastructure Findings
- Change Detection
- Historical Comparison
- Infrastructure Briefs
- Recommendation Engine

Atlas begins interpreting infrastructure rather than simply observing it.

---

## Sprint 4

### Workspace Experience

Planned capabilities include:

- Domain Dashboard
- Historical Timeline
- Snapshot Viewer
- Brief Viewer
- Comparison Viewer
- Workspace Intelligence

Infrastructure knowledge becomes accessible through a calm, human-centered interface.

---

## Future Evolution

Future releases extend the platform without altering its architectural foundation.

Potential capabilities include:

- AI-generated Infrastructure Briefs
- Predictive Infrastructure Intelligence
- Scheduled Understanding
- Notifications
- Team Workspaces
- Enterprise Features
- Public APIs
- Plugin Architecture

The architecture intentionally supports long-term evolution through extension rather than redesign.

---

# Architecture Summary

Atlas is designed as an **Infrastructure Intelligence Platform**.

Unlike traditional infrastructure scanners that focus on individual observations, Atlas preserves historical knowledge and transforms infrastructure data into meaningful intelligence.

The platform follows a layered architecture:

```
Presentation
      │
      ▼
Application
      │
      ▼
Understanding
      │
      ▼
Persistence
      │
      ▼
Intelligence
```

Infrastructure understanding progresses through a structured pipeline:

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
Change History
        │
        ▼
Infrastructure Brief
        │
        ▼
Workspace Intelligence
```

Sprint 2 establishes the production-ready backend foundation by implementing the complete Understanding pipeline through immutable Infrastructure Snapshot persistence.

Future releases extend this foundation with historical comparison, intelligence generation, AI-assisted insights, and an intuitive workspace experience.

This architecture enables Atlas to fulfill its guiding philosophy:

> **Know what changed. Understand why.**

Rather than merely reporting infrastructure state, Atlas remembers infrastructure history, understands meaningful evolution, and explains change in a way that supports informed decision-making.

---

# Related Documents

This document should be read alongside the other canonical architecture documents.

| Document | Purpose |
|----------|---------|
| 01 – Vision | Product vision and long-term direction |
| 02 – Product Requirements | Functional and non-functional requirements |
| 04.1 – Database Architecture | Persistence model and schema |
| 05 – API Architecture | API contracts and interaction model |
| 06 – Development Roadmap | Product evolution strategy |
| 07 – Engineering Decisions | Architectural decision record |
| 10 – Coding Standards | Engineering conventions |
| 11 – Security & Trust Architecture | Cross-cutting security architecture |

Together, these documents define the complete architectural foundation of Atlas.

---

# Document Status

| Property | Value |
|----------|-------|
| **Document** | 03 – System Architecture |
| **Version** | **2.1** |
| **Status** | **Approved (Frozen)** |
| **Classification** | Canonical Architecture Document |
| **Owner** | Atlas Architecture Team |
| **Last Updated** | July 2026 |
| **Next Review Trigger** | Major Architectural Change |
| **Review Process** | Architecture Review Required |

---