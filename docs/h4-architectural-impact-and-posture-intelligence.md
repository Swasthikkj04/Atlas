# H4 — Architectural Impact & Posture Intelligence

> **Vertical:** Core Intelligence & Architecture Evaluation  
> **Status:** 🔒 CERTIFIED & SEALED  
> **Depends On:** T1–T30 🔒 + H1 🔒 + H2 🔒 + H3 🔒  
> **Unblocks:** H5 — Unified Infrastructure Narrative  

---

## 1. Architectural Mission

Nebula does not merely observe isolated software banners or raw forensic changes. **Ticket H4** transforms the layered outputs of technology discovery (T1–T30), ingress topology (H1), deep behavioral wire fingerprinting (H2), and temporal forensics (H3) into an authoritative, evidence-grounded assessment of **architectural meaning, security posture, exposure risk, and actionable operational state**.

```
T1–T30 Technology Evidence
       │
       ▼
H1 — Ingress Request Path & Topology
       │
       ▼
H2 — Deep Wire & Behavioral Fingerprinting
       │
       ▼
H3 — Infrastructure Change Forensics & Diffing
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ H4 — ARCHITECTURAL IMPACT & POSTURE INTELLIGENCE ENGINE     │
│                                                             │
│ • Security Posture Evaluation (EXCELLENT to CRITICAL)       │
│ • Architecture Posture Evaluation (Multi-tier to Direct)    │
│ • Exposure Posture Evaluation (MINIMAL to ELEVATED)         │
│ • Observable Resilience Signals vs Sealed Dimensions        │
│ • Correlated Change Impact (REGRESSION vs EVOLUTION)        │
│ • "What Matters Now" Dynamic Resolution Engine              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
               authoritative posture report
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       "What Matters Now"               Executive Brief
```

---

## 2. Core Posture Evaluation Dimensions

### A. Security Posture
Evaluates the transport security and HTTP response protection headers according to strict cryptographic and defense-in-depth criteria:
* **TLS Assessment:** TLS 1.3 (+30 pts), TLS 1.2 (+20 pts), Expired / Invalid (-50 pts).
* **Defensive Controls:** HSTS (+25 pts), Content-Security-Policy (+20 pts), X-Frame-Options / frame-ancestors (+15 pts), X-Content-Type-Options (+10 pts).
* **Perimeter Layering:** Edge-protected (+10 pts), Gateway-buffered (+5 pts), Direct-origin (+0 pts).
* **Rating Scale:**
  * `EXCELLENT` ($\ge 85$)
  * `GOOD` ($\ge 70$)
  * `ADEQUATE` ($\ge 50$)
  * `DEGRADED` ($\ge 30$)
  * `CRITICAL` ($< 30$)

### B. Architecture Posture & Strict Anti-Overreach Invariants
Evaluates the structural boundaries of the observed ingress path while strictly separating **Observed**, **Interpretation**, and **Unknown**:
* `MODERN_MULTI_TIER`: Ingress is distributed across an edge provider and gateway boundary before reaching an observed server runtime.
  * **Strict Invariant:** Explicitly records that *"This observation does not establish origin high availability, container cluster redundancy, or database replication."*
* `BUFFERED_GATEWAY`: Gateway proxy buffers ingress before reaching origin runtime.
* `FLAT_DIRECT`: Public traffic reaches application framework directly without intermediate proxy buffering.
* `INDETERMINATE`: Insufficient network or HTTP response signal.

### C. Exposure Posture
Assesses the attack surface and information disclosure presented by the target:
* `MINIMAL`: Server and technology headers completely sanitized.
* `LOW`: Generic software identifiers disclosed (e.g., `Server: nginx`).
* `MODERATE`: Precise software version numbers disclosed (e.g., `Server: nginx/1.24.0`).
* `ELEVATED`: Internal origin IPs or backend server hostnames leaked (e.g., `x-backend-server: app-node-04.internal.prod`, `x-origin-ip: 10.0.12.45`).
* `CRITICAL`: Stack traces or debug dumps exposed.

### D. Observable Resilience Signals
Reports observable resilience attributes while highlighting unobserved internal dimensions:
* **Observable Signals:**
  * Edge CDN Global Anycast Ingress
  * Multi-IP Ingress (e.g., 2+ IPv4 addresses)
  * HTTP/2 or HTTP/3 Multiplexed Protocol Support
  * Persistent Connection Keep-Alive Semantics
* **Explicitly Unobserved Dimensions:**
  * Origin Server Instance Count & Cluster Topology
  * Auto-scaling & Failover Automation Policies
  * Backend Database Multi-Region Replication
  * Storage Redundancy & Snapshot Durability

---

## 3. "What Matters Now" Resolution Matrix

The "What Matters Now" engine solves alert fatigue and fear-based UIs by maintaining an evidence-backed truth hierarchy:

| Condition | Status | Title | Subtitle | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Security Regression** (e.g., HSTS removed in latest change) | `ATTENTION` | *HSTS protection was removed* | *Observed after the latest infrastructure change.* | `Review finding →` |
| **Security Restored** (e.g., HSTS restored in verified snapshot) | `RESOLVED` | *HSTS protection restored* | *Resolved in the latest verified snapshot.* | `View timeline →` |
| **Active Critical Findings** | `ATTENTION` | *Architectural Exposure Note* | *N critical findings detected.* | `Review findings →` |
| **Architectural Evolution** (e.g., NGINX $\to$ Envoy) | `CHANGED` | *Gateway migrated from NGINX to Envoy* | *Publicly observable reverse proxy changed.* | `Review changes →` |
| **Clean / Healthy Baseline** | `STABLE` | *Architecture Stable* | *No active infrastructure issues require attention.* | None (Calm Reassurance) |

---

## 4. Test & Verification Gate

* **Backend Engine Test Suite:**
  * File: `apps/api/src/modules/understanding/h4-architectural-impact-posture.spec.ts`
  * Coverage: 10 / 10 passing tests verifying security degradation on HSTS removal, HSTS restoration, exposure leveling, multi-tier anti-overreach invariants, full-stack architectural migration separation, resilience observability, and calm state synthesis.
* **Frontend Contract & UX Test Suite:**
  * File: `apps/web/src/features/workspace/workspace-h4-impact-posture.spec.ts`
  * Coverage: 5 / 5 passing tests verifying calm STABLE state, ATTENTION on security regression, RESOLVED on fix, CHANGED on migration, and sealed boundary integrity.
* **Monorepo Production Build:**
  * `turbo build`: 2 / 2 packages built clean (`api` and `web`).
