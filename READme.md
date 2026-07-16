# Atlas

> **Know what changed. Understand why.**

Atlas is an **Infrastructure Intelligence Assistant** that continuously observes public web infrastructure, remembers its evolution, and explains meaningful changes over time.

Instead of forcing engineering teams to jump between multiple infrastructure tools, Atlas quietly watches websites and surfaces only the insights that matter.

---

## Why Atlas?

Understanding a website today usually means visiting multiple tools:

* SSL Checkers
* DNS Lookup Tools
* Technology Detectors
* Performance Analyzers
* HTTP Header Inspectors

Each tool answers a different question.

None answers the most important one:

> **What changed, and why should I care?**

Atlas exists to answer that question.

---

## Product Philosophy

Atlas is built around one belief:

> **Engineers deserve understanding, not information overload.**

Atlas aims to become an assistant rather than another dashboard.

It watches.

It remembers.

It compares.

It explains.

So engineers can spend less time investigating and more time building.

---

## Core Promise

**Know what changed. Understand why.**

---

## Current Status

**Version:** v0.1.0

Atlas has completed **Sprint 0 – Product Discovery**.

During Sprint 0 we established:

* Product Vision
* Product Requirements
* System Architecture
* Database Design
* API Specification
* Engineering Decisions
* Design Philosophy
* Development Roadmap

Implementation begins in **Sprint 1**.

---

## Planned Architecture

```text
Browser
    │
React Frontend
    │
REST API
    │
Node.js Backend
    │
Scan Manager
    │
Infrastructure Modules
    ├── HTML
    ├── DNS
    ├── SSL
    ├── Technologies
    └── HTTP Headers
    │
PostgreSQL
    │
Comparison Engine
    │
Workspace
```

---

## Planned Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript

### Database

* PostgreSQL

### Infrastructure

* Docker
* GitHub Actions
* Nginx
* Ubuntu Linux

---

## Planned Features

### Guest Understanding

Understand any public website without creating an account.

---

### Personal Workspace

Save domains, monitor infrastructure, and review historical changes.

---

### Infrastructure Timeline

Observe how websites evolve over time.

---

### Daily Infrastructure Brief

Receive a concise summary of meaningful changes since your last visit.

---

### Historical Snapshots

Atlas remembers infrastructure so users don't have to.

---

## Repository Structure

```text
atlas/

├── docs/
├── frontend/
├── backend/
├── docker/
├── nginx/
├── .github/
├── README.md
└── CHANGELOG.md
```

---

## Documentation

Project documentation is located in the `docs/` directory.

* Vision
* Product Requirements
* System Architecture
* Database Design
* API Specification
* Development Roadmap
* Engineering Decisions
* Design Bible

---

## Development Philosophy

Atlas is developed using production-oriented engineering practices.

Every feature follows the workflow:

```
Think

↓

Design

↓

Document

↓

Build

↓

Test

↓

Deploy

↓

Improve
```

---

## Current Roadmap

* ✅ Sprint 0 — Product Discovery
* ⏳ Sprint 1 — Foundation
* ⏳ Sprint 2 — Authentication & Workspace
* ⏳ Sprint 3 — Understanding Engine
* ⏳ Sprint 4 — Infrastructure Intelligence
* ⏳ Sprint 5 — Product Experience
* ⏳ Sprint 6 — Testing & Public MVP

---

## Contributing

Atlas is currently under active development.

Contribution guidelines will be published in a future release.

---

## License

License information will be added before the first public release.

---

## Our Promise

Atlas is not built to collect more data.

Atlas is built to create confidence.

It quietly watches infrastructure, remembers its history, and explains only what truly matters.

**Know what changed. Understand why.**
