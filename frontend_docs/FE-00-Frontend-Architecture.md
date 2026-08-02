# FE-00 — Frontend Architecture

**Document ID:** FE-00

**Version:** 1.0.0

**Status:** Architecture Freeze

**Owner:** Argonion Engineering

---

# 1. Purpose

This document defines the architecture of the Nebula frontend.

It establishes the engineering principles, architectural boundaries, technology decisions, integration model, and user experience philosophy that govern frontend development.

The frontend exists to transform Nebula's infrastructure intelligence into a fast, secure, intuitive, and trustworthy user experience while remaining a thin presentation layer over the backend platform.

This document is the canonical reference for frontend architecture.

---

# 2. Scope

This document defines:

- Frontend architectural principles
- System responsibilities
- Layered architecture
- Application composition
- Integration with backend services
- Authentication architecture
- Guest experience architecture
- Workspace architecture
- State ownership
- Rendering strategy
- Performance principles
- Security principles
- Frontend engineering rules

Implementation details are documented separately.

---

# 3. Design Philosophy

Nebula is an Infrastructure Intelligence Platform.

The frontend must communicate intelligence, not complexity.

Every interaction should help users understand their infrastructure with confidence.

The frontend should feel:

- Calm
- Fast
- Predictable
- Professional
- Trustworthy
- Focused

The interface should never overwhelm users with excessive controls, unnecessary navigation, or redundant information.

---

# 4. Architectural Principles

The frontend follows these principles.

## 4.1 Backend First

Business logic belongs to the backend.

The frontend presents information.

The frontend must never become a second business layer.

---

## 4.2 API Driven

Every piece of data displayed in the UI originates from stable backend APIs.

The frontend does not infer business rules.

The backend remains the source of truth.

---

## 4.3 Experience Driven

The application is organized around user experiences rather than pages.

Examples include:

- Guest Experience
- Authentication Experience
- Workspace Experience
- Infrastructure Understanding Experience
- Search Experience
- Timeline Experience

Each experience is composed of multiple components working together toward a single user goal.

---

## 4.4 Progressive Disclosure

Information is revealed only when needed.

High-level summaries are presented first.

Users progressively explore:

Executive Brief

↓

Highlights

↓

Infrastructure Overview

↓

Evidence

↓

Raw Details

This prevents cognitive overload.

---

## 4.5 Consistency

Every experience follows consistent:

- Navigation
- Layout
- Typography
- Motion
- Colors
- Component behavior
- Error handling
- Loading states

Consistency reduces learning effort.

---

## 4.6 Accessibility

Accessibility is a core engineering requirement.

Every interaction must support:

- Keyboard navigation
- Screen readers
- Focus visibility
- Color contrast
- Reduced motion

Accessibility is considered during design, not added afterward.

---

## 4.7 Security by Default

Authentication is managed by the backend.

The frontend never stores:

- JWTs
- Refresh Tokens
- OAuth Tokens
- Passwords

Authentication relies on secure HTTP-only cookies.

---

# 5. Frontend Responsibilities

The frontend is responsible for:

- Rendering user interfaces
- User interactions
- Client-side routing
- API communication
- Session awareness
- Optimistic user experience
- Loading states
- Error presentation
- Accessibility
- Responsive behavior

---

# 6. Frontend Non-Responsibilities

The frontend must never implement:

- Authentication logic
- Authorization decisions
- Infrastructure discovery
- Rule evaluation
- Business validation
- Permission enforcement
- Infrastructure intelligence generation
- Session security
- Token generation

These responsibilities belong exclusively to the backend.

---

# 7. High-Level Architecture

```

                 Browser

                     │

                     ▼

          React Application

                     │

     ┌───────────────┼───────────────┐

     ▼               ▼               ▼

 Presentation    Application     Integration

     │               │               │

     └───────────────┼───────────────┘

                     ▼

             Nebula Backend API

                     ▼

             Infrastructure Engine

```

The frontend communicates only with the backend API.

It never communicates directly with databases or external providers.

---

# 8. Layered Architecture

The frontend is divided into four logical layers.

## Presentation Layer

Responsible for:

- Layouts
- Pages
- Components
- Typography
- Animations
- User interaction

This layer contains no business logic.

---

## Application Layer

Responsible for:

- Experience orchestration
- Routing
- State coordination
- Workflow management

This layer coordinates experiences.

---

## Integration Layer

Responsible for:

- API communication
- Authentication
- HTTP requests
- Query caching
- Error translation

All backend communication passes through this layer.

---

## Infrastructure Layer

Responsible for:

- Configuration
- Environment variables
- Logging
- Utilities
- Shared helpers

No user-facing functionality exists here.

---

# 9. Directory Structure

The frontend follows a feature-oriented architecture.

Each directory has a single responsibility and clear ownership.

```
apps/web/src
│
├── app/                 # Application bootstrap
├── assets/              # Fonts, icons, images
├── components/          # Shared reusable UI
├── layouts/             # Application layouts
├── modules/             # Feature modules
├── pages/               # Route entry pages
├── router/              # Routing configuration
├── services/            # API clients
├── hooks/               # Shared hooks
├── contexts/            # React contexts
├── providers/           # Global providers
├── stores/              # Client-side state
├── styles/              # Global styles
├── types/               # Shared types
├── utils/               # Utilities
└── config/              # Runtime configuration
```

Feature-specific logic remains inside its respective module.

---

# 10. Rendering Strategy

