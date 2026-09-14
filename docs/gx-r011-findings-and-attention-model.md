# GX-R011 — Findings & Attention Model

**Phase:** Guest Experience Architecture (`GX-R`)  
**Ticket:** `GX-R011`  
**Type:** GX / Intelligence Presentation / Findings / Progressive Disclosure / Contract  
**Priority:** P0 — Blocking  
**Status:** 🔒 FROZEN FINDINGS & ATTENTION CONTRACT  
**Depends on:** `GX-R008` 🔒, `GX-R009` 🔒, `GX-R010` 🔒  
**Security dependency:** `SEC-GXWX-001` 🔒, `S-01` → `S-06` 🔒  
**Unblocks:** `GX-R012` — Next Intelligence / Disclosure Boundary  

---

## 🔒 GX-R011 Acceptance Gate

### Demonstrated Truth
> **"A guest can understand what deserves attention in their infrastructure, why it matters, and how significant it is without being presented with a conventional vulnerability scanner report."**

### Frozen Principles
1. > **"Attention is earned by evidence, not manufactured by severity."**
2. > **"Meaning before severity. Evidence before alarm."**

---

## 1. R011's Position in GX Pipeline

```
GX-R008 🔒 — Understanding Transition
      ↓
GX-R009 🔒 — Live Telemetry & Discovery Staging
      ↓
GX-R010 🔒 — First Meaningful Intelligence
      ↓
GX-R011 🔒 — FINDINGS & ATTENTION MODEL
      ↓
GX-R012    — Next Intelligence / Disclosure Boundary
```

| Contract | Core Question Answered | Focus |
| :--- | :--- | :--- |
| **`GX-R010`** | *What has Nebula understood?* | Overall perimeter architecture, technology footprint, and high-level posture. |
| **`GX-R011`** | *What deserves the guest's attention?* | Meaningful architectural anomalies, configuration risks, and evidence-backed attention items. |

---

## 2. Findings Are Not Scanner Vulnerabilities

Nebula permanently rejects the legacy scanner presentation model:

$$\require{cancel}\cancel{\begin{matrix}
\textbf{CRITICAL} & 127\ \text{vulnerabilities} \\
\textbf{HIGH} & 43\ \text{security issues} \\
\textbf{MEDIUM} & 18\ \text{warnings} \\
\textbf{SCORE} & 42/100\ \text{(Failing)}
\end{matrix}}$$

Instead, Nebula presents **Actionable Architectural Intelligence**:

```
WHAT DESERVES ATTENTION

One thing deserves attention.

Your TLS posture allows an older protocol configuration than expected.

Why it matters →
```

The finding communicates **meaning first**, with technical evidence progressively disclosed upon intent.

---

## 3. Canonical Finding Model

Every guest-visible finding is governed by a strict 6-dimension canonical data structure:

```
Finding
│
├── Identity
│   ├── id: Stable finding identifier (e.g. "finding-tls-legacy-protocols")
│   ├── slug: URL/anchor-safe slug
│   └── fingerprint: SHA-256 deterministic content hash
│
├── Meaning
│   ├── headline: Plain-prose cognitive summary
│   ├── explanation: Contextual explanation of observed state
│   └── whyItMatters: Architectural and operational impact explanation
│
├── Significance
│   ├── attentionLevel: ATTENTION_REQUIRED | NOTABLE | INFORMATIONAL | HEALTHY | UNDETERMINED
│   ├── reason: Plain-language justification for attention assignment
│   ├── materiality: HIGH | MEDIUM | LOW | NEGLIGIBLE
│   └── confidence: HIGH | MEDIUM | LOW
│
├── Evidence
│   ├── observations: Traceable observed facts
│   ├── sources: Protocols & collectors (DNS, TLS, HTTP, TECH, NETWORK, CERTIFICATE)
│   ├── rawEvidenceCount: Integer count of supporting wire signals
│   ├── evidenceHashes: Cryptographic verification hashes
│   └── hasDirectProof: True wire observation vs inferred signal
│
├── Context
│   ├── category: Edge | Web Server | Application | Platform | Hosting | DNS | TLS | Mail
│   ├── infrastructureRelationship: Observed transit path (e.g. "Cloudflare Edge → NGINX Origin")
│   └── affectedComponents: List of identified technologies and network endpoints
│
└── Investigation
    ├── ctaText: "Understand why →"
    ├── doorwayAvailable: Boolean
    ├── targetDrawerId: Drawer surface identifier
    └── guestOnly: true (Strictly confined to GX evidence; never opens WX)
```

