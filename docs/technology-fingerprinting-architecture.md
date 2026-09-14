# Technology Fingerprinting Framework Architecture

**Document Type:** Architectural Reference & Extension Guide  
**Status:** Implemented (AT-TECH-001)  
**Priority:** P0 — Architectural Foundation  
**Module:** `apps/api/src/infrastructure/discovery/technology`

---

## 1. Overview & Objectives

The **Technology Fingerprinting Framework** extends Nebula's Understanding architecture with a modular, plug-and-play system for identifying infrastructure components, cloud providers, web gateways, application frameworks, runtime environments, CMS platforms, CDNs, analytics, payments, and security protocols.

### Core Architectural Invariant
Technology detection **MUST NOT** rely on hardcoded `if/else if` chains in the core Understanding Engine or discovery orchestrator:

```
❌ ANTI-PATTERN:
if (AWS) ... else if (Cloudflare) ... else if (Vercel) ...

✅ NEBULA ARCHITECTURE:
Understanding Engine
       ↓
Technology Discovery Service
       ↓
Technology Fingerprinting Engine
       ↓
Technology Detector Registry
       ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ AWS Detector │ CF Detector  │ Next Detector│ ... Detector │
└──────────────┴──────────────┴──────────────┴──────────────┘
       ↓
Technology Detection Results (with confidence, role, meaning & evidence lineage)
```

Adding a new technology requires:
1. Creating an isolated detector class implementing `TechnologyDetector` (or extending `BaseTechnologyDetector`).
2. Providing deterministic evidence-backed detection logic and metadata (ID, name, category, role, infrastructure meaning, confidence rules).
3. Registering the detector with `TechnologyDetectorRegistryService` (or adding it to `TechnologyModule`).
4. **Zero modifications to the core Understanding Engine or orchestration logic.**

---

## 2. Framework Contracts & Types

All contracts are defined under `apps/api/src/infrastructure/discovery/technology/contracts/`:

### 2.1 TechnologyDetector Contract

```typescript
export interface TechnologyDetector extends TechnologyDefinition {
  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null | Promise<TechnologyDetectionResult | null>;
}

export interface TechnologyDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: TechnologyCategory | string;
  readonly description: string;
  readonly role: string;
  readonly infrastructureMeaning: string;
  readonly detectionSignals: string[];
  readonly confidenceRules: string;
}
```

### 2.2 TechnologyDetectionContext

Detectors consume existing observations (DNS, HTTP headers/status, TLS certificate details, HTML snippets) via safe helper methods rather than independently initiating duplicate network discovery scans:

```typescript
export interface TechnologyDetectionContext {
  readonly domainName: string;
  readonly dns?: DnsDiscoveryResult;
  readonly http?: HttpDiscoveryResult;
  readonly ssl?: SslDiscoveryResult;
  readonly htmlBody?: string;
  readonly headers?: Record<string, string>;

  getHeader(headerName: string): string | undefined;
  hasHeader(headerName: string): boolean;
  hasHeaderContaining(headerName: string, substring: string): boolean;
  getCookie(cookieName: string): string | undefined;
  hasCookie(cookieName: string): boolean;
  hasCname(pattern: string | RegExp): boolean;
  hasNs(pattern: string | RegExp): boolean;
  hasARecord(ip: string): boolean;
  hasCertIssuer(pattern: string | RegExp): boolean;
  hasCertSan(pattern: string | RegExp): boolean;
  hasHtmlPattern(pattern: string | RegExp): boolean;
}
```

### 2.3 TechnologyDetectionResult

Every positive detection is evidence-backed and includes:

```typescript
export interface TechnologyDetectionResult {
  readonly id: string;
  readonly name: string;
  readonly category: TechnologyCategory | string;
  readonly status: 'DETECTED' | 'NOT_DETECTED' | 'INCONCLUSIVE';
  readonly confidence: number; // 0.0 to 1.0
  readonly confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';
  readonly role: string;
  readonly infrastructureMeaning: string;
  readonly evidence: TechnologyEvidence[];
  readonly signals: TechnologySignal[];
  readonly evidenceCount: number;
  readonly version?: string;
}
```

---

