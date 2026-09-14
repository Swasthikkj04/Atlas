# GX-R004 — First Impression Visual Direction

**Phase:** Guest Experience Redesign (`GX-R`)  
**Ticket:** `GX-R004`  
**Type:** UX Architecture / Visual Design System  
**Priority:** P0 — Foundation  
**Status:** 🔒 Ready for Implementation / Frozen Visual Direction  
**Depends on:** `GX-R001` 🔒 $\rightarrow$ `GX-R002` 🔒 $\rightarrow$ `GX-R003` 🔒  
**Unblocks:** `GX-R005` — Idle Canvas Composition  

---

## 1. Objective

Establish the visual DNA of Nebula's Guest Experience before individual UI surfaces are redesigned.

The goal is not to make GX visually flashy.

The goal is:
> **Make Nebula feel immediately credible, intelligent, calm, and premium before the guest has entered a domain.**

The first impression must communicate product quality through restraint, not through marketing language.

---

## 2. Frozen Visual Principle

> [!IMPORTANT]
> **Frozen Principle:**  
> $$\mathbf{Nebula\ should\ look\ like\ an\ intelligence\ product,\ not\ a\ marketing\ website.}$$

The guest should encounter:

$$\begin{matrix}
\mathbf{NEBULA} \\
\downarrow \\
\text{Infrastructure Intelligence} \\
\downarrow \\
\text{Give us a domain} \\
\downarrow \\
\mathbf{Understand\ \rightarrow}
\end{matrix}$$

$$\require{cancel}\cancel{\begin{matrix}
\text{Hero} \\
\downarrow \\
\text{Features} \\
\downarrow \\
\text{Benefits} \\
\downarrow \\
\text{Testimonials} \\
\downarrow \\
\text{Pricing} \\
\downarrow \\
\text{CTA}
\end{matrix}}$$

The conventional SaaS marketing funnel pattern is **explicitly rejected**.

---

## 3. Visual Personality

GX must consistently express five core characteristics:

| Characteristic | Expression | Practical Architecture Requirement |
|:---|:---|:---|
| **`Calm`** | Generous whitespace, restrained motion, low visual noise | Minimum 65–75 CPL readability measure; negative space around intelligence |
| **`Confident`** | Strong hierarchy, direct assertions, no defensive explanation | Direct statement-driven headings; zero apologies or marketing hyperbole |
| **`Intelligent`** | Editorial information design synthesizing meaning | Synthesis before raw data; narrative brief preceding granular observations |
| **`Technical`** | Precise metadata, protocol-accurate vocabulary, timestamps | JetBrains Mono for domains, headers, hashes, protocol statuses |
| **`Premium`** | Material restraint, typography, spacing, and hairline detail | Hairline borders (`#EEEEEB` / `#E1E1DC`), zero glassmorphism, no rainbow gradients |

The experience should feel closer to a **high-end professional instrument** than a conventional SaaS landing page.

---

## 4. Typography Architecture

Typography is one of the primary differentiators across three semantic layers:

```
┌────────────────────────────────────────────────────────────┐
│ 1. NARRATIVE LAYER (Newsreader / Editorial Serif)          │
│    • Primary posture assertions                            │
│    • Executive brief & meaningful narrative                │
│    • High-level system interpretations                     │
├────────────────────────────────────────────────────────────┤
│ 2. INTERFACE LAYER (DM Sans / Inter Sans)                  │
│    • Navigation anchors & search input controls            │
│    • Action triggers & buttons                             │
│    • Status badges & interactive controls                  │
├────────────────────────────────────────────────────────────┤
│ 3. TECHNICAL LAYER (JetBrains Mono)                        │
│    • Target domain FQDNs & IP/CIDR telemetry               │
│    • Protocol headers, TLS cipher suites, DNS records      │
│    • Cryptographic hashes, fingerprints, & timestamps      │
└────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **Typography Rule:**  
> Do not use typography merely to make everything larger. Hierarchy must emerge from **Scale, Weight, Spacing, Line length (65–75 CPL), Contrast, and Position** — never from oversized headings.

---

## 5. Color Architecture

The color system remains semantic, not decorative:

- **Primary Surfaces**: Neutral foundation (`#F9F9F7`, `#FFFFFF`, `#FAFAF8` light / `#121514`, `#1A1D1C` dark).
- **Borders**: Restrained hairlines around containers and divisions (`#EEEEEB` light / `#232726` dark).
- **Dark Surfaces**: Permitted for atmospheric depth, technical context, focused investigation, and telemetry — but not the entire personality by default.

---

## 6. Semantic Color & Restrained Severity

Color must communicate meaning:

$$\begin{matrix}
\mathbf{NORMAL} & \longrightarrow & \text{neutral / quiet} \\
\mathbf{INFORMATION} & \longrightarrow & \text{subtle informational blue/slate} \\
\mathbf{ATTENTION} & \longrightarrow & \text{controlled amber semantic treatment} \\
\mathbf{CRITICAL} & \longrightarrow & \text{controlled destructive treatment} \\
\mathbf{SUCCESS} & \longrightarrow & \text{restrained positive emerald}
\end{matrix}$$

### Explicitly Rejected
- ❌ Rainbow gradients
- ❌ Neon cyberpunk aesthetics
- ❌ Glowing cards and pulse shadows
- ❌ Arbitrary blue/purple "AI" gradients
- ❌ Severity colors without textual meaning

> [!IMPORTANT]
> A guest should **never** need color alone to understand an infrastructure state. Every state requires an unambiguous textual label.

---

## 7. Spatial Design Language

$$\mathbf{GX\ should\ have\ air.}$$

The design deliberately uses negative space around important intelligence. Information density increases **only** when the guest chooses to investigate.

Instead of cluttered KPI cards:

```
┌────────────────────────────────────────────────────────────┐
│                   CURRENT UNDERSTANDING                    │
│                                                            │
│       Your infrastructure is largely stable,               │
│       with one observation worth attention.                │
│                                                            │
│                    ────────────────────                    │
│                                                            │
│                     WHAT MATTERS NOW                       │
│                                                            │
│                     Certificate expiry                     │
│                     requires attention                     │
│                                                            │
│                     Understand why →                       │
└────────────────────────────────────────────────────────────┘
```

---

## 8. Surface Language (Three Spatial Levels)

Cards must stop being the default container for everything:

```
LEVEL 1 — CANVAS    (Frameless spatial region: Current Understanding, What Matters Now)
       │
       ▼
LEVEL 2 — SURFACE   (Hairline contained structural area: Findings, Infra Categories)
       │
       ▼
LEVEL 3 — DETAIL    (Focused contextual drawer / sheet: Wire Traces, Evidence)
```

$$\require{cancel}\cancel{\text{Card} \longrightarrow \text{Card} \longrightarrow \text{Card} \longrightarrow \text{Card}}$$

---

## 9. Borders & Elevation

- **Default State**: No visible elevation (0px shadow).
- **Separation Mechanism**: Whitespace, hairlines (`#EEEEEB`), tonal separation, and typographic contrast.
- **Shadows**: Reserved strictly for spatial layering (drawers, sheets, floating contextual surfaces).

---

## 10. Shape Language

- **Radius Scale**: Restrained geometry (`xs: 2px`, `sm: 4px`, `md: 6px`, `lg: 8px`, `xl: 12px`).
- **Pills**: Reserved strictly for status badges, state chips, and compact telemetry metadata.
- **Buttons / Containers**: Use subtle rectangular curvature (`rounded-lg` / `rounded-xl`), never oversized bubbles.

---

## 11. Iconography

- **Library**: Lucide technical iconography.
- **Size & Stroke**: 14px–16px optical bounds with 1.5px–1.75px stroke width.
- **Role**: Supports comprehension; never replaces text; visually quiet. Zero giant illustrations.

---

## 12. Motion Philosophy

> [!TIP]
> **Canonical Motion Principle:**  
> $$\mathbf{Motion\ should\ be\ noticed\ only\ when\ it\ improves\ understanding.}$$

- Respects the canonical **520ms Nebula Pause**.
- Subtle entrance transitions and contextual drawer sliding.
- Avoids perpetual loop animations, bouncing controls, or loading theatrics.
- Fully honors `prefers-reduced-motion: reduce`.

---

## 13. Microcopy Direction

Short, precise, human, and confident:

| Intent | Preferred Nebula Voice | Rejected Anti-Pattern |
|:---|:---|:---|
| **Investigation** | `Understand why →` | `Click here to view more information about this finding.` |
| **Stable Perimeter** | `Infrastructure appears stable.` | `Your infrastructure scan has completed successfully with 0 errors!` |
| **Attention Finding** | `One thing deserves attention.` | `🚨 WARNING! WE FOUND A CRITICAL SECURITY VULNERABILITY!` |
| **Continuity** | `Keep this understanding →` | `Sign up now to save your scan results!` |

The product **never** sounds excited or hysterical about a user's infrastructure problems.

---

## 14. Interaction Personality

Controls feel deliberate and intellectual:
- **Primary Action**: `Understand →`
- **Investigation**: `Understand why →`
- **Continuity**: `Keep this understanding →`

These actions feel like a natural continuation of intelligence, not conversion traps.

---

## 15. Idle Atmosphere

Atmosphere must **never** compete with intelligence:

```
             faint spatial field (0.05 opacity)
                    ·
        ·                       ·

                  NEBULA

          Infrastructure Intelligence

              [ domain input ]

             Understand →

        ·                       ·
                    ·
```

