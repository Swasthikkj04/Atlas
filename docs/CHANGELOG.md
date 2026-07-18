# CHANGELOG

All notable changes to Atlas are documented in this file.

This project follows the principles of **Keep a Changelog** and uses **Semantic Versioning** where practical.

---

# [Unreleased]

## Planned

### Infrastructure Intelligence

- Infrastructure Findings generation
- Infrastructure Brief generation
- Snapshot comparison engine
- Historical change detection
- Snapshot retrieval APIs
- Historical timeline
- Workspace experience

---

# [0.2.0] - 2026-07-18

## 🚀 Sprint 2 — Backend Foundation & Understanding Engine

This release completes Sprint 2 and establishes the production-ready backend foundation for Atlas.

Atlas now supports authenticated users, multi-tenant domain management, asynchronous infrastructure understanding, modular discovery, and immutable Infrastructure Snapshot persistence.

This release establishes the historical data collection platform that future Infrastructure Intelligence features will build upon.

---

## Added

### Authentication

- User registration
- User login
- JWT authentication
- Protected API endpoints
- Current authenticated user endpoint
- Password hashing

---

### Domain Management

- Domain registration
- Domain ownership validation
- Duplicate domain prevention
- Multi-tenant ownership enforcement

---

### Understanding Engine

- Asynchronous Understanding Job architecture
- Understanding Job creation
- Understanding Job retrieval
- Domain-specific job history
- Production job lifecycle

Supported job states:

- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`

---

### Background Processing

- Background Understanding Worker
- Continuous job polling
- Atomic job claiming
- Execution duration tracking
- Completion timestamps
- Failure recording

---

### Discovery Framework

Implemented a modular Discovery Framework including:

- Discovery Registry
- Ordered discovery pipeline
- Extensible Discovery Module architecture

Implemented discovery modules:

- DNS Discovery
- HTTP Discovery
- SSL Discovery
- Technology Detection

---

### Infrastructure Persistence

- Immutable Infrastructure Snapshot persistence
- Canonical JSON payload storage
- Response metadata persistence
- Understanding Job linkage
- Historical infrastructure storage

---
# [0.1.0] - 2026-07-13

## 🎉 Sprint 0 — Product Discovery

This release marks the birth of Atlas as a product.

Sprint 0 focused on defining the product vision, engineering philosophy, architecture, and documentation before implementation began.

---

## Added

### Product Foundation

- Defined Atlas as an **Infrastructure Intelligence Platform**.
- Established the core promise:

> **Know what changed. Understand why.**

- Identified the primary target users:
  - Software Engineers
  - DevOps Engineers
  - Engineering Managers
  - Technical Leads

---

### Product Philosophy

- Infrastructure Intelligence over infrastructure scanning
- Quiet Intelligence as the product identity
- Workspace-first experience
- Historical understanding over one-time analysis
- Human-centered insights
- Progressive disclosure
- Infrastructure Brief concept
- Timeline-first history

---

### Product Architecture

Designed the initial production architecture including:

- React Frontend
- NestJS Backend
- PostgreSQL
- Prisma ORM
- Modular Monolith architecture
- Repository Pattern
- Clean Architecture
- Multi-tenant design
- Infrastructure Understanding pipeline

---

### Core Platform Design

Defined the core Atlas domain model:

- Users
- Domains
- Understanding Jobs
- Infrastructure Snapshots
- Infrastructure Findings
- Change History
- Infrastructure Briefs

Established immutable snapshots as the foundation of Atlas' historical memory.

---

### API Design

Designed the first REST API covering:

- Authentication
- Domain Management
- Understanding Jobs
- Workspace
- Snapshot Retrieval
- Historical Change Analysis

---

### Documentation

Created the canonical engineering documentation:

- Development Environment
- Vision
- Product Requirements
- System Architecture
- Database Architecture
- API Architecture
- Roadmap
- Engineering Decisions
- Design Bible
- Coding Standards
- Security & Trust Architecture
- Contributing Guide
- Changelog

---

## Engineering Decisions

Established the foundational engineering principles:

- Documentation-first development
- Product-first engineering
- Security by default
- Infrastructure Intelligence over infrastructure scanning
- Modular Monolith architecture
- Clean Architecture
- Repository Pattern
- SOLID principles
- Multi-tenant platform design

---

## Release Summary

Version **0.1.0** contains no production code.

Instead, it establishes the product vision, engineering standards, architectural foundation, and documentation that guide every future release of Atlas.

This release represents the official beginning of the Atlas project.

---
## Changed

- Transitioned infrastructure understanding from synchronous execution to asynchronous background processing.
- Standardized infrastructure discovery through the Discovery Registry architecture.
- Established Infrastructure Snapshots as immutable historical records.
- Adopted canonical JSON payloads as the source of truth for infrastructure observations.
- Refined the Understanding pipeline to support future Infrastructure Intelligence capabilities.

---

## Fixed

- Resolved Prisma schema inconsistencies.
- Resolved database migration synchronization issues.
- Corrected Prisma Client generation inconsistencies.
- Improved worker polling and job claiming reliability.
- Corrected Infrastructure Snapshot persistence workflow.
- Eliminated duplicate discovery execution scenarios.
- Verified end-to-end execution of the Understanding pipeline.

---

## Verified

Completed manual end-to-end validation for:

- User Registration
- User Login
- JWT Authentication
- Domain Registration
- Domain Ownership Enforcement
- Understanding Job Creation
- Background Worker Execution
- Discovery Pipeline
- Infrastructure Snapshot Persistence
- PostgreSQL Data Integrity

---

## Current Platform Status

### Completed

- Authentication
- Domain Management
- Understanding Jobs
- Background Worker
- Discovery Registry
- DNS Discovery
- HTTP Discovery
- SSL Discovery
- Technology Detection
- Infrastructure Snapshot Persistence

### Planned

- Infrastructure Findings
- Change History
- Infrastructure Briefs
- Snapshot Retrieval APIs
- Historical Comparison Engine
- Workspace Experience

---

## Release Summary

Atlas has evolved from an architectural vision into a production-ready backend platform capable of authenticating users, managing domains, executing asynchronous infrastructure discovery, and preserving immutable historical infrastructure snapshots.

Version **0.2.0** establishes the engineering foundation required for Atlas' next phase: **Infrastructure Intelligence**.

---

# [0.1.0] - 2026-07-13

## 🎉 Sprint 0 — Product Discovery

This release marks the birth of Atlas as a product.

Sprint 0 focused on defining the product vision, engineering philosophy, architecture, and documentation before production implementation began.

---

## Added

### Product Foundation

- Defined Atlas as an **Infrastructure Intelligence Platform**.
- Established the core product promise:

> **Know what changed. Understand why.**

- Identified the primary target users:
  - Software Engineers
  - DevOps Engineers
  - Engineering Managers
  - Technical Leads

---

### Product Philosophy

Established the guiding principles of Atlas:

- Infrastructure Intelligence over infrastructure scanning
- Quiet Intelligence
- Workspace-first experience
- Historical understanding
- Progressive disclosure
- Human-centered insights
- Timeline-first experience
- Infrastructure Brief concept

---

### Engineering Architecture

Designed the production architecture including:

- React frontend
- NestJS backend
- PostgreSQL
- Prisma ORM
- Modular Monolith architecture
- Clean Architecture
- Repository Pattern
- Multi-tenant platform

---

### Core Domain Model

Designed the foundational data model consisting of:

- Users
- Domains
- Understanding Jobs
- Infrastructure Snapshots
- Infrastructure Findings
- Change History
- Infrastructure Briefs

Established immutable Infrastructure Snapshots as the foundation of Atlas' historical memory.

---

### API Design

Designed the initial REST API including:

- Authentication
- Domain Management
- Understanding Jobs
- Workspace
- Infrastructure Snapshots
- Historical Change Analysis

---

### Documentation

Created the canonical engineering documentation:

- Development Environment
- Vision
- Product Requirements
- System Architecture
- Database Architecture
- API Architecture
- Roadmap
- Engineering Decisions
- Design Bible
- Coding Standards
- Security & Trust Architecture
- Contributing Guide
- Changelog

---

## Engineering Decisions

Established the engineering principles that continue to guide Atlas development:

- Documentation-first development
- Product-first engineering
- Security by default
- Infrastructure Intelligence over infrastructure scanning
- Modular Monolith architecture
- Clean Architecture
- Repository Pattern
- SOLID design principles
- Multi-tenant platform design
- Historical infrastructure understanding

---

## Release Summary

Version **0.1.0** contains no production code.

Instead, it establishes the product vision, engineering standards, architectural foundation, and canonical documentation that guide every future release of Atlas.

Sprint 0 concludes with Atlas transitioning from an idea into a fully specified software platform, providing the blueprint for all subsequent implementation.

---

## Looking Ahead

The next release introduces the first production implementation of Atlas, including:

- Monorepo workspace
- NestJS backend
- React frontend
- PostgreSQL
- Prisma ORM
- Authentication
- Domain management
- Understanding Jobs
- Discovery Framework
- Infrastructure Snapshot persistence

These capabilities form the foundation for Atlas' evolution into a production-ready Infrastructure Intelligence Platform.