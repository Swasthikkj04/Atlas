# GX-R003 — Guest Shell & Entry Architecture

**Phase:** GX-R — Nebula First Experience Redesign  
**Ticket:** `GX-R003`  
**Type:** UX Architecture / Frontend Architecture  
**Priority:** P0 — Blocking  
**Status:** 🔒 Ready for Implementation / Frozen Shell Architecture  
**Depends on:** `GX-R001` 🔒, `GX-R002` 🔒  
**Unblocks:** `GX-R004` — Idle / First Impression Experience  

---

## 1. Objective

Create the canonical physical shell for the Nebula Guest Workspace.

- `GX-R001` established **What GX IS**.
- `GX-R002` established **How GX is STRUCTURED**.
- `GX-R003` establishes **How GX is CONTAINED**.
- `GX-R004` will establish **How GX FEELS**.

The shell must make the guest feel that they have entered Nebula, rather than opened a public report.

> [!IMPORTANT]
> **Core Principle:**  
> $$\mathbf{The\ shell\ should\ disappear\ into\ the\ experience.\ The\ intelligence\ should\ remain\ the\ focus.}$$

---

## 2. Canonical Guest Entry

The Guest Experience begins at:

$$\text{Public Entry (/)} \longrightarrow \text{Guest Entry (/guest)} \longrightarrow \text{Domain Intent} \longrightarrow \text{Begin Understanding} \longrightarrow \text{Guest Workspace}$$

```
                    NEBULA
                      │
                      ▼
               Guest Entry (/guest)
                      │
                      ▼
              Domain Intent (stripe.com)
                      │
                      ▼
             Begin Understanding (520ms Nebula Pause)
                      │
                      ▼
             Guest Workspace
```

The entry experience must **not** immediately dump or expose the entire Workspace. It establishes deliberate cognitive progression.

---

## 3. Shell Architecture: Five Architectural Layers

```
┌────────────────────────────────────────────────────────────┐
│ 1. BRAND / IDENTITY LAYER                                  │
├────────────────────────────────────────────────────────────┤
│ 2. ORIENTATION / CONTEXT LAYER                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 3. INTELLIGENCE CANVAS                                     │
│    (Overview, Findings, Infrastructure, Evidence)          │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 4. CONTEXTUAL ACTIONS LAYER                                │
├────────────────────────────────────────────────────────────┤
│ 5. QUIET PRODUCT SIGNATURE LAYER                           │
└────────────────────────────────────────────────────────────┘
```

These are **semantic layers**, not mandatory visible bars. The implementation avoids conventional application chrome.

---

## 4. Brand / Identity Layer

Nebula identity is immediately recognizable but strictly restrained.

### Required
- Nebula product identity & living logo mark
- Clear product presence with Newsreader serif and Inter sans
- Premium typography and spatial rhythm
- Subtle visual atmosphere (0.05 max idle opacity)

### Prohibited
- ❌ Oversized logos
- ❌ Promotional headlines
- ❌ Marketing banners
- ❌ Excessive gradients
- ❌ Decorative noise or particle gimmicks
- ❌ "AI-powered" marketing language
- ❌ Generic SaaS visual patterns

The guest should understand:
$$\mathbf{"This\ is\ Nebula."}$$
without being told repeatedly.

---

## 5. Orientation Layer

The guest must always understand:
1. *Where am I?*
2. *What domain am I understanding?*
3. *What state is Nebula in?*

```
┌────────────────────────────────────────────────────────────┐
│ NEBULA   /   stripe.com   •   Current Understanding        │
└────────────────────────────────────────────────────────────┘
```

Maintains domain identity, timestamp freshness, and quick-action triggers for new domain understanding.

---

## 6. Intelligence Canvas

The intelligence canvas is the largest and most important shell region.

It hosts the surfaces defined by GX-R002:
- **`Overview`**
- **`Findings`**
- **`Infrastructure`**
- **`Evidence`**

The canvas seamlessly transitions across all 7 resilience states without tearing down or rebuilding the surrounding shell structure.

---

## 7. No Report Container

The shell explicitly rejects the vertical report stack:

$$\require{cancel}\cancel{\begin{matrix}
\text{Report} \\
\downarrow \\
\text{Section 1} \\
\downarrow \\
\text{Section 2} \\
\downarrow \\
\text{Section 3} \\
\downarrow \\
\text{5,000px Scroll}
\end{matrix}}$$

Instead:

```
┌─────────────────────────────────────┐
│ Nebula / Domain                     │
├───────────┬─────────────────────────┤
│           │                         │
│ Context   │ Intelligence            │
│           │ Canvas                  │
│           │                         │
│           │                         │
│           │                         │
└───────────┴─────────────────────────┘
```

---

