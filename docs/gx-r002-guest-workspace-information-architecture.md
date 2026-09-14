# GX-R002 — Guest Workspace Information Architecture

**Phase:** GX-R — Nebula First Experience Redesign  
**Ticket:** `GX-R002`  
**Type:** UX Architecture / Frontend Architecture  
**Priority:** P0 — Blocking  
**Status:** 🔄 Revised — Ready for Implementation / Frozen Information Architecture  
**Depends on:** `GX-R001` — Guest Experience Product & Experience Contract  
**Unblocks:** `GX-R003` — Guest Shell & Entry Architecture  

---

## 1. Objective

Define the canonical information architecture for the redesigned Nebula Guest Workspace.

The Guest Experience will **not** use an unlimited-scroll report architecture.

Instead, GX will use a **bounded, spatial, Workspace-inspired experience** that gives the guest a temporary sense of entering Nebula itself.

> [!IMPORTANT]
> **GX is a temporary Guest Workspace — not a webpage containing a report.**  
> The experience must provide the same canonical infrastructure intelligence as the authenticated Workspace while maintaining the Guest boundary defined in GX-R001.

---

## 2. Core Architectural Decision: Bounded Workspace Model

🔒 **Bounded Workspace Model**

The Guest Workspace behaves as a controlled application surface, not a long document.

```
┌──────────────────────────────────────────────────────────────┐
│                        NEBULA                                │
│                    Guest Workspace                           │
├────────────────┬─────────────────────────────────────────────┤
│                │                                             │
│   OVERVIEW     │              CURRENT UNDERSTANDING           │
│                │                                             │
│   FINDINGS     │              WHAT MATTERS NOW                │
│                │                                             │
│   INFRA        │              OTHER INTELLIGENCE              │
│                │                                             │
│   EVIDENCE     │              INFRASTRUCTURE                  │
│                │                                             │
│                │              INVESTIGATE →                   │
│                │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

*Note: This diagram represents the architectural concept, not a final UI layout. The actual composition, navigation treatment, density, typography, surfaces, and responsive behavior will be designed in subsequent tickets.*

---

## 3. Why GX Uses a Spatial Model

The bounded Workspace model:
1. Creates a stronger, indelible **product identity**.
2. Prevents report-like **endless scrolling**.
3. Establishes clear **spatial orientation**.
4. Supports progressive cognitive disclosure.
5. Allows intelligence to occupy **deliberate visual hierarchy**.
6. Creates seamless continuity with the authenticated Workspace.
7. Makes the Guest Experience feel like a **real product environment**.
8. Provides a stronger foundation for premium interaction design.

The user should feel:
$$\mathbf{"I\ have\ entered\ Nebula."}$$

Not:
$$\require{cancel}\cancel{\text{"I am reading a generated report."}}$$

---

## 4. Relationship to Authenticated Workspace

GX inherits the interaction philosophy and intelligence model of Workspace without becoming *Workspace Lite*.

```
                 NEBULA INTELLIGENCE
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
       GUEST WORKSPACE             WORKSPACE
            │                         │
      Current Intelligence       Current Intelligence
      Findings                   Findings
      Evidence                   Evidence
      Infrastructure             Infrastructure
            │                         │
            ✕                         ✓
         Memory                    Memory
         History                   History
         Changes                   Changes
         Management                Management
         Collaboration             Collaboration
