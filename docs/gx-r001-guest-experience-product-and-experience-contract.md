# GX-R001 — Guest Experience Product & Experience Contract

**Phase:** GX-R — Nebula First Experience Redesign  
**Ticket:** `GX-R001`  
**Type:** Product / UX / Architecture  
**Priority:** P0 — Foundation  
**Status:** 🔒 Ready to Implement / Frozen Foundation  
**Depends on:** Existing GX + Workspace Intelligence Contracts (`WX-000`, `WX-002`, `WX-211`, `WX-901`, `WX-1017`)  
**Unblocks:** `GX-R002` — Guest Workspace Information Architecture  

---

## 1. Objective

Establish the canonical product contract for the redesigned Nebula Guest Experience before any visual redesign or implementation begins.

This ticket defines what GX is, what it is not, what intelligence it exposes, how it relates to Workspace, and what principles every subsequent GX-R ticket must obey.

> [!IMPORTANT]
> This is a **contract ticket**, not a UI implementation ticket. It sets the non-negotiable architectural boundaries and design mandates governing all GX-R work.

---

## 2. Canonical Product Definition

### Nebula Guest Experience
Nebula lets anyone understand their infrastructure before asking them to create a Workspace.

GX provides the **same underlying infrastructure intelligence** available to registered Workspace users.

**The difference is persistence, not intelligence.**

```
                    NEBULA INTELLIGENCE
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
       GUEST EXPERIENCE              WORKSPACE
             │                           │
       Current Intelligence         Current Intelligence
       Findings                     Findings
       Evidence                     Evidence
       Infrastructure               Infrastructure
             │                           │
             ✕                           ✓
         Memory                      Memory
         History                     History
         Changes                     Changes
         Management                  Management
```

---

## 3. Non-Negotiable Intelligence Invariant

GX **MUST NOT** create a weaker or different interpretation of infrastructure intelligence.

* If Workspace says:
  $$\text{Finding X} \longrightarrow \mathbf{HIGH}$$
  GX must **not** say:
  $$\text{Finding X} \longrightarrow \text{informational}$$

* If Workspace has evidence:
  $$\text{Observation} \longrightarrow \text{interpretation} \longrightarrow \text{significance} \longrightarrow \text{evidence}$$
  GX must preserve that exact same semantic chain.

### Authority Boundaries

**Backend intelligence is canonical.**

| GX Presentation Controls | GX Prohibited From Modifying |
|:---|:---|
| Presentation styling & typography | Severity calculations / tiering |
| Information hierarchy & density | Finding identity & classification |
| Progressive disclosure timing | Evidence truth & raw protocol payloads |
| Interactive filtering & expansion | Observation interpretation logic |
| Editorial narrative formatting | Infrastructure topology conclusions |
| Topological & system visualization | Remediation truth & posture claims |

---

## 4. Experience Philosophy

The redesigned GX must feel like:
> **Entering Nebula, not filling out a form.**

The user should experience:
$$\text{Curiosity} \longrightarrow \text{Understanding} \longrightarrow \text{Discovery} \longrightarrow \text{Confidence} \longrightarrow \text{Optional Continuity}$$

### Anti-Pattern Rejection
GX strictly rejects the legacy scanner funnel:
$$\require{cancel}\cancel{\text{Landing page} \longrightarrow \text{Scan} \longrightarrow \text{Loading spinner} \longrightarrow \text{Report} \longrightarrow \text{Sign up}}$$

---

## 5. Guest Workspace Concept

GX will adopt the concept:
$$\mathbf{Guest\ Workspace}$$

It is not a miniature copy of the authenticated Workspace. It is a **temporary intelligence environment**.

### Boundary Matrix