## 8. Navigation Model

GX navigation is minimal and contextual:
- `Overview`
- `Findings`
- `Infrastructure`

`Evidence` remains contextual (triggered in-situ via *"Understand why →"*), rather than a competing top-level destination.

> [!NOTE]
> If a navigation element does not help the guest understand or investigate their infrastructure, it should not exist.

---

## 9. Guest Context Persistence

During a Guest Session, the shell preserves:
- `currentDomain`
- `understandingState`
- `selectedSurface`
- `selectedFindingId`
- `investigationContext`
- `relevantUiState`

$$\text{Overview} \longrightarrow \text{Finding A} \longrightarrow \text{Understand why } \rightarrow \longrightarrow \text{Evidence Drawer} \longrightarrow \text{Close} \longrightarrow \text{Finding A} \longrightarrow \text{Overview}$$

No context is unnecessarily lost during investigation.

---

## 10. Investigation Surface

Evidence is **not a navigation escape**. When the guest clicks *"Understand why →"*, the shell opens the contextual investigation surface.

```
┌─────────────────────────────────────────────────────┐
│ Overview Canvas                                     │
│                                                     │
│   Primary Story                                     │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │ Contextual Investigation Drawer             │   │
│   │                                             │   │
│   │ Verifiable Wire Evidence                    │   │
│   │                                             │   │
│   │                                      Close ×│   │
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

The underlying context remains mounted and preserved.

---

## 11. Entry $\longrightarrow$ Workspace Transition

```
ENTRY (/guest)
      │
      ▼
DOMAIN ACCEPTED
      │
      ▼
UNDERSTANDING BEGINS
      │
      ▼
SHELL ESTABLISHES ITSELF
      │
      ▼
TELEMETRY / 520ms NEBULA PAUSE
      │
      ▼
FIRST INTELLIGENCE APPEARS
      │
      ▼
WORKSPACE BECOMES FULLY AVAILABLE
```

The interface must **not** flash between unrelated layouts.

---

## 12. Seven-State Shell Stability Contract

| State | Shell Posture | Stability Invariant |
|:---|:---|:---:|
| **`IDLE`** | Calm entry surface with prominent domain intent input | 🔒 No layout jump |
| **`UNDERSTANDING`** | Stable shell established; progressive thinking telemetry with 520ms cadence | 🔒 No layout jump |
| **`PARTIAL`** | Executive brief appears smoothly while auxiliary probes complete | 🔒 No layout jump |
| **`READY`** | Full bounded Guest Workspace with complete overview & topology | 🔒 No layout jump |
| **`QUIET`** | Calm, spacious intelligence confirming stable perimeter | 🔒 No layout jump |
| **`MEANINGFUL_CHANGE`** | Primary Attention finding receives prominent visual priority | 🔒 No layout jump |
| **`FAILURE`** | Same shell structure with calm failure narrative and 1-click retry | 🔒 No layout jump |

---

## 13. Responsive Architecture

- **Desktop ($\ge 1024\text{px}$)**: Full spatial model; fixed identity & orientation; side-by-side or bounded grid; contextual slide-over drawer ($480\text{--}560\text{px}$).
- **Tablet ($641\text{px}\text{--}1023\text{px}$)**: Compact orientation header; refined canvas density; bottom sheet or full drawer.
- **Mobile ($\le 640\text{px}$)**: Stacked bounded surfaces ($\text{Identity} \rightarrow \text{Domain} \rightarrow \text{Current Surface} \rightarrow \text{Next contextual surface}$) with dedicated overlay drawer.

---

## 14. Visual Foundation Constraints

- **Typography**: Editorial display serif (Newsreader), ultra-clear sans (Inter), technical monospace (JetBrains Mono).
- **Color**: Semantic restrained palettes (8% light / 12% dark tint fills, hairline borders `#E1E1DC`/`#E7E7E3`).
- **Character**: *quiet · premium · precise · intelligent*.
- **Avoid**: Card-everything sprawl, heavy shadows, generic glassmorphism.

---

## 15. Atmospheric Layer Contract

$$\mathbf{Atmosphere\ establishes\ identity.\ Intelligence\ establishes\ value.}$$

- **Permitted**: Subtle constellation node treatment, restrained background depth, ambient visual effects.
- **Forbidden**: Animated backgrounds competing with content, excessive stars/particles, distracting 3D or parallax gimmicks.

---

## 16. Motion Contract

- Motion communicates state rather than decorating it.
- Respects the canonical **520ms Nebula Pause** during understanding transitions.
- Fully honors `prefers-reduced-motion: reduce`.

---

## 17. Accessibility