```

**Therefore:** GX borrows the spatial language of Workspace. It does **not** inherit Workspace's persistence or management capabilities.

---

## 5. Canonical Guest Workspace Regions

The Guest Workspace is organized around four primary intelligence areas:

```
                  GUEST WORKSPACE
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      OVERVIEW        FINDINGS      INFRASTRUCTURE
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                      EVIDENCE
```

| Region | Semantic Role | Cognitive Objective | Container Model |
|:---|:---|:---|:---|
| **`Overview`** | Primary orientation & executive understanding surface | Anchors domain context, delivers synthesized narrative, highlights what matters now | Viewport-bounded canvas |
| **`Findings`** | Meaningful observations requiring attention or awareness | Exposes authoritative risks and observations with zero severity downgrade | Contained scroll zone |
| **`Infrastructure`** | Architectural understanding of observed system | Reveals 8-category technology inventory, ingress hops, and component topology | Contained scroll zone |
| **`Evidence`** | Progressive investigation into conclusions | Exposes verifiable protocol headers, DNS records, and cryptographic lineage | Contextual slide-over drawer / sheet |

---

## 6. Overview Architecture

Overview is the default Guest Workspace surface. Its hierarchy remains:

$$\text{Domain Identity} \longrightarrow \text{Current Understanding} \longrightarrow \text{What Matters Now} \longrightarrow \text{Other Things Worth Knowing} \longrightarrow \text{Infrastructure Understanding}$$

These surfaces do **not** form one endless vertical document. They exist within a controlled Workspace composition.

---

## 7. Findings Architecture

The Findings surface provides access to the same canonical findings used by authenticated Workspace:
- ❌ No duplicated GX-specific finding logic
- ❌ No downgraded severity (e.g. High remains High)
- ❌ No alternate or softened interpretations
- ❌ No synthetic GX findings
- ✅ Same finding identity and classification
- ✅ Same evidence lineage and raw hashes
- ✅ Same canonical remediation meaning

---

## 8. Infrastructure Architecture

Infrastructure is presented as an **understanding of architecture**, not a discovery dump.

### Canonical Observed Categories (8 Categories)
1. **Edge**: CDN, WAF, Edge compute, and perimeter reverse proxies (*Cloudflare, Fastly, CloudFront, Akamai*)
2. **Web Server**: HTTP server software (*Nginx, Apache, Caddy, HAProxy, Envoy*)
3. **Application**: Web framework, runtime engine, or fullstack app layer (*Next.js, Django, React, Node.js, PHP, Ruby*)
4. **Platform**: Managed PaaS, serverless environment, or container orchestrators (*Vercel, Netlify, Docker, Kubernetes*)
5. **Hosting**: Cloud infrastructure provider hosting compute resources (*AWS, GCP, Azure, DigitalOcean*)
6. **DNS**: Authoritative name servers and DNS security configuration (*Cloudflare DNS, Route 53, Google Cloud DNS*)
7. **TLS**: Certificate authority, cipher suites, and expiry lineage (*Let's Encrypt, DigiCert, Sectigo, GTS*)
8. **Mail**: Transactional and mail transit security (*Google Workspace, Microsoft 365, SendGrid*)

---

## 9. Evidence Architecture

Evidence remains progressively disclosed so it never overwhelms the primary narrative:

$$\text{Finding} \longrightarrow \text{What happened?} \longrightarrow \text{Why does it matter?} \longrightarrow \text{Understand why } \rightarrow \longrightarrow \text{Evidence} \longrightarrow \text{Deep investigation}$$

---

## 10. Context-Preserving Investigation

Investigation occurs **within the spatial model**, preserving user context:

```
           OVERVIEW
              │
              ▼
        PRIMARY STORY
              │
              ▼
      UNDERSTAND WHY →
              │
              ▼
    INVESTIGATION SURFACE (Contextual Drawer / Sheet)
              │
              ▼
           EVIDENCE
              │
              ▼
            CLOSE
              │
              ▼
   RETURN TO PREVIOUS CONTEXT
