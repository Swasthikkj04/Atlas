# 04 - Database-Design.md

---

# Atlas Database Design

**Product:** Atlas

**Version:** v0.1.0

**Database:** PostgreSQL

**Status:** Sprint 0 – Approved

**Related Documents**

* 01-Vision.md
* 02-Product-Requirements.md
* 03-System-Architecture.md

---

# Overview

The Atlas database serves as the long-term memory of the platform.

Unlike traditional monitoring systems that overwrite previous values, Atlas preserves historical infrastructure snapshots so users can understand how websites evolve over time.

The database is designed around one core principle:

> **Atlas remembers everything necessary to explain change.**

## Database Design Principles

Atlas follows a documentation-first approach to database design. The database is not simply a persistence layer—it is the long-term memory of the platform.

Every model, relationship, and constraint must satisfy the following principles before implementation.

### Security by Design

Security is considered before implementation. Every entity must enforce clear ownership boundaries and support secure access patterns throughout the application.

### Trust by Design

Atlas earns user trust before requesting long-term commitment. Guest users may understand public infrastructure without creating an account. Persistent storage begins only after users explicitly choose to let Atlas remember their infrastructure.

### Privacy by Design

Atlas stores only the information required to deliver value. Unnecessary personal information is intentionally excluded from the data model.

### Tenant Isolation

Atlas is a multi-tenant SaaS platform.

Every persistent record belongs to exactly one tenant through a well-defined ownership hierarchy. At no point should one user be capable of accessing another user's infrastructure, history, or generated insights.

Tenant isolation is a non-negotiable architectural requirement.

### Historical Truth Is Immutable

Historical observations represent facts recorded by Atlas at a specific point in time.

Infrastructure Snapshots, Infrastructure Findings, Change History, and Infrastructure Briefs are immutable. Atlas never rewrites historical truth. Corrections or new understanding are represented by new records rather than modifications to existing history.

### Documentation First

The approved documentation is the source of truth.

Database implementations, Prisma models, migrations, and application code must faithfully implement the documented architecture rather than defining it.

---

# Database Philosophy

Atlas does not store websites.

Atlas stores **understanding**.

Each scan creates a historical snapshot.

Each snapshot contributes to the knowledge Atlas builds over time.

Nothing is overwritten.

History is preserved.

---

# Database Goals

The database should:

* Store user information securely.
* Remember watched domains.
* Preserve every infrastructure snapshot.
* Track meaningful changes.
* Generate Infrastructure Briefs.
* Support future scalability.

---

# High-Level Entity Relationship

```text
Users
   │
   │ 1:N
   ▼
Domains
   │
   │ 1:N
   ▼
Understanding Jobs
   │
   │ 1:1
   ▼
Infrastructure Snapshots
   │
   │ 1:N
   ▼
Infrastructure Findings
   │
   │
   ▼
Change History

User
 └── Domain
      ├── UnderstandingJob
      ├── InfrastructureSnapshot
      │      ├── InfrastructureFinding
      │      └── InfrastructureBrief
      └── ChangeHistory
```

---
## Ownership Hierarchy

Every persistent entity within Atlas has a single, clearly defined owner.

Ownership is inherited through relationships rather than duplicated across models.

```text
User
 └── Domain
      ├── UnderstandingJob
      ├── InfrastructureSnapshot
      │      ├── InfrastructureFinding
      │      └── InfrastructureBrief
      └── ChangeHistory
```

This ownership hierarchy provides:

* Strong tenant isolation
* Simplified authorization
* Reduced data duplication
* Consistent cascade behaviour
* Clear auditability

# Core Tables

## users

Purpose

Stores Atlas accounts.

Columns

* id
* full_name
* email
* password_hash
* created_at
* updated_at

Relationships

One user owns many domains.

---

## domains

Purpose

Stores websites watched by users.

Columns

* id
* user_id
* domain_name
* monitoring_enabled
* created_at
* updated_at

Example

```
github.com

openai.com

atlas.dev
```

