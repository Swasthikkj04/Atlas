# 06 – Development Roadmap

**Product:** Atlas

**Version:** v2.0

**Status:** Sprint 2 Complete

**Document Type:** Product Development Roadmap

**Owner:** Atlas Architecture Team

**Last Updated:** July 2026

**Review Trigger:** Sprint Completion or Major Product Direction Change

---

# Purpose

This document defines the planned evolution of Atlas from an engineering prototype into a production-grade Infrastructure Intelligence Platform.

Unlike project task lists or sprint boards, this roadmap communicates the strategic development direction of Atlas. It describes how product capabilities are introduced incrementally while preserving architectural quality, production readiness, and long-term maintainability.

Every sprint should produce a working, testable, and deployable product increment.

The roadmap serves as the bridge between the Product Requirements, System Architecture, Engineering Decisions, and implementation.

---

# Roadmap Philosophy

Atlas is developed using a documentation-first, production-first engineering process.

Each sprint should satisfy four objectives:

- Deliver measurable product value.
- Strengthen the architectural foundation.
- Maintain production quality.
- Prepare the platform for future evolution.

Rather than maximizing feature count, Atlas prioritizes sustainable engineering and long-term product quality.

Every sprint concludes with:

- Working software
- Updated documentation
- Architecture review
- Testing and QA
- Deployable build

No sprint is considered complete until documentation and implementation remain synchronized.

---

# Development Principles

Atlas follows these guiding principles throughout every sprint.

## Product Before Technology

Every implementation decision must strengthen Atlas as an Infrastructure Intelligence Platform.

Technology serves the product rather than driving product direction.

---

## Documentation First

Architecture and product decisions are documented before implementation.

Approved documentation remains the canonical source of truth.

---

## Production First

Every completed sprint should leave Atlas in a deployable state.

Temporary implementations, shortcuts, and experimental code should not remain in production branches.

---

## Continuous Evolution

Atlas evolves through small, well-defined milestones rather than large rewrites.

Each sprint extends existing architecture while preserving architectural consistency.

---

# Current Sprint Status

| Sprint | Status |
|---------|--------|
| Sprint 0 | ✅ Completed |
| Sprint 1 | ✅ Completed |
| Sprint 2 | ✅ Completed |
| Sprint 3 | 🚧 Planned |
| Sprint 4 | ⏳ Planned |
| Sprint 5 | ⏳ Planned |
| Sprint 6 | ⏳ Planned |

---

# Version Roadmap

| Version | Goal | Status |
|---------|------|--------|
| **v0.1** | Product Discovery & Documentation | ✅ Completed |
| **v0.2** | Backend Foundation & Understanding Engine | ✅ Completed |
| **v0.3** | Infrastructure Intelligence | 🚧 Planned |
| **v0.4** | Workspace Experience | Planned |
| **v0.5** | Historical Intelligence | Planned |
| **v1.0** | Public MVP Release | Planned |

---

# Sprint 0

## Product Discovery

### Status

✅ Completed

### Objective

Transform Atlas from an idea into a well-defined software product before implementation begins.

### Delivered

- Product Vision
- Product Requirements Document
- System Architecture
- Database Design
- API Architecture
- Development Roadmap
- Engineering Decisions
- Design Bible
- Security Architecture
- Coding Standards

### Outcome

Atlas was formally established as an **Infrastructure Intelligence Platform** rather than a traditional infrastructure scanner or monitoring dashboard.

Core product philosophy was frozen:

> **Know what changed. Understand why.**

---

# Sprint 1

## Engineering Foundation

### Status

✅ Completed

### Objective

Build the production engineering foundation required for future product development.

### Delivered

#### Development Environment

- Ubuntu development environment
- Node.js LTS
- pnpm
- Docker
- Docker Compose
- GitHub SSH configuration

#### Repository

- GitHub repository
- Monorepo configuration
- Turborepo workspace

#### Frontend

- React
- Vite
- TypeScript

#### Backend

- NestJS
- TypeScript
- Health API
- Global validation
- Configuration module

#### Database

- PostgreSQL
- Prisma ORM
- Initial Prisma schema
- Initial migration
- Prisma Client

#### Engineering

- Documentation-first workflow
- Production repository structure
- Clean Architecture foundation
- Modular Monolith foundation

### Deliverable

Atlas successfully booted as a production-oriented monorepo containing:

- React frontend
- NestJS backend
- PostgreSQL database
- Prisma ORM
- Health API
- Production-ready project structure

Sprint 1 established the engineering platform upon which all future capabilities are built.