Nebula is implemented as a Single Page Application (SPA).

The frontend communicates with the backend exclusively through REST APIs.

Rendering strategy:

- Initial application bootstrap
- Client-side routing
- Incremental data fetching
- Progressive loading
- Lazy module loading

The frontend does not generate business data.

---

# 11. Routing Architecture

Routing follows user experiences rather than technical modules.

Primary route groups include:

```
/

Guest

Authentication

Workspace

Settings

Administration
```

Protected routes require an authenticated backend session.

Guest routes never expose authenticated workspace resources.

---

# 12. Authentication Architecture

Authentication is fully backend-managed.

The frontend is authentication-aware but never authentication-responsible.

Authentication responsibilities include:

- Initiating login
- Initiating registration
- OAuth redirection
- Session awareness
- Logout

The frontend never:

- Stores JWTs
- Stores Refresh Tokens
- Generates Tokens
- Validates JWTs

Authentication relies entirely on secure HTTP-only cookies.

---

# 13. Guest Experience Architecture

Guest users interact with Nebula without creating an account.

Guest workflow:

```
Landing

↓

Guest Understanding

↓

Understanding Progress

↓

Executive Summary

↓

Guest Conversion

↓

Workspace Activation
```

Guest sessions remain isolated from authenticated workspaces.

Guest state is maintained by the backend using GuestSession.

---

# 14. Workspace Architecture

The authenticated workspace is the primary product experience.

Workspace responsibilities include:

- Executive Brief
- Infrastructure Timeline
- Domains
- Findings
- Snapshots
- Search
- Recommendations
- Settings

Every workspace is backed by authenticated backend APIs.

The frontend never infers workspace state independently.

---

# 15. Backend Integration Architecture

All backend communication passes through a centralized integration layer.

Responsibilities include:

- HTTP client
- Authentication cookies
- Request interceptors
- Response interceptors
- Error normalization
- Retry policies

Components never communicate directly with REST endpoints.

---

# 16. API Communication Model

API communication follows a consistent lifecycle.

```
User Action

↓

API Request

↓

Backend Validation

↓

Business Processing

↓

API Response

↓

State Update

↓

UI Update
```

Every request should be cancellable, recoverable, and observable.

---

# 17. State Ownership Model

State is divided into clearly defined categories.

## Server State

Owned by the backend.

Examples:

- User
- Domains
- Findings
- Snapshots
- Timeline
- Executive Brief

Managed through API requests.

---

## Client State

Owned by the frontend.

Examples:

- Open dialogs
- Active tabs
- Selected rows
- Filters
- Theme
- Sidebar state

Never persisted as business data.

---

## Session State

Represents authentication awareness.

Examples:

- Current user
- Authentication status
- Session expiration

Session validity is determined by the backend.

---

## Temporary UI State

Short-lived interaction state.

Examples:

- Hover
- Drag
- Loading
- Toasts
- Form editing

Never synchronized with backend services.

---

# 18. Environment Configuration

Runtime configuration is provided through environment variables.

Configuration includes:

- Backend API URL
- Application metadata
- Feature flags
- Analytics configuration
- OAuth callback URLs

Sensitive values remain on the backend.

Frontend environment variables must never contain secrets.

---

# 19. Error Handling Strategy

Errors are categorized into:

- Validation Errors
- Authentication Errors
- Authorization Errors
- Network Errors
- Server Errors
- Unknown Errors

Users receive actionable, human-readable feedback.

Internal error details are never exposed.

---

# 20. Loading Strategy

Every asynchronous experience must define loading behavior.

Preferred loading order:

- Skeleton UI
- Progressive content
- Incremental updates
- Final state

Loading indicators should preserve layout stability.

---

# 21. Empty State Strategy

Every experience must define an empty state.

Empty states should:

- Explain why data is absent
- Suggest the next action
- Avoid technical language

Empty states are part of the user experience.

---

# 22. Performance Principles

Performance is treated as an architectural requirement.

Guidelines include:

- Lazy loading
- Route-based code splitting
- Efficient caching
- Request deduplication
- Minimal re-rendering
- Asset optimization

Performance optimizations must not compromise usability.

---

# 23. Security Principles

Frontend security follows zero-trust principles.

The frontend:

- Never trusts client-side state
- Never bypasses backend validation
- Never exposes secrets
- Never stores credentials

All authorization decisions are enforced by the backend.

---

# 24. Technology Stack

Core technologies include:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- CSS Design Tokens

Technology choices should prioritize maintainability and long-term stability.

---

# 25. Engineering Standards

Frontend engineering follows these principles:

- Reusable components
- Feature isolation
- Strong typing
- Predictable state
- Accessible interfaces
- Responsive layouts
- Secure integration
- Consistent user experience

Implementation should favor simplicity over unnecessary abstraction.

---

# 26. Quality Attributes

The frontend architecture prioritizes:

- Maintainability
- Scalability
- Performance
- Accessibility
- Security
- Reliability
- Consistency
- Testability

Every architectural decision should strengthen one or more of these attributes.

---

# 27. Architecture Summary

Nebula's frontend is a presentation and interaction layer built on top of a stable backend platform.

It is experience-driven, API-centric, security-first, and designed to communicate infrastructure intelligence with clarity and confidence.

Business rules, authentication, authorization, and infrastructure intelligence remain exclusively within the backend, while the frontend focuses on delivering a responsive, intuitive, and trustworthy user experience.