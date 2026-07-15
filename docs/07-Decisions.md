# 07 - Decisions.md

---

# Atlas Engineering Decisions

**Product:** Atlas

**Version:** v0.1.0

**Status:** Active

---

# Purpose

This document records important product and engineering decisions made during Atlas development.

Every significant decision should answer:

* Why was this decision made?
* What alternatives were considered?
* Why was the chosen approach selected?

This document prevents future confusion and preserves the reasoning behind Atlas.

---

# Decision 001

## Atlas is an Infrastructure Intelligence Assistant

**Status**

Accepted

**Decision**

Atlas is positioned as an **Infrastructure Intelligence Assistant**, not a website scanner or monitoring dashboard.

**Reason**

Users are looking for understanding, not raw technical information.

The product should explain changes rather than simply collect data.

---

# Decision 002

## Understanding Over Monitoring

**Status**

Accepted

**Decision**

Atlas focuses on answering:

> **What changed, and why should I care?**

instead of continuously displaying technical metrics.

**Reason**

Traditional monitoring tools already exist.

Atlas differentiates itself through understanding.

---

# Decision 003

## Workspace Instead of Dashboard

**Status**

Accepted

**Decision**

Atlas will use a **Workspace** rather than a traditional dashboard.

**Reason**

Dashboards often overwhelm users with charts and widgets.

The Workspace keeps users focused on understanding.

---

# Decision 004

## Guest Mode Before Login

**Status**

Accepted

**Decision**

Visitors may understand public websites without creating an account.

**Reason**

Atlas should earn user trust before requesting commitment.

Accounts enable persistence—not access.

---

# Decision 005

## Accounts Exist to Remember

**Status**

Accepted

**Decision**

Accounts are introduced only when users want Atlas to remember their infrastructure over time.

**Reason**

Users value continuity after experiencing the product.

This creates a natural onboarding flow.

---

# Decision 006

## Snapshots Are Immutable

**Status**

Accepted

**Decision**

Infrastructure snapshots are never modified after creation.

Every understanding creates a new snapshot.

**Reason**

Historical comparisons require permanent records.

Deleting or overwriting history weakens Atlas's intelligence.

---

# Decision 007

## Comparison Is the Core Product

**Status**

Accepted

**Decision**

Atlas compares infrastructure snapshots rather than presenting isolated scan results.

**Reason**

Meaningful change detection is Atlas's primary differentiator.

---

# Decision 008

## Modular Scanner Architecture

**Status**

Accepted

**Decision**

Every infrastructure capability is implemented as an independent module.

Examples

* HTML
* SSL
* DNS
* Technologies

**Reason**

Future capabilities can be added without changing the platform architecture.

---

# Decision 009

## Modular Monolith for Version 1

**Status**

Accepted

**Decision**

Atlas V1 will be implemented as a modular monolith.

**Reason**

Simpler development.

Lower operational complexity.

Easy future migration to microservices.

---

# Decision 010

## PostgreSQL as Primary Database

**Status**

Accepted

**Decision**

Atlas will use PostgreSQL as the primary relational database.

**Reason**

Reliable.

Strong relational model.

Excellent JSON support.

Suitable for historical data.

---

# Decision 011

## Human Language First

**Status**

Accepted

**Decision**

Atlas avoids unnecessary technical terminology.

Examples

Instead of:

* Scan
* Dashboard
* Report

Atlas prefers:

* Understand
* Workspace
* Timeline

**Reason**

The product should feel approachable while remaining technically accurate.

---

# Decision 012

## Progressive Disclosure

**Status**

Accepted

**Decision**

Information should appear gradually.

Atlas avoids overwhelming users with large dashboards.

**Reason**

Understanding improves when users consume information step by step.

---

# Decision 013

## Silence Is the Default

**Status**

Accepted

**Decision**

If nothing meaningful changed,

Atlas should confidently communicate that.

**Reason**

Confidence comes from reducing unnecessary noise.

Users should only be interrupted when something matters.

---

# Decision 014

## Daily Infrastructure Brief

**Status**

Accepted

**Decision**

Returning users are greeted with a concise Infrastructure Brief instead of raw metrics.

Example

> Good Morning.

> While you were away...

**Reason**

This reinforces Atlas's identity as an assistant rather than a reporting tool.

---

# Decision 015

## Build a Product, Not a Portfolio

**Status**

Accepted

**Decision**

Atlas will be developed using production-oriented engineering practices.

Examples

* Documentation
* Versioning
* Roadmaps
* CI/CD
* Clean Architecture

**Reason**

The goal is to create software that could realistically evolve into a commercial product.

---

# Decision 016

## Every Feature Must Earn Its Place

**Status**

Accepted

**Decision**

New features must solve a genuine user problem and reinforce Atlas's core promise.

Features added only because they are "interesting" are rejected.

**Reason**

Scope discipline leads to a better product.

---

# Decision 017

## Product Before Technology

**Status**

Accepted

**Decision**

Product decisions take priority over framework or technology choices.

**Reason**

Users choose products because they solve problems—not because of the technologies used to build them.

---

# Decision 018

## Tenant Isolation by Default

**Status**

Accepted

**Decision**

Atlas enforces strict tenant isolation across every layer of the application.

Every persistent business entity belongs to exactly one user through a well-defined ownership hierarchy. Every request must verify ownership before returning business data.

Authorization is enforced throughout:
* Authentication
* Middleware
* Service Layer
* Repository Layer
* Database

Generic resource lookups are discouraged in favor of ownership-aware repository methods.

**Reason**

User trust is Atlas' most valuable asset. Tenant isolation must be guaranteed by architecture rather than relying on developer discipline alone. Every user should have complete confidence that their infrastructure history, findings, and insights are visible only to them.

---

# Decision 019

## Historical Truth Is Immutable

**Status**

Accepted

**Decision**

Atlas never rewrites historical observations. The following entities are immutable after creation:
* Infrastructure Snapshot
* Infrastructure Finding
* Change History
* Infrastructure Brief

Corrections, improvements, or additional understanding are represented by new historical records rather than updates to existing data. Operational entities such as User, Domain, and Understanding Job remain mutable where appropriate because they represent current configuration or execution state.

**Reason**

Atlas is an Infrastructure Intelligence Assistant whose primary value lies in preserving an accurate historical timeline. Immutability ensures reproducibility, auditability, historical integrity, and long-term user trust.

---

# Decision 020

## Infrastructure Brief Ownership

**Status**

Accepted

**Decision**

Infrastructure Briefs belong to Infrastructure Snapshots rather than directly to Users or Domains.

Relationship:
```text
InfrastructureSnapshot
        │
        ▼
InfrastructureBrief