- Semantic HTML5 landmarks (`header`, `main`, `section`, `aside`, `footer`)
- Complete keyboard navigation with visible focus rings (`outline-ring/50`)
- `Escape` key listener to dismiss contextual drawer
- Logical focus restoration upon drawer dismissal
- Screen-reader live regions for progressive telemetry
- Color-independent severity communication

---

## 18. SEO Boundary

Preserves `GX-R001` indexability rules:
- Public entry (`/`, `/guest`, `/docs/*`) $\longrightarrow$ `index, follow`
- Temporary guest sessions (`/guest?domain=*`) $\longrightarrow$ `noindex, nofollow`
- Workspace, Admin, Settings $\longrightarrow$ `noindex, nofollow`

---

## 19. Performance Priority Pipeline

$$\text{1. Shell} \longrightarrow \text{2. Identity} \longrightarrow \text{3. Domain Context} \longrightarrow \text{4. Primary Interaction} \longrightarrow \text{5. Current Intelligence} \longrightarrow \text{6. Secondary Intelligence} \longrightarrow \text{7. Evidence}$$

The initial interaction must never wait for secondary assets.

---

## 20. Conversion Boundary

The shell must **never** contain permanent signup pressure:
$$\require{cancel}\cancel{\text{"Create account!"} \quad \text{"Sign up now!"} \quad \text{"Upgrade!"} \quad \text{"Unlock!"}}$$

Conversion is an **earned continuity action** positioned contextually.

---

## 21. Explicitly Rejected Shell Patterns

1. ❌ Marketing landing page disguised as GX
2. ❌ Traditional SaaS sidebar with 12 items
3. ❌ Dashboard KPI grid with metric counters
4. ❌ Long-form report container with infinite scroll
5. ❌ Full Workspace clone with disabled upgrade buttons
6. ❌ Persistent upgrade/signup banners crowding the screen
7. ❌ Excessive cosmic decoration and particle gimmicks
8. ❌ Navigation-heavy application chrome
9. ❌ State-specific page rebuilds that flash or jump

---

## 22. Implementation Boundaries

GX-R003 strictly respects boundaries:
- ❌ No backend intelligence rewriting
- ❌ No alternate or downgraded findings
- ❌ No persistence or account management
- ❌ No Admin surface exposure

---

## 23. Acceptance Criteria & Certification Gate

| Area | Requirement | Status |
|:---|:---|:---:|
| **Guest entry** | Dedicated GX entry flow (`/` $\rightarrow$ `/guest`) | ✅ Certified |
| **Shell** | Bounded spatial application surface (5 layers) | ✅ Certified |
| **Report model** | ❌ Rejected infinite vertical document | ✅ Certified |
| **Workspace relationship** | Inspired by Workspace; not a crippled clone | ✅ Certified |
| **Navigation** | Minimal, contextual, and unobtrusive | ✅ Certified |
| **Intelligence canvas** | Primary visual region across 7 states | ✅ Certified |
| **Context** | Preserved through investigation drawer | ✅ Certified |
| **State transitions** | Structurally stable; zero layout jumps | ✅ Certified |
| **Responsive** | Desktop, tablet, and mobile transformations | ✅ Certified |
| **Accessibility** | Semantic landmarks, keyboard, focus restore | ✅ Certified |
| **SEO** | Strict public vs private boundary preserved | ✅ Certified |
| **Performance** | Progressive priority loading | ✅ Certified |
| **Conversion** | Earned continuity; zero paywall pressure | ✅ Certified |
| **Visual identity** | Premium Nebula design language | ✅ Certified |
| **Atmosphere** | Subordinate to intelligence | ✅ Certified |
| **Backend** | Canonical intelligence untouched | ✅ Certified |

---

### 🔒 GX-R003 Certification Gate

This ticket is certified complete when:

> *"A guest can enter Nebula, identify the domain being understood, recognize the current state, move through the intelligence surfaces, investigate evidence, and return to their previous context — all within one coherent bounded environment."*

**Frozen Architectural Rule:**
> **"The Guest Workspace is an environment, not a page."**

---

## Handoff Progression

$$\begin{matrix}
\mathbf{GX\text{-}R001\ 🔒} & \text{What GX IS} \\
\downarrow & \\
\mathbf{GX\text{-}R002\ 🔒} & \text{How GX is STRUCTURED} \\
\downarrow & \\
\mathbf{GX\text{-}R003\ 🔒} & \text{How GX is CONTAINED} \\
\downarrow & \\
\mathbf{GX\text{-}R004} & \mathbf{How\ GX\ FEELS}
\end{matrix}$$

---

## Next Ticket

$$\mathbf{GX\text{-}R004} \text{ — Idle / First Impression Experience}$$

*Getting ruthless about the first impression — idle state, domain input bar, typography, palette, composition, micro-interactions, and the first few seconds of the Nebula experience.*
