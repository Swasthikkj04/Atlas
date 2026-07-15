# 06 - Development-Roadmap.md

---
## Current Sprint Status

| Sprint | Status |
|---------|--------|
| Sprint 0 | ✅ Completed |
| Sprint 1 | 🚧 In Progress |
| Sprint 2 | ⏳ Planned |
| Sprint 3 | ⏳ Planned |
| Sprint 4 | ⏳ Planned |
| Sprint 5 | ⏳ Planned |
| Sprint 6 | ⏳ Planned |
# Atlas Development Roadmap

**Product:** Atlas

**Version:** v0.1.0

**Status:** Sprint Planning

**Project Duration (V1):** 1 Month

**Development Model:** Agile Sprint

---

# Roadmap Philosophy

Atlas will be developed incrementally.

Each sprint must produce a working product that can be demonstrated, tested, and improved.

The objective is **continuous progress**, not perfect software.

Every sprint ends with:

* A working build
* Updated documentation
* Git commits
* Testing
* Deployment

---

# Version Roadmap

| Version | Goal                              | Status    |
| ------- | --------------------------------- | --------- |
| v0.1    | Product Discovery & Documentation | ✅ Current |
| v0.2 | Foundation & Project Setup         | 🚧 In Progress |
| v0.3    | Authentication & Workspace        | Planned   |
| v0.4    | Understanding Engine              | Planned   |
| v0.5    | Historical Intelligence           | Planned   |
| v1.0    | Public MVP Release                | Planned   |

---

# Sprint 0

## Product Discovery

Objective

Transform Atlas from an idea into a documented product.

Deliverables

* Vision
* PRD
* System Architecture
* Database Design
* API Specification
* Development Roadmap
* Design Bible
* Engineering Decisions

Status

Completed

---

# Sprint 1

## Foundation

Objective

Build the engineering foundation.

Tasks

* Create GitHub repository
* Configure project structure
* Setup React
* Setup Node.js
* Configure PostgreSQL
* Dockerize development environment
* Environment configuration
* CI pipeline
* Initial deployment

Deliverable

Atlas boots successfully in development.

---

# Sprint 2

## Authentication & Workspace

Objective

Create the first usable Atlas experience.

Features

* User Registration
* Login
* JWT Authentication
* Guest Mode
* Workspace
* Add Domain
* Remove Domain

Deliverable

Users can create an account or use Atlas as a guest.

---

# Sprint 3

## Understanding Engine

Objective

Build Atlas' core capability.

Modules

* HTML
* SSL
* DNS
* HTTP Headers
* Technology Detection

Features

* Understanding Jobs
* Snapshot Storage
* Progress Tracking

Deliverable

Atlas understands a website and stores its first historical snapshot.

---

# Sprint 4

## Infrastructure Intelligence

Objective

Transform raw snapshots into meaningful understanding.

Features

* Snapshot Comparison
* Change Detection
* Infrastructure Timeline
* Infrastructure Brief

Deliverable

Atlas explains what changed between two understandings.

---

# Sprint 5

## Workspace Experience

Objective

Deliver the complete Atlas experience.

Features

* Timeline
* Domain Overview
* Daily Infrastructure Brief
* Workspace Improvements
* Loading Experience
* Empty States
* Error Handling

Deliverable

Atlas feels like a polished product rather than a technical prototype.

---

# Sprint 6

## Testing & Stabilization

Objective

Prepare Atlas for public release.

Tasks

* Unit Testing
* API Testing
* UI Testing
* Performance Improvements
* Bug Fixes
* Security Review
* Documentation Updates

Deliverable

Stable Release Candidate.

---

# Version 1.0

## Public MVP

Objective

Launch Atlas publicly.

Features

* Guest Understanding
* User Workspace
* Domain Monitoring
* Infrastructure Timeline
* Change Detection
* Daily Infrastructure Brief

Success Criteria

Users can:

* Understand public websites
* Track infrastructure changes
* Return to meaningful daily insights
* Trust Atlas as their Infrastructure Intelligence Assistant

---

# Future Roadmap

## Version 1.1

Product Improvements

* Performance Scanner
* Security Scanner
* Better Comparison Engine
* Improved Timeline

---

## Version 1.2

Productivity

* Email Notifications
* Scheduled Understandings
* Custom Monitoring Frequency
* Domain Organization

---

## Version 2.0

Team Collaboration

* Multiple Users
* Shared Workspaces
* Team Roles
* Activity Feed

---

## Version 2.5

Infrastructure Intelligence

* AI-generated Explanations
* Predictive Insights
* Infrastructure Recommendations
* Root Cause Suggestions

---

## Version 3.0

Atlas Platform

* Plugin Architecture
* Marketplace
* Public APIs
* Third-party Integrations

---

# Engineering Standards

Every sprint must satisfy the following.

## Code

* Clean Architecture
* TypeScript
* Modular Design
* Documentation

---

## Git

Every feature must have:

* Separate branch
* Pull Request
* Meaningful commits

Example

```text
feat: implement guest understanding

fix: improve timeline rendering

docs: update API specification
```

---

## Testing

Every sprint should include:

* Backend Tests
* Frontend Tests
* Manual Verification

---

## Deployment

Every sprint should be deployable.

Deployment environments

* Development
* Staging
* Production

---

# Definition of Done

A feature is considered complete only when:

* Requirements are implemented.
* Code is reviewed.
* Tests pass.
* Documentation is updated.
* Application builds successfully.
* Feature is deployable.

---

# Risks

Potential challenges

* Scope creep
* UI complexity
* Scanner reliability
* Performance bottlenecks
* Third-party dependency changes

Mitigation

* Keep MVP focused.
* Prioritize architecture over shortcuts.
* Build reusable modules.
* Test continuously.

---

# Long-Term Vision

Atlas will evolve from an Infrastructure Intelligence Assistant into a complete Infrastructure Intelligence Platform.

Every release should strengthen one promise:

> **Know what changed. Understand why.**

Future features will expand Atlas without compromising its philosophy of simplicity, clarity, and meaningful understanding.

---

# Roadmap Summary

The roadmap is intentionally iterative.

Each sprint delivers a working product while laying the foundation for future capabilities.

Atlas is not built through one large release.

It grows through continuous improvement, disciplined engineering, and thoughtful product decisions.

## Foundation

### Objective

Build the engineering foundation for Atlas.

### Progress

#### Completed

- [x] Create GitHub repository
- [x] Configure development environment
- [x] Configure pnpm workspace (Monorepo)
- [x] Configure Turborepo
- [x] Bootstrap React + Vite frontend
- [x] Bootstrap Express + TypeScript backend
- [x] Implement health check endpoint (`GET /health`)
- [x] Configure Docker Compose
- [x] Configure PostgreSQL 17
- [x] Install and configure Prisma ORM
- [x] Generate Prisma Client
- [x] Standardize project toolchain

#### Remaining

- [ ] Design initial database schema
- [ ] Create first Prisma migration
- [ ] Configure environment variables
- [ ] Create first Git commit
- [ ] Sprint 1 review
- [ ] Sprint 1 completion

### Current Deliverable

Atlas successfully boots in development with:

- React frontend
- Express backend
- Dockerized PostgreSQL
- Prisma ORM

Sprint 1 remains in progress.