| Capability Dimension | Guest Workspace | Authenticated Workspace | Architectural Justification |
|:---|:---:|:---:|:---|
| **Domain Identity** | ✅ | ✅ | Authoritative domain resolution and context anchoring |
| **Current Understanding** | ✅ | ✅ | Core value proposition is identical |
| **Executive Interpretation** | ✅ | ✅ | Editorial synthesis delivered immediately |
| **Findings Intelligence** | ✅ | ✅ | Identical canonical severities and impact ratings |
| **Infrastructure Understanding** | ✅ | ✅ | Full 8-category technology and perimeter mapping |
| **Evidence Inspection** | ✅ | ✅ | Verifiable protocol headers, DNS records, TLS certs |
| **Progressive Investigation** | ✅ | ✅ | Anti-overreach boundaries and deep evidence drawers |
| **Understanding Freshness** | ✅ | ✅ | Explicit timestamp authority and probe completion |
| **Relevant System States** | ✅ | ✅ | Resilient UI matrix (Quiet, Partial, Error, Loading) |
| **Persistent Memory** | ❌ | ✅ | Requires account ownership & database persistence |
| **Historical Comparisons** | ❌ | ✅ | Requires multi-snapshot timeline diffing engine |
| **Domain Management** | ❌ | ✅ | Multi-domain portfolios require registered context |
| **Continuous Monitoring** | ❌ | ✅ | Scheduled cron re-understanding and alert webhooks |
| **Workspace Administration** | ❌ | ✅ | RBAC, organization policies, and team invites |
| **Account Settings** | ❌ | ✅ | User credentials, sessions, and security keys |
| **Long-Term History** | ❌ | ✅ | Multi-year immutable snapshot archive |

---

## 6. Primary Experience Principle

The user should never feel:
> *"I am looking at a report generated by a scanner."*

They should feel:
> *"Nebula understands something about this infrastructure, and is showing me why."*

This is the central UX test for every subsequent GX-R ticket.

---

## 7. Premium Design Contract

The redesign must establish a recognizable Nebula visual identity.

### Required
- **Editorial-quality typography**: Newsreader serif for display and narrative synthesis, Inter sans for structured metrics and labels, JetBrains Mono for code, headers, and hashes.
- **Sophisticated color system**: Muted canvas surfaces (`#F7F7F5` light / `#121514` dark) and card elevations (`#FFFFFF` / `#1A1D1C`).
- **Restrained semantic colors**: 6-tier severity mapping with 8% light / 12% dark tint backgrounds—never full card fills.
- **Exceptional whitespace**: Unbroken Base-8 spatial rhythm (2px to 96px) and optimal reading columns (65–75 CPL / 720–800px).
- **Precise visual hierarchy**: Clear primary/secondary dominances.
- **Distinctive surfaces**: Hairline borders (`#E1E1DC` / `#E7E7E3`).
- **Meaningful motion**: 520ms Nebula Pause and `cubic-bezier(0.16, 1, 0.3, 1)` easing with full `prefers-reduced-motion` compliance.
- **Subtle atmospheric character**: Dynamic background constellation reacting to understanding phases.
- **Premium responsive behavior**: Seamless adaptation across mobile (320px+), tablet, desktop, and ultra-wide screens.

### Prohibited
- ❌ Generic SaaS dashboard styling
- ❌ Excessive card grids and repetitive KPI tiles
- ❌ Rainbow severity colors and full-card background floods
- ❌ Unnecessary heavy gradients or neon overload
- ❌ Decorative animations without cognitive meaning
- ❌ Oversized marketing copy or buzzword banners
- ❌ Visual noise, glassmorphism, or blurry cards
- ❌ "AI-looking" purple particle gimmicks or robot mascots

### Principle
$$\mathbf{Premium\ through\ precision,\ not\ decoration.}$$

---

## 8. Experience Architecture Principle

The experience progressively reveals complexity from high-level synthesis to granular wire evidence:

```
                    DOMAIN
                      │
                      ▼
              CURRENT UNDERSTANDING
                      │
                      ▼
                WHAT MATTERS
                      │
                      ▼
              OTHER OBSERVATIONS
                      │
                      ▼
              INFRASTRUCTURE
                      │
                      ▼
                   EVIDENCE
                      │
                      ▼
              DEEP INVESTIGATION
```

> [!NOTE]
> The user should never be forced to understand the entire infrastructure model before receiving useful insight.

---

## 9. Guest $\longrightarrow$ Workspace Philosophy

Workspace conversion must never feel like a paywall or interruption.

Instead:
$$\text{"Keep this understanding."}$$

The product first earns the user's trust, then offers persistence.

```
             EXPERIENCE NEBULA
                    ↓
             RECEIVE VALUE
                    ↓
           EXPLORE INTELLIGENCE
                    ↓
           UNDERSTAND THE SYSTEM
                    ↓
          ┌─────────────────────┐
          │ Keep this memory    │
          │ Create Workspace →  │
          └─────────────────────┘
```

---

## 10. SEO Contract

SEO must be considered during GX architecture and implementation rather than bolted on afterward.

### Indexability Boundaries

