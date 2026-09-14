# GX-R009 — Live Telemetry & Discovery Staging

**Phase:** Guest Experience Redesign (`GX-R`)  
**Ticket:** `GX-R009`  
**Type:** UX / Architecture / Telemetry Staging / Visual Recomposition Contract  
**Priority:** P0 — Foundational Canvas Recomposition  
**Status:** 🔒 Ready for Implementation / Frozen Telemetry Staging Contract  
**Depends on:** `GX-R001` 🔒 $\rightarrow$ `GX-R002` 🔒 $\rightarrow$ `GX-R003` 🔒 $\rightarrow$ `GX-R004` 🔒 $\rightarrow$ `GX-R005` 🔒 $\rightarrow$ `GX-R006` 🔒 $\rightarrow$ `GX-R007` 🔒 $\rightarrow$ `GX-R008` 🔒  
**Unblocks:** `GX-R010` — First Meaningful Intelligence & Progressive Disclosure  

---

## 🔒 Objective

Define the visual composition of the `UNDERSTANDING` state after `GX-R008` hands control from intent submission to live discovery.

> **Frozen Principle:**  
> **"Show Nebula thinking, not Nebula scanning."**

---

## 1. Canonical Canvas Transformation

The idle canvas does not become a loading screen or generic placeholder.

```
                 IDLE CANVAS
                     │
              Understand →
                     │
                     ▼
          ┌─────────────────────┐
          │     DOMAIN CONTEXT  │
          │     example.com      │
          └─────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │                          │
        │  Establishing the        │
        │  perimeter.              │
        │                          │
        │  Reading the             │
        │  infrastructure.         │
        │                          │
        │  Connecting the signals. │
        │                          │
        │  Building the current    │
        │  understanding.          │
        │                          │
        └──────────────────────────┘
                     │
                     ▼
             FIRST INTELLIGENCE
                     │
                     ▼
          PARTIAL / READY CANVAS
```

- **The shell remains Nebula throughout**: There is never a moment where the guest feels they have left the product and entered a generic loader.

---

## 2. Four-Layer Telemetry Composition Architecture

| Layer | Layer Name | Typography & Tokens | Role & Visual Behavior | Motion Tier |
|:---|:---|:---|:---|:---:|
| **Layer A** | **Persistent Domain Context Anchor** | `JetBrains Mono` (`UNDERSTANDING · {domain}`) | Unwavering domain anchor ensuring guest orientation throughout live discovery. | `STATIC` |
| **Layer B** | **Primary Cognitive Statement** | `Newsreader serif` (1.75rem – 2.0rem, font-normal) | High-prominence editorial statement communicating current cognitive milestone. | `LEVEL_2_INTERFACE` (220–360ms) |
| **Layer C** | **Quiet Discovery Context** | `Inter sans-serif` (13.5px – 14px, muted foreground) | Restrained secondary explanation providing architectural clarity without technical noise. | `LEVEL_2_INTERFACE` (220–360ms) |
| **Layer D** | **System State Baseline** | `JetBrains Mono` (11px text-muted-foreground/45) | Tiny technical baseline confirming live backend connection (`UNDERSTANDING · LIVE`). | `LEVEL_1_MICRO` (120–180ms) |

---

## 3. Cognitive Stage Transition Rules & Backend Truth

| Stage ID | Primary Cognitive Statement | Visual Behavior | Concrete Backend Truth Source |
|:---|:---|:---|:---|
| `stage_perimeter` | **"Establishing the perimeter."** | Initial cognitive reveal; quiet domain anchor locked in view. | DNS / Anycast resolution & nameserver telemetry probe |
| `stage_infrastructure` | **"Reading the infrastructure."** | Previous statement settles quietly; new statement takes visual prominence. | Edge TLS handshake & HTTP response header inspection |
| `stage_signals` | **"Connecting the signals."** | Strongest synthesis transition; relationship signals cross-correlated. | Technology fingerprinting & multi-hop ingress correlation |
| `stage_synthesis` | **"Building the current understanding."** | Smooth spatial emergence toward the first intelligence surface. | Executive Brief generation & canonical observation assembly |

> **Truth Guarantee**: Stages are driven by genuine backend milestones. Nebula never manufactures fake 520ms-per-stage animation loops merely to look busy. If a stage completes rapidly, the interface moves forward immediately.

---

## 4. Telemetry Restraint: Permanently Rejected Progress Meters

