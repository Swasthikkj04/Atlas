# GX-R010 — First Meaningful Intelligence & Progressive Disclosure

**Phase:** Guest Experience Redesign (`GX-R`)  
**Ticket:** `GX-R010`  
**Type:** UX / Architecture / Intelligence Presentation / Progressive Disclosure Contract  
**Priority:** P0 — Critical Intelligence Canvas  
**Status:** 🔒 Ready for Implementation / Frozen Intelligence Disclosure Contract  
**Depends on:** `GX-R001` 🔒 $\rightarrow$ `GX-R002` 🔒 $\rightarrow$ `GX-R003` 🔒 $\rightarrow$ `GX-R004` 🔒 $\rightarrow$ `GX-R005` 🔒 $\rightarrow$ `GX-R006` 🔒 $\rightarrow$ `GX-R007` 🔒 $\rightarrow$ `GX-R008` 🔒 $\rightarrow$ `GX-R009` 🔒  
**Unblocks:** `GX-R011` — Findings & Attention Model  

---

## 🔒 Objective

Define the first actual intelligence the guest encounters after Nebula transitions from discovery to presentation.

> **Frozen Principle:**  
> **"Meaning before detail."**

---

## 🔒 GX-R010 Certification Gate

**Demonstrated Truth:**
> **"A guest immediately understands what Nebula has learned about the domain, why it matters, and where to look next — without being overwhelmed by raw observations."**

---

## 1. First Intelligence Hierarchy

The guest encounters intelligence in this strict cognitive sequence:

$$\begin{matrix}
\mathbf{CURRENT\ UNDERSTANDING} \\
\downarrow \\
\mathbf{WHAT\ MATTERS\ NOW} \\
\downarrow \\
\mathbf{OTHER\ OBSERVATIONS} \\
\downarrow \\
\mathbf{INFRASTRUCTURE} \\
\downarrow \\
\mathbf{EVIDENCE} \\
\downarrow \\
\mathbf{INVESTIGATE}
\end{matrix}$$

---

## 2. The First Intelligence Canvas

The `READY` state spatially resembles a temporary, bounded Workspace rather than a traditional web report or dashboard.

