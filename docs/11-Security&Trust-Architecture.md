# 11 - Security & Trust Architecture

**Product:** Atlas

**Version:** v0.2.0

**Status:** Active

**Owner:** Swasthik Gowda

**Technical Co-founder:** ChatGPT

---

# Purpose

This document defines the security, privacy, trust, and data protection architecture of Atlas.

Security is not implemented as an afterthought.

It is a foundational design principle that influences every layer of the platform, including product design, user experience, backend architecture, APIs, databases, and infrastructure.

Atlas protects user trust by ensuring that security is the default behavior rather than an optional feature.

---

# Security Philosophy

Atlas follows one simple belief.

> Trust is Atlas' most valuable feature.

Every engineering decision should strengthen user confidence.

Users should never wonder:

- Who can see my data?
- What information does Atlas store?
- Can another customer access my infrastructure?

The answer must always be clear.

Only you.

---

# Core Principles

Atlas is built upon six principles.

## 1. Security by Design

Security is designed before implementation.

Every feature is reviewed for:

- Authentication
- Authorization
- Data ownership
- Privacy
- Abuse prevention

before code is written.

---

## 2. Trust by Design

Atlas earns trust before requesting commitment.

Guest users may experience Atlas without creating an account.

Persistence begins only after users explicitly choose to let Atlas remember their infrastructure.

Accounts unlock continuity—not access.

---

## 3. Privacy by Design

Atlas stores only the minimum amount of information required to provide value.

Version 1 intentionally avoids collecting:

- Phone numbers
- Addresses
- Government identifiers
- Social profiles
- Personal preferences
- Tracking information

Every new field must justify its existence.

---

## 4. Least Privilege

Every component receives only the permissions it requires.

Examples:

- Frontend never accesses the database.
- Infrastructure modules never authenticate users.
- Scan modules never own business logic.
- APIs expose only required fields.

---

## 5. Defense in Depth

Security is enforced at multiple independent layers.

If one layer fails, another continues protecting user data.

Example:

JWT

↓

Middleware

↓

Authorization

↓

Repository

↓

Database

↓

Infrastructure

---

## 6. Secure by Default

The easiest way to write code should also be the safest.

Atlas architecture intentionally discourages insecure patterns.

Developers should not need to remember security.

The architecture should guide them.

---

## Tenant Isolation

Tenant isolation is a foundational architectural requirement of Atlas.

Every authenticated user owns an isolated dataset.

At no point should one user be capable of accessing another user's:

* Domains
* Understanding Jobs
* Infrastructure Snapshots
* Infrastructure Findings
* Change History
* Infrastructure Briefs

Ownership is enforced throughout the entire request lifecycle:

```text id="kwgkbo"
Authentication

↓

Authorization

↓

Service Layer

↓

Repository Layer

↓

Database
```

Security must never rely on a single layer.

Every layer independently reinforces tenant isolation using the principle of defense in depth.

---

# Ownership Model

Every persistent entity must have one clear owner.

Ownership hierarchy:

User

↓

Domain

↓

Understanding Job

↓

Infrastructure Snapshot

↓

Infrastructure Finding

↓

Change History

Infrastructure Briefs belong directly to the owning user.

No orphaned data should exist.

---

# Authentication

Version 1 authentication uses:

- JWT Access Tokens
- Password Hashing (Argon2id)

Passwords are never stored.

Only password hashes are persisted.

Sessions are validated before every protected request.

---

# Authorization

Authentication answers:

Who are you?

Authorization answers:

What are you allowed to access?

Atlas performs authorization on every protected request.

Ownership is verified before data is returned.

---
## Ownership Verification

Every protected operation within Atlas must verify ownership before accessing business data.

Repositories should avoid generic lookup methods such as:

```text id="sxp1vh"
findDomain(id)

findSnapshot(id)

findJob(id)
```

Instead, repositories should expose ownership-aware methods such as:

```text id="n08pcv"
findDomainForUser(userId, domainId)

findSnapshotForUser(userId, snapshotId)

listDomainsForUser(userId)
```

This design makes secure implementation the default behaviour and significantly reduces the likelihood of accidental cross-tenant data exposure.

# Repository Rules

Repositories should never expose methods such as:

findDomain(id)

findSnapshot(id)

findUser(id)

Instead:

findDomainForUser(userId, domainId)

findSnapshotForUser(userId, snapshotId)

listDomainsForUser(userId)

Security should be enforced through repository design.

---

# API Security

Every protected endpoint requires authentication.

Example:

GET /api/v1/domains/{domainId}

Internally becomes:

WHERE

domain.id = :domainId

AND

domain.userId = authenticatedUser.id

If no matching record exists:

Return:

404 Not Found

rather than

403 Forbidden

This avoids leaking resource existence.

---

# Database Security

The database follows these rules.

- UUID primary keys
- Immutable historical snapshots
- Foreign key integrity
- Composite uniqueness where required
- Indexed ownership fields
- No duplicated ownership

Future versions may introduce PostgreSQL Row-Level Security (RLS).

---

# Data Protection

Atlas stores only information required for its core functionality.

Passwords:

Stored as Argon2id hashes.

Emails:

Stored uniquely.

Infrastructure data:

Public information.

Historical understanding:

Private.

---
## Historical Integrity

Atlas distinguishes between operational data and historical knowledge.

Historical observations are immutable.

Once created, the following entities must never be modified:

* Infrastructure Snapshot
* Infrastructure Finding
* Change History
* Infrastructure Brief

Operational entities such as User and Domain remain mutable because they represent current configuration rather than historical observations.

If Atlas gains new knowledge or identifies an earlier mistake, new historical records are created rather than rewriting previous observations.

This preserves auditability, reproducibility, and user trust.

# Guest Mode Security

Guest users remain anonymous.

Guest understandings:

- Are temporary
- Are never persisted
- Leave no historical records

Persistence begins only after account creation.

This reflects Atlas' philosophy:

> Earn trust before asking for commitment.
## Guest Understanding Security

Guest users may understand publicly accessible infrastructure without creating an account.

Guest understandings are intentionally ephemeral.

Atlas does not persist guest Understanding Jobs, Snapshots, Findings, Change History, or Infrastructure Briefs within the primary database.

Persistence begins only after a user explicitly creates an account and chooses to let Atlas remember infrastructure over time.

This approach minimizes unnecessary data collection while reinforcing Atlas' Trust by Design philosophy.


---

# Logging

Logs must never contain:

- Passwords
- Tokens
- Sensitive headers
- Personal information

Operational logs should support debugging without exposing customer data.

---

# Future Security Enhancements

Planned features include:

- Email verification
- Password reset tokens
- Session management
- Audit logs
- Organizations
- Team roles
- API keys
- Two-factor authentication
- Row-Level Security
- Secret management
- Rate limiting
- Security monitoring

These features will be introduced incrementally without compromising existing architecture.

---

# Security Review Checklist

Before implementing any feature, ask:

- Does this expose unnecessary data?
- Is ownership enforced?
- Does the feature respect tenant boundaries?
- Is user privacy preserved?
- Can the API be abused?
- Does this collect unnecessary information?
- Does this reinforce trust?

If any answer is "No", redesign the feature.

---

# Atlas Security Promise

Atlas does not compete by collecting more data.

Atlas competes by protecting the data users choose to trust it with.

Every architectural decision should strengthen that trust.

Security protects systems.

Trust builds products.

Atlas is built on both.

## Security Review Checklist

Before implementing any new feature, every engineer should verify the following:

* Does every persistent entity have a clear owner?
* Is tenant isolation enforced?
* Are ownership checks performed before data access?
* Does the feature collect only necessary information?
* Are historical records protected from modification?
* Is the secure implementation also the easiest implementation?
* Does the feature strengthen user trust?

If any answer is **No**, the feature should be redesigned before implementation.