### Distinction Invariant
> **The model must strictly distinguish finding existence from finding significance.**  
> A discovered observation does not automatically deserve attention.

---

## 4. Canonical Attention Classification

| Attention State | Meaning | Presentation Guidance |
| :--- | :--- | :--- |
| `ATTENTION_REQUIRED` | Evidence indicates something materially worth investigating | Primary attention callout with actionable explanation |
| `NOTABLE` | Interesting architectural observation with meaningful context | Secondary observation with context |
| `INFORMATIONAL` | Useful understanding but no action or risk implied | Structural architecture detail |
| `HEALTHY` | Evidence explicitly supports a stable, hardened condition | Positive baseline confirmation (calm tone) |
| `UNDETERMINED` | Insufficient evidence to make a meaningful determination | Inconclusive indicator; never assumed negative |

### Non-Inference Rule
> **Absence of evidence must NEVER be converted into negative evidence.**  
> If an SPF record is unresolvable due to nameserver timeouts, it is classified as `UNDETERMINED`, not `CRITICAL: Missing SPF Record`.

---

## 5. Severity $\neq$ Attention

```
                 OBSERVATION
                      │
                      ▼
               EVIDENCE QUALITY
                      │
                      ▼
                 SIGNIFICANCE
                      │
                      ▼
              ATTENTION DECISION
                      │
                      ▼
                 PRESENTATION
```

* **Anti-Pattern:** `Observation` $\rightarrow$ `Severity = HIGH` $\rightarrow$ `RED CARD` $\rightarrow$ `Panic CTA`.
* **Nebula Reality:** A technically high-severity header omission may be negligible if fully mitigated by upstream Edge WAF. Conversely, a minor configuration drift at the root DNS level may deserve immediate attention due to domain hijacking blast radius.

---

## 6. Evidence-Backed Attention

Every attention callout requires a verified 3-point evidentiary justification:
1. **Why?** Concrete architectural significance explaining why it matters.
2. **Based on what?** Direct telemetry observations (raw bytes, status codes, DNS resource records).
3. **Can Nebula show evidence?** Cryptographically hashed wire records available in the contextual drawer.

> **If Nebula cannot substantiate the conclusion with evidence, it MUST NOT promote the item to Attention.**

---

## 7. Five-Level Progressive Disclosure Ladder

| Level | Name | Content | Example |
| :---: | :--- | :--- | :--- |
| **1** | **Meaning** | Headline & Attention Summary | *"One thing deserves attention: Your edge configuration shows an unusual routing relationship."* |
| **2** | **Why It Matters** | Operational & Architectural Significance | *"Why it matters: This relationship affects how traffic reaches the public edge."* |
| **3** | **Observation** | Observed Topology & Components | *"Observed: example.edge.provider → CDN → origin infrastructure"* |
| **4** | **Evidence** | Protocols, Sources & Verification Hashes | *"Evidence: DNS resolution (CNAME chain), TLS SNI observation, HTTP response headers"* |
| **5** | **Investigation** | Contextual Drawer & Raw Telemetry | *"Understand why → (Opens bounded guest inspection drawer; raw payloads remain behind drawer)"* |

---

## 8. Quiet State Contract

When all observed infrastructure complies with baseline security and routing expectations:

```
┌──────────────────────────────────────────────────────────────┐
│ WHAT MATTERS NOW                                             │
│                                                              │
│ Infrastructure appears stable.                               │
│                                                              │
│ The observed perimeter satisfies baseline cryptographic,     │
│ routing, and header standards.                               │
└──────────────────────────────────────────────────────────────┘
```

