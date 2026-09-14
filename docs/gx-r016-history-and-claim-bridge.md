# GX-R016 — History & Claim Bridge Architecture

**Ticket ID:** `GX-R016`  
**Phase:** Guest Experience Architecture (`GX-R`) / First Experience Redesign  
**Priority:** P0 — Blocking  
**Type:** GX / Temporal Intelligence / Architectural Boundary / Memory Activation / Claim Bridge Contract  
**Depends on:** `GX-R001` → `GX-R015` 🔒, `SEC-GXWX-001` 🔒, `WX-1001` → `WX-1027` 🔒  
**Status:** 🟢 COMPLETE & CERTIFIED  

---

## 🔒 GX-R016 Acceptance Gate

### Demonstrated Truth
> **“A guest user experiences History as an architectural boundary separating ephemeral inspection from continuous memory, perceiving registration as Nebula beginning to remember rather than a forced conversion, with the current snapshot seamlessly transitioning as the initial workspace baseline.”**

### Frozen Principles
1. > **“History is locked by architectural reality, not an artificial paywall.”**  
   *Ephemeral guest sessions are point-in-time observations. Without authenticated workspace persistence, there is no historical baseline to query.*
2. > **“Registration is Nebula beginning to remember.”**  
   *All guest-to-workspace transition touchpoints emphasize temporal continuity and institutional memory activation rather than transactional account creation.*
3. > **“Zero-friction session handover preserving current snapshot into workspace memory.”**  
   *The ephemeral understanding snapshot seamlessly becomes Snapshot #0 (Genesis Baseline) in the created workspace without re-scanning or data loss.*
4. > **“Strict temporal boundary and zero synthetic historical speculation.”**  
   *Nebula never fabricates fake historical diffs or synthetic past state to entice signups; the locked preview educates through real architectural capabilities and blueprints.*
5. > **“Zero privilege escalation and strict tenant isolation across claim boundaries.”**  
   *The claim bridge token strictly binds to the claimed domain and ephemeral session ID, preventing access to unowned domains or cross-tenant historical state.*

### Certification Gate Statement
> **“Nebula enforces History as an architectural boundary separating ephemeral point-in-time inspection from continuous temporal intelligence, framing registration as Nebula beginning to remember, preserving the initial snapshot as the workspace baseline, and strictly forbidding coercive paywall patterns.”**

---

## 1. Architectural Motivation & The Memory Metaphor

In traditional SaaS products, unauthenticated trial users are confronted with **aggressive, transactional paywalls**:
- *"Upgrade to Pro for $49/mo to see past history!"*
- Fake countdown timers: *"Your report will expire in 04:59!"*
- Intrusive interstitial modals blocking technical reading surfaces.
- Artificial feature locks that withhold already-computed data.

### The Nebula Thesis: Persistence vs. Intelligence
Under Nebula's foundational product contract (**GX-R001**):
> *"GX provides the same underlying infrastructure intelligence available to registered Workspace users. The difference is persistence, not intelligence."*

In **GX-R016**, this principle extends directly to temporal memory:
1. **Why History is Locked for Guests**: An ephemeral guest session is by definition an anonymous, single-point-in-time probe. Without a verified workspace entity and recurring scheduler, there is no historical baseline to diff against. Locking History is an **honest reflection of system physics**, not an arbitrary marketing restriction.
2. **The Memory Metaphor**: Registration is transformed from a transactional obstacle into an architectural milestone: **Nebula beginning to remember**.
3. **Calm Educational Preview**: The locked History tab remains clickable, serving as an educational architectural blueprint that clearly demonstrates how Nebula's automated diff-engine, snapshot lineage, and infinite change timeline operate once persistent tracking is initialized.

---

## 2. Ephemeral vs. Continuous Memory Matrix

| Dimension | Ephemeral Guest Session (`/guest`) | Authenticated Workspace (`/workspace`) |
|:---|:---|:---|
| **Temporal Identity** | Anonymous, point-in-time execution (`sessionId`, `jobId`). | Permanent tenant entity bound to authenticated user/org. |
| **Observation Depth** | Complete wire telemetry (DNS, TLS, HTTP, Ingress Hops, Findings). | Complete wire telemetry with multi-snapshot lineage. |
| **History & Drift** | 🔒 **Locked (Architectural Boundary)** — No past baseline exists. | 🟢 **Active** — Infinite chronological timeline & diff forensics. |
| **Scheduled Monitoring** | None (Single-flight probe). | Continuous background scheduler (24h automated drift checks). |
| **Drift Alerts** | Inactive. | Proactive notifications on TLS changes, DNS shifts, header drift. |
| **Conversion Framing** | **"Nebula is ready to remember your infrastructure."** | Active institutional memory established. |

---

## 3. The Genesis Baseline Handover (Zero Data Loss)

