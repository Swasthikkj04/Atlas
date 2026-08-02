# Guest Experience Migration Plan — FE-MIG-001

## 1. Overview & Purpose

The `apps/web/guest-reference/` directory is a frozen, temporary engineering migration source containing the standalone Guest Experience application codebase.

### Key Purpose
- Serve as a production-ready reference during the Sprint 9 migration.
- Provide source code for promotion, merge, adaptation, and integration into Nebula's architecture.
- **`guest-reference/` is not production code, not part of the runtime application, and not a second frontend.**

---

## 2. Engineering Migration Rules

1. **Strict Import Boundary**: Never import production code from `guest-reference/`. No production file inside `src/` may reference `guest-reference`.
2. **Architecture Integration (AR-001)**: Every migrated module must be integrated into the Nebula frontend architecture (via promotion, merge, adaptation, extraction, or relocation).
3. **Module Compilation**: Every migrated module must compile successfully and pass linting before the next migration phase begins.
4. **Reference Preservation**: Until full migration verification and architecture approval, the original reference code in `guest-reference/` remains untouched.

---

## 3. Promotion Rules (AR-003)

Components and utilities that represent core Nebula platform capabilities rather than feature-specific Guest logic must be promoted to Nebula's shared architecture layers rather than remaining inside `features/guest/`.

### Promotion Targets:
- **`src/components/branding/`**: LivingLogo, brand marks, wordmarks
- **`src/components/ui/`**: ThemeToggle, shared UI primitives
- **`src/hooks/`**: `useTheme`, shared state and lifecycle hooks
- **`src/styles/`**: Shared motion primitives, constellation CSS animations
- **`src/services/api/`**: Base Guest API clients and HTTP infrastructure

---

## 4. Migration Phases (AR-002)

The migration follows Nebula's layered frontend architecture sequence:

1. **Phase 1: Workspace Preparation (FE-MIG-001)** — Completed
   - Renamed migration source to `guest-reference/`.
   - Excluded `guest-reference/` from build and lint tools.
   - Setup `src/features/guest/` destination directory structure.
   - Established migration plan and registry.

2. **Phase 2: Shared Infrastructure & Theme (FE-MIG-002)** — Completed
   - Extracted and promoted API clients, types, theme hook (`useTheme`), reduced motion hook (`useReducedMotion`), and motion primitives (`FadeUp`) to `src/hooks/`, `src/components/ui/`, `src/services/api/`, and `src/utils/`.

3. **Phase 3: Platform Branding (FE-MIG-003)** — Completed
   - Promoted platform capabilities (`LivingLogo`, `BackgroundConstellation`, brand constants & geometry) to `src/components/branding/`.

4. **Phase 4: Guest Feature Foundation (FE-MIG-004)** — Completed
   - Ported domain logic, API layer (`GuestApiClient`), analytics event bus, constants, types, and state machine (`useGuestMachine`) into `src/features/guest/`.

5. **Phase 5: Guest Presentation Migration (FE-MIG-005)** — Completed
   - Migrated full presentation layer (`GuestPage`, Layout, Hero, Executive Brief, Tech Summary, Observations, Timeline, Evidence, Workspace Conversion) to `src/features/guest/`.

6. **Phase 6: Routing & Application Integration (FE-MIG-006)** — Completed
   - Registered `/guest` route in `App.tsx` and wired Landing page CTAs and Auth navigation targets.

7. **Phase 7: Reference Cleanup & Graduation (FE-MIG-007)** — Completed
   - Removed temporary `guest-reference/` directory after 100% functional, architectural, and production build & lint verification.

---

## 5. Migration Registry (AR-004)

