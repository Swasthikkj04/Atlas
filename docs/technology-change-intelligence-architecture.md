# Technology Change Intelligence & Architecture Drift Architecture

**Document Type:** Architectural Reference & Domain Intelligence Guide  
**Status:** Implemented (TECH-006)  
**Priority:** P0 — Core Change Intelligence  
**Module:** `apps/api/src/modules/understanding`  
**Depends On:** TECH-005 🔒 (Snapshot Memory & Temporal Baseline) · Existing `ChangeDetectionEngine` & `ChangeHistory`  

---

## 1. Executive Summary & Philosophy

The foundational question answered by **TECH-006** is:

> **"What changed in this infrastructure since the previous understanding?"**

TECH-006 seamlessly integrates Technology Intelligence into Nebula's existing change-detection architecture without creating duplicate tables or parallel controllers. It enables Nebula to compare consecutive temporal baseline memories ([`InfrastructureSnapshotMemory`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/understanding/contracts/snapshot-memory.interface.ts)) and produce **semantic, evidence-backed technology and architecture change events**.

```
Understanding Run (TECH-001 → TECH-004)
        ↓
Temporal Baseline Memory (TECH-005)
 ├── Previous Snapshot Memory
 └── Current Snapshot Memory
        ↓
ChangeDetectionEngine & TechnologyChangeAnalyzerService (TECH-006)
 ├── Fast-Path Cryptographic Fingerprint Optimization (O(1))
 ├── Technology Lifecycle Changes (Added, Removed, Version Changed)
 ├── Architecture Drift (Gateway Migration, Edge Appearance/Drift, Path Shifts)
 ├── Integration Lifecycle (Payment & APM Integrations Attached/Removed)
 ├── Unknown-State Transitions (MASKED ➔ OBSERVED, OBSERVED ➔ MASKED)
 └── Topology Relationship Diffs
        ↓
Canonical ChangeHistory (FindingModule.TECHNOLOGY)
        ↓
Unified Workspace Changes Experience
```

---

## 2. Core Change Classifications

Classifications reside in [`apps/api/src/modules/understanding/contracts/technology-change.interface.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/understanding/contracts/technology-change.interface.ts):

| Classification | Impact | ChangeType | Severity | Description |
|---|---|:---:|:---:|---|
| **`TECHNOLOGY_ADDED`** | `LIFECYCLE` | `ADDED` | `LOW` | A new technology was detected on the infrastructure (e.g. Next.js). |
| **`TECHNOLOGY_REMOVED`** | `LIFECYCLE` | `REMOVED` | `LOW` | Technology is no longer observable from telemetry. |
| **`TECHNOLOGY_CHANGED`** | `LIFECYCLE` | `MODIFIED` | `LOW` | Evidence-backed version update (e.g. NGINX `1.24.0` $\rightarrow$ `1.26.1`). |
| **`GATEWAY_MIGRATED`** | `ARCHITECTURAL` | `MODIFIED` | `MEDIUM` | Web gateway component changed (e.g. NGINX $\rightarrow$ Caddy). |
| **`EDGE_LAYER_DRIFT`** | `ARCHITECTURAL` | `MODIFIED` | `MEDIUM` | Edge CDN is no longer observable or newly appeared. |
| **`ARCHITECTURE_PATH_CHANGED`** | `ARCHITECTURAL` | `MODIFIED` | `LOW` | Structural shift in multi-tier ingress sequence. |
| **`INTEGRATION_ADDED`** | `INTEGRATION` | `ADDED` | `LOW` | Third-party service observed (e.g. Stripe checkout, Sentry APM). |
| **`INTEGRATION_REMOVED`** | `INTEGRATION` | `REMOVED` | `LOW` | Third-party service is no longer observable. |
| **`MASKED_BECAME_OBSERVED`** | `OBSERVABILITY` | `MODIFIED` | `LOW` | Origin provider transitioned from `MASKED` to observable. |
| **`OBSERVED_BECAME_MASKED`** | `OBSERVABILITY` | `MODIFIED` | `LOW` | Origin provider transitioned from direct to `MASKED` behind CDN. |
| **`RELATIONSHIP_ADDED`** | `ARCHITECTURAL` | `ADDED` | `LOW` | New topology edge formed between existing components. |

---

## 3. Strict Anti-Overreach Invariants

1. **Observational Absence $\neq$ Definite Removal:**
   - *Wrong:* "Sentry was uninstalled from the backend."
   - *Right:* "Technology Sentry is no longer observable from the current public telemetry."
2. **Edge Absence $\neq$ Intentional Bypass:**
   - *Wrong:* "Cloudflare was intentionally bypassed."
   - *Right:* "Cloudflare is no longer observable in the current public request path."
3. **No Unbacked Version Inference:**
   - Version changes are only emitted when concrete version strings exist in both snapshots (e.g. `server: nginx/1.24.0` $\rightarrow$ `server: nginx/1.26.1`).
4. **Cloud/Hosting Claim Boundaries:**
   - Disappearance of CloudFront does not prove AWS infrastructure was decommissioned.
   - Disappearance of Next.js does not prove a Vercel project was deleted.

---

## 4. Performance & Idempotency Invariants

- **Fast-Path Fingerprint Evaluation:** If `current.fingerprints.overallFingerprint === previous.fingerprints.overallFingerprint`, the analyzer exits in $< 0.1\text{ms}$ with zero database queries.
- **Idempotent Persistence:** Re-running change detection on the same snapshot pair checks for existing `ChangeHistory` records and avoids duplicate database insertions.
- **Unified Change Pipeline:** All events persist into PostgreSQL `change_history` table with `FindingModule.TECHNOLOGY` and are exposed via existing Workspace change endpoints.
