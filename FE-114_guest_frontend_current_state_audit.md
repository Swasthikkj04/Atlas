# FE-114 — Guest Frontend Current-State & Adoption Audit

**Priority:** P0 — Blocking  
**Type:** Architecture / Discovery  
**Status:** Complete  
**Target Applications:** `apps/web` vs. `apps/SaaS Experience Design for Nebula (1)`  

---

## Executive Summary

A complete, read-only architectural audit was conducted across `apps/web` and the generated React Guest application (`apps/SaaS Experience Design for Nebula (1)`). 

**Key Findings:**
1. **Incomplete Adoption Root Cause:** The previous incremental adoption copied only 3 layout/header shell components (`GuestLayout.tsx`, `GuestHeader.tsx`, `BackgroundConstellation.tsx`) into `apps/web/src/features/guest/components/`. It left `GuestPage.tsx` as an empty fragment shell (`{/* Empty content for now */}`). **18 presentation, hook, service, and type files were completely omitted.**
2. **Zero Third-Party UI Blockers:** All 22 files comprising the generated Guest Experience depend exclusively on `react` (v18/v19), `motion/react` (Framer Motion v12), `lucide-react`, and CSS custom properties. None of the heavy third-party UI packages (`@radix-ui/*`, `@mui/*`, `recharts`, `emotion`) present in the generated app's `package.json` are used by the Guest components.
3. **Build & Lint Verification:** `apps/web` builds cleanly (`pnpm --filter web build`) and passes linting (`pnpm --filter web lint`) with zero errors. The generated React app builds cleanly via direct Vite build (`vite build`), though `pnpm --dir ... build` encounters pnpm script approval restrictions.
4. **Recommended Strategy:** **Strategy A (Full Monorepo Adoption)**. Migrate all 22 self-contained files into `apps/web/src/features/guest/` and incorporate missing Tailwind v4 base layer styles into `apps/web/src/index.css`.

---

## 1. Audit of `apps/web`

### 1.1 Codebase & Configuration Structure

`apps/web` is a modern Vite + React 19 single-page application configured with Tailwind CSS v4 and TypeScript.

```
apps/web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── index.html
├── public/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── vite-env.d.ts
    ├── assets/
    │   ├── branding/
    │   │   ├── argonion-mark.svg
    │   │   ├── argonion-wordmark.svg
    │   │   └── favicon.svg
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   ├── branding/
    │   ├── feedback/
    │   ├── layout/
    │   ├── navigation/
    │   └── ui/
    ├── features/
    │   ├── auth/
    │   │   └── AuthCallbackPage.tsx
    │   ├── guest/
    │   └── landing/
    ├── hooks/
    │   ├── useReducedMotion.ts
    │   └── useTheme.ts
    ├── services/
    │   ├── api/
    │   └── auth/
    ├── styles/
    │   ├── globals.css
    │   ├── foundation/
    │   └── semantic/
    │       ├── elevation.css
    │       └── theme.css
    ├── types/
    └── utils/
```

### 1.2 Configuration & Dependencies Summary

* **Entry Points:** `src/main.tsx` renders `<App />` wrapped in `<React.StrictMode>`. It imports `index.css` and `styles/globals.css`.
* **Routing:** Lightweight client-side path switching in `src/App.tsx` (`window.location.pathname` state with `popstate` and anchor click interception).
  * `/auth/callback*` → `<AuthCallbackPage />`
  * `/guest*` → `<GuestPage />`
  * Default (`/`) → `<LandingPage />`
* **Tailwind Configuration:** Uses `@tailwindcss/vite` (v4.3.3) plugin in `vite.config.ts`. Styles are configured via CSS `@theme` block in `src/index.css`.
* **Global CSS & Fonts:** `src/index.css` imports Google Fonts (`DM Sans`, `Newsreader`, `JetBrains Mono`), `@import "tailwindcss";`, and `./styles/semantic/theme.css`.
* **Package Dependencies (`package.json`):**
  * `react`: `^19.2.7`
  * `react-dom`: `^19.2.7`
  * `lucide-react`: `^0.487.0`
  * `motion`: `^12.23.24` (Framer Motion)
  * `@tailwindcss/vite`: `^4.3.3`
  * `tailwindcss`: `^4.3.3`
  * `vite`: `^8.1.1`