---

# Sprint 2

## Backend Foundation & Understanding Engine

### Status

✅ Completed

### Objective

Transform Atlas from an authenticated web application into a functioning Infrastructure Understanding platform.

Sprint 2 focused on establishing the complete backend execution pipeline, asynchronous processing architecture, discovery framework, and immutable historical persistence.

### Delivered

## Authentication

- User Registration
- User Login
- JWT Authentication
- Protected API Endpoints
- Current User Endpoint
- Password Hashing
- Authentication Guards

---

## Domain Management

- Add Domain
- List Owned Domains
- Domain Ownership Validation
- Duplicate Domain Prevention
- Multi-tenant Ownership Enforcement

---

## Understanding Jobs

- Understanding Job Creation
- Understanding Job Retrieval
- Domain Job History
- Job Status Tracking
- Background Job Processing
- Atomic Job Claiming
- Asynchronous Execution Pipeline

---

## Background Worker

Implemented a production-style background worker capable of:

- Polling pending jobs
- Claiming jobs atomically
- Executing Understanding requests
- Completing jobs
- Recording execution duration
- Handling failures safely

---

## Discovery Framework

Implemented Atlas' extensible discovery architecture.

### Discovery Registry

- Discovery Module Registration
- Ordered Discovery Pipeline
- Module Orchestration

### Discovery Modules

Implemented:

- DNS Discovery
- HTTP Discovery
- SSL Discovery
- Technology Detection

The architecture now supports future discovery modules without requiring changes to the Understanding Engine.

---

## Understanding Engine

Implemented the production Understanding execution pipeline.

```
Understanding Request
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
Discovery Snapshot
        │
        ▼
Infrastructure Snapshot
        │
        ▼
Job Completion
```

---
## Infrastructure Snapshot Persistence

Implemented Atlas' immutable persistence model.

### Discovery Snapshot

Every completed Understanding produces an in-memory `DiscoverySnapshot` representing the complete observed infrastructure state.

### Infrastructure Snapshot

Every completed Understanding persists an immutable `InfrastructureSnapshot` containing:

- Domain reference
- Understanding Job reference
- Response metadata
- HTTP metadata
- Canonical discovery payload (JSON)
- Historical timestamp

The Infrastructure Snapshot is considered the permanent historical memory of Atlas.

---

## Quality Assurance

Sprint 2 concluded with comprehensive manual end-to-end validation.

Verified capabilities include:

### Authentication

- User Registration
- User Login
- Protected Endpoints
- JWT Validation

### Domain Management

- Domain Creation
- Duplicate Prevention
- Ownership Enforcement

### Understanding Pipeline

- Job Creation
- Background Worker
- Discovery Execution
- Snapshot Persistence
- Job Completion

### Persistence

Verified:

- InfrastructureSnapshot generation
- Immutable persistence
- Historical storage
- End-to-end execution pipeline

### Deliverable

Atlas can now:

- Authenticate users.
- Manage owned domains.
- Execute asynchronous Understanding jobs.
- Collect infrastructure observations.
- Persist immutable historical snapshots.
- Maintain production-quality execution workflows.

Sprint 2 established the production backend foundation of Atlas.

---

# Sprint 3

## Infrastructure Intelligence

### Status

🚧 Planned

### Objective

Transform raw infrastructure observations into meaningful intelligence.

Sprint 3 introduces Atlas' intelligence layer.

Rather than collecting infrastructure data, Atlas begins interpreting, comparing, and explaining infrastructure evolution.

### Planned Deliverables

## Infrastructure Findings

Generate normalized findings from Infrastructure Snapshots.

Examples include:

- Technology Detection
- Missing Security Headers
- TLS Configuration
- DNS Characteristics
- Infrastructure Risks
- Positive Observations

Infrastructure Findings become the normalized intelligence layer of Atlas.

---

## Infrastructure Brief

Generate human-readable summaries from Infrastructure Findings.

Example:

> While you were away...

> HTTP/3 has been enabled.

> Cloudflare continues protecting this domain.

> TLS configuration remains healthy.

> One recommended improvement:
> Enable HSTS.

Infrastructure Briefs become Atlas' primary communication mechanism.

---

## Snapshot Comparison

Introduce historical comparison between Infrastructure Snapshots.

Examples:

- Technology Added
- Technology Removed
- TLS Version Changed
- DNS Updated
- CDN Changed
- Performance Differences

Atlas begins understanding infrastructure evolution rather than isolated observations.

---

## Change Detection

Generate persistent Change History records describing meaningful infrastructure evolution.