```
┌────────────────────────────────────────────────────────┐
│ PUBLIC / POTENTIALLY INDEXABLE                         │
│ • Nebula public entry experience (/)                  │
│ • Guest experience entry point (/guest)                │
│ • Public documentation and guides (/docs/*)            │
│ • Meta: index, follow                                  │
└────────────────────────────────────────────────────────┘
                           │
                           │ STRICT PRIVACY BOUNDARY
                           ▼
┌────────────────────────────────────────────────────────┐
│ PRIVATE / NON-INDEXABLE                                │
│ • Active guest assessment sessions (/guest?domain=...) │
│ • Authenticated Workspace (/workspace/*)              │
│ • Admin Console surfaces (/admin/*)                    │
│ • Account and profile settings (/settings/*)           │
│ • Meta: noindex, nofollow                              │
└────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> SEO must never compromise guest privacy or cross authenticated security boundaries.

---

## 11. Production Contract

Every GX-R implementation must account for the five pillars of production excellence:

1. **Performance**:
   - Minimal unnecessary JavaScript payload with tree-shaken imports.
   - Controlled animation cost (GPU-accelerated transforms/opacity).
   - Efficient rendering without extraneous React re-renders.
   - Sub-300ms initial interactive input readiness.
2. **Accessibility**:
   - Semantic HTML5 landmark regions (`main`, `header`, `section`, `footer`).
   - Full keyboard navigability with visible focus indicators (`outline-ring/50`).
   - Screen-reader accessible live regions for real-time telemetry.
   - WCAG 2.1 AA compliant color contrast across light and dark themes.
   - Reduced-motion support (`prefers-reduced-motion: reduce`).
3. **Responsive**:
   - Mobile (320px–640px), tablet (641px–1024px), desktop (1025px–1440px), and large displays (1440px+).
4. **Resilience Matrix**:
   - `First-run`: Curated sample domain targets (`stripe.com`, `github.com`, `vercel.com`).
   - `Loading`: Step-by-step thinking sequence with deliberate 520ms Nebula pause.
   - `Partial results`: Unbroken brief synthesis even if specific probes time out.
   - `Quiet/stable state`: Clear articulation of stable perimeter without artificial alert filler.
   - `Failure`: Typed error codes (`NETWORK_FAILURE`, `DOMAIN_INSUFFICIENT_SIGNAL`, `RATE_LIMIT_EXCEEDED`).
   - `Retry`: Preservation of input domain and 1-click recovery.
   - `Network interruption`: Clear offline state detection and reconnection guidance.
5. **Security**:
   - Strict guest session isolation.
   - Zero sensitive data leakage in public URLs or storage.
   - No accidental Workspace privilege elevation.
   - Zero Admin surface exposure.

---

## 12. Design Decision

> [!IMPORTANT]
> 🔒 **DECISION**: Nebula GX will be redesigned as a **Guest Workspace** rather than a traditional landing $\rightarrow$ scanner $\rightarrow$ report flow.  
> The Guest Workspace will expose **canonical Workspace intelligence without Workspace memory**.  
> This decision governs all future GX-R tickets.

---

## 13. Acceptance Criteria & Certification Gate

| Criterion | Requirement | Status |
|:---|:---|:---:|
| **Intelligence parity** | Same canonical intelligence as Workspace | ✅ Certified |
| **Semantic parity** | Findings/evidence retain canonical meaning | ✅ Certified |
| **Guest boundary** | No Workspace memory or management | ✅ Certified |
| **Experience** | Narrative-first, progressive disclosure | ✅ Certified |
| **Visual direction** | Ultra-premium and distinctly Nebula | ✅ Certified |
| **Marketing dependence** | Product experience communicates value without marketing spend | ✅ Certified |
| **Conversion** | Workspace creation is optional continuity ("Keep this understanding") | ✅ Certified |
| **SEO** | Considered from architecture onward with strict privacy boundaries | ✅ Certified |
| **Production** | Performance, security, accessibility, and resilience included | ✅ Certified |
| **Architecture** | Existing backend intelligence remains authoritative | ✅ Certified |

---

### 🔒 GX-R001 Certification Gate

This ticket is certified complete when the team can answer:

$$\mathbf{What\ is\ GX?}$$

with:

> *"A temporary Guest Workspace that exposes Nebula's canonical infrastructure intelligence without requiring an account or providing persistent Workspace memory."*

**That is our foundation.**

---

## Next Ticket

$$\mathbf{GX\text{-}R002} \text{ — Guest Workspace Information Architecture}$$

*Designing the structural layout of the experience — shell, navigation, sections, hierarchy, entry $\rightarrow$ understanding $\rightarrow$ results $\rightarrow$ investigation $\rightarrow$ Workspace continuity — before touching colors or visual polish.*