---

## 2. Audit of Current Guest Feature (`apps/web/src/features/guest/`)

### File Classification & Inventory

| File | Classification | Layer | Description & Dependencies | Rendered? | Mock Logic? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `index.ts` | **ADOPT** | Architecture / Barrel | Re-exports `GuestPage` from `./pages/GuestPage`. | Yes | No |
| `pages/GuestPage.tsx` | **REPLACE** | Presentation | Top-level view component. Currently renders an empty `<GuestLayout>` with `{/* Empty content for now */}`. | Yes | No (empty shell) |
| `components/GuestLayout.tsx` | **REPLACE** | Presentation | Layout container rendering `BackgroundConstellation`, `GuestHeader`, and a wrapper `div`. Defines `ContentWidth` and `SectionSpacer`. | Yes | No |
| `components/GuestHeader.tsx` | **REPLACE** | Presentation | Fixed top header (52px height) rendering "Argonion" wordmark, domain breadcrumb placeholder, and navigation buttons. | Yes | Yes (hardcoded props) |
| `components/BackgroundConstellation.tsx` | **REPLACE** | Presentation | Dynamic SVG background constellation node/edge grid with opacity transitions using `motion/react`. | Yes | Hardcoded SVG node positions |
| `README.md` | **KEEP** | Documentation | Feature documentation. | No | No |
| `hooks/` | **ADOPT** | Application | Empty directory. | No | No |
| `types/` | **ADOPT** | Infrastructure | Empty directory. | No | No |
| `utils/` | **ADOPT** | Infrastructure | Empty directory. | No | No |
| `assets/` | **ADOPT** | Infrastructure | Empty directory. | No | No |

---

## 3. Actual Render Path Trace

The actual execution tree starting from `apps/web/src/main.tsx` down to the `/guest` render state:

```
apps/web/src/main.tsx
   ↓ (imports ./index.css, ./styles/globals.css)
apps/web/src/App.tsx
   ↓ (checks window.location.pathname.startsWith('/guest'))
apps/web/src/features/guest/index.ts
   ↓ (exports default GuestPage)
apps/web/src/features/guest/pages/GuestPage.tsx
   ↓ (renders <GuestLayout>)
apps/web/src/features/guest/components/GuestLayout.tsx
   ├──> <BackgroundConstellation />
   ├──> <GuestHeader />
   └──> <div className="relative z-10 min-h-screen flex flex-col pt-[52px]">
           {/* Empty content for now */}
        </div>
```

**Browser Observation:** Renders only a fixed 52px top header bar with "Argonion", "Login", and "Create Workspace" links over a faint SVG background constellation. **The page body is 100% empty.**

---

## 4. Audit of Generated React Project (`apps/SaaS Experience Design for Nebula (1)`)

### 4.1 Directory Structure & Layout

```
apps/SaaS Experience Design for Nebula (1)/
├── package.json
├── vite.config.ts
├── postcss.config.mjs
├── index.html
├── default_shadcn_theme.css
└── src/
    ├── main.tsx
    ├── styles/
    │   ├── fonts.css
    │   ├── globals.css
    │   ├── index.css
    │   ├── tailwind.css
    │   └── theme.css
    ├── imports/
    │   ├── Desktop1/index.tsx
    │   └── pasted_text/nebula-experience-design.md
    └── app/
        ├── App.tsx
        ├── components/
        │   ├── figma/ImageWithFallback.tsx
        │   └── ui/ (48 radix/shadcn component files)
        └── guest/ (22 Guest Experience files)
```

### 4.2 Presentation & Infrastructure Categorization

