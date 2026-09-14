---
title: "Infrastructure Understanding Methodology & Discovery Engine | Nebula Docs"
description: "Authoritative guide to Nebula's non-intrusive 6-stage infrastructure understanding pipeline, passive wire telemetry, ingress topology mapping, and security posture intelligence."
canonical: "https://argonion.com/docs/understanding-methodology"
robots: "index, follow"
og_type: "article"
og_title: "Nebula Infrastructure Understanding Methodology & Discovery Engine"
og_description: "Understand how Nebula performs non-intrusive, 6-stage public perimeter fingerprinting and causal intelligence synthesis."
og_image: "https://argonion.com/argonion-mark.svg"
schema_type: "TechArticle"
---

# Infrastructure Understanding Methodology & Discovery Engine

Nebula by Argonion transforms raw perimeter telemetry into structured, causal infrastructure intelligence. 

Unlike legacy vulnerability scanners that rely on intrusive port fuzzing or synthetic simulations, Nebula executes a **non-intrusive, passive discovery pipeline** that observes public network transit, cryptographic handshakes, and wire-level protocol signatures to model an organization's actual infrastructure topology.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        NEBULA DISCOVERY & UNDERSTANDING PIPELINE                       │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┬───────────────┤
│   STAGE 1   │   STAGE 2   │   STAGE 3   │   STAGE 4   │    STAGE 5     │    STAGE 6    │
│  DNS & Net  │  TLS & Wire │  Behavioral │  Snapshot   │  Architectural │  Topology &   │
│   Routing   │  Protocols  │ Fingerprint │ Persistence │   Anomalies    │  Exec Brief   │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┴───────────────┘
```

---

## 1. Core Principles of Understanding

Nebula operates under strict engineering invariants defined in the foundational architecture contracts:

1. **Non-Intrusive Passive Observation:** Nebula communicates solely through standard public Internet protocols (RFC-compliant DNS resolution, TLS 1.2/1.3 handshakes, and standard HTTP/HTTPS transport). Nebula **never** attempts unauthorized exploit payload execution, intrusive port scanning, or brute-force requests.
2. **Deterministic Truth & Zero Simulated Telemetry:** Every finding, technology identification, and topology hop is directly backed by raw, cryptographic, or protocol evidence (DNS records, TLS certificates, HTTP response headers, and wire fingerprints).
3. **Canonical Workspace Parity:** The intelligence presented in the Guest Experience (GX) is semantically identical to the Authenticated Workspace (WX). Findings, severities, and evidence chains share the exact same backend engine.
4. **SSRF & Network Boundary Protection:** The pipeline enforces strict RFC-1918, link-local, loopback, and cloud metadata IP filters (`isPrivateOrRestrictedIp`, `isRestrictedHostname`), preventing internal perimeter pivoting.

---

## 2. The 6-Stage Understanding Pipeline

When a domain target (e.g., `stripe.com`) is submitted for understanding, the engine executes six deterministic pipeline stages:

```
[Target Domain]
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 1: PROBING_DNS_NETWORK                           │
│ • Authoritative NS resolution & Anycast routing         │
│ • Root/Apex A, AAAA, MX, CNAME, TXT, and CAA records    │
│ • DNSSEC cryptographic validation & chain of trust      │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 2: ANALYZING_TLS_SECURITY                         │
│ • SSL/TLS certificate chain, validity, and root issuer  │
│ • Cipher suite negotiation & ALPN (HTTP/2, HTTP/3)     │
│ • Transport security directives (HSTS, CSP, Headers)    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 3: BEHAVIORAL_FINGERPRINTING                      │
│ • Multi-signal Edge & CDN attribution (Cloudflare, etc.)│
│ • Gateway & Web Server detection (Nginx, Envoy, HAProxy)│
│ • Application framework markers & Cloud provider origin │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 4: PERSISTING_SNAPSHOT_DIFF                       │
│ • Canonicalization & SHA-256 state fingerprinting       │
│ • Immutable snapshot persistence                        │
│ • Temporal delta & drift analysis against past baseline │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 5: EVALUATING_FINDINGS_ANOMALIES                  │
│ • Evaluation of 6-tier severity rules                   │
│ • Direct origin exposure & edge bypass detection       │
│ • Weak cipher fallback & transport hygiene evaluation   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 6: SYNTHESIZING_BRIEF                             │
│ • 5-Hop Ingress Flow Synthesis (Client → Edge → Gateway │
│   → App → Cloud)                                        │
│ • Multi-paragraph executive narrative generation        │
│ • Final projection into Guest Workspace surfaces        │
└─────────────────────────────────────────────────────────┘
```

### Stage 1: DNS & Perimeter Routing (`PROBING_DNS_NETWORK`)
* Queries authoritative nameservers to identify Anycast routing infrastructure.
* Collects DNS apex records: `A`, `AAAA`, `MX`, `CNAME`, `TXT`, and `CAA` (Certification Authority Authorization).
* Verifies DNSSEC integrity (RRSIG, DNSKEY, DS records) to detect zone poisoning risks.

### Stage 2: TLS & Wire Protocols (`ANALYZING_TLS_SECURITY`)
* Inspects the active public TLS certificate: Common Name, SANs, Validity Window, and Certificate Authority issuer.
* Evaluates protocol hygiene: Enforces TLS 1.2 / TLS 1.3 standards and flags legacy weak cipher suites (e.g., 3DES, CBC mode).
* Inspects edge response headers for critical transport headers: `Strict-Transport-Security` (including `preload` & `includeSubDomains`), `Content-Security-Policy`, `X-Frame-Options`, and `X-Content-Type-Options`.

### Stage 3: Deep Behavioral Fingerprinting (`BEHAVIORAL_FINGERPRINTING`)
* Matches multi-signal wire headers, error page signatures, and response quirks to authoritative technology profiles.
* Identifies 8 canonical infrastructure categories:
  1. **Edge & CDN Routing:** Cloudflare, AWS CloudFront, Fastly, Akamai.
  2. **Ingress Gateways:** Nginx, Envoy, HAProxy, Apache, Caddy, Traefik.
  3. **Application Runtimes:** Node.js, Next.js, React, Django, Go, Rust, Java, .NET, Ruby, PHP.
  4. **Cloud Providers:** AWS, Google Cloud Platform (GCP), Microsoft Azure.
  5. **DNS Architecture:** Cloudflare DNS, Route 53, NS1, Azure DNS.
  6. **TLS Infrastructure:** Let's Encrypt, DigiCert, Sectigo, Cloudflare Managed CA.
  7. **Transport Security:** Strict HSTS, Custom CSP Policies, Cookie attributes.
  8. **Perimeter Hygiene:** Origin IP isolation, Actuator/debug perimeter exposure.

### Stage 4: Snapshot Persistence & Drift Computation (`PERSISTING_SNAPSHOT_DIFF`)
* Normalizes all observed attributes into an immutable canonical format.
* Generates a deterministic SHA-256 snapshot fingerprint.
* For authenticated workspaces, computes exact temporal deltas between snapshots to detect infrastructure drift (DNS IP shifts, certificate renewal changes, header modifications).

### Stage 5: Architectural Anomaly Detection (`EVALUATING_FINDINGS_ANOMALIES`)
* Passes snapshot context through the deterministic Finding Rule Engine.
* Classifies findings across the **6-Tier Severity Scale**:
  * `CRITICAL`: Immediate perimeter breach hazard or active service degradation risk.
  * `HIGH`: Origin IP exposure bypassing CDN WAF, missing critical security directives.
  * `MEDIUM`: Sub-optimal TLS cipher negotiation, missing CAA records, weak cookie scoping.
  * `LOW`: Informational header discrepancies, non-standard server banners.
  * `INFORMATIONAL`: Verified architecture baseline attributes (e.g., Anycast CDN active).
  * `POSITIVE`: Verified security posture achievements (e.g., HSTS Preloaded, Valid DNSSEC).

### Stage 6: Architecture Topology & Brief Synthesis (`SYNTHESIZING_BRIEF`)
* Synthesizes the end-to-end **5-Hop Ingress Flow**:
  $$\text{Public Client} \longrightarrow \text{Edge / CDN} \longrightarrow \text{Gateway} \longrightarrow \text{Application Runtime} \longrightarrow \text{Cloud Infrastructure}$$
* Generates an executive narrative explaining why the infrastructure is structured the way it is and highlighting immediate attention points.

---

## 3. Ephemeral Guest Workspace vs. Authenticated Workspace

| Capability Dimension | Guest Experience (GX) | Authenticated Workspace (WX) |
| :--- | :---: | :---: |
| **Non-Intrusive Infrastructure Analysis** | ✅ Complete | ✅ Complete |
| **Ingress Topology Map (5 Hops)** | ✅ Complete | ✅ Complete |
| **6-Tier Findings & Evidence Inspection** | ✅ Complete | ✅ Complete |
| **Executive Architecture Narrative** | ✅ Complete | ✅ Complete |
| **Historical Snapshots & Timeline** | ❌ Ephemeral (Current only) | ✅ Multi-year immutable archive |
| **Automated Real-Time Drift Alerts** | ❌ None | ✅ Webhooks & Email Notifications |
| **Continuous Scheduled Monitoring** | ❌ Manual trigger | ✅ 24/7 Automated Cron Probes |
| **Multi-Domain Portfolio Management** | ❌ Single ephemeral session | ✅ Multi-domain asset matrix |
| **Team Collaboration & RBAC** | ❌ Single session | ✅ Organization RBAC & Audit Trails |

---

## 4. Search Engine & Privacy Specifications

In accordance with [`gx-r001-product-experience.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/guest/contracts/gx-r001-product-experience.contract.ts), Nebula enforces strict boundaries between public indexable educational documentation and ephemeral guest user data:

