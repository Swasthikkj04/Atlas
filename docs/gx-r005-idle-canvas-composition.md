# GX-R005 — Idle Canvas Composition

**Phase:** Guest Experience Redesign (`GX-R`)  
**Ticket:** `GX-R005`  
**Type:** Architecture / UX / Visual Composition  
**Priority:** P0 — Foundation  
**Status:** 🔒 Ready for Implementation / Frozen Idle Canvas Composition  
**Depends on:** `GX-R001` 🔒 $\rightarrow$ `GX-R002` 🔒 $\rightarrow$ `GX-R003` 🔒 $\rightarrow$ `GX-R004` 🔒  
**Unblocks:** `GX-R006` — Domain Input & Intent  

---

## 🔒 Objective

Define the exact spatial composition of Nebula's first Guest Experience canvas before any implementation begins.

The idle canvas must communicate:
> **"Nebula is ready to understand infrastructure."**

It must feel like entering a premium intelligence environment, not landing on a SaaS marketing page.

---

## 1. Canonical Idle Canvas

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  NEBULA                                      Docs · Workspace        │
│                                                                      │
│                                                                      │
│                                                                      │
│                 Infrastructure intelligence                         │
│                 begins with understanding.                           │
│                                                                      │
│                 Enter a domain.                                      │
│                 Nebula will build its current understanding.         │
│                                                                      │
│                                                                      │
│              ┌────────────────────────────────────────────┐          │
│              │  example.com                              │          │
│              └────────────────────────────────────────────┘          │
│                                                                      │
│                         Understand →                                 │
│                                                                      │
│                                                                      │
│                                                                      │
│  Current intelligence · No account required                          │
│                                                                      │
│  Intelligence before data · Context before details ·                │
│  Summary before evidence                                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

*This is a spatial composition model, not a literal UI mockup. Exact typography, spacing, and hairline treatment are implementation details.*

---

## 2. Spatial Hierarchy (5 Zones)

```
Zone A — Identity
         ↓
Zone B — Intelligence Statement
         ↓
Zone C — Domain Intent (Input + Action)
         ↓
Zone D — Quiet Context
         ↓
Zone E — Product Signature
```

### Zone A — Identity
- **Mark**: Minimal Nebula wordmark / living mark.
- **Navigation**: Restrained links (`Docs`, `Workspace`). Zero marketing dropdowns or promotional banners.

### Zone B — Intelligence Statement
- **Headline**: *"Infrastructure intelligence begins with understanding."*
- **Supporting**: *"Enter a domain. Nebula will build its current understanding."*
- **Prohibited**: Buzzwords like `"AI-powered"`, `"Next-generation"`, `"Enterprise-grade"`, or `"Secure your infrastructure today"`.

### Zone C — Domain Intent
- **Object**: Dedicated domain input container + `Understand →` action trigger.
- **Post**: Acts as one cohesive interaction unit. Detailed state interactions handled in `GX-R006`.

### Zone D — Quiet Context
- **Copy**: *"Current intelligence · No account required"*
- **Tone**: Communicates the Guest Experience boundary without sounding like a conversion pitch.

### Zone E — Product Signature
- **Baseline**: *"Intelligence before data · Context before details · Summary before evidence"*
- **Role**: Quiet philosophical baseline subordinate to the intelligence canvas.

---

## 3. Viewport Philosophy & Zero-Scroll Guarantee

> [!IMPORTANT]
> **Zero-Scroll Invariant:**  
> GX must **not** require the guest to scroll to perceive the full proposition and initiate their first interaction.

- **Desktop ($\ge 1024\text{px}$)**: Complete 5-zone composition fits comfortably in the primary viewport.
- **Laptop ($768\text{px} - 1023\text{px}$)**: Intact hierarchy with proportionally scaled vertical rhythm.
- **Mobile ($\le 640\text{px}$)**: Vertically stacked surface; zero horizontal overflow; primary input remains completely above the fold.

---

## 4. Visual Weight Distribution

$$\begin{matrix}
\mathbf{INTELLIGENCE} \\
\downarrow \\
\mathbf{DOMAIN\ INTENT} \\
\downarrow \\
\mathbf{ACTION} \\
\downarrow \\
\mathbf{TRUST\ CONTEXT} \\
\downarrow \\
\mathbf{PRODUCT\ SIGNATURE}
\end{matrix}$$

$$\require{cancel}\cancel{\begin{matrix}
\text{Logo} \\
\downarrow \\
\text{Huge Hero} \\
\downarrow \\
\text{Three Feature Cards} \\
\downarrow \\
\text{Testimonials} \\
\downarrow \\
\text{Pricing} \\
\downarrow \\
\text{CTA}
\end{matrix}}$$