```

> [!IMPORTANT]
> The user is **never** dumped onto a separate report page merely because they requested evidence.

---

## 11. Navigation Philosophy

GX navigation is minimal and contextual. It answers:
- *Where am I?*
- *What does Nebula understand?*
- *What matters?*
- *What else exists?*
- *Why?*

Navigation never becomes a competing information layer.

---

## 12. Bounded Viewport Principle

🔒 **Non-Negotiable**:
The default Guest Workspace must **not** require unlimited page scrolling to understand the primary experience.

Primary intelligence fits within a deliberate spatial composition.

Detailed evidence, infrastructure data, or deep investigations reside inside:
- Contained scrolling regions
- Contextual surfaces
- Drawers / sheets
- Dedicated spatial layers

$$\mathbf{Eliminate\ document\text{-}style\ infinite\ scrolling;\ do\ not\ prohibit\ localized\ contained\ scrolling.}$$

---

## 13. Responsive Transformation

The spatial model adapts rather than simply shrinking:

- **Desktop ($\ge 1024\text{px}$)**: Rich spatial composition; multi-pane canvas; contextual slide-over drawer ($480\text{--}560\text{px}$).
- **Tablet ($641\text{px}\text{--}1023\text{px}$)**: Reduced density retaining hierarchy; bottom sheet or full drawer.
- **Mobile ($\le 640\text{px}$)**: Controlled sequential surfaces ($\text{Domain} \rightarrow \text{Understanding} \rightarrow \text{What Matters} \rightarrow \text{Other} \rightarrow \text{Infra} \rightarrow \text{Evidence}$) with bounded surface transitions.

---

## 14. Guest Session Architecture

Backed by the temporary Guest Session:
- **Exposes**: Domain, current understanding, findings, infrastructure understanding, evidence references, freshness timestamp, UI states.
- **Prohibits**: Historical memory, persistent history, monitoring, multi-domain portfolios, team collaboration, account credentials.

---

## 15. Continuity Architecture

Workspace conversion is an earned continuity action:

$$\text{Experience} \longrightarrow \text{Understand} \longrightarrow \text{Investigate} \longrightarrow \text{Value Established} \longrightarrow \text{Keep this understanding} \longrightarrow \text{Create Workspace}$$

---

## 16. State Architecture: Seven Canonical Resilience States

| State | Code | Description | Shell Behavior |
|:---|:---:|:---|:---|
| **`IDLE`** | `01` | Guest has not started understanding | Clean calm input surface with curated sample domains |
| **`UNDERSTANDING`** | `02` | Nebula is actively synthesizing intelligence | Telemetry sequence with 520ms pause; structurally stable shell |
| **`PARTIAL_UNDERSTANDING`** | `03` | Core signals ready while auxiliary probes complete | Displays initial brief with enrichment indicator |
| **`READY`** | `04` | Current understanding complete | Full bounded workspace with brief, findings, and infra matrix |
| **`QUIET_STABLE`** | `05` | Well-configured perimeter; no critical findings | Calm affirmative posture; zero artificial card clutter |
| **`MEANINGFUL_CHANGE`** | `06` | Meaningful risks or perimeter drift detected | Highlighted Primary Attention card with "Understand why →" |
| **`FAILURE`** | `07` | Probe or resolution failed | Graceful failure canvas with typed error code and 1-click retry |

---

## 17. No Artificial Density

A premium Workspace does not need every region filled at all times. If there are no secondary findings or limited infrastructure components, the interface remains calm.

$$\require{cancel}\cancel{\text{Empty space} \longrightarrow \text{add another card}}$$

$$\mathbf{Let\ the\ intelligence\ determine\ the\ composition.}$$

---

## 18. SEO Boundary

- Public informational surfaces (`/`, `/guest`, `/docs/*`) $\longrightarrow$ `index, follow`
- Ephemeral Guest Workspace (`/guest?domain=*`) $\longrightarrow$ `noindex, nofollow`
- Authenticated Workspace, Admin, and Settings $\longrightarrow$ `noindex, nofollow`

---

## 19. Performance Architecture

Progressive rendering order:
$$\text{Shell} (50\text{ms}) \longrightarrow \text{Domain} (80\text{ms}) \longrightarrow \text{Current Understanding} (200\text{ms}) \longrightarrow \text{Primary Intelligence} (300\text{ms}) \longrightarrow \text{Secondary Intelligence} (500\text{ms}) \longrightarrow \text{Infrastructure} (650\text{ms}) \longrightarrow \text{Evidence} (800\text{ms})$$

Animation and atmospheric effects remain subordinate to performance.

---

## 20. Accessibility Architecture

- Semantic HTML5 landmarks (`main`, `header`, `section`, `aside`, `footer`)
- Meaningful heading hierarchy (`h1` $\rightarrow$ `h2` $\rightarrow$ `h3`)
- Complete keyboard navigation with visible focus rings (`outline-ring/50`)
- Logical focus movement and focus restoration upon drawer dismissal
- Screen-reader live regions for progressive telemetry
- Reduced-motion behavior (`prefers-reduced-motion: reduce`)
- Color-independent severity communication (icons, badges, text)

---

## 21. Security Boundary

The Guest Workspace strictly isolates guest state and never provides a path into authenticated memory, account settings, or operator administration.

---

## 22. Explicitly Rejected Models

- ❌ **Infinite Report**: Everything stacked in a 5,000px vertical dump.
- ❌ **Traditional Dashboard**: Grid of equal-weight KPI cards and metric counters.
- ❌ **Scanner**: Progress bar ("Checking... 127 checks 78%") with raw CVE checklists.
- ❌ **Workspace Clone**: Authenticated Workspace with locked/disabled upgrade buttons everywhere.
- ❌ **Marketing Funnel**: Popup paywalls, countdown timers, and interrupting sales gates.

---

## 23. Architectural Principle

🔒 **CANONICAL PRINCIPLE**

> **Nebula GX is a bounded spatial intelligence environment inspired by Workspace, not an infinite-scroll report and not a reduced Workspace clone.**  
> **Its primary experience is: Understand → Orient → Investigate → Decide whether to keep it.**

---

## 24. Acceptance Criteria & Certification Gate

| Area | Requirement | Status |
|:---|:---|:---:|
| **Spatial model** | Bounded Workspace-style experience | ✅ Certified |
| **Infinite scroll** | ❌ Not used as primary architecture | ✅ Certified |
| **Workspace relationship** | Shares intelligence and spatial philosophy | ✅ Certified |
| **Workspace cloning** | ❌ Prohibited | ✅ Certified |
| **Overview** | Primary orientation surface | ✅ Certified |
| **Findings** | Canonical Workspace findings | ✅ Certified |
| **Infrastructure** | Canonical 8-category infrastructure understanding | ✅ Certified |
| **Evidence** | Progressive disclosure | ✅ Certified |
| **Investigation** | Context-preserving drawer / sheet | ✅ Certified |
| **Guest session** | Ephemeral | ✅ Certified |
| **Memory / History** | ❌ Prohibited in Guest | ✅ Certified |
| **Monitoring / Mgmt** | ❌ Prohibited in Guest | ✅ Certified |
| **Conversion** | Earned continuity | ✅ Certified |
| **Responsive** | Spatial model transforms appropriately | ✅ Certified |
| **SEO** | Public / private boundary preserved | ✅ Certified |
| **Performance** | Progressive rendering pipeline | ✅ Certified |
| **Accessibility** | Full semantic / keyboard / screen-reader support | ✅ Certified |
| **Resilience** | Seven canonical states (01–07) | ✅ Certified |

---

### 🔒 GX-R002 Certification Gate

This ticket is certified complete when the implementation demonstrates:

> *"A guest can enter a bounded Nebula environment, orient themselves, understand the current infrastructure, investigate meaningful intelligence, and return to their previous context — without navigating an endless report."*

**And the central design rule is now frozen:**

> **"GX should feel like temporarily entering Nebula Workspace, not scrolling through a report about Nebula."**

---

## Next Ticket

$$\mathbf{GX\text{-}R003} \text{ — Guest Shell \& Entry Architecture}$$

*Implementing the structural shell layout, domain entry mechanisms, header navigation, responsive frames, and spatial canvas boundaries for the Guest Workspace.*
