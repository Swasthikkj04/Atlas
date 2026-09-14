# Technology Finding Rules & Architecture Risk Engine

**Document Type:** Architectural Reference & Domain Intelligence Guide  
**Status:** Implemented (TECH-007)  
**Priority:** P0 — Architecture Risk Analysis  
**Module:** `apps/api/src/modules/findings` & `apps/api/src/modules/infrastructure-findings`  
**Depends On:** TECH-001 🔒 through TECH-006 🔒 · Existing `FindingRuleEngineService`, `FindingRuleRegistryService`, `InfrastructureFinding`  

---

## 1. Executive Summary & Philosophy

The foundational question answered by **TECH-007** is:

> **"Given what Nebula understands about this infrastructure, is there anything important the owner should pay attention to?"**

TECH-007 is **not a new network scanner**. It operates 100% in-memory on already-collected discovery telemetry and structured understanding outputs to evaluate evidence-backed architectural health, configuration risks, and hygiene gaps.

```
DNS / HTTP / TLS / HTML Telemetry
        ↓
TECH-001 🔒: Technology Detection
        ↓
TECH-002 🔒: Technology Meaning & Roles
        ↓
TECH-003 🔒: Infrastructure Topology Graph
        ↓
TECH-004 🔒: Architecture Brief Synthesis
        ↓
TECH-005 🔒: Snapshot Memory & Temporal Baseline
        ↓
TECH-006 🔒: Technology Change Detection
        ↓
TECH-007 🔒: Technology Finding Rules & Architecture Health
        ↓
InfrastructureFinding (FindingModule.TECHNOLOGY)
        ↓
Existing Finding APIs & Workspace Experience
```

---

## 2. Technology Finding Rules Matrix

| Rule ID | Rule Name | Category | Severity | Confidence | Risk Classification | Description |
|---|---|:---:|:---:|:---:|:---:|---|
| **`tech.edge-origin-exposure`** | `EdgeOriginExposureRule` | `CDN` | `MEDIUM` | `AUTHORITATIVE` | `SECURITY_HARDENING_GAP` | Backend server banners (e.g. Apache/NGINX/PHP) leak through Anycast edge CDN proxy. |
| **`tech.missing-secure-ingress`** | `MissingSecureIngressRule` | `TLS` | `HIGH` | `AUTHORITATIVE` | `SECURITY_HARDENING_GAP` | Public application endpoint responds over unencrypted HTTP without automatic HTTPS upgrade. |
| **`tech.version-exposure`** | `TechnologyVersionExposureRule` | `TECHNOLOGY` | `LOW` | `AUTHORITATIVE` | `INFORMATIONAL_OBSERVATION` | Granular software version numbers (e.g. NGINX 1.24.0, PHP 8.2.14) disclosed in headers. |
| **`tech.deprecated-gateway-version`** | `DeprecatedGatewayVersionRule` | `TECHNOLOGY` | `MEDIUM` | `AUTHORITATIVE` | `SECURITY_HARDENING_GAP` | Gateway or runtime software advertised belongs to an end-of-life release line (e.g. PHP 5.x/7.x). |
| **`tech.client-integration-exposure`** | `ClientIntegrationExposureRule` | `TECHNOLOGY` | `CRITICAL` | `AUTHORITATIVE` | `CONFIRMED_SECURITY_CONDITION` | Pattern matching a private secret API token (e.g. `sk_live_...`) exposed in public HTML/JS assets. |
| **`tech.architecture-drift-risk`** | `ArchitectureDriftRiskRule` | `CDN` | `LOW` | `SUPPORTED` | `OPERATIONAL_OBSERVATION` | Application server is directly exposed on public endpoint without edge CDN or reverse proxy gateway. |

---

## 3. Strict Quality Invariants

### 3.1 Severity vs Confidence Separation
- **Severity** reflects the potential architectural/security impact (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`).
- **Confidence** reflects the certainty of evidence (`AUTHORITATIVE`, `SUPPORTED`, `CONTEXTUAL`).
- *Example:* Disclosed version numbers have `HIGH` confidence (the banner is clear) but `LOW` severity (it is an informational disclosure).

### 3.2 Anti-Overreach & WhatThisDoesNotProve
Every rule carries an explicit `whatThisDoesNotProve` boundary:
- **Cloudflare Edge Leakage** $\neq$ "Origin is actively compromised or bypassed".
- **Version Exposure** $\neq$ "Target has an exploitable zero-day".
- **Public Stripe SDK** $\neq$ "Backend payment credentials compromised".
- **Legacy Version Banner** $\neq$ "Backported distribution patches do not exist".

### 3.3 Zero Network Side-Effects
TECH-007 rules perform **0 outbound network requests**, evaluating memory snapshots in $< 25\text{ms}$.

---

## 4. Integration with Existing Finding Infrastructure

- Persisted into PostgreSQL `infrastructure_findings` table with `FindingModule.TECHNOLOGY`.
- Consumed directly by existing Finding APIs (`GET /api/v1/domains/:id/findings` and `GET /api/v1/snapshots/:id/findings`).
- Full lifecycle and deduplication support across repeated snapshot runs.