* **Public Documentation (`/docs/*`):** `robots: index, follow`. Optimized for search engine crawlers with semantic heading hierarchy, OpenGraph metadata, and Schema.org structured data.
* **Landing Page (`/`) & Guest Entry (`/guest`):** `robots: index, follow`. Public entry points.
* **Active Guest Assessment (`/guest?domain=example.com`):** `robots: noindex, nofollow`. Ephemeral assessment sessions are strictly excluded from indexing to preserve confidentiality and user intent privacy.
* **Authenticated Workspace (`/workspace/*`):** `robots: noindex, nofollow`. Authenticated private surfaces are guarded behind strict session authentication.

---

## 5. Structured Metadata (Schema.org)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TechArticle",
      "@id": "https://argonion.com/docs/understanding-methodology#article",
      "isPartOf": {
        "@type": "WebPage",
        "@id": "https://argonion.com/docs/understanding-methodology"
      },
      "headline": "Nebula Infrastructure Understanding Methodology & Discovery Engine",
      "description": "Authoritative technical guide to Nebula's 6-stage passive infrastructure understanding pipeline, topology synthesis, and security posture intelligence.",
      "inLanguage": "en",
      "publisher": {
        "@type": "Organization",
        "name": "Argonion",
        "url": "https://argonion.com",
        "logo": "https://argonion.com/argonion-mark.svg"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://argonion.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Documentation",
          "item": "https://argonion.com/docs"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Infrastructure Understanding Methodology",
          "item": "https://argonion.com/docs/understanding-methodology"
        }
      ]
    }
  ]
}
```