Examples include:

- HTTP/3 Enabled
- Cloudflare Added
- Certificate Renewed
- Security Header Removed
- DNS Provider Changed

---

## Snapshot Retrieval API

Introduce APIs for historical infrastructure retrieval.

Examples:

```
GET /domains/{domainId}/snapshots

GET /snapshots/{snapshotId}
```

These endpoints expose Atlas' historical memory to the Workspace and future integrations.

---

### Deliverable

Atlas evolves from infrastructure observation into infrastructure intelligence by transforming historical snapshots into meaningful understanding.

---

# Sprint 4

## Workspace Experience

### Status

⏳ Planned

### Objective

Build the first complete Atlas user experience.

Sprint 4 focuses on presenting infrastructure intelligence through a calm, human-centered workspace.

### Planned Deliverables

- Workspace Home
- Domain Overview
- Infrastructure Timeline
- Snapshot Viewer
- Infrastructure Brief Viewer
- Historical Comparison Viewer
- Understanding Progress
- Loading Experience
- Empty States
- Error Experience

The Workspace becomes the primary interface through which users interact with Atlas.

### Deliverable

Atlas feels like an intelligent assistant rather than a technical dashboard.

---

# Sprint 5

## Platform Maturity

### Status

⏳ Planned

### Objective

Strengthen Atlas through automation, monitoring, and user experience improvements.

### Planned Deliverables

- Scheduled Understanding
- Monitoring Configuration
- Infrastructure Notifications
- Daily Infrastructure Brief
- Improved Timeline
- Recommendation Engine
- Performance Improvements
- Operational Observability
- Production Monitoring
- Reliability Improvements

### Deliverable

Atlas operates continuously while providing meaningful infrastructure awareness with minimal user effort.

---

# Sprint 6

## Stabilization & Release Preparation

### Status

⏳ Planned

### Objective

Prepare Atlas for its first public release.

### Planned Deliverables

#### Engineering

- Unit Testing
- Integration Testing
- End-to-End Testing
- Performance Testing
- Security Testing

#### Operations

- Production Deployment
- Monitoring
- Logging
- Backup Strategy
- Disaster Recovery

#### Documentation

- Documentation Review
- API Documentation
- Deployment Guides
- Contributor Guides

#### Quality

- Bug Fixes
- Performance Optimization
- Security Hardening
- Release Validation

### Deliverable

Atlas becomes production-ready and suitable for public release.

---

# Version 1.0

## Public MVP

### Objective

Release the first public version of Atlas.

### Core Capabilities

- Guest Understanding
- User Accounts
- Domain Management
- Historical Infrastructure Snapshots
- Infrastructure Timeline
- Infrastructure Findings
- Infrastructure Briefs
- Change Detection
- Workspace Experience

### Success Criteria

Users can:

- Understand public infrastructure.
- Preserve historical knowledge.
- Track infrastructure evolution.
- Receive meaningful Infrastructure Briefs.
- Trust Atlas to quietly observe and explain infrastructure changes.

Atlas fulfills its promise:

> **Know what changed. Understand why.**
---
# Future Roadmap

Atlas is intentionally designed to evolve without requiring architectural redesign.

Future releases will strengthen Atlas' position as an Infrastructure Intelligence Platform while preserving the architectural principles established in Version 1.

---

## Version 1.1

### Product Enhancements

- Improved Infrastructure Findings
- Advanced Technology Detection
- Security Header Analysis
- Performance Intelligence
- Infrastructure Health Scoring
- Enhanced Historical Comparison

---

## Version 1.2

### Productivity

- Email Notifications
- Scheduled Infrastructure Briefs
- Configurable Monitoring Frequency
- Domain Organization
- Saved Filters
- Workspace Customization

---

## Version 2.0

### Team Collaboration

- Organizations
- Teams
- Shared Workspaces
- Role-Based Access Control
- Activity Timeline
- Shared Infrastructure Ownership

---

## Version 2.5

### AI Infrastructure Intelligence

- AI-generated Infrastructure Briefs
- Root Cause Suggestions
- Historical Trend Analysis
- Infrastructure Recommendations
- Predictive Infrastructure Insights
- Natural Language Infrastructure Search

---

## Version 3.0

### Atlas Platform

Atlas evolves into an extensible Infrastructure Intelligence Platform.

Potential capabilities include:

- Plugin Architecture
- Marketplace
- Public APIs
- Webhooks
- Event Streaming
- Third-party Integrations
- Enterprise Extensions
- Organization Intelligence

---

# Engineering Standards

