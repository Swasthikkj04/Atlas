# Nebula Repository & Product Audit

## 1. Executive Summary

Overall assessment:

    Repository Health: Poor. Contains numerous duplicated components, dead files, and unmigrated Figma artifacts.
    Architecture Health: Fair. Backend respects boundaries and NestJS patterns, but frontend lacks strict boundaries.
    Frontend Health: Poor. Fragmented between direct and context-aware flows, duplicate implementations exist, and design system components are bypassed.
    UX Health: Fair. The intent is good, but the duplicate flows and lack of robust context preservation hinder the experience.
    Design System Health: Poor. Tailwind classes frequently override or bypass defined design tokens.
    Security Health: Fair. Authentication has standard controls, but the separation between session and guest claims needs tighter validation.
    Documentation Health: Fair. Documentation is extensive but drifting due to uncompleted migration steps from Atlas to Nebula.
    Test Health: Good. Extensive tests are written and passing once the environment is properly configured.

The repository requires a structured cleanup phase to eliminate duplicated and abandoned frontend code generated from prototypes, consolidate the routing layer, and enforce strict adherence to design tokens.

---

## 2. Critical Findings

- **Unmigrated Figma Prototyping Code**: An entire parallel prototype workspace (`apps/SaaS Experience Design for Nebula (1)`) exists alongside the main application. This creates severe technical debt and confusion about the source of truth.
- **Fragmented Authentication Flows**: The `CreateWorkspacePage.tsx` duplicates complex state logic and handles two entirely distinct "modes" (context-aware vs direct) by checking query parameters, violating the Single Responsibility Principle.

---

## 3. Repository Cleanup Candidates

| Path | Classification | Evidence | Risk | Recommendation |
|------|----------------|----------|------|----------------|
| `apps/SaaS Experience Design for Nebula (1)/` | E — Confirmed obsolete | Contains prototype code, duplicate `package.json` with 50+ unused UI libraries, duplicate `GuestPage.tsx` | Low | DELETE |
| `apps/web/src/features/auth/pages/CreateWorkspacePage.tsx` | F — Duplicate | Implements duplicate layout structure compared to `CreateWorkspaceSurface.tsx` | Medium | CONSOLIDATE |
| `apps/web/src/App.tsx` | H — Requires architectural decision | Mixes exact matches and `.startsWith()` resulting in fragile route resolution | Medium | REFACTOR |
| `docs/FE-114_guest_frontend_current_state_audit.md` | D — Potentially obsolete | Is a snapshot of an older state and should be archived | Low | MOVE |
| `apps/web/src/features/landing/TopSection.tsx` | D — Potentially obsolete | Wraps components redundantly and is bypassed in modern pages | Low | DELETE |

---

## 4. Duplicate / Overlapping Implementations

- **`CreateWorkspacePage` vs `CreateWorkspaceSurface`**: `CreateWorkspacePage.tsx` renders its own form and state machine for the same functionality ostensibly provided by `CreateWorkspaceSurface.tsx`.
- **Guest Experience**: Components in `apps/web/src/features/guest/` are duplicated from the `SaaS Experience Design` package, but without the appropriate state hook (`useGuestMachine.ts`), which was left behind in the prototype folder.

---

## 5. Routing Audit

| Route | Component | Purpose | Status | Issue |
|------|-----------|---------|--------|-------|
| `/` | `LandingPage` | Public marketing | Active | Uses relative paths that could break. |
| `/guest` | `GuestPage` | Contextual infrastructure understanding | Active | Missing the state machine logic required to drive the experience. |
| `/auth/register` | `CreateWorkspacePage` | Account creation | Duplicate | Handled by `CreateWorkspacePage` which mixes direct and context-aware flows. |
| `/auth/login` | `LoginPage` | Authentication | Active | Fine, but contains complex logic for extracting domain context. |
| `/auth/verify-email` | `VerifyEmailPage` | Email verification | Active | - |
| `/workspace` | `WorkspacePage` | Authenticated dashboard | Active | Mixed with `/dashboard` fallback. |

---

## 6. Authentication Audit

- **Registration**: Implemented with Argon2 hashing and email verification requirements.
- **Login**: Issues HTTP-Only cookies securely.
- **Verification**: Consumes a single-use token and appropriately transitions user state to ACTIVE.
- **OAuth**: Google and GitHub OAuth implementations exist, though email verification checks on OAuth can fail if the user's primary email isn't verified in the provider.
- **Guest Claim**: Claim token is persisted insecurely via URL parameters and `sessionStorage`, making it prone to loss during OAuth redirects or tab closures.

---

## 7. Guest → Workspace Audit

The guest flow attempts to preserve context using `sessionStorage` (`nebula_guest_claim`). However, the transition from Guest to Registration to Verification to Authenticated Workspace is fragile because if a user opens the verification email in a different browser, the `sessionStorage` context is lost.

---

## 8. Create Workspace Audit