GX-R009 permanently rejects:
- ❌ Progress percentage bars (`████████░░ 82%`)
- ❌ Technical check counters (`127 / 184 checks completed`)
- ❌ Security checklist tick-boxes (`DNS ✓`, `TLS ✓`, `HTTP ✓`, `Tech ✓`)
- ❌ Generic scanner terminology (`Scanning...`, `Probing target...`)

Instead, Nebula communicates cognitive milestone synthesis:
$$\text{"Connecting the signals."} \longrightarrow \text{"Synthesizing relationship evidence and behavioral patterns across systems."}$$

---

## 5. Spatial Emergence Progression (Canvas Recomposition)

Rather than jumping abruptly from *"Connecting the signals"* to a sudden wall of cards, the intelligence canvas emerges gradually:

$$\begin{matrix}
\mathbf{UNDERSTANDING\ DISCOVERY} \\
\downarrow \\
\mathbf{FIRST\ SIGNAL\ CRYSTALLIZATION} \\
\downarrow \\
\mathbf{CURRENT\ UNDERSTANDING\ (Executive\ Brief)} \\
\downarrow \\
\mathbf{WHAT\ DESERVES\ ATTENTION\ (Observations)} \\
\downarrow \\
\mathbf{INFRASTRUCTURE\ ARCHITECTURE\ MATRIX}
\end{matrix}$$

---

## 6. Motion Discipline (GX-R007 Alignment)

- **Level 1 Micro (120–180ms)**: Opacity transitions, text settling, quiet baseline status updates.
- **Level 2 Interface (220–360ms)**: Cognitive stage replacement, contextual text cross-fades, first intelligence surface reveal.
- **Level 3 Nebula Transition (~520ms)**: `IDLE` $\rightarrow$ `UNDERSTANDING` conceptual transition, and `UNDERSTANDING` $\rightarrow$ first meaningful intelligence composition.
- **Strictly Prohibited**: No perpetual animation, no bouncing, no pulsing radar, no particle field.

---

## 7. Mobile Composition

- Vertically compact, strictly bounded hierarchy:
  $$\mathbf{NEBULA} \longrightarrow \mathbf{UNDERSTANDING} \longrightarrow \mathbf{example.com} \longrightarrow \mathbf{Primary\ Cognitive\ Statement} \longrightarrow \mathbf{Supporting\ Context}$$
- **Persistent Visibility**: The target domain never disappears or truncates undesirably on smaller viewports.

---

## 8. Stalled Discovery & Calm Resilience

- **Slow Discovery**:
  - Primary: *"Nebula is still forming the understanding."*
  - Context: *"Correlating multi-regional signals and routing evidence."*
  - (Never *"Still scanning... 94%"*).
- **Operation Failure**:
  - Primary: *"Nebula couldn't complete this understanding."*
  - Action: *"Try again →"*
  - Renders in the same calm shell with zero technical stack traces.

---

## 9. Accessibility Contract

- **`aria-live="polite"`**: Cognitive stage updates announce politely without disruptive speech synthesizer queue flooding.
- **Reduced Motion**: Disables transition choreography under `prefers-reduced-motion: reduce`.
- **Touch Ergonomics**: All interactive retry and return elements maintain $\ge 44\text{px}$ touch targets.

---

## 10. Eleven Explicitly Rejected Patterns

1. ❌ Radar animation with sweep lines or target blips
2. ❌ Rotating 3D wireframe globe or orb
3. ❌ Pulsing network graph nodes with active physics simulation
4. ❌ *"AI is thinking..."* glowing sparkles or magical wand animations
5. ❌ Fake matrix rain or green terminal scrolling text
6. ❌ Progress percentage bars (e.g., 82%, 99%)
7. ❌ Check counters (e.g., *"127 / 184 checks completed"*)
8. ❌ Security scanner checkmark lists (e.g., *"DNS ✓"*, *"TLS ✓"*)
9. ❌ Constant skeleton shimmer across unpopulated cards
10. ❌ Manufactured artificial delays when backend data is already ready
11. ❌ Full-screen spinner or blocking loader overlay

---

## Acceptance Gate & Definition of Done

$$\mathbf{GX\text{-}R009\ Acceptance\ Gate}$$

> **"A guest can watch Nebula transition from intent into live infrastructure understanding and perceive meaningful progress without being presented with scanner mechanics, fake telemetry, or visual noise."**

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
\mathbf{GX\text{-}R009\ 🔒} & \mathbf{LIVE\ TELEMETRY\ \&\ DISCOVERY\ STAGING} \\
\downarrow & \\
\mathbf{GX\text{-}R010} & \text{FIRST MEANINGFUL INTELLIGENCE \& DISCLOSURE}
\end{matrix}$$
