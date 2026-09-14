# Infrastructure Architecture Brief & Synthesis Engine

**Document Type:** Architectural Reference & Domain Intelligence Guide  
**Status:** Implemented (TECH-004)  
**Priority:** P0 — Understanding Intelligence  
**Module:** `apps/api/src/infrastructure/discovery/technology`  
**Depends On:** TECH-001 🔒 (Fingerprinting Framework) · TECH-002 🔒 (Meaning Engine) · TECH-003 🔒 (Relationship Model)  

---

## 1. Executive Overview & Philosophy

The final question of the Understanding Intelligence foundation is:

> **"Given everything Nebula can observe, what does this infrastructure appear to look like as a system?"**

Rather than producing a flat list of isolated tags (`[Cloudflare, NGINX, Next.js, Docker, Sentry, Stripe]`), **TECH-004** synthesizes the entire observational lineage into a coherent, deterministic, human-readable **Infrastructure Architecture Brief**.

```
Discovery Evidence (DNS / HTTP / TLS / HTML / JS / Cookies)
       ↓
Technology Detection (TECH-001: 40+ Detectors)
       ↓
Technology Meaning (TECH-002: 4-Question Answers & Claim Boundaries)
       ↓
Technology Relationships (TECH-003: Relationship Rules & Ingress Topology)
       ↓
Architecture Synthesis (TECH-004: Synthesis Engine)
       ↓
Infrastructure Architecture Brief (Executive Summary, Path, Layers, Integrations, Unknowns)
```

---

## 2. Architecture & Pipeline Flow

```
                    Understanding Engine
                           │
                           ▼
                  Technology Intelligence
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       Detection        Meaning       Relationships
       (TECH-001)      (TECH-002)      (TECH-003)
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                  Infrastructure Topology
                           │
                           ▼
             TECH-004 Synthesis Engine
       (InfrastructureArchitectureSynthesisEngine)
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       Architecture      Key Roles      Confidence
         Summary
            │
            ▼
       InfrastructureArchitectureBrief
            │
            ├── summary
            ├── architecturePath
            ├── layers
            ├── keyTechnologies
            ├── integrations
            ├── evidence
            ├── confidence
            ├── knownUnknowns
            └── claimBoundaries
```

---

## 3. Canonical Architecture Brief Contract

The contract is defined in [`apps/api/src/infrastructure/discovery/technology/contracts/architecture-brief.interface.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/infrastructure/discovery/technology/contracts/architecture-brief.interface.ts):

```typescript
export interface InfrastructureArchitectureBrief {
  /**
   * Deterministic narrative explaining the observed infrastructure as a system.
   */
  readonly summary: string;

  /**
   * Linear, best-supported request/traffic flow path through observed layers.
   */
  readonly architecturePath: ArchitecturePathSegment[];

  /**
   * Structured layer-by-layer architectural breakdown.
   */
  readonly layers: ArchitectureLayerSummary[];

  /**
   * Core request-handling, platform, and runtime technologies.
   */
  readonly keyTechnologies: TechnologyArchitectureSummary[];

  /**
   * External integrations (Observability/APM, Payments, Analytics).
   */
  readonly integrations: TechnologyArchitectureSummary[];

  /**
   * Consolidated evidence lineage references.
   */
  readonly evidence: TechnologyEvidence[];

  /**
   * Multi-dimensional confidence breakdown.
   */
  readonly confidence: ArchitectureConfidenceSummary;

  /**
   * Explicitly stated architectural unknowns and unobserved dimensions.
   */
  readonly knownUnknowns: ArchitectureUnknown[];

  /**
   * Anti-overreach claim boundaries preventing unwarranted inferences.
   */
  readonly claimBoundaries: ClaimBoundary[];

  /**
   * Timestamp of architecture brief generation.
   */
  readonly generatedAt: string;
}
```

---

## 4. Synthesis Capabilities

### 4.1 Linear Ingress Path vs External Integrations
The synthesis engine constructs a true multi-hop request flow from the outer public endpoint inward:
1. **Hop 0**: Public Endpoint (`Client Ingress`)
2. **Hop 1**: Edge & CDN (`Cloudflare / CloudFront`) via `EDGE_OF`
3. **Hop 2**: Web Gateway & Reverse Proxy (`NGINX / Envoy / Apache`) via `PROXIES_TO`
4. **Hop 3**: Application Framework (`Next.js / Django / Laravel`) via `RUNS_ON`
5. **Hop 4**: Container Runtime (`Docker / Kubernetes`) via `RUNS_ON`

External third-party SaaS integrations (`Sentry APM`, `Stripe Payments`) are **not** forced into the linear ingress path; they are cleanly segregated into `integrations` with explicit `REPORTS_TO` and `INTEGRATES_WITH` semantics.

### 4.2 Multi-Dimensional Confidence Synthesis
Instead of an arbitrary global score, confidence is synthesized across layers:
- `overallLevel`: `HIGH` | `MEDIUM` | `LOW` | `INCONCLUSIVE`
- `overallScore`: Weighted score combining node confidences and confirmed relationship ratios.
- `layerConfidence`: Confidence per layer (`EDGE: HIGH`, `GATEWAY: HIGH`, `APPLICATION: HIGH`, `RUNTIME: MEDIUM`).
- `rationale`: Transparent derivation explanation.

### 4.3 Known Unknowns as a First-Class Trust Model
Nebula explicitly communicates what cannot be verified from public telemetry:
- **Origin Cloud Provider (`MASKED`)**: Anycast edge proxies terminate public connections, hiding upstream origin IPs.
- **Private Network & VPC Topology (`UNOBSERVED`)**: Internal microservice boundaries and VPC subnets remain unexposed.
- **Database Layer (`UNOBSERVED`)**: Backend database engines are isolated from public ingress.
- **Host Operating System (`UNKNOWN`)**: Low-level kernel banners are omitted by modern reverse proxies.

### 4.4 Hard Anti-Overreach Invariants
- `CloudFront` $\neq$ AWS EC2 origin compute.
- `Next.js` $\neq$ Vercel hosting.
- `Docker` $\neq$ AWS ECS/EKS.
- `NGINX` $\neq$ Linux OS.
- Every claim boundary is preserved in `claimBoundaries[]`.

---

## 5. Summary of Milestones (TECH-001 to TECH-004)

| Milestone | Question Answered | Deliverable | Status |
|---|---|---|---|
| **TECH-001** | *What exists?* | Modular Fingerprinting Framework & Detector Registry (40+ Detectors) | 🔒 Complete |
| **TECH-002** | *What does it mean?* | 4-Question Infrastructure Meaning Engine & Claim Boundaries | 🔒 Complete |
| **TECH-003** | *How does it relate?* | Infrastructure Topology & Relationship Graph Model | 🔒 Complete |
| **TECH-004** | *What does the infrastructure look like as a system?* | Infrastructure Architecture Brief & Synthesis Engine | 🔒 Complete |
