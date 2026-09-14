# Technology Infrastructure Meaning Engine Architecture

**Document Type:** Architectural Reference & Domain Intelligence Guide  
**Status:** Implemented (TECH-002)  
**Priority:** P0 — Understanding Intelligence  
**Module:** `apps/api/src/infrastructure/discovery/technology`  
**Depends On:** TECH-001 (Plug-and-Play Technology Fingerprinting Framework)  
**Leads To:** TECH-003 (Technology Relationship Mapping)

---

## 1. Overview & Objectives

Where **TECH-001** built the eyes to detect technologies, **TECH-002** teaches those eyes what the observations actually mean.

Raw technology detections (`AWS / Detected: true / Confidence: HIGH`) lack architectural context. The **Technology Infrastructure Meaning Engine** transforms raw signals into structured, evidence-backed infrastructure explanations.

### The Four Core Questions

For every detected technology, the engine authoritatively answers four questions:

1. **What is it?**
   - Technology identifier, canonical name, category, version (when observed), and concise description.
2. **Why do we believe it is present?**
   - Direct, transparent telemetry explanation grounded strictly in the matched observations (HTTP headers, DNS records, TLS SANs, cookies, or HTML payload tokens).
3. **What role does it play in this infrastructure?**
   - The functional and architectural role of the component within the public endpoint communication path (e.g. Edge CDN, Reverse Proxy, Application Framework, Container Runtime, Payment Gateway).
4. **What does its presence mean for this infrastructure?**
   - The nuanced operational, architectural, and security implications of its presence, coupled with explicit boundary definitions (**What this does NOT prove**) to eliminate false or overreaching inferences.

---

## 2. Architecture & Pipeline

```
Technology Detector
        ↓
Detection Result (Raw Detections)
        ↓
Meaning / Interpretation Engine (TechnologyMeaningEngine)
        ↓
┌──────────────────────────────────────────────┐
│ Technology: AWS CloudFront                   │
│ Confidence: HIGH (0.99)                      │
│                                              │
│ 1. What is it?                               │
│    Amazon CloudFront CDN & edge cache        │
│                                              │
│ 2. Why we believe this:                      │
│    Observed x-amz-cf-id header and via proxy │
│                                              │
│ 3. Infrastructure role:                      │
│    Edge / CDN delivery                       │
│                                              │
│ 4. What this means:                          │
│    The public endpoint delivers and caches   │
│    traffic via AWS edge network.             │
│                                              │
│ 5. What this does NOT prove:                 │
│    CloudFront edge delivery does not prove   │
│    origin hosting on AWS EC2 or S3.          │
│                                              │
│ Evidence Lineage: [DNS, HTTP, TLS]           │
└──────────────────────────────────────────────┘
        ↓
Technology Intelligence
        ↓
Understanding Experience (Overview, Brief, Attributions)
```

---

## 3. Critical Invariant: Evidence Truth & Claim Boundaries

Infrastructure intelligence must **never infer more than the observations support**.

### Common Anti-Patterns Prevented:

| Observation | Permitted Finding | ❌ Forbidden Overreach |
|---|---|---|
| `x-amz-cf-id` (CloudFront) | CloudFront is the Edge / CDN layer | "The origin server runs on AWS EC2" |
| `__NEXT_DATA__` (Next.js) | Frontend application framework is Next.js | "The site is hosted on Vercel" |
| `server: nginx` | Web gateway / reverse proxy is NGINX | "The backend server is Ubuntu Linux" |
| `js.stripe.com` | Payment checkout is handled via Stripe | "Backend merchant gateway is exposed" |
| `sentry-trace` | Error tracking & telemetry sent to Sentry | "Application has a full APM logging cluster" |

Each detector carries an explicit `whatThisDoesNotProve` boundary and `defaultImplications` list that bounds downstream synthesis.

---

## 4. Plug-and-Play Interpretation Contract

Adding new technologies or specialized interpretation rules requires **zero centralized if/else branches**.

### 4.1 Detector Meaning Interface

Detectors implement or inherit `interpret(...)`:

```typescript
export interface TechnologyDetector extends TechnologyDefinition {
  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null | Promise<TechnologyDetectionResult | null>;

  interpret?(
    result: TechnologyDetectionResult,
    context: TechnologyDetectionContext,
  ): TechnologyMeaning | Promise<TechnologyMeaning>;
}
```

### 4.2 BaseTechnologyDetector Default Meaning Synthesis

If a detector does not override `interpret(...)`, `BaseTechnologyDetector` synthesizes evidence-backed answers dynamically:
- **`whyDetected`**: Automatically builds a human-readable trace of exact observed headers, CNAMEs, cookies, and HTML indicators.
- **`role`**: Contextualizes role using the target domain name.
- **`infrastructureMeaning`**: Employs the detector's defined infrastructure meaning.
- **`whatThisDoesNotProve`**: Enforces strict boundary rules preventing unobserved origin claims.

---

## 5. What Comes Next: TECH-003 (Technology Relationship Mapping)

With **TECH-001** (Technology Fingerprinting) and **TECH-002** (Infrastructure Meaning Engine) in place, technologies are accurately identified and explained in isolation.

The next natural evolution in the Understanding Intelligence roadmap is **TECH-003 — Technology Relationship Mapping**.

### Vision for TECH-003:
Transform isolated technology detections into an end-to-end **Infrastructure Topology Graph**:

```
[ DNS & Nameservers: Route53 ]
               ↓
[ Edge Security / CDN: Cloudflare Anycast ]
               ↓
[ Gateway & Reverse Proxy: NGINX / CloudFront ]
               ↓
[ Compute / Runtime: Docker / Kubernetes ]
               ↓
[ Application Framework: Next.js SSR ]
         ┌─────┴─────┐
         ↓           ↓
[ Payments: Stripe ] [ APM: Sentry ]
```

TECH-003 will model ingress dependencies, upstream-downstream correlations, and data flow relationships across all detected components.
