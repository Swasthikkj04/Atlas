# FE-13 — Frontend Implementation Guide

**Document ID:** FE-13  
**Version:** 1.0.0  
**Status:** Architecture Freeze  
**Owner:** Argonion Engineering  

---

## 1. Purpose & Scope

This document establishes the canonical implementation standards, engineering conventions, project workflows, and architectural rules for the **Nebula** frontend application (`apps/web`).

It bridges high-level architecture documents ([FE-00](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-00-Frontend-Architecture.md) through [FE-12](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-12-Performance.md)) into concrete, day-to-day coding practices. Adherence to this guide ensures that every feature developed is maintainable, performant, accessible, type-safe, and architecturally aligned with the Argonion platform.

---

## 2. Core Engineering Principles

Every engineer contributing to Nebula must adhere to eight foundational principles:

| Principle | Description | Rule |
| :--- | :--- | :--- |
| **Backend-First** | The backend is the single source of truth for business logic and state. | The frontend presents intelligence; it never makes business decisions or authorization evaluations. |
| **Component-First** | UIs are composed of modular, focused, and reusable functional components. | Every component solves a single responsibility and is decoupled from external globals. |
| **API-Driven** | All dynamic data flows from standardized, typed REST endpoints. | Direct database connections or informal data mutations are strictly prohibited. |
| **Strict Typing** | TypeScript is enforced in strict mode across the entire codebase. | No `any` types; all request payloads, responses, and domain entities must have formal types. |
| **Accessible by Design** | Every screen meets WCAG 2.1 AA accessibility standards out of the box. | Semantic HTML, full keyboard navigation, screen reader support, and focus management are mandatory. |
| **Responsive by Default** | Functionality remains complete across mobile, tablet, and desktop viewports. | Layouts adapt gracefully; features are never stripped solely because of viewport size. |
| **Zero-Trust Security** | Security credentials and session state are managed by the backend. | No JWTs, refresh tokens, or passwords are stored in `localStorage`, `sessionStorage`, or frontend state. |
| **Performance by Construction** | Fast rendering, minimal layout shifts, and optimized bundle footprints. | Lazy loading, request caching, deduplication, and memoization are built in from day one. |

---

## 3. Directory Structure & Architecture Boundaries

The application follows a **feature-oriented, layered modular architecture** inside `apps/web/src`:

```
apps/web/src/
├── app/                  # Application bootstrap, root providers, global wrappers
├── assets/               # Static assets (SVGs, brand iconography, typography)
├── components/           # Shared, domain-agnostic UI primitives
│   ├── branding/         # LivingLogo, LivingSignature, constellations
│   ├── feedback/         # Toast, Alert, Skeleton, Progress
│   ├── layout/           # Container, Grid, Section, Inline, Page
│   └── ui/               # Button, Input, Modal, Badge, Dropdown
├── config/               # Runtime environment configuration & constants
├── contexts/             # Global React contexts (Theme, Shell)
├── features/             # Domain-specific feature modules
│   ├── auth/             # Login, Registration, Password Reset, OAuth
│   ├── domain-details/   # Domain overview, health metrics, asset details
│   ├── explorer/         # Asset inventory, Knowledge Graph inspection
│   ├── findings/         # Findings explorer, explainability drawer
│   ├── guest/            # Guest understanding, split intelligence surface
│   ├── timeline/         # Causal timeline, drift history, snapshot diffs
│   └── workspace/        # Authenticated workspace landing, activity feeds
├── hooks/                # Global reusable custom React hooks
├── layouts/              # Shared layout shells (GuestLayout, WorkspaceLayout)
├── router/               # React Router configuration & route guards
├── services/             # Centralized HTTP API clients & Axios interceptors
├── styles/               # Global CSS variables, design tokens, Tailwind config
├── types/                # Shared TypeScript domain contracts & API DTOs
└── utils/                # Pure utility functions (formatting, date, validation)
```

> [!IMPORTANT]
> **Boundary Rule**: Feature modules must be self-contained. Feature-specific components, hooks, and types must remain inside their respective `features/<module>/` directory. Shared logic must be promoted to root-level `components/`, `hooks/`, or `services/` only when utilized by two or more distinct features.

---

## 4. Feature Development Lifecycle

