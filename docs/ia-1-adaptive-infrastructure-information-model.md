# IA-1: Adaptive Infrastructure Information Model

**Phase:** Infrastructure Experience Architecture  
**Priority:** P0 — Blocking T13  
**Status:** 🔒 COMPLETE & CERTIFIED  
**Scope:** Dedicated `/workspace/infrastructure`  
**Depends on:** T4 → T12, TA-1, TA-2  

---

## 1. Executive Summary & Objective

IA-1 replaces the fixed 8-box infrastructure assumption with a data-driven **Adaptive Infrastructure Information Model**.

```
            BACKEND TRUTH
                  │
                  ▼
       Observed Infrastructure
                  │
                  ▼
      Normalized Components
                  │
                  ▼
       Semantic Categories
                  │
                  ▼
     Generic Infrastructure UI
                  │
                  ▼
       /workspace/infrastructure
```

The dedicated Infrastructure surface (`/workspace/infrastructure`) dynamically reflects what Nebula actually understands about the target domain, without forcing websites into artificial, symmetrical templates or manufacturing empty cards for unobserved categories.

---

## 2. Core Architecture & Information Model

### 2.1 Canonical Normalization Contract
Implemented in [`apps/web/src/features/workspace/contracts/adaptive-infrastructure.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/contracts/adaptive-infrastructure.contract.ts):

- **Adaptive Component Structure:**
  - `id`: Deterministic identifier
  - `category`: Semantic category (`EDGE`, `GATEWAY`, `APPLICATION`, `PLATFORM`, `RUNTIME`, `HOSTING`, `DNS`, `TLS`, `NETWORK`, `DATABASE`, `CACHE`, `SECURITY`, `OTHER`)
  - `name`: Authoritative technology / component name
  - `version`: Optional version string (preserved when evidenced, never synthesized as `"Unknown"`)
  - `role`: Canonical infrastructure role
  - `layer`: Topology layer (`EDGE`, `GATEWAY`, `APPLICATION`, `PLATFORM`, `RUNTIME`, etc.)
  - `confidence`: Calibrated confidence score and level (`HIGH`, `MEDIUM`, `LOW`, `INCONCLUSIVE`)
  - `whyDetected`: Evidence reason summary
  - `whatThisDoesNotProve`: Authoritative anti-overreach claim boundary
  - `evidenceReferences`: Lineage evidence references

### 2.2 Semantic Categorization Without Hardcoding
Categorization is purely data-driven from backend topology layers and categories. The frontend contains **0 technology-specific branches** (`if (technology === '...')`).

### 2.3 Adaptive Composition Examples
- **Domain A (Next.js + React + Cloudflare + NGINX + Node.js):**
  - Displays `EDGE` (Cloudflare), `GATEWAY` (NGINX), `APPLICATION` (Next.js, React), `RUNTIME` (Node.js).
  - Unobserved `DATABASE` remains in the Unobservable Dimensions section without generating empty cards.
- **Domain B (Django + Python + NGINX):**
  - Displays `GATEWAY` (NGINX), `APPLICATION` (Django), `RUNTIME` (Python).
  - Zero `EDGE` or `PLATFORM` cards rendered.
- **Domain C (WordPress 6.4.2 + PHP 8.2.14 + Fastly + NGINX):**
  - Displays `EDGE` (Fastly), `GATEWAY` (NGINX), `PLATFORM` (WordPress), `RUNTIME` (PHP).

---

## 3. Extensibility Invariant (Future Technology Gate)

A synthetic future technology (`T13_TEST`, `category: 'RUNTIME'`, `version: '1.0.0-rc1'`) integrates into the Infrastructure view seamlessly with 0 frontend code additions.

---

## 4. Acceptance Matrix & Verification

| Requirement | Behavior | Status |
| :--- | :--- | :---: |
| **Cloudflare-only Evidence** | Only relevant `EDGE` infrastructure appears | 🔒 PASS |
| **NGINX Detected** | Appears under `GATEWAY` semantic role | 🔒 PASS |
| **PHP Detected** | Appears under `RUNTIME` without implying WordPress | 🔒 PASS |
| **WordPress Detected** | Appears under `PLATFORM` without inventing database or plugins | 🔒 PASS |
| **React Detected** | Appears under `APPLICATION` without creating Next.js | 🔒 PASS |
| **Docker Detected** | Appears under `RUNTIME` without creating Kubernetes | 🔒 PASS |
| **No Database Evidence** | No fabricated database cards; honest `[UNOBSERVED]` state | 🔒 PASS |
| **Version Unavailable** | Renders without `"Version: Unknown"` clutter | 🔒 PASS |
| **Future Extensibility** | `T13_TEST` renders through generic engine | 🔒 PASS |
| **Domain Switch** | State completely clears and reflects new domain | 🔒 PASS |
| **Overview Tab** | Completely untouched | 🔒 PASS |

---

## 5. Test Suite Verification

- **Contract Spec:** [`workspace-adaptive-infrastructure.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-adaptive-infrastructure.spec.ts) (**8 tests passed**).
- **Full Web Test Suite:** **650 suites passed**, **1,038 tests passed**.
- **Full Backend Test Suite:** **125 suites passed**, **707 tests passed**.
