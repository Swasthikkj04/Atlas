# H7: Infrastructure Intelligence Consistency & Cross-Surface Truth Verification

**Phase**: Intelligence Hardening  
**Priority**: P0 — Trust Critical  
**Status**: 🔒 Certified & Complete  
**Depends On**: H1 🔒, H2 🔒, H3 🔒, H4 🔒, H5 🔒, H6 🔒  
**Unblocks**: H8 — Final Intelligence Integrity / Production Hardening  

---

## 1. Executive Summary & Core Invariant

The fundamental principle established by **Ticket H7** is:

> **"One verified observation must produce one consistent truth everywhere it appears."**

Nebula presents infrastructure intelligence across multiple specialized surfaces:
- **Overview & What Matters Now**: High-level posture, executive brief, and required operator actions.
- **Ingress Request Path & Topology**: Step-by-step verified network traversal.
- **Technology Ledger**: Categorized technologies, versions, layers, and claim boundaries.
- **Active & Resolved Findings**: Actionable security gaps and audited mitigation history (WX-211).
- **Changes & Memory Timeline**: Historical evidence diffs and infrastructure migrations.
- **Deep Evidence Drawer**: 3-level progressive wire telemetry disclosure.
- **Unified Infrastructure Narrative**: Synthesized architectural explanation.

Prior to H7, individual surfaces could independently interpret raw observations or carry stale state across transitions. Under H7, all surfaces derive projections strictly from the **Authoritative Intelligence State**, preventing any contradiction in lifecycle, confidence, topology, or technology attribution.

---

## 2. The Golden Truth Chain

```
                   AUTHORITATIVE SNAPSHOT
                             │
                             ▼
                     OBSERVATION TRUTH
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    TECHNOLOGY TRUTH   FINDING TRUTH     CHANGE TRUTH
           │                 │                 │
           └─────────────────┼─────────────────┘
                             ▼
                    INTELLIGENCE TRUTH
                             │
 ┌──────────┬──────────┬─────┴────┬───────────┬─────────────┐
 ▼          ▼          ▼          ▼           ▼             ▼
Overview   What     Changes   Topology    Findings &    Evidence
          Matters                         Investigation  Drawer &
            Now                                         Narrative
```

### Strict Invariants Enforced Across the Entire Chain:
$$\text{Same Evidence} \longrightarrow \text{Same Interpretation} \longrightarrow \text{Same Lifecycle} \longrightarrow \text{Same Confidence} \longrightarrow \text{Same Meaning}$$

---

## 3. Authoritative Intelligence State Contract

The single source of truth across both API and Web layers is defined by `AuthoritativeIntelligenceStateDto` and `FrontendAuthoritativeIntelligenceState`:

```typescript
export interface AuthoritativeIntelligenceStateDto {
  readonly snapshotId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly timestamp: string;
  readonly status: 'STABLE' | 'CHANGED' | 'ATTENTION';
  readonly technologies: AuthoritativeTechnologyTruth[];
  readonly ingressPath: AuthoritativeTopologyHop[];
  readonly activeFindings: AuthoritativeFindingTruth[];
  readonly resolvedFindings: AuthoritativeFindingTruth[];
  readonly changeEvents: AuthoritativeChangeEvent[];
  readonly posture: AuthoritativePostureAssessment;
  readonly whatMattersNow: AuthoritativeWhatMattersNow;
  readonly unifiedNarrative: AuthoritativeUnifiedNarrative;
  readonly knownUnknowns: AuthoritativeKnownUnknown[];
  readonly confidence: AuthoritativeConfidence;
}
```

---

## 4. Cross-Surface Contradiction Detection Matrix

The `IntelligenceConsistencyAuthorityService` (API) and `validateFrontendCrossSurfaceConsistency` (Web) audit and prevent 8 distinct dimensions of contradiction:

| # | Dimension | Invariant Rule | Violation Severity |
|---|---|---|---|
| **1** | `FINDING_LIFECYCLE` | Active findings (`isCompliant: false`) cannot exist while Overview / What Matters Now displays `STABLE`. Resolved findings (`isCompliant: true`) cannot appear in active badges. | `FATAL` |
| **2** | `TECHNOLOGY_TRUTH` | Technology names, semantic layers (EDGE, GATEWAY, RUNTIME, PLATFORM), and versions must match exactly across all surfaces. | `FATAL` |
| **3** | `TOPOLOGY_DRIFT` | Ingress path hops must reflect observed evidence; no surface may inject unobserved speculative proxies. | `FATAL` |
| **4** | `CONFIDENCE_MISMATCH` | A `LOW` confidence observation cannot be inflated to `HIGH` in Narrative or Executive Brief. | `FATAL` |
| **5** | `KNOWN_UNKNOWNS` | Unobserved backend databases, container orchestrators, and host OS layers must remain strictly `UNOBSERVED` across all narratives and drawers. | `FATAL` |
| **6** | `CHANGE_TRUTH` | Technology additions, removals, and migrations must be represented with identical before/after state in Changes, Narrative, and Memory. | `FATAL` |
| **7** | `POSTURE_ALIGNMENT` | Security posture must reflect the active finding set (e.g., `DEGRADED` when critical findings exist, `GOOD` upon remediation). | `FATAL` |
| **8** | `NARRATIVE_FIDELITY` | Every narrative sentence and claim must trace directly to an authoritative intelligence object with cryptographic or wire evidence. | `FATAL` |

---

## 5. Certification Matrix: Scenarios A through H

All 8 canonical scenarios are verified across backend (`h7-cross-surface-truth.spec.ts`) and frontend (`workspace-h7-cross-surface-truth.spec.ts`):

```
Scenario A (Clean Baseline):
  • 0 active findings
  • Status = STABLE
  • Posture = GOOD
  • What Matters Now = "Architecture Stable"
  • Result: 100% Consistent across all surfaces

Scenario B (New Security Finding):
  • Missing HSTS detected
  • Finding Status = ACTIVE, isCompliant = false
  • Overview Status = ATTENTION
  • Posture = DEGRADED
  • Result: 100% Consistent across all surfaces

Scenario C (Finding Remediation):
  • HSTS header restored
  • Finding Status = RESOLVED, isCompliant = true, resolvingSnapshotId attached
  • Overview Status = STABLE
  • Posture = GOOD
  • Mitigation Event recorded in Changes Timeline
  • Result: Zero stale active warnings across all surfaces

Scenario D (Technology Migration):
  • NGINX replaced by Envoy
  • Status = CHANGED
  • Ingress Path updated to Envoy (GATEWAY)
  • Narrative updated to Envoy
  • Result: 100% Consistent across all surfaces

Scenario E (Technology Disappearance):
  • Legacy PHP runtime removed
  • Status = CHANGED
  • PHP eliminated from active technology badges
  • Result: Zero residual ghost state

Scenario F (Direct Flat Ingress / Unknown Gateway Layer):
  • Direct Cloudflare -> Node.js observation
  • Ingress Path preserves 2 hops without inventing intermediate gateway
  • Result: Anti-drift topology invariant preserved

Scenario G (Sealed Backend Tier):
  • Database unobserved behind Node.js runtime
  • Known Unknowns = Database Tier (UNOBSERVED)
  • Zero speculative database guesses in narrative or overview
  • Result: Known unknowns perimeter sealed

Scenario H (Corroborated Technology):
  • Direct server banner + wire behavioral error page signature
  • Confidence = HIGH across Overview, Drawer, and Narrative
  • Result: Confidence propagation invariant verified
```

---

## 6. Verification & Test Suite Summary

- **Backend Unit & Integration Tests**: `166 passed suites`, `1,135 / 1,135 tests passing` (100%).
  - `h7-intelligence-consistency.spec.ts`: Authoritative state synthesis & WX-211 lifecycle.
  - `h7-cross-surface-truth.spec.ts`: Cross-surface projection validation.
  - `h7-contradiction-detection.spec.ts`: Automated multi-dimensional contradiction detection.
- **Frontend Unit Tests**: `825 passed suites`, `1,224 / 1,224 tests passing` (100%).
  - `workspace-h7-intelligence-consistency.spec.ts`: Invariant contracts and zero-stale cache convergence.
  - `workspace-h7-cross-surface-truth.spec.ts`: Scenarios A through H.
  - `workspace-infrastructure-understanding-master.spec.ts`: 45/45 master smoke matrix cases.
- **Monorepo Build**: `turbo build` $\to$ 2/2 packages built cleanly with 0 TypeScript/Vite errors.
