# H3: Infrastructure Change Forensics & Temporal Architecture Diffing

**Ticket**: `H3`  
**Phase**: Intelligence & Behavioral Analysis  
**Priority**: P0 — Trust-Critical Core Intelligence  
**Status**: 🟢 COMPLETE & CERTIFIED  
**Depends On**: `T1–T30` 🔒 + `H1` 🔒 + `H2` 🔒  
**Unblocks**: `H4 — Architectural & Security Impact Understanding`

---

## 1. Executive Summary & Golden Invariants

Nebula's **H3 — Infrastructure Change Forensics** transforms temporal snapshots ($Snapshot_N \to Snapshot_{N+1}$) into an evidence-grounded forensic understanding of how an organization's public infrastructure evolves over time.

Instead of turning every byte difference into an alarm, H3 enforces calm, authoritative forensics with strict evidence boundaries:

```
SNAPSHOT N
    │
    ▼
SNAPSHOT N+1
    │
    ▼
Evidence Diff (H3-001)
    ├── Technology Added / Removed / Version Changed
    ├── Ingress Hop Added / Removed (H1)
    ├── Relationship Changed (H1)
    ├── Deep Wire Behavioral Signal Changed (H2)
    ├── TLS / SSL Certificate Changed
    ├── DNS & Ingress Routing Changed
    └── Security-Relevant Evidence Changed
            │
            ▼
      Change Classification (H3-002)
            │
            ▼
      Impact Assessment (H3-003)
            │
            ▼
      Evidence-Grounded Narrative (H3-004)
            │
            ▼
      5-Part Forensic Explanation & Negative Boundary (H3-005)
```

### Golden Invariants Enforced

1. **Quiet on Zero Change**: When $Snapshot_A$ and $Snapshot_B$ observe identical infrastructure, Nebula emits zero change diffs and remains completely calm (`QUIET` state).
2. **Never Speculate Beyond Observable Facts**:
   - $\text{Cloudflare} \to \text{Fastly}$: *"Edge delivery network changed from Cloudflare to Fastly."*
   - $\text{NGINX} \to \text{Envoy}$: *"The publicly observable gateway boundary changed from NGINX to Envoy."*
   - **Never**: *"Your architecture migrated to AWS"* or *"You deployed a Kubernetes cluster"* (unless directly evidenced).
3. **Severity $\neq$ Change Distinction**:
   - Architectural migrations ($\text{Node.js} \to \text{Go}$) are classified as `ARCHITECTURAL` with `MEDIUM/LOW` severity and neutral impact.
   - Security regressions ($\text{HSTS Present} \to \text{HSTS Missing}$) trigger `HIGH/CRITICAL` security finding evaluation.
4. **5-Part Forensic Structure**:
   - **What changed**: Literal observation shift.
   - **Why we believe it**: Authoritative evidence before and evidence after.
   - **What it means**: Architectural significance.
   - **What we cannot conclude**: Negative proof boundary (`whatThisDoesNotProve`).
   - **Impact**: Security or architectural operational relevance.
5. **Idempotent Multi-Snapshot Lineage**: Re-running understanding over historical snapshots produces deterministic, idempotent change history.

---

## 2. Temporal Change Taxonomy (H3-002)

| Classification | Meaning | Evidence Example | Strict Negative Boundary |
| :--- | :--- | :--- | :--- |
| `GATEWAY_MIGRATED` | Reverse proxy/gateway boundary changed | `server: nginx` $\to$ `server: envoy` | Does not establish a Kubernetes migration, service-mesh deployment, or cloud-provider change. |
| `FRAMEWORK_MIGRATED` | Application runtime layer changed | `x-powered-by: Express` $\to$ `x-powered-by: Go` | Does not establish an origin cloud provider migration or container orchestrator change. |
| `EDGE_LAYER_DRIFT` | CDN/Edge layer changed or appeared | `cf-ray` $\to$ `x-served-by (Fastly)` | Does not prove that backend origin servers have migrated to a different cloud provider. |
| `HOP_ADDED` / `HOP_REMOVED` | Ingress request path changed hop count | Hop 0 added (e.g. Cloudflare Edge) | Hop addition reflects ingress path shifts, not origin datacenter restructuring. |
| `HTTP_BEHAVIOR_CHANGED` | Wire behavioral fingerprint shifted | HTTP Keep-Alive profile / routing header | Behavioral wire signals corroborate active profiles but do not manufacture certainty. |
| `SECURITY_POSTURE_CHANGED` | Security header / TLS regression | HSTS header removed | Does not guarantee that client connections cannot be compromised through other vectors. |

---

## 3. Verification & Certification Suite

| Suite | Scope | Tests Passed | Status |
| :--- | :--- | :--- | :--- |
| `apps/api/src/modules/understanding/h3-infrastructure-change-forensics.spec.ts` | Backend integration & temporal diffing | **10 / 10** | 🟢 PASSED |
| `apps/api/src/modules/understanding/services/technology-change-analyzer.service.spec.ts` | Technology diffing engine & hops | **9 / 9** | 🟢 PASSED |
| `apps/api/src/modules/understanding/services/change-detection.engine.spec.ts` | Change detection engine & persistence | **7 / 7** | 🟢 PASSED |
| `apps/web/src/features/workspace/workspace-h3-change-forensics.spec.ts` | Frontend forensic story & quiet state UX | **5 / 5** | 🟢 PASSED |
| Full Backend Test Suite (`pnpm --filter api test`) | Monorepo API regression suite | **1087 / 1087** | 🟢 PASSED |
| Full Web Test Suite (`pnpm --filter web test`) | Monorepo Web regression suite | **1190 / 1190** | 🟢 PASSED |
| Full Monorepo Build (`pnpm build`) | TypeScript & Vite production bundle | **2 / 2 packages** | 🟢 PASSED |
