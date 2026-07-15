# CHANGELOG

All notable changes to Atlas will be documented in this file.

The format is inspired by **Keep a Changelog** and follows semantic versioning where practical.

---

# [Unreleased]

### Added

* Future features under active development.

### Changed

* Improvements awaiting release.

### Fixed

* Pending bug fixes.

---

# [0.1.0] - 2026-07-13

## 🎉 Sprint 0 — Product Discovery

This marks the birth of Atlas as a product.

The focus of this release was defining the vision, philosophy, architecture, and engineering foundations before writing production code.

---

## Added

### Product Foundation

* Defined Atlas as an **Infrastructure Intelligence Assistant**.
* Established the core promise:

> **Know what changed. Understand why.**

* Identified the primary target users:

  * Software Engineers
  * DevOps Engineers
  * Engineering Managers
  * Technical Leads

---

### Product Philosophy

* Atlas delivers understanding instead of raw infrastructure data.
* Atlas focuses on meaningful changes rather than continuous monitoring.
* Defined "Quiet Intelligence" as the product identity.
* Introduced the principle:

> **Silence is the default. Insight is the exception.**

---

### User Experience

* Guest Mode concept.
* Workspace-first experience.
* Dashboard-free philosophy.
* Progressive understanding flow.
* Human-centered product language.
* Infrastructure Brief concept.
* Timeline-first history view.

---

### Product Growth Strategy

Established a product-led onboarding flow.

Users:

1. Experience Atlas.
2. Receive value.
3. Create an account only if they want Atlas to remember their infrastructure.

This became Atlas' onboarding philosophy.

---

### Engineering Architecture

Designed the first Atlas architecture.

Core components include:

* React Frontend
* Node.js Backend
* Scan Manager
* Independent Infrastructure Modules
* PostgreSQL
* Historical Snapshot Engine
* Comparison Engine

Architecture selected:

**Modular Monolith**

---

### Infrastructure Modules

Initial Version 1 modules:

* HTML
* DNS
* SSL
* HTTP Headers
* Technology Detection

Future modules documented for later versions.

---

### Database Model

Designed Atlas around historical knowledge.

Core entities:

* Users
* Domains
* Understanding Jobs
* Infrastructure Snapshots
* Infrastructure Findings
* Change History
* Infrastructure Briefs

Snapshots are immutable.

---

### API

Designed REST API Version 1.

Included:

* Authentication
* Guest Understanding
* Workspace
* Domains
* Timeline
* Understanding Jobs
* Snapshot Retrieval
* Change Detection

---

### Documentation

Created:

* 01-Vision.md
* 02-Product-Requirements.md
* 03-System-Architecture.md
* 04-Database-Design.md
* 05-API-Specification.md
* 06-Development-Roadmap.md
* 07-Decisions.md
* 08-Design-Bible.md
* CHANGELOG.md

---

## Product Decisions

Major decisions accepted during Sprint 0:

* Atlas is an assistant, not a dashboard.
* Workspace replaces Dashboard.
* Understanding replaces Scan.
* Accounts exist for memory, not access.
* Every feature must earn its place.
* Motion has meaning.
* Progressive disclosure.
* Human language first.
* Platform before features.

---

## Future

Planned after Sprint 0:

* Repository setup
* Project structure
* React application
* Backend API
* PostgreSQL implementation
* Docker development environment
* CI/CD pipeline
* First production deployment

---

## Closing Note

Version **0.1.0** contains no production code.

Instead, it establishes the vision, engineering principles, product philosophy, and technical foundation that will guide every future release of Atlas.

This version marks the official beginning of the Atlas journey.

# [0.2.0] - 2026-07-14

## 🚀 Sprint 1 — Foundation (In Progress)

This release marks the transition of Atlas from a documented product into a working software project.

Sprint 1 focuses on establishing the engineering foundation required for future feature development.

---

## Added

### Repository & Workspace

* Initialized the Atlas GitHub repository.
* Configured a pnpm workspace (monorepo).
* Added Turborepo for workspace orchestration.
* Standardized the repository structure for frontend, backend, and shared packages.

---

### Frontend

* Bootstrapped the React + Vite + TypeScript application.
* Verified the frontend development server.
* Established the initial frontend application structure.

---

### Backend

* Bootstrapped the Express + TypeScript API.
* Implemented the first API endpoint:

```
GET /health
```

* Verified successful API startup.
* Verified successful health response.

---

### Database

* Configured Docker Compose for local development.
* Added PostgreSQL 17 as the development database.
* Successfully started the PostgreSQL container.

---

### Prisma

* Installed Prisma ORM.
* Standardized on Prisma 6.19.3.
* Generated the Prisma Client.
* Prepared the project for database schema implementation.

---

### Engineering

* Standardized the backend folder structure.
* Established the initial development workflow.
* Locked the project toolchain for stable development.

---

## Changed

* Standardized TypeScript to version 5.9.3 across the entire workspace.
* Standardized Prisma to version 6.19.3.
* Adopted Docker-managed PostgreSQL for local development.

---

## Fixed

* Resolved pnpm workspace configuration issues.
* Resolved TypeScript module configuration issues.
* Resolved Prisma 7 compatibility issues by pinning Prisma 6.
* Resolved Docker PostgreSQL port conflict.
* Resolved Prisma client generation issues.

---

## Current Status

Sprint 1 remains in progress.

Completed:

- Development Environment
- Repository Setup
- Monorepo
- Frontend
- Backend
- Docker PostgreSQL
- Prisma Installation

Remaining:

- Database Schema
- Initial Migration
- Environment Finalization
- First Git Commit
- Sprint 1 Review