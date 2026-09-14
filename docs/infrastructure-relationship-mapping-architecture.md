# Infrastructure Relationship Mapping & Topology Model Architecture

**Document Type:** Architectural Reference & Domain Intelligence Guide  
**Status:** Implemented (TECH-003)  
**Priority:** P0 — Understanding Intelligence  
**Module:** `apps/api/src/infrastructure/discovery/technology`  
**Depends On:** TECH-001 🔒 (Fingerprinting Framework) + TECH-002 🔒 (Infrastructure Meaning Engine)  

---

## 1. Overview & Objectives

While **TECH-001** discovers *what* components are present and **TECH-002** explains *what* each component means, **TECH-003** transforms these isolated observations into an evidence-backed **Infrastructure Relationship Model and Topology Graph**.

```
Detection tells us what exists.
Meaning tells us what it means.
Relationship Mapping tells us how the observed components fit together.
```

### Core Invariant
Topology is **NEVER invented** from common deployment assumptions (e.g. Next.js does not imply Vercel; CloudFront does not imply EC2; Docker does not imply AWS; NGINX does not imply Linux). Every relationship is derived strictly from observable DNS, HTTP, TLS, HTML, Cookie, or client integration telemetry.

---

## 2. Target Architecture

```
                 Understanding Engine
                         │
                         ▼
              Technology Discovery
                         │
                         ▼
             Technology Fingerprinting
                         │
                         ▼
              Technology Meaning Engine
                         │
                         ▼
          Infrastructure Relationship Engine
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      Technology Nodes        Relationship Rules
             │                       │
             └───────────┬───────────┘
                         ▼
              Infrastructure Topology
                         │
                         ▼
             Technology Intelligence
                         │
                         ▼
            Understanding Experience
```

---

## 3. Relationship Model & Contracts

All contracts reside under `apps/api/src/infrastructure/discovery/technology/contracts/`:

### 3.1 TechnologyRelationship Contract

```typescript
export interface TechnologyRelationship {
  readonly id: string;
  readonly sourceTechnologyId: string;
  readonly sourceTechnologyName: string;
  readonly targetTechnologyId: string;
  readonly targetTechnologyName: string;

  readonly relationshipType: TechnologyRelationshipType;
  readonly evidenceState: RelationshipEvidenceState;

  readonly confidence: number;
  readonly confidenceLevel: TechnologyConfidenceLevel;

  readonly explanation: string;
  readonly evidence: TechnologyEvidence[];
  readonly claimBoundary?: string;
}
```

### 3.2 Controlled Relationship Vocabulary

| Relationship Type | Category | Semantic Meaning |
|---|---|---|
| `EDGE_OF` | Position | Node operates at the outermost ingress edge of the target endpoint |
| `FORWARDS_TO` | Traffic Flow | Edge node routes/forwards incoming traffic downstream to a gateway |
| `PROXIES_TO` | Traffic Flow | Web gateway/reverse proxy terminates HTTP and proxies to an application |
| `SERVES` | Hosting | Managed platform or storefront server hosts the public site |
| `RUNS_ON` | Runtime | Application or gateway workload executes inside container runtime |
| `REPORTS_TO` | Integration | Application transmits distributed telemetry/error metrics to APM |
| `INTEGRATES_WITH` | Integration | Application connects with external checkout, billing, or SaaS service |
| `USES` | Security | Endpoint enforces transport or security policy mechanism |

### 3.3 Evidence States

- **`CONFIRMED`**: Direct, unambiguous telemetry connects the two entities (e.g. `Next.js REPORTS_TO Sentry` verified via client SDK payload or distributed trace header; `Cloudflare EDGE_OF Endpoint` verified via Anycast NS/headers).
- **`SUPPORTED`**: Strong positional correlation in the communication path (e.g. `Cloudflare FORWARDS_TO NGINX`; `NGINX PROXIES_TO Next.js` based on correlated response banners).
- **`INFERRED`**: Plausible architectural sequence where intermediate hops are unexposed.

---

## 4. Topology Layer Model

The `InfrastructureTopology` organizes nodes into functional tiers:

```
┌──────────────────────────────────────────────┐
│                  EDGE LAYER                  │
│       Cloudflare Anycast / CloudFront        │
└──────────────────────┬───────────────────────┘
                       │ FORWARDS_TO
                       ▼
┌──────────────────────────────────────────────┐
│                GATEWAY LAYER                 │
│            NGINX / Apache / Envoy            │
└──────────────────────┬───────────────────────┘
                       │ PROXIES_TO
                       ▼
┌──────────────────────────────────────────────┐
│              APPLICATION LAYER               │
│        Next.js SSR / React / Laravel         │
└──────────────────────┬───────────────────────┘
                       │ RUNS_ON
                       ▼
┌──────────────────────────────────────────────┐
│                RUNTIME LAYER                 │
│              Docker Containers               │
└──────────────────────────────────────────────┘
         │                             │
         │ REPORTS_TO                  │ INTEGRATES_WITH
         ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│  Sentry (APM)   │           │ Stripe Checkout │
└─────────────────┘           └─────────────────┘
```

---

## 5. Plug-and-Play Rule Architecture

Relationship mapping is completely extensible without centralized `if/else` branching:

- **[`TechnologyRelationshipRule`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/infrastructure/discovery/technology/contracts/technology-relationship-rule.interface.ts)**: Interface defining isolated relationship evaluation logic.
- **[`BaseTechnologyRelationshipRule`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/infrastructure/discovery/technology/base/base-technology-relationship.rule.ts)**: Base helper providing node lookup, layer filtering, and standard relationship factories.
- **[`TechnologyRelationshipRegistryService`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/infrastructure/discovery/technology/registry/technology-relationship-registry.service.ts)**: Registry managing rule lifecycle (`register`, `unregister`, `get`, `list`, `evaluateAll`).
- **[`InfrastructureRelationshipEngine`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/infrastructure/discovery/technology/engine/infrastructure-relationship.engine.ts)**: Constructs layered topology, evaluates rules, deduplicates edges, computes confidence, and formats human-readable summaries.

---

## 6. Real-World Topologies Validated

1. **CloudFront + NGINX + Next.js**:
   - `CloudFront EDGE_OF Endpoint` (`CONFIRMED`)
   - `CloudFront FORWARDS_TO NGINX` (`SUPPORTED`)
   - `NGINX PROXIES_TO Next.js` (`SUPPORTED`)
2. **Cloudflare + Next.js + Sentry**:
   - `Cloudflare EDGE_OF Endpoint` (`CONFIRMED`)
   - `Next.js REPORTS_TO Sentry` (`CONFIRMED`)
3. **Cloudflare + Shopify + Stripe**:
   - `Cloudflare EDGE_OF Endpoint` (`CONFIRMED`)
   - `Shopify SERVES Endpoint` (`CONFIRMED`)
   - `Shopify INTEGRATES_WITH Stripe` (`CONFIRMED`)
4. **NGINX + Docker**:
   - `NGINX RUNS_ON Docker` (`SUPPORTED`)
