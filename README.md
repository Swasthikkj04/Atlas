<div align="center">

# NEBULA

### Infrastructure Intelligence Platform
*by Argonion*

**Understand. Reconstruct. Detect. Explain.**

An enterprise-grade Infrastructure Intelligence platform that continuously understands perimeter architecture, reconstructs causal timelines, and eliminates alert noise using verified telemetry and causal reasoning.

[![Status](https://img.shields.io/badge/status-production--ready-success)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB)](#)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](#)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](#)

</div>

---

## Vision

Nebula is an **Infrastructure Intelligence Platform** designed to give engineering teams unambiguous truth about their digital perimeter.

Instead of shallow uptime checks or fragmented log alerts, Nebula continuously analyzes DNS, HTTP wire signatures, TLS cryptography, and routing topologies to synthesize causal narratives, detect architectural drift, and maintain an immutable historical timeline.

---

## Core Capabilities

- **Zero-Agent Ingress & Perimeter Discovery**: Deep wire analysis, reverse proxy attribution, and multi-hop routing mapping.
- **Continuous State Forensics**: High-fidelity detection of infrastructure drift, DNSSEC/CAA configuration, and certificate rotation.
- **30+ Certified Technology Verticals**: Tailored intelligence models across Cloudflare, AWS CloudFront, Fastly, Akamai, NGINX, Envoy, Kubernetes, and Modern Web Frameworks.
- **Enterprise Security Boundaries (S1–S11)**: Strict tenant isolation, cryptographic session management, RBAC, and granular data retention policies.
- **Dual Surface Architecture**: Seamless transition from public guest perimeter discovery (`/guest`) directly into authenticated team workspaces (`/workspace`).

---

## Repository Structure

```
├── apps/
│   ├── api/             # NestJS API Gateway & Discovery Background Worker
│   └── web/             # React 19 + Tailwind v4 + Framer Motion Frontend SPA
├── docs/                # Canonical Backend & System Architecture Documentation
│   ├── archive/         # Archived historical sprint notes & exploration drafts
│   └── production/      # Production deployment foundation guides
├── frontend_docs/       # Canonical Frontend Architecture & Workspace Design Bible
├── infra/               # GCP Terraform modules, Cloud Run & Cloud SQL manifests
├── security/            # Security supply chain policies & dependency inventory
├── docker-compose.yml   # Local development runtime orchestration
├── pnpm-workspace.yaml  # Monorepo workspace configuration
└── turbo.json           # Turborepo build & test pipeline caching
```

---

## Canonical Documentation

The repository strictly adheres to a **Documentation-First Architecture**:

| Domain | Canonical Documents |
|:---|:---|
| **System & Philosophy** | [`docs/01-Vision.md`](docs/01-Vision.md) • [`docs/03-System-Architecture.md`](docs/03-System-Architecture.md) |
| **Database & Schema** | [`docs/04.1-Database-Architecture.md`](docs/04.1-Database-Architecture.md) |
| **API & Ingress** | [`docs/05-API.md`](docs/05-API.md) |
| **Security & Trust** | [`docs/11-Security&Trust-Architecture.md`](docs/11-Security&Trust-Architecture.md) • `docs/s-01` to `docs/s-10` |
| **Workspace & UX** | [`frontend_docs/workspace_bible.md`](frontend_docs/workspace_bible.md) • [`docs/12-workspace-Experience-Arch.md`](docs/12-workspace-Experience-Arch.md) |
| **Intelligence Engine** | [`docs/technology-fingerprinting-architecture.md`](docs/technology-fingerprinting-architecture.md) • [`docs/technology-infrastructure-meaning-engine.md`](docs/technology-infrastructure-meaning-engine.md) • [`docs/technology-finding-rules-architecture.md`](docs/technology-finding-rules-architecture.md) |
| **Production Foundation** | [`docs/production/gcp-production-foundation.md`](docs/production/gcp-production-foundation.md) |

---

## Getting Started

### Prerequisites

- Node.js >= 24
- pnpm >= 11
- Docker & Docker Compose

### Quickstart

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Swasthikkj04/Atlas.git
   cd Atlas
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start local infrastructure (PostgreSQL & Mailpit):**
   ```bash
   docker compose up -d
   ```

4. **Run database migrations:**
   ```bash
   pnpm --filter api exec prisma migrate dev
   ```

5. **Start full development stack:**
   ```bash
   pnpm dev
   ```
   - Web Application: `http://localhost:5173`
   - API Gateway: `http://localhost:3000/api/v1`

---

## Testing & Quality Gates

```bash
# Run all unit and integration contract suites
pnpm test

# Build production artifacts
pnpm build

# Run end-to-end Playwright test suite
pnpm test:e2e
```

---

## License

MIT © Argonion Inc.