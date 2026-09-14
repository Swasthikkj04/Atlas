# H5 — Unified Infrastructure Narrative

## 1. Executive Summary

**Ticket H5: Unified Infrastructure Narrative** establishes the definitive synthesis engine for Nebula. It transforms individual, independent evidence streams (T1–T30 Discovery, H1 Ingress Topology, H2 Deep Wire & Behavioral Fingerprinting, H3 Temporal Change Forensics, and H4 Architectural Impact & Posture Intelligence) into one cohesive, human-readable, and executive-ready narrative.

### Golden Principle
$$\text{Evidence} \longrightarrow \text{Understanding} \longrightarrow \text{Narrative}$$

**Never**:
$$\text{Observation} \longrightarrow \text{Guess} \longrightarrow \text{Narrative}$$

---

## 2. Core Narrative Architecture

```
                 T1–T30: Technology Evidence
                            │
                            ▼
           H1: Ingress Request Path & Topology
                            │
                            ▼
       H2: Deep Wire & Behavioral Fingerprinting
                            │
                            ▼
          H3: Infrastructure Change Forensics
                            │
                            ▼
          H4: Architectural Impact & Posture
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             H5: UNIFIED NARRATIVE ENGINE               │
│                                                        │
│  • Architecture Narrative (Multi-tier to Direct)      │
│  • Request Journey (Hop-by-hop & Missing Explanations) │
│  • Evidence Lineage (Traceable Claim Chain)            │
│  • Change & Evolution Narrative (Impact Correlated)    │
│  • Current Truth Reconciliation (WX-211 Lifecycle)     │
│  • Known Unknowns (Honest Perimeter Sealing)          │
│  • Progressive Disclosure (Levels 1, 2, 3)             │
│  • Executive Brief Paragraph                           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌───────────────────────────┴────────────────────────────┐
│                    SURFACE CONSUMERS                   │
│                                                        │
│  Overview Hero   What Matters Now   Executive Brief   │
│  Topology Visualizer   Progressive Detail Cards       │
└────────────────────────────────────────────────────────┘
```

---

## 3. The 3-Level Progressive Disclosure Model

| Level | Purpose | Contents |
|:---|:---|:---|
| **Level 1 — Understanding** | Executive 1-Liner & Path Badge | Natural language synthesis (e.g. *"Cloudflare edge, followed by an NGINX gateway and a Go application runtime"*) + Ingress path summary. |
| **Level 2 — Context** | Architectural Meaning & Sealed Boundaries | Explains why each layer appears, what changes mean, security posture rating, and explicit unobserved perimeter dimensions. |
| **Level 3 — Evidence** | Verifiable Lineage & Raw Observations | Full evidence chain linking every claim to headers, DNS records, TLS handshakes, wire signatures, snapshot IDs, and timestamps. |

---

## 4. Current Truth & Lifecycle Reconciliation (WX-211)

The narrative strictly respects the authoritative lifecycle state:

1. **Active Finding State (`ACTIVE`)**:
   - Headline: e.g. `HSTS Protection Removed`
   - Narrative: *"One active infrastructure issue currently requires attention: HSTS protection is absent."*
2. **Resolved Finding State (`RESOLVED`)**:
   - Headline: e.g. `HSTS Protection Restored`
   - Narrative: *"HSTS protection was restored in the latest verified snapshot."*
3. **Clean Baseline State (`STABLE`)**:
   - Headline: `Architecture Stable`
   - Narrative: *"Architecture Stable. No active infrastructure issues currently require attention."*

---

## 5. Anti-Overreach Invariants Certified

1. **Zero Cross-Perimeter Guesses**:
   - `Go` never implies `PostgreSQL`.
   - `NGINX` never implies `Linux`.
   - `Cloudflare` never implies `AWS`.
   - `Traefik` never implies `Kubernetes`.
2. **Missing Intermediary Honesty**:
   - When only Edge and Runtime are observed, Nebula explicitly records: *"The observed evidence does not establish an intermediate gateway between the edge and application runtime."*
3. **Absence $\neq$ Vulnerability**:
   - Unobserved internal databases or clusters do NOT generate security alarms.
4. **Determinism**:
   - Identical snapshot inputs always produce identical narrative structures.

---

## 6. Verification Suite

- **Backend Spec**: `apps/api/src/modules/understanding/h5-unified-infrastructure-narrative.spec.ts` (11/11 passed)
- **Frontend Spec**: `apps/web/src/features/workspace/workspace-h5-unified-narrative.spec.ts` (5/5 passed)
- **Master Smoke Suite**: `apps/web/src/features/workspace/workspace-infrastructure-understanding-master.spec.ts` (8/8 suites, 39/39 smoke targets passed)