Every feature follows a disciplined, structured lifecycle from requirement to deployment:

```
┌────────────────────────────────────────────────────────┐
│ 1. Requirement & Architecture Alignment (FE-00 - FE-12)│
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. Design Foundation & Token Mapping (FE-02, FE-03)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. Component & State Implementation (FE-07, FE-09)     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. API Integration & Type Contracts (FE-08)            │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 5. Accessibility & Responsive Verification (FE-10, FE-11)│
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 6. Automated Testing & Quality Gates (FE-13)           │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 7. Documentation Sync & Code Review                    │
└────────────────────────────────────────────────────────┘
```

---

## 5. Component Development Standards

### 5.1 Component Structure Template

Components must be defined as functional components with explicit TypeScript interfaces, semantic markup, and proper displayName assignment:

```tsx
import React, { memo } from 'react';
import { motion } from 'motion/react';
import type { Finding } from '@/types';

export interface FindingCardProps {
  finding: Finding;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export const FindingCard: React.FC<FindingCardProps> = memo(({
  finding,
  isSelected = false,
  onSelect,
  className = '',
}) => {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelect(finding.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(finding.id);
        }
      }}
      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-card border-primary ring-2 ring-primary/20 shadow-sm'
          : 'bg-card/60 border-border hover:border-border-hover'
      } ${className}`}
    >
      <header className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
          {finding.severity}
        </span>
        <time className="font-mono text-[10px] text-muted-foreground">
          {finding.detectedAt}
        </time>
      </header>

      <h3 className="font-serif text-base font-medium text-foreground mb-1">
        {finding.title}
      </h3>

      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {finding.description}
      </p>
    </article>
  );
});

FindingCard.displayName = 'FindingCard';
```

### 5.2 Component Best Practices

* **Single Responsibility**: One component does one job. Extract sub-sections when a component exceeds ~200 lines.
* **Pure Presentation**: Presentation components must not execute side effects or fetch data directly.
* **Prop Immutability**: Never mutate props directly; use immutability patterns for updates.
* **Keyboard Accessibility**: Any clickable non-button element must have `tabIndex={0}`, an ARIA role, and `onKeyDown` handling for `Enter` and `Space`.

---

## 6. State Management Standards

State is categorized into four distinct layers according to [FE-09-State-Management.md](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-09-State-Management.md):

```
┌────────────────────────────────────────────────────────┐
│ 1. Server State (TanStack Query / REST API Cache)      │
├────────────────────────────────────────────────────────┤
│ 2. Session State (AuthContext / HTTP-Only Cookies)     │
├────────────────────────────────────────────────────────┤
│ 3. Client UI State (Context / Local Feature Stores)    │
├────────────────────────────────────────────────────────┤
│ 4. Transient State (Component `useState` / Form State) │
└────────────────────────────────────────────────────────┘
```

### 6.1 State Ownership Rules

1. **Server State**: Managed exclusively via TanStack Query. Never copy server data into local `useState` or global stores unless creating an explicit editable draft.
2. **Derived State**: Compute values on the fly during render or via `useMemo`. Avoid synchronizing state variables with `useEffect`.
3. **Session State**: Session validity is dictated by backend HTTP cookies. The frontend only maintains boolean authentication awareness.

---

## 7. API Integration Standards

API communication strictly follows [FE-08-API-Integration.md](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-08-API-Integration.md):

### 7.1 Custom Query Hook Pattern

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api-client';
import type { DomainOverview, ApiError } from '@/types';

export const DOMAIN_KEYS = {
  all: ['domains'] as const,
  lists: () => [...DOMAIN_KEYS.all, 'list'] as const,
  details: () => [...DOMAIN_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...DOMAIN_KEYS.details(), id] as const,
  overview: (id: string) => [...DOMAIN_KEYS.detail(id), 'overview'] as const,
};

export function useDomainOverview(domainId: string) {
  return useQuery<DomainOverview, ApiError>({
    queryKey: DOMAIN_KEYS.overview(domainId),
    queryFn: async () => {
      const response = await api.get<DomainOverview>(`/api/v1/domains/${domainId}/overview`);
      return response.data;
    },
    enabled: Boolean(domainId),
    staleTime: 60 * 1000, // 1 minute fresh window
    retry: (failureCount, error) => {
      // Never retry on 401, 403, or 404
      if (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
```