Every sprint must satisfy Atlas engineering standards.

## Architecture

- Documentation First
- Product First
- Production First
- Security by Default
- Modular Monolith
- Clean Architecture
- Repository Pattern
- Feature-First Organization

---

## Code Quality

Every feature should:

- Build successfully
- Pass testing
- Follow Coding Standards
- Respect architectural boundaries
- Preserve module ownership
- Maintain tenant isolation

---

## Documentation

Documentation forms part of the Definition of Done.

Every significant engineering change should update the appropriate documentation.

Documentation remains synchronized with implementation.

---

## Testing

Every sprint should include:

- Manual Verification
- Integration Testing
- API Testing
- Regression Testing where applicable

Future releases will expand automated testing coverage.

---

## Deployment

Every completed sprint should remain deployable.

Deployment environments include:

- Development
- Staging
- Production

Deployment quality is considered part of production readiness.

---

# Definition of Done

A feature is considered complete only when all applicable requirements have been satisfied.

## Product

- Requirements implemented
- Acceptance criteria satisfied

---

## Engineering

- Builds successfully
- Production quality
- Architecture respected
- Security reviewed

---

## Testing

- Manual QA completed
- Integration verified
- Critical workflows validated

---

## Documentation

- Documentation updated
- API documentation updated where required
- Changelog updated
- Engineering Decisions updated where applicable

---

## Operations

- Logging implemented
- Error handling verified
- Deployable build produced

Only after satisfying these requirements should a feature be considered complete.

---

# Current Implementation Status

## Completed

### Platform Foundation

- Development Environment
- Monorepo
- Turborepo
- React Frontend
- NestJS Backend
- PostgreSQL
- Prisma ORM

---

### Authentication

- User Registration
- User Login
- JWT Authentication
- Protected Endpoints
- Current User Endpoint

---

### Domain Management

- Domain Registration
- Domain Ownership
- Multi-tenant Validation

---

### Understanding Engine

- Understanding Jobs
- Background Worker
- Atomic Job Claiming
- Job Lifecycle
- Discovery Framework

---

### Discovery Modules

- DNS Discovery
- HTTP Discovery
- SSL Discovery
- Technology Detection

---

### Historical Memory

- Discovery Snapshot
- Infrastructure Snapshot Persistence
- Immutable JSON Payload
- Historical Snapshot Storage

---

### Quality Assurance

- End-to-End API Validation
- Authentication Testing
- Domain Management Testing
- Worker Validation
- Snapshot Persistence Validation

---

## Planned

### Infrastructure Intelligence

- Infrastructure Findings
- Infrastructure Brief Generation
- Snapshot Comparison
- Change Detection
- Historical Timeline

---

### Workspace

- Workspace UI
- Timeline
- Snapshot Viewer
- Infrastructure Brief Viewer

---

### Platform

- Scheduled Understanding
- Notifications
- AI Intelligence
- Team Collaboration
- Enterprise Features

---

# Risks

Potential engineering challenges include:

- Infrastructure variability
- Third-party dependency changes
- Performance at scale
- Distributed processing
- Long-term historical storage
- Future AI integration

These risks are mitigated through:

- Documentation-first engineering
- Modular architecture
- Immutable historical storage
- Continuous testing
- Incremental architectural evolution

---

# Roadmap Summary

Atlas is being developed through disciplined, incremental engineering rather than large feature drops.

Each sprint strengthens one of four platform capabilities:

1. Foundation
2. Understanding
3. Intelligence
4. Experience

The platform evolves through a predictable intelligence pipeline:

```text
Infrastructure Discovery
        │
        ▼
Historical Snapshots
        │
        ▼
Infrastructure Findings
        │
        ▼
Historical Comparison
        │
        ▼
Infrastructure Briefs
        │
        ▼
Workspace Intelligence
```

This progression reflects Atlas' core philosophy.

Atlas does not simply collect infrastructure data.

Atlas remembers.

Atlas understands.

Atlas explains.

Every completed sprint moves Atlas closer to becoming a complete Infrastructure Intelligence Platform while preserving the architectural principles established by its canonical engineering documentation.

---

# Document Status

| Property | Value |
|----------|-------|
| **Document** | 06 – Development Roadmap |
| **Version** | **2.0** |
| **Status** | **Approved (Frozen)** |
| **Classification** | Product Development Roadmap |
| **Owner** | Atlas Architecture Team |
| **Last Updated** | July 2026 |
| **Next Review Trigger** | Sprint Completion or Major Product Direction Change |
| **Review Process** | Architecture Review Required |

---