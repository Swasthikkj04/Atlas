# H6: Investigation Continuity & Evidence Navigation

**Priority**: P0 — Operator Trust Critical  
**Scope**: Workspace investigation + evidence navigation continuity  
**Depends On**: `WX-211` 🔒, `H1–H5` 🔒  
**Status**: `CERTIFIED & PRODUCTION READY`

---

## 1. Executive Summary & The Golden Invariant

Deep infrastructure investigation is inherently multi-layered: an operator notices an observation in the **H5 Unified Narrative**, opens the **Evidence Drawer** to view raw HTTP headers, transitions to a **Deep Finding Investigation**, examines the **Historical Diff** across snapshots, and inspects underlying **Protocol Telemetry**.

### The Golden Invariant:
> **Deep investigation must never destroy operator context.**  
> An engineer must be able to click *"View evidence"*, traverse multiple layers deep into an investigation and historical diff, and return to the exact surface, section, scroll position, and active filter state they came from — knowing precisely what they were looking at and why.

---

## 2. Canonical Investigation Flow

```
                                  H5 UNIFIED NARRATIVE
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
  TECHNOLOGY CLAIM                  ACTIVE FINDING                   RESOLVED FINDING
         │                                 │                                 │
         ▼                                 ▼                                 ▼
   Evidence Drawer                  Deep Investigation               Resolution Snapshot
   (Level 1, 2, 3)                         │                                 │
         │                                 ▼                                 ▼
         ▼                          Historical Diff                   Compliant Proof
   Raw Telemetry                   (Snapshot N vs N+1)                 (Restoration)
         │                                 │                                 │
         └─────────────────────────────────┼─────────────────────────────────┘
                                           │
                                           ▼
                                 STICKY RETURN ANCHOR
                        (Exact restoration of prior context)
```

---

## 3. Serialized Investigation Return Contract (`H6-001`)

The canonical `InvestigationContext` contract maintains durable, reload-safe, shareable state across routes:

```typescript
export interface InvestigationContext {
  readonly domainId: string;
  readonly domainName?: string;
  readonly sourceSurface: 'overview' | 'findings' | 'changes' | 'infrastructure' | 'memory';
  readonly sourceSection?: string;
  readonly entityType: 'technology' | 'finding' | 'change' | 'observation' | 'snapshot' | 'control';
  readonly entityId: string;
  readonly entityName?: string;
  readonly snapshotId: string;
  readonly findingId?: string;
  readonly evidenceId?: string;
  readonly disclosureLevel?: 1 | 2 | 3;
  readonly filterState?: Record<string, string | number | boolean>;
  readonly scrollAnchor?: string;
  readonly timestamp?: string;
}
```

### URL Parameter Mapping:
- `?from=narrative` / `?srcSurface=overview`
- `&srcSection=narrative`
- `&entityType=technology`
- `&entityId=tech-nginx`
- `&snapshot=snap-2026-08-29-001`
- `&level=3`
- `&anchor=tech-nginx-row`

---

## 4. Sticky Return Anchor Rules (`H6-002`)

Every deep destination reached from another surface renders a visible, accessible return button with an **origin-descriptive label**.

### Label Resolution Matrix:
| Origin Context | Synthesized Return Label |
|:---|:---|
| `sourceSection === 'narrative'` | `← Back to Infrastructure Narrative` |
| `entityType === 'technology'` | `← Back to [Technology Name] evidence` (e.g. `← Back to NGINX evidence`) |
| `entityType === 'finding'` | `← Back to [Finding Name] investigation` |
| `sourceSurface === 'changes'` | `← Back to Changes` |
| `sourceSurface === 'findings'` | `← Back to Findings` |
| `sourceSurface === 'infrastructure'` | `← Back to Infrastructure Overview` |
| `sourceSurface === 'memory'` | `← Back to Snapshot History` |
| *Default fallback* | `← Back to Overview` |

> [!IMPORTANT]
> **Strict Invariant**: Generic `"Back"` labels are forbidden when origin context is known.

---

## 5. Exact Context Restoration (`H6-003`)

When navigating back, Nebula restores:
1. **Selected Tab / Surface**: (`overview`, `findings`, `changes`, `infrastructure`, `memory`).
2. **Selected Section**: (`narrative`, `topology`, `drift`, `matrix`, etc.).
3. **Active Filter State**: (`severity`, `tier`, `showResolved`).
4. **Highlighted Entity**: (`tech-nginx`, `finding-hsts`).
5. **Progressive Disclosure Level**: (`1`, `2`, or `3`).
6. **Scroll Position / Anchor**: Target element view anchor.

---

## 6. Evidence Drawer Architecture (`H6-004` & `H6-005`)

The reusable **Evidence Drawer** provides structured 3-level progressive disclosure:

1. **Level 1 (Summary)**: High-level observation headline (e.g., *"Observed HTTP response headers at GATEWAY boundary"*).
2. **Level 2 (Architectural Meaning)**: Plain-language explanation of what the evidence establishes (e.g., *"Server: nginx/1.24.0 — Directly identifies the observed NGINX gateway signature"*).
3. **Level 3 (Raw Telemetry)**: Unfiltered technical proof:
   - Protocol source (`HTTP Response`, `TLS Handshake`, `DNS A Record`, `Wire Signature`).
   - Observed timestamp.
   - Exact header / cipher / IP value.
   - Snapshot hash lineage.
   - Confidence level (`HIGH`, `MEDIUM`, `LOW`).
   - One-click copy for raw values and complete JSON evidence envelopes.

---

## 7. Finding Lifecycle Integrity (`H6-006` / `WX-211`)

Investigation continuity adheres strictly to the authoritative **WX-211 finding lifecycle**:
- **ACTIVE Findings**: Must correlate with active `NON_COMPLIANT` raw observations in the current snapshot.
- **RESOLVED Findings**: Must correlate with `COMPLIANT` raw observations in the resolving snapshot.
- **Forbidden Contradictions**: Rejects `ACTIVE` findings claiming compliant proof or `RESOLVED` findings claiming non-compliant active telemetry.

---

## 8. Security Boundary & Graceful Fallback (`H6-009` & `H6-010`)

1. **Zero Authorization Bypass**: Navigation state cannot grant access to unowned tenant domains or resources. Backend verification remains strictly authoritative.
2. **No Secret Leaks in URLs**: Context query strings are stripped of tokens, credentials, and script tags.
3. **Graceful Context Loss**: If a target finding or snapshot was deleted or expired, Nebula presents an honest notification (*"The original investigation context is no longer available."*) and gracefully falls back to the nearest valid surface anchor.

---

## 9. Verification & Test Certification

| Test Suite | Scope | Result |
|:---|:---|:---:|
| [`h6-investigation-continuity.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/understanding/h6-investigation-continuity.spec.ts) | Backend Context Validation, Sanitization, Tenant Security, WX-211 Lifecycle | **14 / 14 PASS** |
| [`workspace-h6-investigation-continuity.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-h6-investigation-continuity.spec.ts) | Frontend Context Serialization, Return Anchor Labels, Restoration, Fallback | **8 / 8 PASS** |
| [`workspace-h6-evidence-drawer.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-h6-evidence-drawer.spec.ts) | Evidence Drawer 3-Level Telemetry, TLS Handshake, DNS Lineage | **3 / 3 PASS** |
| [`workspace-infrastructure-understanding-master.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-infrastructure-understanding-master.spec.ts) | Master Understanding & Investigation Continuity Matrix | **42 / 42 PASS** |
| **Monorepo Build** | Full TypeScript typecheck and Vite/Nest production build | **2 / 2 PASS** |
