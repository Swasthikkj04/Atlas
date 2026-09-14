# GX-R013 — Guest Workspace Shell & Visual Authority Architecture

**Ticket ID:** `GX-R013`  
**Phase:** Guest Experience Architecture (`GX-R`)  
**Priority:** P0 — Blocking  
**Type:** GX / Workspace Convergence / Visual Authority / Information Architecture / Security Contract  
**Depends on:** `GX-R001` → `GX-R012` 🔒, `SEC-GXWX-001` 🔒, `S-01` → `S-06` 🔒  
**Status:** 🟡 FROZEN GUEST WORKSPACE CONTRACT  

---

## 🔒 GX-R013 Acceptance Gate

### Demonstrated Truth
> **“A guest user experiences the full visual authority, spatial density, and analytical precision of the Nebula Workspace without compromising tenant isolation, exposing multitenant resources, or requiring account creation before receiving immediate value.”**

### Frozen Principles
1. > **“Deliver the full intelligence workspace, not a stripped-down article.”**
2. > **“Guest workspace is ephemeral, single-domain, and read-only; privilege escalation is strictly forbidden.”**
3. > **“The upgrade bridge is natural and educational, revealing the continuous power of Workspace without artificial friction.”**

### Certification Gate Statement
> **“The Nebula Guest Workspace delivers an authoritative, high-density intelligence environment mirroring the authenticated Workspace layout across Overview, Architecture, Findings, and Evidence surfaces while preserving strict zero-privilege public isolation and offering an organic claim pathway.”**

---

## 1. Architectural Motivation & Transformation

The traditional guest understanding report suffered from **"document fatigue"**:
- Monolithic vertical scrolling of plain text boxes.
- Rigid academic numbered headers (`1. Executive Understanding`, `2. What Matters Now`).
- Flat spreadsheet-style data tables.

`GX-R013` replaces this with the **Guest Workspace Shell** — an obsidian, high-density, multi-tab application environment that mirrors the authenticated Nebula Workspace while respecting the ephemeral guest boundary.

---

## 2. The 5 Canonical Guest Workspace Tabs

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🌐 NEBULA   [ stripe.com ]  ● Ephemeral Session    [ 🔄 New Domain ]  [ ⚡ Claim Workspace → ] │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ 🏢 Overview ]   [ 🗺️ Architecture ]   [ 🚨 Findings ]   [ 🔍 Evidence ]   [ 🔒 History ]  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Tab ID | Label | State | Surface Description |
| :--- | :--- | :---: | :--- |
| `overview` | **Overview** | `ACTIVE` | Executive Briefing Bento card, Perimeter Vitals Radar, Mini Ingress Path, Attention-Required Spotlight. |
| `architecture` | **Architecture & Topology** | `ACTIVE` | Interactive Ingress Flow Graph, 8-Category Infrastructure Matrix, Discovered Technologies with wire signatures. |
| `findings` | **Findings & Posture** | `ACTIVE` | 6-Tier Severity Findings Matrix (`CRITICAL` → `INFORMATIONAL`), Category Filters, "Why It Matters" breakdowns. |
| `evidence` | **Evidence & Wire** | `ACTIVE` | Sanitized raw DNS, TLS handshake ciphers, HTTP security headers, SHA-256 cryptographic verification hashes. |
| `history` | **History & Drift** | `LOCKED_PREVIEW` | Educational preview explaining continuous automated monitoring and drift tracking, with a frictionless `[ Claim Workspace ]` action. |

---

## 3. The Data Transformation Model (Guest Adapter)

The Guest Workspace receives raw `AssessmentData` and projects it into the high-precision **GuestWorkspaceViewModel**:

