# IA-2: Adaptive Infrastructure Detail & Progressive Disclosure

**Phase:** Infrastructure Experience Architecture  
**Priority:** P0  
**Status:** 🔒 COMPLETE & CERTIFIED  
**Depends On:** IA-1 🔒  
**Blocks:** IA-3 / Infrastructure Experience Certification  
**Scope:** Dedicated `/workspace/infrastructure`  

---

## 1. Executive Summary & Objective

IA-2 establishes an adaptive infrastructure investigation experience with **3-Tier Progressive Disclosure** for `/workspace/infrastructure`.

```
          BACKEND TRUTH
                │
                ▼
  IA-1 Semantic Infrastructure Model
                │
                ▼
    IA-2 Adaptive Detail Model
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
 Level 1     Level 2     Level 3
Understanding Context   Evidence
```

The infrastructure page answers:
> *"What does Nebula actually know about this infrastructure, and what authentic evidence supports it?"*

Without forcing every website into a rigid template or manufacturing empty cards for unobserved categories.

---

## 2. 3-Tier Progressive Disclosure Architecture

Implemented in [`adaptive-infrastructure-detail.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/contracts/adaptive-infrastructure-detail.contract.ts) and [`AdaptiveInfrastructureDetailCard.tsx`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/components/overview/AdaptiveInfrastructureDetailCard.tsx):

### Level 1 — Understanding (Immediately Visible)
- Component Name (e.g. `WordPress`, `NGINX`, `PHP`, `React`)
- Version badge (e.g. `v6.4.2`, `v8.2.14` — rendered **only** when evidenced; never synthesized as `"Version: Unknown"`)
- Layer badge (e.g. `PLATFORM`, `GATEWAY`, `RUNTIME`, `APPLICATION`)
- Role (e.g. `Content Management Platform`, `Web Gateway / Reverse Proxy`)
- Calibrated confidence indicator (e.g. `HIGH Confidence`)

### Level 2 — Context (Interactive Disclosure: "Why this appears")
- Infrastructure meaning & detection context (e.g. `Manages dynamic content publishing and administrative surfaces.`)
- Authoritative anti-overreach claim boundary with shield warning (e.g. `WordPress presence does not prove MySQL, WooCommerce, or specific plugins.`)

### Level 3 — Evidence (Explicit Investigation: "View evidence →")
- Verified evidence signals (e.g. `<meta name="generator" content="WordPress 6.4.2" />`, `/wp-content/`)
- Evidence source type (e.g. `HTTP / HTML response`, `HTTP / Response Headers`)
- Observed timestamp (e.g. `27 Aug 2026 · 15:14`)
- Calibrated evidence confidence

---

## 3. Core Invariants & Quality Standards

1. **Zero Technology-Specific Hardcoding:**
   - **0** `if (technology === '...')` branches exist across the contract or renderer.
   - All technology verticals (T4–T12 and synthetic future `T13_TEST`) pass through the exact same normalization pipeline.
2. **No Fabricated Attributes or Symmetrical Cards:**
   - Unobservable dimensions (`Database Backend`, `Host OS`) reside cleanly in the dedicated Unobservable Dimensions section at the bottom with `[UNOBSERVED]` status.
3. **Multi-Technology Independence:**
   - Framework pairs (`Next.js` + `React`) and runtime pairs (`PHP` + `Docker`) remain separate, independent component cards.
4. **Domain Switching Complete State Cleansing:**
   - Switching domains completely clears active models, expanded accordions, and evidence drawers.
5. **Re-Understanding Truth Replacement:**
   - Fresh backend verification immediately replaces previous state without merging obsolete components.
6. **Overview Tab Untouched:**
   - `CompactInfrastructureOverview` on the Overview tab remains 100% untouched.

---

## 4. Acceptance Matrix & Verification

| Requirement | Behavior | Status |
| :--- | :--- | :---: |
| **Cloudflare Only** | Only verified Cloudflare infrastructure appears | 🔒 PASS |
| **NGINX** | Appears under Gateway with optional version | 🔒 PASS |
| **WordPress** | Appears under Platform with CMS role | 🔒 PASS |
| **PHP** | Appears under Runtime with PHP session/header evidence | 🔒 PASS |
| **React** | Appears under Application without creating Next.js | 🔒 PASS |
| **Next.js + React** | Both appear independently | 🔒 PASS |
| **Docker** | Appears under Runtime without creating Kubernetes | 🔒 PASS |
| **No Database Evidence** | No database card; honest `[UNOBSERVED]` state | 🔒 PASS |
| **Version Unavailable** | Renders without `"Version: Unknown"` | 🔒 PASS |
| **Evidence Available** | Evidence path reveals signals, source, timestamp | 🔒 PASS |
| **Domain Switch** | Complete state isolation | 🔒 PASS |
| **Re-understanding** | New truth replaces stale presentation | 🔒 PASS |
| **Future T13 Technology** | Renders with 3-tier disclosure with 0 code change | 🔒 PASS |
| **Overview Tab** | Completely untouched | 🔒 PASS |

---

## 5. Test Suite Certification

- **IA-2 Automated Spec:** [`workspace-adaptive-infrastructure-detail.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-adaptive-infrastructure-detail.spec.ts) (**11 tests passed**).
- **IA-1 Automated Spec:** [`workspace-adaptive-infrastructure.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-adaptive-infrastructure.spec.ts) (**8 tests passed**).
- **Master Frontend Verification:** [`workspace-infrastructure-understanding-master.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-infrastructure-understanding-master.spec.ts) (**Passed**).
- **Full Web Test Suite:** **662 suites passed**, **1,049 tests passed**.
- **Full Backend Test Suite:** **125 suites passed**, **707 tests passed**.