#### A. Guest Presentation Components (`src/app/guest/`)
1. **`GuestPage.tsx`**: Central orchestrator. Controls state machine (`useGuestMachine`), theme (`useTheme`), accessibility (`useReducedMotion`), skip-link, header, hero, real-time understanding stage, error alert section, 6 progressive results sections, footer, and theme toggle.
2. **`GuestLayout.tsx`**: Shell wrapper establishing z-index stacking layers and screen boundaries.
3. **`GuestHeader.tsx`**: Top header bar with `LivingLogo`, domain breadcrumb, reset button, and auth CTAs.
4. **`HeroSection.tsx`**: Title, search/domain input, quick domain pills (`stripe.com`, `linear.app`, `github.com`), error callout, and `LivingSignature`.
5. **`LivingLogo.tsx`**: Animated SVG multi-ring logo.
6. **`LivingSignature.tsx`**: Dynamic status badge ("Analyzing public infrastructure...", "Signal verified", etc.).
7. **`BackgroundConstellation.tsx`**: SVG constellation particle grid responding to understanding phase and scroll depth.
8. **`UnderstandingStage.tsx`**: Animated step-by-step progress cards displaying rotating thinking sentences.
9. **`ExecutiveBrief.tsx`**: Section 1 — Narrative paragraphs and key infrastructure statistics grid.
10. **`TechnologySummary.tsx`**: Section 2 — Categorized tech stack cards (Cloudflare, AWS, React, Nginx, PostgreSQL, Redis, Stripe JS) with confidence badges and evidence counts.
11. **`ObservationsSection.tsx`**: Section 3 — Infrastructure finding cards (SPF soft-fail, HSTS preload, IPv6) with severity indicators and collapsible "Why it matters" sections.
12. **`TimelineSection.tsx`**: Section 4 — Interpretive engineering timeline entries showing architectural evolution over time.
13. **`EvidenceSection.tsx`**: Section 5 — Technical evidence appendix (HTTP, DNS, TLS, HTML/JS) with expandable raw payload viewers, SHA-256 hashes, and copy buttons.
14. **`WorkspaceConversion.tsx`**: Section 6 — Bottom CTA conversion card inviting transition to full Nebula workspace.
15. **`GuestFooter.tsx`**: Minimal page footer with status indicator.
16. **`ThemeToggle.tsx`**: Fixed floating bottom-right theme picker (Light / System / Dark).
17. **`ui.tsx`**: Shared presentation primitives (`ContentColumn`, `SectionLabel`, `ConfidenceBadge`, `SeverityBadge`, `ease`, `useReducedMotion`).

#### B. Demo & Application Infrastructure (`src/app/guest/`)
18. **`useGuestMachine.ts`**: Core state machine hook managing transitions (`IDLE` → `VALIDATING` → `UNDERSTANDING` → `PAUSING` → `UNDERSTOOD` → `CONVERTED` / `ERROR`), sentence advancement timers, progressive reveal delays (530ms per section), and analytics emissions.
19. **`api.ts`**: Simulated API layer (`postGuestUnderstand`, `getGuestJob`, `getExecutiveBrief`, `getTechnologies`, `getObservations`, `getTimeline`, `getEvidence`, `loadAssessmentData`). Contains comprehensive mock dataset for `stripe.com` infrastructure.
20. **`types.ts`**: Complete TypeScript domain model (`GuestPhase`, `GuestErrorCode`, `ExecutiveBriefData`, `Technology`, `Observation`, `TimelineEntry`, `EvidenceRow`, `isValidDomain`, `normalizeDomain`).
21. **`analytics.ts`**: In-memory event bus (`emit`, `subscribe`, `getEventHistory`) emitting structured GX telemetry events.
22. **`useTheme.ts`**: Theme state hook managing `light`, `dark`, or `system` mode and toggling `.dark` class on `document.documentElement`.

---

## 5. Comprehensive Application Comparison

