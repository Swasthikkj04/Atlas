# Atlas Development Environment

**Product:** Atlas

**Version:** v0.2.0

**Status:** Required Before Sprint 1

---

# Purpose

This document records the required development environment for Atlas.

Every contributor should configure their machine according to this guide before writing code.

---

# Operating System

Ubuntu 24.04 LTS

---

# Git

Version

2.43.0

Verify

```bash
git --version
```

---

# GitHub

Authentication Method

SSH

Verify

```bash
ssh -T git@github.com
```

Expected

```
Hi <username>! You've successfully authenticated...
```

---

# Node.js

Managed using

NVM (Node Version Manager)

Current Version

24.18.0 LTS

Verify

```bash
node -v
```

---

# npm

Version

11.16.0

Verify

```bash
npm -v
```

---

# pnpm

Version

11.13.0

Verify

```bash
pnpm -v
```

---

# Docker

Version

29.1.3

Verify

```bash
docker --version
```

---

# Docker Compose

Version

2.27.0

Verify

```bash
docker compose version
```

---

# Git Configuration

Username

swasthikkj04

Email

swasthikgowdakj@gmail.com

Verify

```bash
git config --global user.name
git config --global user.email
```

---

# VS Code Extensions

Required

- ESLint
- Prettier
- Docker
- Prisma
- GitLens
- Tailwind CSS IntelliSense
- Error Lens
- Thunder Client
- DotENV

Recommended

- Material Icon Theme
- Path Intellisense
- Todo Tree
- EditorConfig

---

# Development Standards

Package Manager

pnpm

Node Management

nvm

Version Control

Git + GitHub (SSH)

Containerization

Docker Compose

Database

PostgreSQL (Docker)

---

# Status

✅ Development environment configured.

Ready to begin Atlas Sprint 1.

---

Last Updated

July 2026

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