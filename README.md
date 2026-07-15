<div align="center">

# Atlas

### Infrastructure Intelligence Assistant

**Understand. Monitor. Detect. Explain.**

An enterprise-grade Infrastructure Intelligence platform that continuously understands, monitors, detects changes, and explains web infrastructure using modern cloud-native architecture and AI.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)

</div>

---

# Vision

Atlas is an Infrastructure Intelligence Assistant designed to help organizations understand and monitor their public infrastructure.

Instead of simply checking whether a website is online, Atlas continuously discovers infrastructure details, detects meaningful changes, and generates AI-powered summaries that explain what changed and why it matters.

Our goal is to transform infrastructure monitoring from raw technical data into actionable operational intelligence.

---

# Core Features

- Infrastructure Understanding Engine
- Continuous Infrastructure Monitoring
- Change Detection
- AI Generated Infrastructure Briefs
- Historical Infrastructure Timeline
- Domain Management
- Multi-Tenant SaaS Architecture
- Secure Authentication
- REST API
- PostgreSQL + Prisma
- Documentation-First Development

---

# Architecture

```text
                +----------------------+
                |      Frontend        |
                +----------+-----------+
                           |
                           v
                +----------------------+
                |     NestJS API       |
                +----------+-----------+
                           |
         +-----------------+-----------------+
         |                 |                 |
         v                 v                 v
 Authentication   Understanding Engine   Monitoring
         |                 |                 |
         +-----------------+-----------------+
                           |
                           v
                +----------------------+
                |      PostgreSQL      |
                +----------------------+
                           |
                           v
                     Prisma ORM
```

---

# Technology Stack

| Category | Technology |
|-----------|------------|
| Language | TypeScript |
| Backend | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| Monorepo | Turborepo |
| Package Manager | pnpm |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Authentication | JWT |
| AI | OpenAI (planned) |

---

# Repository Structure

```
Atlas/

├── apps/
├── packages/
├── infrastructure/
├── docs/
├── prisma/
├── .github/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

# Documentation

The project follows a **Documentation-First Development** workflow.

Documentation includes:

- Vision
- Product Requirements
- System Architecture
- Database Design
- API Specification
- Roadmap
- Design Bible
- Coding Standards
- Engineering Decisions
- Security Architecture
- Changelog
- Contributing Guide

---

# Development

Clone the repository:

```bash
git clone https://github.com/Swasthikkj04/Atlas.git
```

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL:

```bash
docker compose up -d
```

Run database migrations:

```bash
pnpm prisma migrate dev
```

Start development:

```bash
pnpm dev
```

---

# Project Status

Atlas is currently under active development.

Current progress:

- ✅ Documentation
- ✅ Architecture
- ✅ Database Design
- ✅ Prisma Schema
- ✅ Initial Migration
- 🚧 Authentication
- 🚧 Domain Management
- ⏳ Understanding Engine
- ⏳ Monitoring Engine
- ⏳ AI Infrastructure Briefs
- ⏳ Dashboard

---

# Roadmap

- Authentication
- Domain Registration
- Infrastructure Understanding
- Infrastructure Monitoring
- Change Detection
- AI Summaries
- Notifications
- Team Workspaces
- Public API
- Enterprise Features

---

# Contributing

Contributions are welcome.

Please read the documentation inside the `docs/` directory before contributing.

---

# License

MIT License

---

<div align="center">

**Atlas**

Infrastructure Intelligence Assistant

Built with ❤️ using TypeScript, NestJS, PostgreSQL and Prisma.

</div>