The interface—not the background—is the hero.

---

## 16. Premium Detail Requirements

First-class design execution requires precision in:
- Exact baseline typography alignment
- Consistent optical spacing
- High-contrast accessible focus-rings (`outline-ring/50`)
- Subtle border opacities and hairline transitions
- Contextual keyboard focus restoration upon drawer dismissal

---

## 17. Responsive Visual Principle

- **Desktop ($\ge 1024\text{px}$)**: Spatial composition (`Identity` $\rightarrow$ `Canvas` $\rightarrow$ `Domain Intent`).
- **Mobile ($\le 640\text{px}$)**: Stacked bounded surfaces (`Identity` $\rightarrow$ `Narrative` $\rightarrow$ `Domain Intent` $\rightarrow$ `Supporting Context`).
- Mobile feels intentionally designed rather than squashed.

---

## 18. Explicitly Rejected Visual Directions

1. ❌ Generic SaaS marketing gradients and hero blobs
2. ❌ AI sparkle aesthetics (magic wands, purple particle clouds)
3. ❌ Neon cyberpunk palettes and high-contrast glowing borders
4. ❌ Excessive glassmorphism and blurred translucent cards
5. ❌ Dashboard KPI walls with equal-weight numeric counters
6. ❌ Giant hero typography dominating the viewport
7. ❌ Card-everything layouts with nested rounded cards
8. ❌ Decorative 3D illustrations or cartoon mascots without meaning
9. ❌ Continuous loop background animations and particle swarms
10. ❌ Marketing-style 3-tier feature grids and pricing tables
11. ❌ Fake urgency badges and countdown timers
12. ❌ Aggressive conversion CTAs and recurring signup popups

---

## 19. Design System Contract

Reuses established Nebula design tokens (`@tokens`, CSS variables) rather than creating a parallel design system:

```
Nebula Design System
        │
        ├── Workspace
        │
        ├── Admin
        │
        └── Guest Experience
                │
                └── GX visual expression
```

---

## 20. Acceptance Criteria & Certification Gate

| Criterion | Requirement | Status |
|:---|:---|:---:|
| **Visual Personality** | 5 core characteristics (Calm, Confident, Intelligent, Technical, Premium) | ✅ Frozen |
| **Typography Hierarchy** | 3 semantic layers (Narrative Serif, Interface Sans, Technical Mono) | ✅ Frozen |
| **Color Hierarchy** | Neutral foundations + hairline borders (`#EEEEEB`) | ✅ Frozen |
| **Semantic Severity** | 5 levels with mandatory textual labels | ✅ Frozen |
| **Surface Language** | 3 levels (Canvas $\rightarrow$ Surface $\rightarrow$ Detail) | ✅ Frozen |
| **Border / Elevation** | 0px default elevation; hairlines; shadows only for drawers | ✅ Frozen |
| **Shape Language** | Restrained radii; pills strictly for status/metadata | ✅ Frozen |
| **Iconography** | Technical Lucide icons (14–16px, 1.5–1.75px stroke) | ✅ Frozen |
| **Motion Philosophy** | 520ms Nebula Pause; reduced-motion compliant | ✅ Frozen |
| **Microcopy Principles** | Precise, human, calm vocabulary | ✅ Frozen |
| **Responsive Principle** | Spatial desktop + stacked bounded mobile | ✅ Frozen |
| **Design System** | Reuses canonical Nebula design tokens | ✅ Frozen |

---

### 🔒 GX-R004 Certification Gate

This ticket is certified complete when:

> **"Nebula feels immediately credible, intelligent, calm, and premium through typographic authority, spatial air, and material restraint before the guest has even entered a domain."**

**Frozen Visual Principle:**
> **"Nebula should look like an intelligence product, not a marketing website."**

---

## Architectural Progression

$$\begin{matrix}
\mathbf{GX\text{-}R001\ 🔒} & \text{WHAT GX IS} \\
\downarrow & \\
\mathbf{GX\text{-}R002\ 🔒} & \text{HOW GX IS STRUCTURED} \\
\downarrow & \\
\mathbf{GX\text{-}R003\ 🔒} & \text{HOW GX IS CONTAINED} \\
\downarrow & \\
\mathbf{GX\text{-}R004\ 🔒} & \mathbf{HOW\ GX\ LOOKS\ \&\ FEELS} \\
\downarrow & \\
\mathbf{GX\text{-}R005} & \text{IDLE CANVAS COMPOSITION}
\end{matrix}$$

---

## Next Ticket

$$\mathbf{GX\text{-}R005} \text{ — Idle Canvas Composition}$$

*Translating this visual direction into the physical idle screen — composition, domain input bar, sample targets, and atmospheric depth.*
