# FE-01 — Development Environment

**Document ID:** FE-01

**Version:** 1.0.0

**Status:** Architecture Freeze

**Owner:** Argonion Engineering

---

# 1. Purpose

This document defines the frontend development environment for Nebula.

It establishes the required tooling, project configuration, development workflow, environment variables, and integration prerequisites required for consistent frontend development.

---

# 2. Scope

This document covers:

- Development prerequisites
- Required software
- Repository structure
- Environment configuration
- Backend connectivity
- Authentication prerequisites
- Local development workflow
- Build process
- Code quality standards

---

# 3. Operating System

Supported development environments:

- Ubuntu 24.04 LTS (Primary)
- macOS (Supported)
- Windows (Supported via WSL2)

Ubuntu LTS remains the reference development environment.

---

# 4. Required Software

| Software | Purpose |
|----------|---------|
| Git | Version Control |
| Node.js (LTS) | Runtime |
| pnpm | Package Manager |
| Turbo | Monorepo Build System |
| Visual Studio Code | Recommended IDE |
| Google Chrome | Primary Browser |
| Docker Desktop / Docker Engine | Local Infrastructure |
| PostgreSQL | Backend Database |

---

# 5. Repository Layout

```

Atlas/

├── apps/
│ ├── api/
│ └── web/
│
├── packages/
│
├── docs/
│
└── frontend_docs/

```

Frontend development is performed exclusively inside:

```

apps/web

```

---

# 6. Frontend Stack

Core technologies:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- CSS Design Tokens

No additional frameworks should be introduced without architectural approval.

---

# 7. Environment Variables

Frontend configuration is supplied through `.env`.

Only public runtime configuration belongs in the frontend.

Examples include:

- Backend API URL
- Application Name
- Environment
- Analytics Configuration
- Public OAuth Redirect URLs

Secrets must never be stored in the frontend.

---

# 8. Backend Integration

Frontend communicates exclusively with the Nebula Backend API.

Development endpoint:

```

http://localhost:3000/api/v1

```

Swagger:

```

http://localhost:3000/api/docs

```

No direct database access is permitted.

---

# 9. Authentication Integration

Authentication is backend-managed.

Frontend responsibilities:

- Initiate authentication
- Maintain session awareness
- Handle redirects
- Display authentication state

Backend responsibilities:

- JWT issuance
- Cookie management
- Session validation
- Authorization
- OAuth
- Password security

---

# 10. Cookie Requirements

Nebula uses secure HTTP-only cookies.

Frontend never reads authentication cookies directly.

Browser automatically attaches cookies to authenticated requests.

API client must always send requests with credentials enabled.

---

# 11. OAuth Configuration

Supported providers:

- Google
- GitHub

Frontend initiates OAuth through backend endpoints.

OAuth callbacks terminate at the backend before redirecting to the frontend callback route.

Frontend never exchanges OAuth tokens.

---

# 12. Development Workflow

Standard workflow:

1. Start Backend
2. Start Frontend
3. Verify Backend Connectivity
4. Verify Authentication
5. Implement Feature
6. Validate API Integration
7. Run Quality Checks
8. Commit Changes

Frontend implementation should always target a running backend.

---

# 13. Build Process

Development builds prioritize fast feedback.

Production builds prioritize:

- Optimization
- Type Safety
- Asset Optimization
- Dead Code Elimination

Build failures must block deployment.

---

# 14. Browser Support

Primary support:

- Latest Google Chrome
- Latest Microsoft Edge
- Latest Mozilla Firefox
- Latest Safari

Older browsers are not targeted.

---

# 15. Code Quality

Every change must satisfy:

- Successful TypeScript compilation
- Successful production build
- Zero lint errors
- No unused exports
- No console debugging statements
- No hardcoded secrets

---

# 16. Environment Separation

Configuration is environment-specific.

Typical environments include:

- Development
- Testing
- Staging
- Production

Behavior must be driven by configuration rather than source code changes.

---

# 17. Engineering Principles

Frontend development follows these principles:

- Backend-first
- API-driven
- Component reuse
- Strong typing
- Secure by default
- Accessibility first
- Performance aware
- Responsive by design

---

# 18. Summary

The Nebula frontend development environment provides a standardized, reproducible foundation for engineering. All frontend development must follow the defined tooling, configuration, and integration practices to ensure consistency, maintainability, and seamless compatibility with the backend platform.