When a guest user registers or signs in through the claim bridge, their ephemeral snapshot is directly promoted to **Snapshot #0 (Genesis Baseline)** in PostgreSQL.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                GUEST EPHEMERAL STATE                                  │
│   Domain: stripe.com  ·  Session: ses_guest_9921  ·  Job: job_guest_1102               │
│   Observed: 5 Ingress Hops  ·  3 Actionable Findings  ·  38 Verified Wire Signals       │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           │ [ Begin Continuous Memory → ]
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLAIM BRIDGE HANDOVER                                     │
│   1. Single-Flight Claim Token cryptographically bound to (ses_guest_9921, stripe.com)│
│   2. Context-Aware Auth Form preserves session in sessionStorage                       │
│   3. Zero re-scanning or data recalculation required                                  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           │ [ Account Created / Verified ]
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             AUTHENTICATED WORKSPACE                                    │
│   Domain Entity: dom_stripe_com (Registered)                                           │
│   Snapshot #0 (GENESIS BASELINE):                                                      │
│     - Timestamp: Original execution time                                               │
│     - State: Immutably recorded in database                                            │
│     - Next Scheduled Epoch: +24 Hours (Automated Drift Detection)                      │
│   Timeline Surface: Origin Seal established at timeline genesis                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Canonical 10 Core Invariants

- **`GX-R016-I01` — Ephemeral Temporal Grounding:** History is locked for guests because unauthenticated sessions lack identity and persistent baseline over time.
- **`GX-R016-I02` — Memory Metaphor Authority:** Registration and claim flows are framed as Nebula beginning to remember, never as a transactional purchase or paywall.
- **`GX-R016-I03` — Genesis Baseline Preservation:** The ephemeral understanding snapshot seamlessly becomes Snapshot #0 (Genesis Baseline) in the created workspace.
- **`GX-R016-I04` — Zero Synthetic Diffing:** Guest History locked preview presents architectural capabilities and blueprints, never fabricated past changes.
- **`GX-R016-I05` — Context-Preserving Handover:** Claim bridge carries domain, session ID, job ID, and verified signals without requiring re-discovery or re-entry.
- **`GX-R016-I06` — Non-Coercive Locked State:** History tab remains accessible for inspection as an educational blueprint with calm, transparent explanation.
- **`GX-R016-I07` — Single-Flight Claim Security:** Claim token is cryptographically and logically bound strictly to the single ephemeral session and domain.
- **`GX-R016-I08` — Instant Baseline Continuity:** Upon successful account creation, the workspace immediately reflects the genesis snapshot in Overview and Timeline.
- **`GX-R016-I09` — Rejection of Forced Conversion Tropes:** Strictly bans countdown ultimatums, popups, aggressive modal blocks, and misleading pricing cues.
- **`GX-R016-I10` — Multi-Tenant Memory Isolation:** Claiming a domain grants access strictly to that domain baseline, with zero exposure to foreign tenant histories.

---

## 5. Prohibited Anti-Patterns & Enforcement Matrix

| Prohibited Pattern | Why It Is Banned in Nebula | Contract Enforcement Rule |
|:---|:---|:---|
| **Coercive Countdown Ultimatum** | Falsely induces panic (*"Report deleted in 2 minutes!"*). Destroys institutional trust. | `validateMemoryMetaphorCopy()` rejects urgency tokens. |
| **Paywall & Pricing Promotion** | Degrades an infrastructure intelligence workspace into a sales funnel. | `validateMemoryMetaphorCopy()` rejects pricing, discounts, and tier locks. |
| **Synthetic Diff Fabrication** | Fabricating fake historical changes to lure signups is unethical and violates truth contracts. | `GX-R016-I04` strictly forbids synthetic timeline data. |
| **Aggressive Modal Interruption** | Blocking an engineer while they are inspecting wire evidence breaks concentration. | Claim bridge is accessible via calm persistent CTAs and dedicated History tab. |
| **Multi-Tenant Memory Leakage** | Showing other organizations' snapshot diffs in history preview violates tenant isolation. | `auditHistoryAccessPermission()` blocks unowned memory access. |

---

## 6. Verification & Spec Conformance

The contract is formally implemented and verified in:
- **Contract:** [`apps/web/src/features/guest/contracts/gx-r016-history-claim-bridge.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/guest/contracts/gx-r016-history-claim-bridge.contract.ts)
- **Test Suite:** [`apps/web/src/features/guest/contracts/gx-r016-history-claim-bridge.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/guest/contracts/gx-r016-history-claim-bridge.contract.spec.ts)
- **UI Surface:** [`apps/web/src/features/guest/components/workspace/GuestHistoryLockedPreview.tsx`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/guest/components/workspace/GuestHistoryLockedPreview.tsx)
- **Results:** **20 passing tests, 0 failures**