```
┌──────────────────────────────────────────────────────────────┐
│ NEBULA                         UNDERSTANDING · stripe.com     │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│ OVERVIEW      │ CURRENT UNDERSTANDING                        │
│               │                                              │
│ FINDINGS      │ Stripe's infrastructure appears...          │
│               │                                              │
│ INFRA         │ ──────────────────────────────────────────   │
│               │                                              │
│ EVIDENCE      │ WHAT MATTERS NOW                             │
│               │                                              │
│               │ One thing deserves attention.                │
│               │ Understand why →                             │
│               │                                              │
│               │ OTHER OBSERVATIONS                           │
│               │                                              │
│               │ Infrastructure                               │
│               │ Edge · TLS · DNS · Mail · ...                │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

---

## 3. Current Understanding (Hero Surface)

Answers the fundamental question: **"What does Nebula currently understand about this domain?"**

- **Editorial Narrative**: Uses the canonical Executive Brief paragraphs directly.
- **Editorial Typography**: Newsreader serif headline and leading paragraph (`text-foreground leading-[1.65]`).
- **Restraint**: Zero arbitrary scores, zero "checks passed", zero raw telemetry dumps.

---

## 4. What Matters Now (Actionable Findings)

Highlights actionable items requiring immediate review:

- **Single Finding**: *"One thing deserves attention."*
- **Multiple Findings**: *"{N} observations deserve attention."*
- **Canonical Severity**: Preserves authoritative severity tiers (`Critical`, `High`, `Medium`, `Low`, `Info`) without softening or exaggerating.
- **Contextual Action**: Prominently presents **`Understand why →`**.

---

## 5. Quiet / Healthy State Contract

Nebula never manufactures false problems to appear busy.

- **Stable Perimeter**:
  $$\mathbf{"Infrastructure\ appears\ stable."}$$
  *"The observed perimeter satisfies baseline cryptographic, routing, and header standards."*
- **Credibility Mandate**: A platform that constantly flags false "critical" alerts loses trust.

---

## 6. Other Observations & 8 Canonical Infrastructure Categories

Secondary intelligence is grouped semantically across the 8 categories defined in `GX-R002`:

1. **Edge** (Anycast routing, CDN distribution)
2. **Web Server** (Server signatures, protocol transit)
3. **Application** (Frameworks, runtimes, UI libraries)
4. **Platform** (Cloud platforms, hosting abstractions)
5. **Hosting** (Autonomous Systems, data centers)
6. **DNS** (Authoritative nameservers, SPF/DMARC hygiene)
7. **TLS** (Certificates, cipher suites, HSTS posture)
8. **Mail** (Mail servers, MX routing, sender policies)

---

## 7. Evidence Remains Behind Meaning

The disclosure ladder guarantees **Summary before Evidence**:

$$\mathbf{Meaning} \longrightarrow \mathbf{Observation} \longrightarrow \mathbf{Significance} \longrightarrow \mathbf{Evidence}$$

The guest never encounters raw DNS records, HTTP response headers, or certificate byte-dumps before understanding why they matter.

---

## 8. Investigation Entry & Context Preservation

- **Canonical CTA**: **`Understand why →`**
- **Flow**:
  $$\mathbf{OVERVIEW} \xrightarrow{\text{Understand why } \rightarrow} \mathbf{Contextual\ Drawer} \longrightarrow \mathbf{Significance} \longrightarrow \mathbf{Wire\ Evidence}$$
- **Context Restoration**: Closing the drawer restores the guest to their exact prior position without reloading or resetting state.

---

## 9. Six-Level Progressive Disclosure Ladder

| Level | Level Name | Key Surfaces | Cognitive Purpose |
|:---|:---|:---|:---|
| **Level 0** | **Orientation** | Domain Context Anchor, `UNDERSTANDING`, Timestamp | Establishes unwavering reference to the investigated target domain. |
| **Level 1** | **Meaning** | Executive Brief Narrative, Synthesized Interpretation | Answers "What does Nebula understand about this domain?" in plain prose. |
| **Level 2** | **Attention** | What Matters Now, Significance, `Understand why →` | Highlights actionable findings and explains architectural significance. |
| **Level 3** | **Architecture** | Semantic Observation Groups, 8-Category Matrix | Exposes structural topology across the 8 canonical categories. |
| **Level 4** | **Evidence Preview** | Contextual Investigation Doorway, Signal Summary | Bridges cognitive understanding to specific telemetry evidence. |
| **Level 5** | **Deep Investigation** | Contextual Drawer, Raw Collector Payloads, Hashes | Full evidentiary audit trail upon deliberate guest interaction. |

---

## 10. Strict Anti-Fabrication Contract

$$\mathbf{BACKEND\ CANONICAL\ INTELLIGENCE} \longrightarrow \mathbf{GX\ PRESENTATION}$$

- The presentation layer formats and prioritizes facts; it **never invents claims or creates synthetic scores**.
- Severity, findings, and evidence are 100% derived from backend assessment models.

---

## 11. Ten Explicitly Rejected Anti-Patterns

1. ❌ KPI dashboard wall (e.g. `94 / 100 · 17 findings · 8 technologies`)
2. ❌ Scan report check counters (e.g. `127 checks completed`)
3. ❌ Security sales funnel (e.g. `3 vulnerabilities found → Upgrade`)
4. ❌ Evidence-first presentation (huge raw DNS/TLS tables immediately on load)
5. ❌ AI theater (e.g. `"AI discovered something amazing!"`)
6. ❌ Artificial severity inflation (turning harmless baselines into warnings)
7. ❌ Card explosion (every sentence enclosed in an isolated container)
8. ❌ Infinite scroll report architecture
9. ❌ Workspace lock wall (`Sign up to view findings`, `Create account to unlock`)
10. ❌ Fake numerical posture scores computed decoratively in the UI

---

## Acceptance Gate & Definition of Done

$$\mathbf{GX\text{-}R010\ Acceptance\ Gate}$$

> **"A guest immediately understands what Nebula has learned about the domain, why it matters, and where to look next — without being overwhelmed by raw observations."**

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
\mathbf{GX\text{-}R008\ 🔒} & \text{UNDERSTANDING TRANSITION} \\
\downarrow & \\
\mathbf{GX\text{-}R009\ 🔒} & \text{LIVE TELEMETRY \& DISCOVERY STAGING} \\
\downarrow & \\
\mathbf{GX\text{-}R010\ 🔒} & \mathbf{FIRST\ MEANINGFUL\ INTELLIGENCE} \\
\downarrow & \\
\mathbf{GX\text{-}R011} & \text{FINDINGS \& ATTENTION MODEL}
\end{matrix}$$