```typescript
export interface GuestWorkspaceViewModel {
  readonly domain: string;
  readonly sessionId: string;
  readonly jobId: string;
  readonly snapshotTimestamp: string;
  readonly executiveNarrative: {
    readonly paragraphs: readonly string[];
    readonly highlightedEntities: readonly { name: string; category: string }[];
  };
  readonly perimeterVitals: {
    readonly postureVerdict: string;
    readonly postureScore: string;
    readonly tlsCipherSuite: string;
    readonly ingressHopsCount: number;
    readonly actionableFindingsCount: number;
    readonly totalEvidenceCount: number;
  };
  readonly severityDistribution: {
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
    readonly informational: number;
    readonly total: number;
  };
  readonly ingressHops: readonly IngressHopViewModel[];
  readonly categorizedComponents: readonly CategorizedComponentViewModel[];
  readonly findings: readonly FindingViewModel[];
  readonly rawEvidenceRecords: readonly EvidenceRecordViewModel[];
}
```

---

## 4. Strict Security & Tenant Isolation Invariants

1. **`GX-R013-SEC-01` — Ephemeral Public Plane:**  
   The Guest Workspace operates strictly on public perimeter telemetry. Internal VPC configurations, private IP ranges, database IDs, and cross-tenant data are strictly excluded.
2. **`GX-R013-SEC-02` — Zero Privilege Escalation:**  
   Guest tab navigation is local and pure. It never calls authenticated `/api/v1/workspace/*` endpoints.
3. **`GX-R013-SEC-03` — Token Segregation:**  
   Guest session tokens (`ses_*`) are isolated and never conflated with authenticated user JWTs.
4. **`GX-R013-SEC-04` — Explicit Claiming Transaction:**  
   Converting guest understanding into authenticated workspace state requires an explicit user action passing the `sessionToken` to `POST /api/v1/guest/claim`.
5. **`GX-R013-SEC-05` — Bounded Depth & Read-Only Memory:**  
   Guest mode is strictly single-domain and read-only. Database modification routes are unavailable in guest mode.

---

## 5. Verification Matrix (20 Test Points)

1. `GX-R013-T01`: Metadata, phase, and frozen status verification.
2. `GX-R013-T02`: 🔒 GX-R013 Certification Gate statement acceptance and rejection test.
3. `GX-R013-T03`: 5 Canonical tabs enumeration (`overview`, `architecture`, `findings`, `evidence`, `history`).
4. `GX-R013-T04`: Tab status validation (`overview`, `architecture`, `findings`, `evidence` are `ACTIVE`; `history` is `LOCKED_PREVIEW`).
5. `GX-R013-T05`: Data adapter maps empty/null `AssessmentData` gracefully with fallback models.
6. `GX-R013-T06`: Data adapter synthesizes executive brief paragraphs and highlighted entities.
7. `GX-R013-T07`: Data adapter calculates 6-tier severity distribution accurately.
8. `GX-R013-T08`: Data adapter synthesizes perimeter vitals (posture, TLS cipher, hops count).
9. `GX-R013-T09`: Ingress hop synthesis constructs valid client-to-origin hops with roles.
10. `GX-R013-T10`: Categorized components map into 8 canonical infrastructure buckets.
11. `GX-R013-T11`: Findings model extracts occurrence and why-it-matters separation.
12. `GX-R013-T12`: Evidence records format raw DNS, TLS, and HTTP payloads with collector lineage.
13. `GX-R013-T13`: Security auditor permits valid guest navigation between active tabs.
14. `GX-R013-T14`: Security auditor blocks unauthenticated calls to `/api/v1/workspace/domains`.
15. `GX-R013-T15`: Security auditor blocks cross-tenant parameter injections.
16. `GX-R013-T16`: Security auditor rejects invalid or malformed tab identifiers.
17. `GX-R013-T17`: History locked preview includes educational continuous monitoring copy.
18. `GX-R013-T18`: Zero layout shift guarantee during tab switching.
19. `GX-R013-T19`: WCAG 2.1 AA keyboard tab accessibility and ARIA role conformance.
20. `GX-R013-T20`: 10 core invariants verification.