The domain interaction is the destination of the first impression.

---

## 5. Ambient Intelligence & Depth

- **Permitted**: Restrained spatial motion, subtle state transitions, typographic movement, quiet focus response, barely perceptible depth (max 0.05 opacity).
- **Prohibited**: Continuous particle swarms, glowing stars, AI sparkle wands, animated gradient blobs, or looping 3D backgrounds.

> **Principle:** The interface feels alive because it responds — not because it continuously animates.

---

## 6. Idle State Invariant

Before domain entry:
- Clear, uncrowded input surface.
- **Zero fake scan results** or mocked data pretending Nebula has already analyzed something.

---

## 7. Sample Domain Shortcuts

Sample domains serve as subtle interaction aids:

$$\text{Try an example: } \mathbf{stripe.com} \cdot \mathbf{github.com} \cdot \mathbf{cloudflare.com}$$

- **Role**: Fast interaction shortcuts illustrating multi-tier infrastructure.
- **Boundary**: Subtle, optional; never dominates or replaces the input.

---

## 8. Interaction Entry Point

$$\mathbf{Domain\ Intent} \longrightarrow \mathbf{Understand\ \rightarrow} \longrightarrow \mathbf{Guest\ Workspace}$$

- 🚫 No forced registration
- 🚫 No email capture walls
- 🚫 No upfront paywalls or pricing selection
- 🚫 No modal popups or marketing interruptions

The guest earns the opportunity to create a Workspace **after** experiencing intelligence.

---

## 9. Accessibility Contract (WCAG 2.1 AA)

- Full keyboard navigation (`Tab`, `Enter`, `Esc`).
- Visible, high-contrast focus rings (`outline-ring/50`).
- Semantic heading structure (`<h1>` for intelligence statement).
- Accessible ARIA labels on domain inputs and triggers.
- Full `prefers-reduced-motion` compliance.

---

## 10. Responsive Invariant

> **"Across every supported viewport, the guest must always understand what Nebula is, what they should enter, and what happens next."**

---

## 11. Explicitly Rejected Idle Canvas Patterns (12 Items)

1. ❌ Infinite landing-page scroll
2. ❌ Marketing feature grids with cards
3. ❌ Pricing sections and tier comparison tables
4. ❌ Customer testimonials and review quotes
5. ❌ Giant hero 3D illustrations or mascot art
6. ❌ Decorative AI imagery and particle swarms
7. ❌ Multiple competing CTAs (`Start Free` vs `Book Demo`)
8. ❌ Signup-first or email-gate architecture
9. ❌ Fake intelligence previews or mocked scan graphs
10. ❌ Dashboard KPI walls with numeric metric counters
11. ❌ Excessive card containers nesting the input
12. ❌ Neon glowing borders or pulsating ring animations

---

## 12. Acceptance Criteria & Certification Gate

| Criterion | Requirement | Status |
|:---|:---|:---:|
| **First Viewport** | Complete primary interaction visible without scrolling | ✅ Frozen |
| **Product Identity** | Minimal living mark + quiet Docs/Workspace links | ✅ Frozen |
| **Domain Intent** | Primary interaction object (`[ input ]` + `Understand →`) | ✅ Frozen |
| **Microcopy** | Literary statement + "Current intelligence · No account required" | ✅ Frozen |
| **Sample Domains** | Subtle, optional (`stripe.com`, `github.com`, `cloudflare.com`) | ✅ Frozen |
| **Product Signature** | Quiet baseline ("Intelligence before data...") | ✅ Frozen |
| **Accessibility** | WCAG 2.1 AA aligned + reduced motion support | ✅ Frozen |
| **Conversion Boundary** | Zero upfront gates or forced registration | ✅ Frozen |

---

### 🔒 GX-R005 Definition of Done

This ticket is certified complete when:

> **"The idle Guest Workspace canvas establishes a viewport-bounded spatial composition where identity, intelligence statement, domain intent input, trust context, and product signature fit completely within the initial view without requiring scrolling."**

**Core Objective:**
> **"Nebula is ready to understand infrastructure."**

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
\mathbf{GX\text{-}R005\ 🔒} & \mathbf{IDLE\ CANVAS\ COMPOSITION} \\
\downarrow & \\
\mathbf{GX\text{-}R006} & \text{DOMAIN INPUT \& INTENT}
\end{matrix}$$

---

## Next Ticket

$$\mathbf{GX\text{-}R006} \text{ — Domain Input \& Intent}$$

*Granular interaction specification for domain input: validation, placeholder behavior, focus states, keyboard ergonomics, inline error recovery, and the 520ms Nebula Pause transition into UNDERSTANDING.*
