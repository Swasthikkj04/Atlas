# GX-R008 — Understanding Transition

**Phase:** Guest Experience Redesign (`GX-R`)  
**Ticket:** `GX-R008`  
**Type:** UX / Architecture / Telemetry / State Machine Contract  
**Priority:** P0 — Critical Transition  
**Status:** 🔒 Ready for Implementation / Frozen Transition Contract  
**Depends on:** `GX-R001` 🔒 $\rightarrow$ `GX-R002` 🔒 $\rightarrow$ `GX-R003` 🔒 $\rightarrow$ `GX-R004` 🔒 $\rightarrow$ `GX-R005` 🔒 $\rightarrow$ `GX-R006` 🔒 $\rightarrow$ `GX-R007` 🔒  
**Unblocks:** `GX-R009` — Live Telemetry & Discovery Staging / Canvas Recomposition  

---

## 🔒 Objective

Define exactly what happens after the guest submits a domain and before Nebula presents the first meaningful intelligence.

> **Frozen Principle:**  
> **"The transition should feel like Nebula beginning to understand — not a scanner running checks."**

---

## 1. Scope & Core Architectural Invariants

1. **Submission Handoff**:
   - `Understand →` action commits immediately.
   - Domain intent is frozen and debounced to prevent duplicate API requests.
   - Guest remains anchored inside the bounded Guest Workspace (no external redirection or page replacement).

2. **The Nebula Pause (~520ms)**:
   - Preserves the established ~520ms conceptual pause.
   - Acts as an intentional cognitive bridge from intent submission to intelligence formulation.

3. **Understanding Shell Stability**:
   - The GX shell remains structurally locked and stable.
   - Zero layout jump or sudden page-height jitter.
   - The target domain remains continuously visible in the header anchor.

4. **Progressive Intelligence Language**:
   - Communicates cognitive synthesis rather than technical scanner probes.

---

## 2. Progressive Cognitive Stages vs. Prohibited Scanner Jargon

| Stage ID | Canonical Cognitive Statement | Subtext Summary | Prohibited Scanner Jargon (Rejected) |
|:---|:---|:---|:---|
| `stage_perimeter` | **"Establishing the perimeter."** | Resolving authoritative edge infrastructure and routing boundaries. | ❌ *"Scanning DNS records & Anycast IPs..."* |
| `stage_infrastructure` | **"Reading the infrastructure."** | Observing publicly deployed systems, cryptography, and server protocols. | ❌ *"Checking SSL certificates & probing HTTP ports..."* |
| `stage_signals` | **"Connecting the signals."** | Synthesizing relationship evidence and behavioral patterns across systems. | ❌ *"Fingerprinting 127 tech signatures & CVE checks..."* |
| `stage_synthesis` | **"Building the current understanding."** | Assembling the canonical architecture overview and executive summary. | ❌ *"Compiling vulnerability report (89% complete)..."* |

---

## 3. Telemetry Restraint Discipline

- **No Percentage Counters**: Never show `45%`, `74%`, `99%` or arbitrary loading gauges.
- **No Technical Check Counters**: Never show `127 / 500 checks completed`.
- **No Progress Bars**: Avoid linear filling bars that emulate downloading or scanning.
- **No Radar Graphics**: Prohibit spinning radar circles, pinging satellites, or laser crosshairs.
- **No Fake Activity**: Telemetry reflects genuine backend pipeline states only.

---

## 4. Partial Understanding Contract

- If canonical architectural intelligence (e.g., Executive Brief, Edge CDN, TLS posture) becomes available before every secondary probe completes:
  - Nebula immediately transitions into `PARTIAL_UNDERSTANDING` or displays the ready intelligence.
  - The guest is never forced to wait for secondary or auxiliary probes when the core understanding is already formulated.

---

## 5. Calm Failure Resilience & Error Recovery

- If a domain cannot be understood (e.g., DNS NXDOMAIN, network timeout):
  - The bounded shell is preserved.
  - A calm, human explanation is provided (e.g., *"Nebula could not establish a connection to this domain."*).
  - A clear retry action (`Understand a different domain`) is provided.
  - Technical stack traces, raw error codes, and microservice details are strictly forbidden from the guest view.

---

## 6. Accessibility & Motion Discipline

- **`aria-live="polite"`**: State progressions are politely announced to assistive technologies without disruptive alerts.
- **Reduced Motion**: Under `prefers-reduced-motion`, all state transitions execute cleanly without forced animation intervals.
- **Continuous Domain Visibility**: The active domain remains in view as an authoritative reference throughout the entire process.

---

## 7. Canonical State Progression

$$\begin{matrix}
\mathbf{IDLE} \\
\downarrow & \text{Understand } \rightarrow \\
\mathbf{COMMIT\ INTENT} & \text{(Intent frozen, debounced)} \\
\downarrow & \\
\mathbf{NEBULA\ PAUSE\ (\sim 520ms)} & \text{(Cognitive bridge)} \\
\downarrow & \\
\mathbf{UNDERSTANDING} & \text{(Progressive cognitive statements)} \\
\swarrow \qquad \qquad \searrow & \\
\mathbf{PARTIAL\ UNDERSTANDING} \qquad \mathbf{READY} & \text{(Core intelligence revealed)} \\
\downarrow & \\
\mathbf{BOUNDED\ GUEST\ WORKSPACE} &
\end{matrix}$$

---

## 8. Eight Explicitly Prohibited Scanner Anti-Patterns

1. ❌ *"Scanning..."* dashboard with security radar or crosshairs
2. ❌ Percentage completion counters (e.g., 45%, 74%, 99%)
3. ❌ Fake technical check counters (e.g., *"127 / 500 checks completed"*)
4. ❌ Infinite animated telemetry loops or matrix rain text
5. ❌ Replacing the entire page with a full-screen loading spinner
6. ❌ Artificial 5–10 second delays when backend data is already available
7. ❌ Exposing internal worker/job implementation or microservice identifiers
8. ❌ Making the guest wait for secondary intelligence when canonical brief is ready

---

## Acceptance Gate & Definition of Done

$$\mathbf{GX\text{-}R008\ Acceptance\ Gate}$$

> **"A guest can submit a domain and experience a calm, spatially stable transition in which Nebula visibly begins forming an understanding, without feeling that they have entered a conventional security scanner."**

---

## Architectural Progression

$$\begin{matrix}
\mathbf{GX\text{-}R001\ 🔒} & \text{WHAT GX IS} \\
\downarrow & \\
\mathbf{GX\text{-}R002\ 🔒} & \text{HOW GX IS STRUCTURED} \\
\downarrow & \\
\mathbf{GX\text{-}R003\ 🔒} & \text{HOW GX IS CONTAINED} \\
\downarrow & \\
\mathbf{GX\text{-}R004\ 🔒} & \text{HOW GX LOOKS \& FEELS} \\
\downarrow & \\
\mathbf{GX\text{-}R005\ 🔒} & \text{IDLE CANVAS COMPOSITION} \\
\downarrow & \\
\mathbf{GX\text{-}R006\ 🔒} & \text{DOMAIN INPUT \& INTENT} \\
\downarrow & \\
\mathbf{GX\text{-}R007\ 🔒} & \text{IDLE MICRO-INTERACTIONS \& MOTION LANGUAGE} \\
\downarrow & \\
\mathbf{GX\text{-}R008\ 🔒} & \mathbf{UNDERSTANDING\ TRANSITION} \\
\downarrow & \\
\mathbf{GX\text{-}R009} & \text{LIVE TELEMETRY \& DISCOVERY STAGING}
\end{matrix}$$
