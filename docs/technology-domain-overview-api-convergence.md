# Technology Domain Overview & Details API Mapper Convergence

**Document Type:** Architectural Reference & API Convergence Guide  
**Status:** Implemented (TECH-008)  
**Priority:** P0 — API & Product Convergence  
**Module:** `apps/api/src/modules/domain-details` & `apps/api/src/modules/infrastructure-snapshots`  
**Depends On:** TECH-001 🔒 through TECH-007 🔒  

---

## 1. Executive Summary & Core Principle

The foundational principle of **TECH-008** is:

> **"The backend owns the understanding. The frontend consumes the understanding."**

The frontend must never reconstruct topology, architecture paths, version meaning, integrations, or known unknowns from raw discovery strings. Instead, the backend exposes the complete, synthesized Technology Intelligence pipeline through Nebula's canonical `InfrastructureOverviewMapper` and `DomainOverviewResponseDto`.

```
                    UNDERSTANDING ENGINE
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
       Technology        Architecture      Findings
       Intelligence       Intelligence     Intelligence
            │                │                │
            └────────────────┼────────────────┘
                             ▼
                   Canonical Snapshot
                             │
                             ▼
                  InfrastructureOverviewMapper
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
        Domain Overview API          Domain Details API
               │                           │
               └─────────────┬─────────────┘
                             ▼
                      Workspace / GX
```

---

## 2. Canonical API Response Contract

The `infrastructure.technologyArchitecture` property in `InfrastructureOverviewDto` exposes the following canonical structure:

```json
{
  "infrastructure": {
    "ipv4Addresses": ["104.21.1.1"],
    "ipv6Addresses": ["2606:4700::1"],
    "webServer": "Cloudflare",
    "cdn": "Cloudflare",
    "sslValid": true,
    "technologies": ["Cloudflare", "Next.js", "Sentry", "Stripe"],
    "technologyArchitecture": {
      "architectureSummary": "The public endpoint appears to be delivered and protected via Cloudflare edge infrastructure before requests reach Next.js.",
      "ingressPath": [
        { "hop": 0, "layer": "EDGE", "technologyId": "public-endpoint", "technologyName": "Public Endpoint", "role": "Ingress" },
        { "hop": 1, "layer": "EDGE", "technologyId": "tech-cloudflare", "technologyName": "Cloudflare", "role": "Edge CDN", "relationshipType": "FORWARDS_TO" },
        { "hop": 2, "layer": "APPLICATION", "technologyId": "tech-nextjs", "technologyName": "Next.js", "role": "Application Framework" }
      ],
      "layers": [
        { "layer": "EDGE", "state": "OBSERVED", "confidenceLevel": "HIGH", "technologies": [...] },
        { "layer": "GATEWAY", "state": "UNOBSERVED", "confidenceLevel": "LOW", "technologies": [] },
        { "layer": "APPLICATION", "state": "OBSERVED", "confidenceLevel": "HIGH", "technologies": [...] },
        { "layer": "RUNTIME", "state": "UNOBSERVED", "confidenceLevel": "LOW", "technologies": [] },
        { "layer": "PLATFORM", "state": "UNOBSERVED", "confidenceLevel": "LOW", "technologies": [] },
        { "layer": "INTEGRATION", "state": "OBSERVED", "confidenceLevel": "HIGH", "technologies": [...] },
        { "layer": "SECURITY", "state": "UNOBSERVED", "confidenceLevel": "LOW", "technologies": [] }
      ],
      "keyTechnologies": [...],
      "integrations": [
        { "name": "Sentry", "category": "Analytics", "role": "Application Observability", "infrastructureMeaning": "Error APM Telemetry" },
        { "name": "Stripe", "category": "Payments", "role": "Payment Gateway", "infrastructureMeaning": "Client Checkout SDK" }
      ],
      "knownUnknowns": [
        { "dimension": "Origin Cloud Provider", "status": "MASKED", "explanation": "Origin infrastructure is masked behind Cloudflare Anycast proxies." }
      ],
      "claimBoundaries": [
        { "technologyName": "Cloudflare", "boundary": "Cloudflare presence does not prove origin cloud provider." }
      ],
      "confidence": {
        "overallLevel": "HIGH",
        "overallScore": 0.95,
        "layerConfidence": { "EDGE": "HIGH", "APPLICATION": "HIGH" },
        "confirmedRelationshipsCount": 1,
        "supportedRelationshipsCount": 1,
        "inferredRelationshipsCount": 0
      }
    }
  }
}
```

---

## 3. Strict Invariants Enforced

1. **No Duplicate Summary / Path Computation:** `InfrastructureOverviewMapper` reuses the authoritative `InfrastructureArchitectureBrief` created by TECH-004.
2. **Third-Party Integration Segregation:** Client SDKs (Stripe, Sentry, Google Analytics) are cleanly isolated under `integrations` and never injected as false intermediate hops in `ingressPath`.
3. **First-Class Uncertainty:** Known unknowns (`Origin Cloud Provider [MASKED]`, `Database Backend [UNOBSERVED]`) are preserved explicitly.
4. **Anti-Overreach:** Claim boundaries prevent hallucinating unproven hosting providers (e.g. CloudFront $\neq$ AWS EC2, Next.js $\neq$ Vercel).
5. **Zero Additional Network I/O:** Operates 100% in-memory against snapshot state in $< 5\text{ms}$.