| Generated React Element | `apps/web` Counterpart | Status in `apps/web` | Migration Decision |
| :--- | :--- | :--- | :--- |
| `GuestPage.tsx` | `src/features/guest/pages/GuestPage.tsx` | Empty shell rendering `<GuestLayout>` | **REPLACE** |
| `GuestLayout.tsx` | `src/features/guest/components/GuestLayout.tsx` | Shell layout missing skip link & proper props | **REPLACE** |
| `GuestHeader.tsx` | `src/features/guest/components/GuestHeader.tsx` | Missing `LivingLogo` import and status binding | **REPLACE** |
| `BackgroundConstellation.tsx` | `src/features/guest/components/BackgroundConstellation.tsx` | Incomplete animation bindings | **REPLACE** |
| `HeroSection.tsx` | Missing | Omitted | **ADOPT** |
| `LivingLogo.tsx` | Missing | Omitted | **ADOPT** |
| `LivingSignature.tsx` | Missing | Omitted | **ADOPT** |
| `UnderstandingStage.tsx` | Missing | Omitted | **ADOPT** |
| `ExecutiveBrief.tsx` | Missing | Omitted | **ADOPT** |
| `TechnologySummary.tsx` | Missing | Omitted | **ADOPT** |
| `ObservationsSection.tsx` | Missing | Omitted | **ADOPT** |
| `TimelineSection.tsx` | Missing | Omitted | **ADOPT** |
| `EvidenceSection.tsx` | Missing | Omitted | **ADOPT** |
| `WorkspaceConversion.tsx` | Missing | Omitted | **ADOPT** |
| `GuestFooter.tsx` | Missing | Omitted | **ADOPT** |
| `ThemeToggle.tsx` | Missing | Omitted | **ADOPT** |
| `ui.tsx` | Missing | Omitted | **ADOPT** |
| `useGuestMachine.ts` | Missing | Omitted | **ADOPT** |
| `useTheme.ts` | `src/hooks/useTheme.ts` | Global hook exists; local guest hook preferred | **ADOPT** (local hook) |
| `api.ts` | Missing | Omitted | **ADOPT** |
| `types.ts` | Missing | Omitted | **ADOPT** |
| `analytics.ts` | Missing | Omitted | **ADOPT** |
| `src/styles/theme.css` | `src/index.css` | Missing `@custom-variant dark` & `@layer base` | **ADOPT** (merge CSS) |
| Binary Assets | `src/assets/` | Existing logos in `branding/` | **KEEP** |

---

## 6. Critical Root Cause Analysis

Investigation into why previous incremental adoption produced an incomplete and broken Guest page:

1. **Severe Scope Omission (Component Dependencies):**  
   The previous attempt copied only 3 components (`GuestLayout`, `GuestHeader`, `BackgroundConstellation`), omitting 18 mandatory files. `GuestPage` in `apps/web` was left as an empty placeholder with `{/* Empty content for now */}`.
2. **Tightly-Coupled State Architecture:**  
   The Guest Experience is designed as an integrated single-page system. `GuestPage.tsx` relies on `useGuestMachine` to orchestrate 6 progressive results sections. Without the machine and the sub-components (`HeroSection`, `UnderstandingStage`, `ExecutiveBrief`, etc.), rendering `<GuestLayout>` produces an empty page.
3. **CSS Base Layer & Variant Discrepancy:**  
   The generated project's `theme.css` specifies `@custom-variant dark (&:is(.dark *));` and an `@layer base` block setting default typography, border colors, and element resets (`* { @apply border-border outline-ring/50; }`). `apps/web/src/index.css` lacks these base resets, causing raw `h1`-`h4`, `button`, and `input` elements to lose design system styling.
4. **Font & Token Definitions:**  
   Both projects import Google Fonts (`DM Sans`, `Newsreader`, `JetBrains Mono`). However, `apps/web/src/index.css` defines `--font-sans` differently in `@theme` compared to the generated inline theme.
5. **Asset Resolver Plugin Dependency:**  
   The generated `vite.config.ts` includes a custom `figmaAssetResolver` Vite plugin for `figma:asset/*` alias resolution. `apps/web/vite.config.ts` does not have this plugin. Components must use standard relative asset paths.
