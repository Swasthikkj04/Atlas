# 03 - System-Architecture.md

---

# Atlas System Architecture

**Product:** Atlas

**Document Version:** v0.1.0

**Status:** Sprint 0 – Approved

**Related Documents:**

* 01-Vision.md
* 02-Product-Requirements.md

---

# Overview

Atlas is designed as a modular Infrastructure Intelligence Assistant that continuously understands public web infrastructure.

Rather than behaving as a single website scanner, Atlas acts as a platform that coordinates multiple independent understanding modules and combines their results into meaningful insights.

The architecture is intentionally designed to remain simple for Version 1 while supporting long-term growth without major redesign.

---

# Architectural Goals

The architecture is designed to achieve the following objectives:

* Simple enough for a small engineering team.
* Easy to extend with new infrastructure modules.
* Maintainable over long-term development.
* Suitable for production deployment.
* Capable of scaling as Atlas grows.
* Consistent with Atlas' product philosophy.

---

# High-Level Architecture

```text
                    User Browser
                           │
                    HTTPS Requests
                           │
                           ▼
                Atlas Frontend (React)
                           │
                      REST API
                           │
                           ▼
          Atlas Backend (Node.js + Express)
                           │
     ┌────────────┬──────────────┬──────────────┐
     │            │              │              │
Authentication Workspace   Domain Service  Scan Manager
                                           │
                                           ▼
                               Infrastructure Modules
                     ┌──────────┬──────────┬──────────┐
                     │          │          │          │
                 HTML       SSL        DNS     Technologies
                     │          │          │          │
                     └──────────┴──────────┴──────────┘
                                   │
                                   ▼
                           PostgreSQL Database
                                   │
                                   ▼
                     Timeline & Infrastructure Brief
```

---

# Architectural Philosophy

Atlas is not built around scanners.

Atlas is built around **understanding**.

Scanners are independent modules responsible only for collecting infrastructure information.

Understanding is created by combining historical data, identifying meaningful changes, and presenting them in a way that helps users make decisions.

---

# Core Components

## 1. Atlas Frontend

Responsibilities

* User authentication
* Guest experience
* Workspace interface
* Infrastructure Brief
* Timeline visualization
* Domain management
* Understanding interface

The frontend never performs infrastructure analysis directly.

Its responsibility is presenting information in a clear and calm manner.

---

## 2. Backend API

Responsibilities

* Authentication
* User management
* Domain management
* Request validation
* Communication with the Scan Manager
* Data retrieval
* Timeline generation

The Backend API acts as the central gateway for all client requests.

---

## 3. Authentication Service

Responsibilities

* User registration
* Login
* Logout
* Session validation
* Future OAuth integration

Authentication exists only to enable persistence and personalization.

Guest users should still be able to understand public websites.

---

## 4. Workspace Service

Responsibilities

* Personal Workspace
* Saved domains
* Recent activity
* Daily Infrastructure Brief
* Infrastructure Timeline

The Workspace replaces the traditional dashboard.

---

## 5. Domain Service

Responsibilities

* Add domains
* Remove domains
* Validate domains
* Retrieve watched domains
* Schedule future understanding jobs

---

## 6. Scan Manager

The Scan Manager is the orchestration layer of Atlas.

It never performs analysis itself.

Instead, it coordinates multiple independent infrastructure modules.

Responsibilities

* Start understanding jobs
* Execute infrastructure modules
* Collect module results
* Store snapshots
* Trigger comparison engine
* Generate Infrastructure Brief

This component allows Atlas to grow by adding new modules rather than modifying existing ones.

---

# Infrastructure Modules

Each module performs one specific responsibility.

Examples

## HTML Module

Collects

* HTML
* Meta tags
* Links
* Scripts

---

## SSL Module

Collects

* Certificate information
* Expiry date
* TLS version
* Certificate issuer

---

## DNS Module

Collects

* A Records
* AAAA Records
* MX Records
* TXT Records
* CNAME Records

---

## Technology Module

Detects

* Frameworks
* Libraries
* CMS
* CDN
* Analytics tools

---

## Future Modules

The architecture intentionally allows additional modules such as

* Performance
* Accessibility
* API
* Security
* SEO
* Kubernetes
* AI Understanding

without changing the existing platform architecture.

---

# Module Independence

Every infrastructure module follows the same lifecycle.

Input

```
example.com
```

Processing

```
Collect infrastructure data
```

Output

```json
{
  "module": "ssl",
  "status": "completed",
  "result": {}
}
```

Because every module follows the same interface, Atlas can easily introduce new modules in future versions.

---

# Data Flow

A typical understanding process follows these steps.

1. User starts understanding.
2. Backend creates a new understanding job.
3. Scan Manager begins orchestration.
4. Infrastructure modules execute independently.
5. Results are stored as a snapshot.
6. Previous snapshot is retrieved.
7. Comparison Engine detects changes.
8. Infrastructure Brief is generated.
9. Results appear inside the Workspace.

---

# Historical Knowledge

Atlas treats every understanding as a historical snapshot.

Snapshots are never overwritten.

Instead, Atlas builds a timeline that allows infrastructure evolution to be observed over time.

This historical model forms the foundation for change detection.

---

# Comparison Engine

The Comparison Engine transforms infrastructure data into meaningful understanding.

Responsibilities

* Compare snapshots
* Detect additions
* Detect removals
* Detect upgrades
* Detect regressions
* Generate meaningful change summaries

Atlas differentiates itself through this component.

---

# Database Responsibilities

The PostgreSQL database stores

* Users
* Domains
* Understanding jobs
* Infrastructure snapshots
* Historical changes
* Timelines
* Daily Infrastructure Briefs

The database represents Atlas' long-term memory.

Infrastructure modules remain stateless.

---

# Scalability Strategy

Atlas Version 1 follows a **Modular Monolith** architecture.

Reasons

* Easier development
* Faster debugging
* Simpler deployment
* Lower operational complexity
* Clear module boundaries

As Atlas grows, individual components such as the Scan Manager or Comparison Engine can be extracted into independent services without redesigning the overall platform.

---

# Design Principles

Atlas follows the following architectural principles.

### Single Responsibility

Each component has one clear responsibility.

---

### Loose Coupling

Infrastructure modules remain independent.

---

### High Cohesion

Related functionality remains grouped together.

---

### API First

All communication between the frontend and backend occurs through well-defined REST APIs.

---

### Platform Before Features

The platform should support future capabilities without requiring major architectural changes.

---

# Future Evolution

The architecture supports future capabilities including

* Background understanding jobs
* AI-generated explanations
* Team workspaces
* Notifications
* Public API
* Third-party integrations
* Marketplace modules
* Plugin ecosystem

These features can be introduced incrementally without altering the core platform.

---

# Architecture Summary

Atlas is designed as a platform that gains knowledge over time.

Infrastructure modules collect data.

The Comparison Engine creates understanding.

The Workspace communicates meaningful insights.

Together, these components fulfill Atlas' mission:

> **Know what changed. Understand why.**