## 3. Technology Detector Registry & Engine

### 3.1 TechnologyDetectorRegistryService
- **`register(detector: TechnologyDetector): void`**: Registers a detector, enforcing unique ID constraints and interface validation.
- **`unregister(detectorId: string): boolean`**: Removes a detector dynamically.
- **`get(detectorId: string): TechnologyDetector | undefined`**: Retrieves a registered detector.
- **`list(): TechnologyDetector[]`**: Returns all registered detectors.
- **`execute(context: TechnologyDetectionContext): Promise<TechnologyDetectionResult[]>`**: Executes all detectors in parallel with isolated try-catch error boundaries.

### 3.2 TechnologyFingerprintingEngine
- Accepts `TechnologyDetectionContext`.
- Executes all registered detectors via the registry.
- Performs deterministic deduplication (preserving the highest confidence detection if duplicate technology names exist).
- Sorts results deterministically (confidence descending, then name ascending).
- Generates the standard `TechnologyDiscoveryResult`.

---

## 4. Initial Detector Catalog

The framework ships with modular detectors across 9 categories:

| Category | Detectors Included |
|---|---|
| **Cloud / Infrastructure** | Cloudflare, AWS, Google Cloud (GCP), Microsoft Azure, Vercel, Netlify, Fly.io, Render, Railway, GitHub Pages |
| **Web / Server** | NGINX, Apache HTTP Server, Microsoft IIS, Caddy, LiteSpeed, OpenResty, Envoy Proxy, F5 BIG-IP, Node.js, PHP |
| **Frameworks** | Next.js, React, Vue.js, Angular, Svelte, ASP.NET, Laravel, Django, Ruby on Rails |
| **CMS / Platforms** | WordPress, Shopify, Webflow, Wix |
| **CDN / Edge** | AWS CloudFront, Akamai Edge Network, Fastly, Imperva Incapsula |
| **Runtime** | Docker, Kubernetes, Java Enterprise (Tomcat / Jetty / WebLogic) |
| **Analytics & Observability** | Google Analytics, Google Tag Manager, PostHog, Sentry, Datadog, New Relic |
| **Payments** | Stripe, PayPal |
| **Security** | HTTP Strict Transport Security (HSTS) |

---

## 5. Adding a New Detector (Step-by-Step)

To add a new technology detector:

1. **Create the detector file** in `apps/api/src/infrastructure/discovery/technology/detectors/<category>/<name>.detector.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseTechnologyDetector } from '../../base/base-technology.detector';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
} from '../../contracts';

@Injectable()
export class SupabaseDetector extends BaseTechnologyDetector {
  readonly id = 'tech-supabase';
  readonly name = 'Supabase';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description = 'Supabase open source Firebase alternative and backend-as-a-service';
  readonly role = 'BaaS / Database Substrate';
  readonly infrastructureMeaning = 'The public endpoint integrates or resolves to Supabase infrastructure.';
  readonly detectionSignals = ['supabase.co in CNAME records', 'x-supabase-* headers'];
  readonly confidenceRules = 'HIGH confidence when supabase.co CNAME is present.';

  detect(context: TechnologyDetectionContext): TechnologyDetectionResult | null {
    if (context.hasCname(/supabase\.co/i)) {
      return this.createResult({
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        evidence: [
          {
            sourceType: 'DNS',
            source: 'CNAME Records',
            indicator: 'Supabase CNAME target',
            confidence: 'HIGH',
          },
        ],
        signals: [
          {
            name: 'Supabase CNAME',
            type: 'DNS',
            indicator: 'supabase.co CNAME',
            matched: true,
            weight: 10,
          },
        ],
        role: `Backend infrastructure and database for ${context.domainName}`,
      });
    }
    return null;
  }
}
```

2. **Export and register in `TechnologyModule`**:
   - Add `SupabaseDetector` to `detectors/index.ts`.
   - Add `SupabaseDetector` to `TechnologyModule` providers array and constructor.

3. **Add unit test**:
   - Create tests verifying positive and negative detection in `detectors/technology-detectors.spec.ts`.

4. **Verify**:
   - The detector is automatically evaluated in every Understanding discovery run without changing `UnderstandingEngine`.