6. **Package Dependencies & Isolation:**  
   Although `apps/SaaS Experience Design for Nebula (1)/package.json` contains 50+ dependencies (including `@radix-ui/*`, `@mui/*`, `recharts`, `emotion`), **zero of these dependencies are imported by any Guest Experience file**. All 22 Guest files rely exclusively on standard React hooks, `motion/react`, and `lucide-react`, both of which are already present in `apps/web/package.json`.

---

## 7. Adoption Strategy Recommendation

### Recommended Strategy: **STRATEGY A (Adopt the complete Guest presentation tree into `apps/web`)**

### Technical Justification:

1. **Zero New Package Overhead:**  
   All 22 Guest files use only `react`, `motion/react`, and `lucide-react`. `apps/web/package.json` already contains `"motion": "^12.23.24"` and `"lucide-react": "^0.487.0"`. No new npm installations are required.
2. **Self-Contained Architecture:**  
   The Guest feature in `apps/SaaS Experience Design for Nebula (1)/src/app/guest/` has zero external dependencies on shadcn UI components, radix UI primitives, or MUI. It is completely modular and self-contained.
3. **Single Monorepo Target:**  
   Adopting the code directly into `apps/web/src/features/guest/` maintains a clean, single Vite build pipeline in `apps/web`. Strategy B (running a separate sub-app) would introduce multi-app routing complexity, sub-app hosting overhead, and pnpm build script issues without any technical benefit.
4. **Clean API Boundary:**  
   The `api.ts` module defines clear simulated API boundaries (`postGuestUnderstand`, `getExecutiveBrief`, `loadAssessmentData`). This makes future integration with Nebula's real backend endpoints straightforward.

---

## 8. Verification Results (Without Modification)

1. `pnpm --filter web build`  
   * **Status:** **PASSED (Exit Code 0)**  
   * **Output:** Built cleanly in 527ms (`dist/index.html` 3.05 kB, `dist/assets/index-CIOtdrqX.js` 357.97 kB).

2. `pnpm --filter web lint`  
   * **Status:** **PASSED (Exit Code 0)**  
   * **Output:** `eslint .` completed with 0 errors.

3. `pnpm --dir "apps/SaaS Experience Design for Nebula (1)" build`  
   * **Status:** **FAILED (Exit Code 1)** during dependency check due to pnpm script restrictions (`[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @tailwindcss/oxide@4.1.12, esbuild@0.25.12`).  
   * **Direct Exec Status:** Running `./node_modules/.bin/vite build` inside `apps/SaaS Experience Design for Nebula (1)` **PASSED (Exit Code 0)**, generating `dist/assets/index-CmPG_gTL.js 337.03 kB` in 3.92s.

---

## 9. Next Implementation Ticket Definition

### Proposed Ticket: FE-115 — Complete Guest Experience UI Adoption into `apps/web`

**Scope of FE-115:**
1. **Copy missing files** from `apps/SaaS Experience Design for Nebula (1)/src/app/guest/` into `apps/web/src/features/guest/`:
   * `pages/GuestPage.tsx`
   * `components/` (`GuestLayout`, `GuestHeader`, `HeroSection`, `LivingLogo`, `LivingSignature`, `BackgroundConstellation`, `UnderstandingStage`, `ExecutiveBrief`, `TechnologySummary`, `ObservationsSection`, `TimelineSection`, `EvidenceSection`, `WorkspaceConversion`, `GuestFooter`, `ThemeToggle`, `ui.tsx`)
   * `hooks/` (`useGuestMachine.ts`, `useTheme.ts`)
   * `services/` (`api.ts`, `analytics.ts`)
   * `types/` (`index.ts`)
2. **Merge CSS Definitions:** Update `apps/web/src/index.css` to include `@custom-variant dark (&:is(.dark *));` and `@layer base` element reset rules.
3. **Verification:** Confirm build (`pnpm --filter web build`), linting (`pnpm --filter web lint`), and visual preview at `/guest`.