| Module | Source Path | Target Destination | Status |
|---|---|---|---|
| Guest Page | `guest-reference/src/app/guest/GuestPage.tsx` | `src/features/guest/pages/GuestPage.tsx` | Completed (FE-MIG-005) |
| Guest Layout & Header & Footer | `guest-reference/src/app/guest/GuestLayout.tsx` | `src/features/guest/components/layout/` | Completed (FE-MIG-005) |
| Hero Section & Stage | `guest-reference/src/app/guest/HeroSection.tsx` | `src/features/guest/components/hero/` | Completed (FE-MIG-005) |
| Executive Brief | `guest-reference/src/app/guest/ExecutiveBrief.tsx` | `src/features/guest/components/brief/` | Completed (FE-MIG-005) |
| Technology Summary | `guest-reference/src/app/guest/TechnologySummary.tsx` | `src/features/guest/components/technology/` | Completed (FE-MIG-005) |
| Observations Section | `guest-reference/src/app/guest/ObservationsSection.tsx` | `src/features/guest/components/observations/` | Completed (FE-MIG-005) |
| Timeline Section | `guest-reference/src/app/guest/TimelineSection.tsx` | `src/features/guest/components/timeline/` | Completed (FE-MIG-005) |
| Evidence Explorer | `guest-reference/src/app/guest/EvidenceSection.tsx` | `src/features/guest/components/evidence/` | Completed (FE-MIG-005) |
| Workspace Conversion | `guest-reference/src/app/guest/WorkspaceConversion.tsx` | `src/features/guest/components/conversion/` | Completed (FE-MIG-005) |
| Living Logo | `guest-reference/src/app/guest/LivingLogo.tsx` | `src/components/branding/LivingLogo.tsx` | Completed (FE-MIG-003) |
| Background Constellation | `guest-reference/src/app/guest/BackgroundConstellation.tsx` | `src/components/branding/BackgroundConstellation.tsx` | Completed (FE-MIG-003) |
| Brand Geometry & Tokens | `guest-reference/src/app/guest/BackgroundConstellation.tsx` | `src/components/branding/constants/` | Completed (FE-MIG-003) |
| Theme Toggle | `guest-reference/src/app/guest/ThemeToggle.tsx` | `src/components/ui/ThemeToggle.tsx` | Completed (FE-MIG-002) |
| `useTheme` Hook | `guest-reference/src/app/guest/useTheme.ts` | `src/hooks/useTheme.ts` | Completed (FE-MIG-002) |
| `useReducedMotion` Hook | `guest-reference/src/app/guest/ui.tsx` | `src/hooks/useReducedMotion.ts` | Completed (FE-MIG-002) |
| Motion Primitives (`FadeUp`) | `guest-reference/src/app/guest/ui.tsx` | `src/components/ui/FadeUp.tsx` | Completed (FE-MIG-002) |
| Platform Constants | `guest-reference/src/app/guest/constants/timings.ts` | `src/utils/constants.ts` | Completed (FE-MIG-002) |
| Base API Infrastructure | `guest-reference/src/app/guest/api/HttpGuestApiClient.ts` | `src/services/api/client.ts` | Completed (FE-MIG-002) |
| Guest API Client | `guest-reference/src/app/guest/api/GuestApiClient.ts` | `src/features/guest/api/` | Completed (FE-MIG-004) |
| Guest Domain Logic | `guest-reference/src/app/guest/domain/validation.ts` | `src/features/guest/domain/` | Completed (FE-MIG-004) |
| Guest Constants | `guest-reference/src/app/guest/constants/` | `src/features/guest/constants/` | Completed (FE-MIG-004) |
| Guest Types | `guest-reference/src/app/guest/types/` | `src/features/guest/types/` | Completed (FE-MIG-004) |
| Guest Analytics | `guest-reference/src/app/guest/analytics.ts` | `src/features/guest/analytics/` | Completed (FE-MIG-004) |
| `useGuestMachine` Hook | `guest-reference/src/app/guest/useGuestMachine.ts` | `src/features/guest/hooks/` | Completed (FE-MIG-004) |
| Application Routing & Integration | `guest-reference/` | `src/App.tsx`, `src/features/landing/` | Completed (FE-MIG-006) |
| Reference Cleanup & Graduation | `guest-reference/` | `apps/web/` | Completed (FE-MIG-007) |

---

## 6. Reference Deletion Policy (AR-005)

A file or module inside `guest-reference/` must **never** be removed until:
- The migrated implementation builds successfully in `src/`.
- Functional verification and tests pass cleanly.
- Architecture review approves the migrated implementation.

Full deletion of the `guest-reference/` folder will occur in **Phase 7: Reference Cleanup** only after the entire Guest Experience is fully integrated into Nebula.