### Prohibited Quiet-State Representations
* ❌ `"0 vulnerabilities found"`
* ❌ `"0 risks detected"`
* ❌ `"100% secure"`
* ❌ `"Security score: 100 / 100"`
* ❌ Artificial "Grade A+" badges

---

## 9. Deterministic Attention Ordering

When multiple findings are identified, they are ordered using a deterministic 6-tier comparator:

$$\begin{matrix}
\mathbf{1.\ Evidence\text{-}backed\ Significance} & (\text{ATTENTION\_REQUIRED} > \text{NOTABLE} > \text{INFORMATIONAL} > \text{HEALTHY} > \text{UNDETERMINED}) \\
\downarrow & \\
\mathbf{2.\ Materiality} & (\text{HIGH} > \text{MEDIUM} > \text{LOW} > \text{NEGLIGIBLE}) \\
\downarrow & \\
\mathbf{3.\ Confidence} & (\text{HIGH} > \text{MEDIUM} > \text{LOW}) \\
\downarrow & \\
\mathbf{4.\ Evidence\ Integrity} & (\text{Direct Proof True} > \text{False},\ \text{Raw Evidence Count Descending}) \\
\downarrow & \\
\mathbf{5.\ Layer\ Topology} & (\text{Edge} > \text{TLS} > \text{DNS} > \text{Web Server} > \text{App} > \text{Platform} > \text{Mail} > \text{Hosting}) \\
\downarrow & \\
\mathbf{6.\ Stable\ ID\ Tiebreaker} & (\text{Alphabetical string comparison on finding.id})
\end{matrix}$$

---

## 10. Explicitly Rejected Anti-Patterns

1. **Vulnerability-count dashboards** (e.g., `"127 vulnerabilities found"`)
2. **Fake severity inflation** (elevating informational signals to generate false urgency)
3. **Red-card everything** (alarmist visual design)
4. **"Critical" without evidence** (claims without raw telemetry backing)
5. **Security score generation** (synthetic numerical grades)
6. **Finding walls** (unorganized infinite dumps of observations)
7. **Raw observation-first presentation** (dumping raw headers before explaining meaning)
8. **CVE-style language for configuration baselines** (labeling missing headers as CVEs)
9. **AI-generated speculative warnings** (hallucinated posture warnings)
10. **Duplicate findings across infrastructure layers** (same observation repeated under DNS, HTTP, and TLS)
11. **Attention based solely on collector output** (missing significance evaluation)
12. **Empty-state alarmism**
13. **"0 issues found" reassurance**

---

## 11. GX/WX Security Boundary Isolation

```
                 GUEST SESSION
                      │
                      ▼
               GX FINDINGS MODEL
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Meaning     Attention    Evidence
          │           │           │
          └───────────┼───────────┘
                      │
                Understand why →
                      │
                      ✕
                      │
                 NO WX ACCESS
```

### Invariants:
1. **Zero WX Leakage:** A guest finding cannot expose private workspace IDs, tenant tokens, internal notes, or private snapshot lineage.
2. **Authenticated Browser Sandboxing:** If a user with an active authenticated session accesses `/guest`, the rendered findings model remains strictly scoped to ephemeral public telemetry.
3. **No Impersonation:** Guest inspection actions (`Understand why →`) open guest-scoped drawers and never trigger authenticated workspace routes or backend mutations.

---

## 12. Backend Truth Requirement

```
Collector → Observation → Canonical Finding → Significance Evaluation → GX Attention Model → Guest Presentation
```

* The frontend presentation layer **never fabricates findings, scores, or severity**.
* All findings and attention states originate from validated backend discovery pipelines.
* The frontend acts purely as a deterministic projection of canonical backend truth.

---

## 13. Acceptance Gate Verification

```typescript
import { verifyGXR011CertificationGate } from './contracts/gx-r011-findings-attention.contract.ts';

const result = verifyGXR011CertificationGate(
  'A guest can understand what deserves attention in their infrastructure, why it matters, and how significant it is without being presented with a conventional vulnerability scanner report.'
);

assert.equal(result.passed, true);
```