- **Context-aware Mode**: Retrieves context from URL/session storage and attempts to preserve it.
- **Direct Mode**: Standard account creation without context.
The distinction is managed via complex `useMemo` hooks inside the component rather than structurally separated routes or providers, leading to a bloated `CreateWorkspacePage`.

---

## 9. Email Verification Audit

- Token generation is cryptographically secure.
- Expiry is enforced.
- Development uses Mailpit successfully.
- UX handles resends and cooldowns appropriately.

---

## 10. Design System Audit

- Hardcoded colors like `bg-[#f8f9fc]` found in `TopSection.tsx` bypass Tailwind and design tokens.
- Font families are repeatedly hardcoded (`const SERIF = ...`) inside individual page components instead of utilizing CSS variables from the theme layer.

---

## 11. Design Flaws

| Severity | Screen | Problem | Why | Recommendation |
|----------|--------|---------|-----|----------------|
| High | Guest | Page renders blank due to missing state hook. | Broken user experience. | Complete migration of `useGuestMachine.ts`. |
| Medium | Create Workspace | Mixed concerns between context-aware and direct modes. | Confuses users if context is lost. | Split into two distinct page components. |
| Medium | Landing Page | Hardcoded inline styles in `TopSection.tsx`. | Breaks theme consistency. | Remove inline styles and use design tokens. |

---

## 12. UX / Product Flaws

The product feels slightly generic during the "Direct Mode" of registration because it shares the same component structure as the "Context-Aware" mode but simply hides the context cards, leaving an awkward void.

---

## 13. Accessibility Audit

- Input fields in the Auth features utilize appropriate labels and ARIA attributes.
- Password toggle buttons have correct `aria-label`s.
- However, focus outlines are sometimes overridden or diminished by custom Tailwind classes.

---

## 14. Responsive Audit

- The application generally uses flexible flex-col layouts that adapt to mobile.
- Some hardcoded widths or missing overflow handling may exist in the raw Evidence sections of the Guest experience.

---

## 15. Backend Architecture Audit

- Follows standard NestJS module boundaries with controllers, services, and repositories.
- DTOs are well-structured.
- No immediate "God Services" detected, though `understanding.worker.ts` could become bloated over time.

---

## 16. Database Audit

- The schema accurately reflects the architecture documents (e.g., separating `User` from `UserSession`).
- Relationships are correctly defined with foreign keys and cascade deletions where appropriate.

---

## 17. API Contract Audit

The API contracts (`RegisterDto`, `LoginDto`, etc) are consistent with frontend expectations. Validation is strictly enforced using `class-validator`.

---

## 18. Security Audit

- **Medium**: `sessionStorage` is used to persist guest context (`nebula_guest_claim`), which is lost if verification occurs on another device/browser.
- CSRF protections and JWT HttpOnly cookies are correctly utilized.
- Passwords have strong policy validations.

---

## 19. Dependency Audit

- The `apps/SaaS Experience Design for Nebula (1)` package contains dozens of unused UI libraries (`@radix-ui/*`, `recharts`, `framer-motion` alongside `motion/react`, etc).
- `apps/web` accurately relies on minimal dependencies (`react`, `motion/react`, `lucide-react`).

---

## 20. Documentation Drift

- The `docs/` folder still refers to "Atlas" in numerous places (`README.md`, `CHANGELOG.md`, `08-Design-Bible.md`), while the prompt specifies the brand is now "Nebula".
- The frontend docs have not been fully updated to reflect the fragmented state of the Guest Experience migration.

---

## 21. Recommended Cleanup Plan

### P0 — Must Fix Before Next Feature
- Complete the migration of the Guest Experience logic (`useGuestMachine.ts` and related files) from the Figma prototype folder to `apps/web/src/features/guest/`.
- Delete the `apps/SaaS Experience Design for Nebula (1)` directory to remove technical debt.

### P1 — Should Fix Soon
- Consolidate `CreateWorkspacePage.tsx` and `CreateWorkspaceSurface.tsx`.
- Remove hardcoded fonts and inline styles across frontend components, enforcing strict use of the Design Tokens.

### P2 — Technical Debt
- Refactor `App.tsx` routing to use a more robust router (e.g. `react-router-dom` or similar context-based router).

### P3 — Nice to Have
- Update all documentation files to replace "Atlas" with "Nebula" to resolve brand drift.

---

## 22. Recommended Design Improvements

1. Improve the visual distinction between "Direct" and "Context-Aware" workspace creation, rather than just hiding elements.
2. Introduce persistent cross-device context preservation (e.g., appending the claim context securely to the email verification link).

---

## 23. Recommended Next Tickets

    AUDIT-002 — Remove obsolete frontend artifacts (SaaS Experience Design folder)
    AUDIT-003 — Complete Guest Experience state machine migration
    UX-001 — Fix verification recovery UX for cross-device context preservation
    DESIGN-001 — Resolve hardcoded token violations in frontend components
    ARCH-001 — Refactor App.tsx to use a standardized routing library