One domain belongs to one user.

---

## understanding_jobs

Purpose

Represents every understanding request.

A job may be started by

* Guest
* User
* Automatic monitoring

Columns

* id
* domain_id
* status
* started_at
* completed_at
* triggered_by

Status

* Pending
* Running
* Completed
* Failed

---

## infrastructure_snapshots

Purpose

Represents one complete understanding of a website.

Each snapshot stores the overall result of one understanding session.

Columns

* id
* domain_id
* job_id
* response_time
* http_status
* created_at

Every understanding creates one snapshot.

Snapshots are never updated.

---

## infrastructure_findings

Purpose

Stores the detailed findings belonging to one snapshot.

Examples

SSL

DNS

Headers

Technologies

Performance

Redirects

Each finding belongs to one snapshot.

Columns

* id
* snapshot_id
* category
* key
* value

Example

```
Category

SSL

Key

TLS Version

Value

TLS 1.3
```

Another Example

```
Category

Technology

Key

Framework

Value

Next.js
```

This flexible design lets Atlas support future scanners without changing the database schema.


---

## change_history

Purpose

Stores meaningful differences detected between two snapshots.

Columns

* id
* domain_id
* previous_snapshot_id
* current_snapshot_id
* category
* severity
* title
* description
* detected_at

Example

```
Performance decreased by 9%

Likely caused by larger JavaScript bundles.
```

This table powers Atlas' timeline.

---

## infrastructure_briefs

Purpose

Stores the summaries presented to users.

Example

```
Good Morning.

While you were away...

• SSL renewed

• CDN changed

• Performance decreased
S
Everything else remains healthy.
```

Columns

id
snapshot_id
summary
created_at
## Understanding Behaviour

For registered users, every manual understanding represents a deliberate request to capture the current state of a domain.

Each manual understanding always creates:

* One Understanding Job
* One Infrastructure Snapshot
* Infrastructure Findings
* Infrastructure Comparison
* One Infrastructure Brief

Atlas never overwrites previous historical observations.

Instead, every understanding contributes to the domain's historical timeline, allowing Atlas to explain infrastructure evolution over time.

---

#
---

# Historical Model

Atlas never replaces old data.

Every understanding creates a new snapshot.

Comparison occurs between snapshots.

This approach enables:

* Infrastructure timelines
* Historical comparisons
* Regression detection
* Trend analysis

---

# Why Snapshots?

Traditional systems overwrite values.

Atlas preserves them.

Example

```
Yesterday

HTTP/2

↓

Today

HTTP/3
```

Without snapshots,

the previous state disappears.

Atlas intentionally preserves history.

---

# Extensibility

Future infrastructure modules should not require database redesign.

Adding

* Accessibility
* SEO
* Security
* API
* Kubernetes

should only create additional findings.

No new core tables should be necessary.

---

# Normalization Strategy

Atlas follows normalization principles to reduce redundancy.

Separate tables exist for:

* Users
* Domains
* Jobs
* Snapshots
* Findings
* Changes
* Briefs

Relationships are maintained using foreign keys.

---

# Indexing Strategy

Primary indexes

* user_id
* domain_id
* snapshot_id
* created_at

Additional indexes may be introduced based on production usage.

---

# Future Tables (Not Version 1)

These tables are intentionally postponed.

* notifications
* teams
* workspaces
* api_keys
* billing
* audit_logs
* plugins
* integrations
* deployments

---

# Database Principles

Atlas follows these rules.

## Snapshots are immutable.

Once created,

they are never modified.

---

## History is permanent.

Understanding improves because history exists.

---

## Findings are modular.

Every infrastructure module stores data using the same flexible model.

---

## The database remembers.

Infrastructure modules remain stateless.

Atlas learns by remembering.

---

# Database Summary

The Atlas database is not simply a storage system.

It is the platform's memory.

Every snapshot increases Atlas' understanding.

Every comparison creates knowledge.

Every piece of knowledge helps users answer one question:

> **What changed, and why does it matter?**