---

## 8. Design System & Styling Conventions

Styling must use Tailwind CSS utility classes mapped directly to **Nebula Design Tokens** defined in [FE-02](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-02-Design-Foundation.md) and [FE-03](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-03-Design-System.md).

### 8.1 Styling Rules

* **Zero Hardcoded Colors**: Use semantic token classes (`text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `border-border`, `text-primary`).
* **Calm Typography**:
  * Headings: `font-serif` or `font-display`
  * Body Text: `font-sans`
  * System Identifiers, Dates, Code, Metrics: `font-mono`
* **Consistent Elevation & Radius**:
  * Borders: `rounded-lg`, `rounded-xl`, `border-border`
  * Surfaces: `bg-card/60 backdrop-blur-md`

---

## 9. Error Handling & Loading State Standards

### 9.1 Loading States
* **Skeletons Over Spinners**: Prefer layout-stable skeleton screens that mimic the target layout to prevent Cumulative Layout Shift (CLS).
* **Deterministic Transitions**: Fade in content smoothly with subtle motion (`motion/react` with standard cubic bezier curves `[0.4, 0, 0.2, 1]`).

### 9.2 Empty States
Every empty state must follow the **Explain & Guide** pattern:
1. Explain what is currently present (e.g., *"No critical findings detected"*).
2. Clarify why (e.g., *"All security headers and TLS certificates meet target specifications"*).
3. Provide the next logical action (e.g., *"Trigger manual verification"* or *"Explore technology inventory"*).

### 9.3 Error Normalization
Errors returned from the API are normalized into human-readable messages:

```tsx
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'An unexpected platform error occurred. Please try again.';
}
```

---

## 10. Performance & Optimization Standards

All code must adhere to [FE-12-Performance.md](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-12-Performance.md):

1. **Route Code Splitting**: All page-level route entries must be loaded lazily with `React.lazy()` and wrapped in a `<Suspense>` boundary.
2. **Heavy Computations**: Graph transformations, timeline aggregations, and large list filters must be memoized using `useMemo`.
3. **List Virtualization**: Any dynamic list exceeding 50 items must use virtual scrolling.
4. **Layout Stability**: Always reserve aspect-ratio or explicit dimensions for logos, charts, and loaded images.

---

## 11. Accessibility (a11y) Verification

Every component must pass accessibility checks before pull request submission:

* [ ] **Semantic Structure**: Proper heading hierarchy (`h1` $\to$ `h2` $\to$ `h3`) with only one `h1` per page.
* [ ] **Contrast Ratio**: Normal text achieves at least 4.5:1; large text achieves at least 3:1.
* [ ] **Focus Management**: Visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).
* [ ] **Keyboard Operability**: All interactive controls are navigable via `Tab`, `Space`, `Enter`, and `Escape`.
* [ ] **Reduced Motion**: All animations respect the `prefers-reduced-motion` media query.

---

## 12. Quality Gates & Definition of Done

A task or pull request is considered **Complete** only when all quality gates pass:

```bash
# 1. Type Verification (Zero Errors)
pnpm typecheck

# 2. Linting & Formatting
pnpm lint
pnpm format:check

# 3. Unit & Component Test Suite
pnpm test

# 4. Production Build Verification
pnpm build
```

### Pull Request Checklist

* [ ] Feature implements its designated specification document ([FE-00](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-00-Frontend-Architecture.md) through [FE-12](file:///home/swasthik-k-j/Desktop/Atlas/frontend_docs/FE-12-Performance.md)).
* [ ] No `any` type annotations or `@ts-ignore` comments without explicit architectural approval.
* [ ] No hardcoded colors, spacing values, or external font references.
* [ ] Error, loading, empty, and offline states are implemented and tested.
* [ ] Keyboard navigation and accessibility contrast verified.
* [ ] `frontend_docs/FE-CHANGELOG.md` updated with ticket reference.

---

## 13. Summary

Nebula's Frontend Implementation Guide ensures engineering excellence, cross-team consistency, and platform reliability. By adhering to these standards, the team builds an Infrastructure Intelligence Workspace that is calm, confident, and trustworthy.