# Nebula Workspace Bible

This document is the canonical **Workspace Bible** for Nebula, defining how the authenticated Nebula Workspace should be experienced by users. It is the human-facing expression of the Infrastructure Intelligence Platform.

---

## 1. Purpose

### 1.1 Document Purpose
This document defines the product experience that sits between Nebula's infrastructure intelligence and the human using it. The backend architecture defines what Nebula knows and how it is built; the Workspace Bible defines how that intelligence is experienced by humans.

### 1.2 Authority
This document is the canonical source of truth for Workspace experience decisions. Future frontend implementation must follow this document regarding information hierarchy, navigation, layout, interaction behavior, progressive disclosure, intelligence presentation, historical experience, evidence access, Workspace states, user flows, responsive behavior, accessibility, visual experience principles, and interaction philosophy.

When implementation and Workspace experience conflict, **the implementation changes to preserve the experience architecture.**

### 1.3 What This Document Is Not
This document does not define backend implementation details (database schemas, service architecture, API/collector implementation, discovery algorithms, deployment, auth details) or frontend technical details (React structure, component source, CSS).

### 1.4 Product Experience Objective
Nebula optimizes for **understanding, not information consumption**. A successful Workspace experience allows a user to quickly understand:
- What is happening
- What changed
- What matters and why
- What remains stable
- What deserves investigation
- Where the supporting evidence exists
- How the infrastructure has evolved over time

### 1.5 Core Product Promise: "Know what changed. Understand why."
Nebula must identify meaningful differences (snapshots, comparison, change detection) and provide context (significance, intelligence, explanation, lineage, history, confidence).

### 1.6 Infrastructure Intelligence, Not Infrastructure Scanning
Nebula must be experienced as an **Infrastructure Intelligence Platform**, not a scanner, monitoring dashboard, or raw discovery tool.

### 1.7 The Workspace Is Not a Dashboard
Nebula reverses the traditional dashboard relationship (Data -> Widgets -> User interpretation).
**Nebula's approach:** Observation -> Comparison -> Intelligence -> Prioritization -> Human understanding -> Evidence.

### 1.8 The Workspace Should Answer Questions
The Workspace is designed around human questions:
- *What happened since my last visit?* (Workspace)
- *What is the current state?* (Executive Brief)
- *What matters most right now?* (Primary Story)
- *What else is worth knowing?* (Secondary Stories)
- *What is different?* (What Changed)
- *Why does it matter?* (Why?)
- *How do we know?* (Evidence)
- *What exists?* (Infrastructure Overview)
- *How has it evolved?* (Infrastructure Memory)
- *What did Nebula observe?* (Snapshot)

### 1.9 Experience Over Interface
The primary measure is how quickly and confidently the user can understand their infrastructure. A quieter interface that communicates intelligence quickly is a success; a visually impressive interface that complicates understanding is a failure.

### 1.10 The Workspace as Human Intelligence
The Workspace is a product architecture layer that determines what is surfaced, hidden, prioritized, explained, and disclosed.

### 1.11 Intelligence Before Information
The preferred progression: Observation -> Understanding -> Intelligence -> Summary -> Detail -> Evidence.

### 1.12 Context Before Details
Technical information without context creates cognitive work. Users must understand what information represents, why it is shown, and its importance before seeing technical depth.

### 1.13 Summary Before Evidence
The user should first understand the conclusion, then be able to inspect supporting evidence.

### 1.14 Progressive Disclosure
Nebula must progressively reveal complexity. The user should be able to stop at any level without being forced into deeper technical detail.

### 1.15 Every Interaction Should Reduce Uncertainty
If an interaction does not reduce uncertainty or improve understanding, it should be questioned.

### 1.16 Calm Intelligence
The Workspace should remain calm during all states (changes, investigations, incomplete evidence) and communicate urgency only when genuinely justified.

### 1.17 Silence Is Valuable
Nebula must be comfortable saying nothing if no meaningful change occurred or if no action is required. This is a feature, not an empty state.

### 1.18 Earn Trust Through Restraint
Nebula earns trust by demonstrating it knows what *not* to surface. Prefer 3 meaningful observations over 30 technically accurate ones if the latter do not improve understanding.

### 1.19 Explain Before Asking for Action
The sequence is: What happened? -> Why does it matter? -> What evidence supports this? -> What should I consider doing?

### 1.20 Actionability Without Pressure
Recommendations should be contextual, evidence-backed, and optional. The product should not turn every finding into an urgent task.

### 1.21 Confidence and Honesty
Distinguish between observation, inference, history, uncertainty, and recommendations. Never communicate more certainty than the intelligence supports.

### 1.22 Evidence Must Remain Accessible
Progressive disclosure must never become evidence suppression.

### 1.23 History Is Infrastructure Memory
Infrastructure Memory represents the accumulated understanding of how an infrastructure has evolved, not merely an archive.

### 1.24 Current Workspace vs Infrastructure Memory
- **Current Workspace:** Answers "What matters now?" (Current Intelligence).
- **Infrastructure Memory:** Answers "What happened over time?" (Historical Intelligence).
These must remain distinct.

### 1.25 Registered User Experience
Registered users have a persistent relationship with Nebula, gaining memory, monitoring, and continuous context.

### 1.26 Guest and Registered Experience Boundary
Registration should not feel like a gate; it should feel like the moment Nebula begins remembering for the user.

### 1.27 Post-GX Registration Continuity
The transition from guest to registered user should feel continuous, preserving domain understanding and analysis.

### 1.28 Workspace as a Continuing Relationship
The authenticated Workspace should feel like Nebula has been watching and remembering, allowing the user to pick up where they left off.

### 1.29 Primary Story Philosophy
The Workspace should normally have one dominant Primary Story answering "What matters most right now?"

### 1.30 Secondary Story Philosophy
Secondary Stories answer "What else is worth knowing?" and provide supporting intelligence without competing with the Primary Story.

### 1.31 Significance Is Different From Severity
Severity is technical; significance is how important it is to the current infrastructure understanding. A high-severity finding is not automatically the Primary Story.

### 1.32 Intelligence Layer Before LLM
The Intelligence Layer owns factual and prioritization decisions. The LLM is merely a synthesis and communication mechanism. AI machinery should remain invisible; intelligence must be inspectable.

### 1.33 Human-Readable Does Not Mean Evidence-Free
Simplification must never destroy authenticity. Users must always be able to move from human-readable meaning to technical evidence.

### 1.34 Premium Character
Nebula should feel calm, premium, intelligent, trustworthy, and deliberate.

### 1.35 Enterprise Character
Enterprise-grade experience requires both simplicity and verifiability.

### 1.36 Preserve Curiosity & Context
Reward users who investigate deeper; ensure investigative context (domain, path, filters) is preserved throughout.

### 1.37 One Clear Purpose at a Time
Every major experience should have one primary purpose. If a screen attempts to answer unrelated questions, it should be split.

### 1.38 Consistency Over Novelty
Favor predictable patterns over constant interface novelty.

### 1.39 No Forced Complexity
Advanced technical capabilities should exist without forcing every user to understand them.

### 1.40 No Fake Intelligence
Never use AI language to suggest intelligence where deterministic understanding does not exist.

### 1.41 No Marketing Language Inside the Workspace
The authenticated Workspace is a product experience, not a marketing page.

### 1.42 No Unnecessary Interruptions
Avoid unnecessary modals, popups, and animations. The default state should allow uninterrupted investigation.

### 1.43 No Information Competition
Primary intelligence must not compete visually with supporting information or navigation.

### 1.44 Information Should Be Grouped by Meaning
Organize information around engineering concepts (Security, Infrastructure, Availability) rather than collector implementation.

### 1.45 Historical Context Is First-Class
History contributes to current intelligence; it is not a separate archive.

### 1.46 Historical Comparison Is User-Driven
Users should be able to select two snapshots/states and ask, "What changed?"

### 1.47 Complete Knowledge, Selective Presentation
The Workspace is selective by design; underlying knowledge remains comprehensive.

### 1.48 Workspace Psychology
The Workspace must never overwhelm, never interrupt, and must always reduce cognitive load.

### 1.49 The Workspace Should Feel Like an Expert
The system should act like an expert that has already reviewed the infrastructure, not a system asking the user to figure it out from raw data.

### 1.50 The Workspace Should Not Pretend to Be Human
Avoid personality theater, greetings, or conversational filler. Communicate directly.

### 1.51 The Workspace Communication Model
Layers: 1. Current Understanding -> 2. Primary Story -> 3. Secondary Stories -> 4. Change -> 5. Significance -> 6. Evidence -> 7. Infrastructure Memory.

### 1.52 Workspace Success Criteria
A successful experience allows a returning user to quickly answer: What changed? What matters? Why? Do I need to do anything? How confident is Nebula? Can I verify this? What happened historically?

### 1.53 Core Experience Invariants
- Intelligence before information.
- Context before details.
- Summary before evidence.
- Progressive disclosure.
- Silence is valuable.
- Significance is distinct from severity.
- Verifiable conclusions.

---

## 1.57 Canonical Experience Statement
Nebula observes, remembers, compares, determines what matters, explains why, and preserves evidence. The user experiences intelligence, context, meaning, evidence, and memory.

# 2. Workspace Information Hierarchy

## 2.1 Core Principle

The authenticated Workspace follows:

> **Intelligence before data, context before details, and summary before evidence.**

The user should understand what matters before being asked to inspect the underlying infrastructure data.

---

## 2.2 Workspace Progression

The primary information hierarchy is:

```text
1. Executive Brief
        ↓
2. Primary Story
        ↓
3. Secondary Stories
        ↓
4. Infrastructure Overview
        ↓
5. Evidence
```

Historical information is intentionally separated into **Infrastructure Memory** rather than being placed directly into the primary Workspace flow.

---

## 2.3 Executive Brief

The Executive Brief is the highest-level summary of the current domain state.

It should communicate:

* current infrastructure state
* overall architectural understanding
* major engineering context
* important observations
* finding severity summary where useful

It should be concise and narrative-driven rather than metric-heavy.

The user should understand the domain before entering technical details.

---

## 2.4 Primary Story

The Primary Story answers:

> **What matters most right now?**

Nebula should normally select one Primary Story.

It represents the most significant current intelligence conclusion.

It is not necessarily:

* the highest-severity finding
* the newest change
* the largest metric
* the most technically complex event

The Intelligence Layer determines what deserves Primary Story status.

---

## 2.5 Secondary Stories

Secondary Stories answer:

> **What else is worth knowing?**

They provide additional meaningful intelligence that does not justify becoming the Primary Story.

Normally:

* 0–3 Secondary Stories
* fewer is better
* no filler stories
* no artificial activity

They must not become a findings feed, alert feed, or activity feed.

Preferred conceptual heading:

> **Other Things Worth Knowing**

---

## 2.6 Infrastructure Overview

The Infrastructure Overview communicates what Nebula currently understands about the infrastructure.

It may include:

* edge delivery
* CDN
* cloud compute
* hosting
* reverse proxies
* frontend technologies
* security and TLS
* databases
* caches
* detected versions
* confidence

The purpose is understanding the infrastructure architecture, not displaying raw collector output.

---

## 2.7 Evidence

Evidence provides the technical foundation behind Nebula's intelligence.

The user should be able to progressively inspect:

```text
Story
  ↓
Why it matters
  ↓
Observation
  ↓
Source
  ↓
Raw Evidence
```

Evidence may include:

* DNS records
* HTTP responses and headers
* TLS observations
* technology detection
* timestamps
* collector information
* evidence hashes
* other raw observations

Human-readable intelligence must never remove access to authentic technical evidence.

---

## 2.8 Intelligence Layer vs LLM

The Intelligence Layer determines:

* what changed
* what matters
* significance
* relevance
* story selection
* relationships between observations
* historical context
* confidence where supported

The LLM is responsible for synthesizing grounded intelligence into human-readable language.

```text
Infrastructure Data
        ↓
Intelligence Layer
        ↓
Story Selection
        ↓
RAG Context
        ↓
LLM
        ↓
Human-readable Intelligence
```

The LLM must not invent infrastructure facts, evidence, changes, history, or significance.

---

## 2.9 Severity vs Significance

Severity and significance are different.

Severity describes the technical seriousness of a finding.

Significance describes how important that information is to the current infrastructure understanding.

Therefore:

```text
Finding
  ↓
Severity
  ↓
Intelligence Assessment
  ↓
Significance
  ↓
Workspace Story
```

A high-severity finding does not automatically become the Primary Story.

---

## 2.10 Progressive Disclosure

The Workspace should progressively reveal technical depth.

```text
Summary
  ↓
Meaning
  ↓
Change
  ↓
Why
  ↓
Technical Detail
  ↓
Evidence
```

Users who only need the current state can stop at the summary.

Users who want technical verification can continue deeper.

Users should never be forced to inspect raw infrastructure data to understand the main conclusion.

---

## 2.11 Current Intelligence vs History

The Workspace answers:

> **What matters now?**

Infrastructure Memory answers:

> **What happened over time?**

Historical data should not overwhelm the current Workspace.

Infrastructure Memory should provide access to:

* previous snapshots
* previous months
* historical changes
* infrastructure evolution
* historical comparisons

---

## 2.12 Historical Comparison

Users should be able to intentionally compare two infrastructure snapshots or historical states.

The comparison answers:

> **What changed between these two points?**

Conceptually:

```text
Previous Snapshot
        ↓
Current Snapshot
        ↓
Meaningful Differences
        ↓
Significance
        ↓
Evidence
```

History is therefore not just a chronological event list.

It is Infrastructure Memory that can support investigation and decision-making.

---

## 2.13 Silence

If nothing meaningful changed, Nebula should not manufacture stories.

If no meaningful Secondary Stories exist, they should not be created merely to fill the Workspace.

The product should be comfortable communicating:

> **Nothing important changed.**

and continuing without unnecessary content.

---

## 2.14 Experience Standard

The Workspace should consistently feel:

* premium
* calm
* intelligent
* trustworthy
* technically credible
* restrained
* enterprise-grade

The product should surface less information, but make the information it does surface more meaningful.

The core experience remains:

> **Know what changed. Understand why.**
# 3. Workspace Structure

## 3.1 Authenticated Workspace

The authenticated Workspace is the primary operating surface for a registered Nebula user.

Its purpose is to answer:

> **What do I need to know about my infrastructure right now?**

The Workspace should bring together current intelligence while keeping deeper technical information progressively accessible.

---

## 3.2 Workspace Flow

The primary experience follows this order:

```text
Workspace
   ↓
Executive Brief
   ↓
Primary Story
   ↓
Secondary Stories
   ↓
Infrastructure Overview
   ↓
Evidence
```

Historical information is intentionally separated into:

**Infrastructure Memory**

rather than being placed directly into the main current-state flow.

---

## 3.3 Executive Brief

The Executive Brief is the top-level current-state synthesis.

It should communicate:

* subject/domain identity
* current understanding state
* overall infrastructure condition
* major architectural context
* important observations
* meaningful severity summary

The Executive Brief should read as an intelligent summary, not as a metrics dashboard.

The user should be able to understand the domain's current state without opening individual findings.

---

## 3.4 Primary Story

The Primary Story is the most important intelligence in the current Workspace.

It answers:

> **What matters most right now?**

There should normally be one Primary Story.

The Primary Story may describe:

* a meaningful infrastructure change
* an architectural evolution
* an important security posture change
* a significant stability condition
* another intelligence conclusion that materially affects understanding

The Primary Story is selected by the Intelligence Layer.

---

## 3.5 Secondary Stories

Secondary Stories provide additional intelligence that is worth knowing but does not deserve Primary Story status.

They answer:

> **What else is worth knowing?**

The normal range is:

**0–3 Secondary Stories**

They should be selected for relevance, not volume.

They should not become:

* a findings feed
* an alert feed
* an activity feed
* a list of every detected change

---

## 3.6 Infrastructure Overview

The Infrastructure Overview provides the structured understanding behind the narrative.

It may organize infrastructure into meaningful areas such as:

* Edge Delivery & CDN
* Cloud Compute & Hosting
* Web Server & Reverse Proxy
* Frontend
* Security & TLS
* Databases & Caches
* Other detected infrastructure components

Technology versions and confidence may be displayed where useful.

The purpose is to help the user understand:

> **What does this infrastructure look like?**

It should not simply expose raw discovery output.

---

## 3.7 Evidence

Evidence is the deepest technical layer of the current Workspace.

It provides authenticity and verification for the intelligence presented above it.

The intended progression is:

```text
Story
   ↓
Why it matters
   ↓
Observation
   ↓
Source
   ↓
Raw Evidence
```

Evidence may include:

* DNS records
* HTTP responses and headers
* TLS observations
* technology detection results
* observation timestamps
* collector metadata
* evidence hashes
* other raw probe output

Evidence should be progressively disclosed rather than placed on the primary surface.

---

## 3.8 What Changed

When meaningful infrastructure changes are available, the user should be able to investigate them directly.

The experience answers:

> **What changed?**

A change should provide enough context to understand:

* previous state
* current state
* change type
* significance
* affected infrastructure area
* supporting evidence

The user should not need to manually compare raw snapshots.

---

## 3.9 Why

The Why experience answers:

> **Why does this matter?**

It should connect an infrastructure observation or change to its significance.

The explanation should be grounded in the Intelligence Layer and available evidence.

The user should understand the engineering relevance without losing access to the underlying technical basis.

---

## 3.10 Evidence Lineage

Where appropriate, Nebula should expose the causal lineage connecting an intelligence conclusion to the observed infrastructure state.

Conceptually:

```text
Finding / Story
      ↓
Observation State
      ↓
Source
      ↓
Observed Signal
      ↓
Observed Time
      ↓
Raw Evidence
```

This provides enterprise-grade traceability.

---

## 3.11 Infrastructure Memory

Infrastructure Memory is the historical experience for registered users.

It answers:

> **How has this infrastructure evolved over time?**

It provides access to:

* previous snapshots
* historical understanding
* meaningful changes
* previous months
* infrastructure evolution
* historical comparisons

Infrastructure Memory is separate from the primary current-state Workspace.

---

## 3.12 Access to Infrastructure Memory

Infrastructure Memory should be available through the user's profile/context navigation rather than becoming a dominant item in the primary Workspace navigation.

The intent is:

```text
Current Workspace
      ↓
What matters now


Profile / Context
      ↓
Infrastructure Memory
      ↓
Historical investigation
```

This preserves the calmness of the primary Workspace.

---

## 3.13 Snapshot Comparison

Users should be able to compare two historical infrastructure snapshots on demand.

The comparison experience answers:

> **What changed between these two snapshots?**

The result should focus on meaningful differences rather than displaying two large raw datasets side by side.

```text
Snapshot A
    +
Snapshot B
    ↓
Comparison
    ↓
Meaningful Changes
    ↓
Significance
    ↓
Evidence
```

---

## 3.14 Continuous Monitoring

Registered domains are continuously understood over time.

When a new understanding is available, Nebula compares it with the previous trusted state.

Conceptually:

```text
Previous Snapshot
       ↓
New Snapshot
       ↓
Comparison
       ↓
Meaningful Changes
       ↓
Intelligence Assessment
       ↓
Workspace Update
```

The user should not be shown every background activity.

Only meaningful intelligence should reach the primary Workspace surface.

---

## 3.15 "While You Were Away"

When a registered user returns after meaningful infrastructure evolution, Nebula should communicate the important changes calmly.

The experience should answer:

> **What happened while I was away?**

A meaningful change may become:

* the Primary Story
* a Secondary Story
* historical information only

depending on its significance.

If nothing important changed, Nebula should be comfortable communicating:

> **Nothing important changed today. Everything else remains healthy. We'll continue watching.**

The exact wording may evolve with the final copy system, but the principle is frozen:

> **Silence is preferable to manufactured activity.**

---

## 3.16 Domain Context

The Workspace is domain-centered.

The selected domain is the context for:

* current understanding
* stories
* findings
* infrastructure overview
* evidence
* changes
* Infrastructure Memory

Changing domains should update the entire contextual experience rather than mixing information from multiple domains.

---

## 3.17 Multi-Domain Workspace

Registered users may have multiple saved domains.

The Workspace must maintain clear domain context at all times.

Information from one domain must never appear to belong to another domain.

The domain selector should therefore be persistent and unmistakable without becoming visually dominant.

The experience should remain calm even when multiple domains are managed.

---

## 3.18 Domain Limit

The Workspace supports a finite number of saved domains according to the product's current domain policy.

Once the maximum supported number of domains has been reached:

> The Add Domain action should no longer be presented as an available action.

The interface should not show an Add Domain button that cannot perform a useful action.

This is a deliberate product decision.

---

## 3.19 Registered User Continuity

The authenticated Workspace represents persistent infrastructure understanding.

When a user returns:

```text
Saved Domain
    ↓
Previous Understanding
    ↓
Current Understanding
    ↓
Comparison
    ↓
Current Intelligence
```

The user should not need to restart the understanding process manually merely to recover existing context.

---

## 3.20 Workspace Navigation Principle

Navigation should follow the user's questions rather than backend modules.

Avoid primary navigation such as:

* DNS
* HTTP
* SSL
* Technology
* Findings
* Snapshots
* Evidence

Prefer navigation organized around:

* Current Understanding
* Infrastructure
* Memory

Technical subsystems should become visible when the user investigates them.

---

## 3.21 Workspace Shell

The Workspace shell should remain visually quiet.

Persistent shell elements should provide:

* product identity
* domain context
* primary navigation/context
* profile access
* essential Workspace actions

The shell should not compete with current intelligence.

---

## 3.22 Profile Context

The profile area provides access to user-level context and secondary experiences.

Infrastructure Memory should be accessible from this area.

The profile should not become a second application dashboard.

The intent is to keep historical and account-level concerns available without crowding the intelligence surface.

---

## 3.23 Workspace State Preservation

When users navigate within the Workspace, Nebula should preserve relevant context such as:

* selected domain
* selected story
* selected finding
* selected snapshot
* comparison state
* historical context
* filters where appropriate

The user should be able to return to the current investigation without reconstructing it.

---

## 3.24 Workspace Information Ownership

Each surface has a clear responsibility:

| Surface                 | Primary Question                       |
| ----------------------- | -------------------------------------- |
| Executive Brief         | What is the current state?             |
| Primary Story           | What matters most?                     |
| Secondary Stories       | What else is worth knowing?            |
| Infrastructure Overview | What exists?                           |
| What Changed            | What is different?                     |
| Why                     | Why does it matter?                    |
| Evidence                | How do we know?                        |
| Infrastructure Memory   | How has it evolved?                    |
| Snapshot Comparison     | What changed between these two points? |

This separation prevents the Workspace from becoming overloaded.

---

## 3.25 Frozen Structure

The authenticated Workspace structure is therefore:

```text
AUTHENTICATED WORKSPACE
│
├── Executive Brief
│
├── Primary Story
│
├── Secondary Stories
│
├── Infrastructure Overview
│
├── Evidence / Investigation
│
└── Infrastructure Memory
       ├── Historical Snapshots
       ├── Timeline / Evolution
       └── Snapshot Comparison
```

The primary current-state experience remains focused on:

> **What matters now.**

Historical exploration remains available as:

> **Infrastructure Memory.**
# 5. Primary Story & Secondary Stories

## 5.1 Primary Story

The Primary Story is the most important intelligence in the current Workspace.

It answers:

> **What matters most right now?**

Nebula should normally present one Primary Story.

It may represent:

* a meaningful infrastructure change
* an architectural evolution
* an important security or operational condition
* a significant pattern discovered across observations

The Primary Story is selected by the **Intelligence Layer**, not directly by the LLM.

---

## 5.2 Primary Story Selection

Selection should consider:

* significance
* impact
* architectural relevance
* change magnitude
* historical context
* confidence
* relationship to other observations

The highest-severity finding is not automatically the Primary Story.

The goal is to select the intelligence that provides the most useful current understanding.

---

## 5.3 Secondary Stories

Secondary Stories answer:

> **What else is worth knowing?**

They contain additional meaningful intelligence that does not deserve Primary Story status.

Normally:

* 0–3 stories
* fewer is better
* no filler
* no duplicate stories

They should not become:

* a findings feed
* an alert feed
* an activity feed
* a list of every detected change

Preferred conceptual heading:

> **Other Things Worth Knowing**

---

## 5.4 Story Composition

A story should generally contain:

```text
Meaningful conclusion
        ↓
Optional significance
        ↓
Optional confidence
        ↓
Investigation path
```

For deeper investigation, the user should be able to reach:

```text
Story
  ↓
What Changed
  ↓
Why
  ↓
Evidence
```

The exact UI interaction may vary, but the relationship must remain clear.

---

## 5.5 Story Grounding

Every story must be grounded in Nebula's infrastructure intelligence.

The underlying chain is:

```text
Observation
   ↓
Finding / Change
   ↓
Intelligence Assessment
   ↓
Story
```

The LLM may turn the conclusion into natural language, but it must not invent the underlying fact.

---

## 5.6 Story Correlation

Multiple observations may be combined into one story when they describe the same underlying infrastructure event or condition.

Example:

```text
Certificate changed
        +
TLS configuration changed
        +
TLS protocol changed
        ↓
TLS posture has strengthened.
```

The detailed observations remain available through Evidence.

---

## 5.7 Story Stability

If the underlying intelligence has not meaningfully changed, the story should remain stable.

Nebula should not repeatedly rewrite the same intelligence simply because the LLM can generate different wording.

Narrative stability is important for trust.

---

## 5.8 Significance

Significance determines whether information deserves Workspace attention.

It is different from technical severity.

```text
Severity
   ↓
Intelligence Assessment
   ↓
Significance
   ↓
Primary / Secondary / Deeper Detail
```

Significance may consider:

* technical impact
* architectural importance
* security relevance
* historical context
* scope
* confidence

---

## 5.9 What Does Not Become a Story

Information should remain in deeper layers when it is:

* routine
* redundant
* purely technical
* already represented by another story
* useful only as evidence
* useful mainly for historical reference
* insufficiently supported

The information is preserved; it is simply not promoted to the current Workspace.

---

## 5.10 Silence

If nothing meaningful deserves to be surfaced, Nebula should not manufacture stories.

Example:

```text
No meaningful Secondary Stories
        ↓
Do not fill the space
```

The product should prefer silence over unnecessary information.

This reinforces:

> **Surface less. Make what is surfaced meaningful.**

---

## 5.11 Story-to-Evidence Relationship

Every substantive story should remain traceable to its supporting evidence where available.

```text
Story
  ↓
Intelligence
  ↓
Observation
  ↓
Source
  ↓
Evidence
```

This preserves both:

* human-readable intelligence
* technical authenticity

The user sees the meaning first and can inspect the proof when needed.

# 6. Infrastructure Overview & Evidence

## 6.1 Infrastructure Overview

The Infrastructure Overview answers:

> **What does this infrastructure look like?**

It provides a structured view of the infrastructure Nebula currently understands.

It may include:

* Edge Delivery & CDN
* Cloud Compute & Hosting
* Web Server / Reverse Proxy
* Frontend
* Security & TLS
* Databases & Caches
* Other relevant technologies and infrastructure components

Where useful, Nebula may show:

* detected technology
* version
* role
* confidence

The purpose is understanding, not raw discovery output.

---

## 6.2 Evidence

Evidence answers:

> **How do we know?**

Evidence is progressively disclosed after the user has understood the intelligence.

The intended flow is:

```text
Intelligence
   ↓
Why it matters
   ↓
Observation
   ↓
Source
   ↓
Raw Evidence
```

Evidence may include:

* DNS records
* HTTP responses and headers
* TLS observations
* technology detection
* timestamps
* collector/version metadata
* evidence hashes
* other raw probe results

---

## 6.3 Evidence Lineage

Where applicable, Nebula should preserve the relationship between the story, the observation, and the raw evidence.

```text
Story / Finding
      ↓
Observation State
      ↓
Source / Collector
      ↓
Observed Signal
      ↓
Observed Time
      ↓
Raw Evidence
```

This provides technical authenticity without forcing raw technical data onto the primary surface.

---

## 6.4 Human-readable Intelligence + Raw Evidence

Nebula should not convert every technical observation into an explanation and hide the original evidence.

The preferred model is:

```text
Human-readable meaning
        +
Authentic technical evidence
```

The user receives the understandable conclusion first and can inspect the original technical basis when required.

---

## 6.5 Progressive Evidence

Evidence should remain hidden until the user wants deeper verification.

The user should not have to read:

* raw HTTP headers
* DNS records
* TLS details
* hashes
* collector metadata

to understand the Primary Story.

However, these details must remain accessible for technical verification.

This preserves both:

> **Simplicity**

and:

> **Enterprise-grade verifiability.**

---

## 6.6 Evidence Trust Rules

Evidence must be:

* grounded in actual collection
* associated with the correct snapshot
* associated with the correct observation/finding where applicable
* timestamped
* attributable to its source
* immutable where required by the underlying architecture

Nebula must never generate synthetic evidence to support an AI-generated conclusion.

---

## 6.7 Overview vs Evidence

The two layers have different purposes:

| Layer                   | Question                             |
| ----------------------- | ------------------------------------ |
| Infrastructure Overview | What exists and how is it organized? |
| Evidence                | What was actually observed?          |

The Overview communicates understanding.

Evidence provides proof.

Both are necessary, but they should not compete on the primary Workspace surface.


# 7. Infrastructure Memory & Historical Experience

## 7.1 Purpose

Infrastructure Memory is Nebula's persistent historical understanding of a domain.

It answers:

> **How has this infrastructure evolved over time?**

It is separate from the current Workspace so that historical detail does not overload the current intelligence experience.

---

## 7.2 What Infrastructure Memory Contains

Infrastructure Memory preserves:

* previous infrastructure snapshots
* meaningful changes
* historical findings
* infrastructure evolution
* previous understanding states
* supporting evidence
* historical comparisons

The underlying history remains immutable.

---

## 7.3 Access

Infrastructure Memory should be accessible from the user's profile/context menu.

It should not become a dominant item in the primary Workspace navigation.

Conceptually:

```text id="1y0s2c"
Profile
   ↓
Infrastructure Memory
   ↓
Historical Investigation
```

This keeps the main Workspace focused on:

> **What matters now?**

---

## 7.4 Historical Timeline

The timeline provides a chronological view of meaningful infrastructure evolution.

It should prioritize meaningful events rather than every low-level observation.

Examples:

* CDN/provider changed
* TLS posture changed
* frontend architecture changed
* compute expanded
* infrastructure boundary changed

The timeline should communicate the evolution of the infrastructure, not act as an activity log.

---

## 7.5 Historical Comparison

Users should be able to select two snapshots and compare them on demand.

The comparison answers:

> **What changed between these two points?**

```text id="1k8whb"
Snapshot A
    +
Snapshot B
    ↓
Meaningful Differences
    ↓
Significance
    ↓
Evidence
```

The comparison should focus on meaningful changes rather than forcing users to compare raw JSON or technical payloads manually.

---

## 7.6 Relative and Absolute Time

Historical events may use readable relative labels such as:

* Today
* Yesterday
* 4 days ago
* 2 weeks ago
* Earlier this month

When precision matters, the exact date/time should also be available.

---

## 7.7 Historical Narrative

Where sufficient intelligence exists, historical events may have a concise narrative explaining the architectural evolution.

Example:

> **The frontend moved to server-side rendering at the edge.**

The narrative must be grounded in actual snapshots, changes, and evidence.

Nebula must not infer historical intent unless the evidence supports it.

---

## 7.8 History vs Current Workspace

The distinction is:

```text id="y2s7jc"
Workspace
    ↓
What matters now?


Infrastructure Memory
    ↓
What happened over time?
```

Historical information may influence current intelligence, but the complete historical record should not be displayed on the primary Workspace.

---

## 7.9 Historical Evidence

Every meaningful historical event should retain access to its supporting evidence where available.

```text id="3r9s0w"
Historical Event
      ↓
Previous State
      ↓
Current State
      ↓
Observed Difference
      ↓
Evidence
```

This preserves the authenticity of Infrastructure Memory.

---

## 7.10 No Activity Feed

Infrastructure Memory should not become a chronological dump of everything Nebula observed.

Routine observations remain in the underlying snapshots and evidence.

The historical experience surfaces meaningful infrastructure evolution.

---

## 7.11 Immutable Memory

Historical snapshots and their associated evidence should remain immutable.

New understandings create new historical states rather than rewriting the past.

Conceptually:

```text id="e4y8xj"
Snapshot 1
   ↓
Snapshot 2
   ↓
Snapshot 3
   ↓
Snapshot 4
```

Nebula remembers what it previously understood.

---

## 7.12 Historical Memory as Intelligence

Infrastructure Memory is not merely storage.

It enables Nebula to understand:

* whether a change is new
* whether a change has happened before
* whether infrastructure is evolving
* whether a current state reverses an earlier state
* whether a pattern is persistent

Therefore:

> **History is part of Nebula's intelligence, not merely an archive.**

# 8. Registered User Continuity & Monitoring

## 8.1 Persistent Experience

The authenticated Workspace represents a continuing relationship between the user and their infrastructure.

Registered users have:

* saved domains
* persistent infrastructure understanding
* continuous monitoring
* immutable snapshots
* change history
* Infrastructure Memory

The experience should feel continuous rather than like repeated one-off scans.

---

## 8.2 Guest → Registered Continuity

When a user registers after completing the Guest Experience:

```text id="9m5v6r"
Guest Understanding
       ↓
Registration
       ↓
Domain preserved automatically
       ↓
Understanding preserved / continued
       ↓
Authenticated Workspace
```

The user should not be required to enter the same domain again or restart the entire understanding process unnecessarily.

Registration should feel like gaining continuity, not starting over.

---

## 8.3 Continuous Understanding

For registered domains, Nebula continues to create infrastructure understandings over time.

The system compares:

```text id="a6c2yz"
Previous Snapshot
       ↓
New Snapshot
       ↓
Change Detection
       ↓
Intelligence Assessment
       ↓
Workspace Update
```

Only meaningful intelligence should reach the user's primary Workspace.

---

## 8.4 "While You Were Away"

When the user returns after meaningful infrastructure evolution, Nebula should surface the important changes.

The experience should answer:

> **What happened while I was away?**

A meaningful change may become:

* Primary Story
* Secondary Story
* Infrastructure Memory only

depending on significance.

---

## 8.5 No Meaningful Change

When nothing important changed, Nebula should remain calm.

The intended behavior is conceptually:

> **Nothing important changed today. Everything else remains healthy. We'll continue watching.**

The exact copy may evolve, but the principle is fixed:

> **Do not manufacture activity when there is nothing meaningful to report.**

---

## 8.6 Background Understanding

While a new understanding is running:

* existing trusted intelligence remains visible
* existing stories remain stable
* the user can continue using the Workspace
* new intelligence is published only after the understanding is sufficiently established

A background job should not cause the Workspace to flicker or continuously rewrite itself.

---

## 8.7 Failed Understanding

A failed understanding must not replace the previous trusted Workspace state.

The previous valid understanding remains the active source of intelligence.

The failure may be communicated separately when useful.

No unsupported new stories should be generated from a failed run.

---

## 8.8 Partial Understanding

A partial understanding should not silently replace trusted intelligence.

If sufficient information exists for safe publication, Nebula may expose supported intelligence with appropriate uncertainty.

Otherwise, the previous valid understanding remains the active Workspace state.

---

## 8.9 Monitoring Philosophy

Continuous monitoring is not the same as continuous notification.

Nebula may continuously observe infrastructure without continuously interrupting the user.

The system should:

```text id="qlp5qa"
Observe continuously
       ↓
Compare continuously
       ↓
Assess continuously
       ↓
Surface selectively
```

This distinction is essential to the calm Workspace experience.

---

## 8.10 Persistent Memory

Every new understanding should contribute to the domain's Infrastructure Memory.

Nebula therefore becomes increasingly useful over time because it has a longitudinal understanding of the infrastructure rather than only its current state.

The experience should evolve from:

> **Understand this infrastructure**

to:

> **Continue understanding this infrastructure.**

# 9. Workspace States & Trust

## 9.1 Core Principle

The Workspace must always make the state of Nebula's understanding clear.

The user should be able to distinguish between:

* understood
* updating
* unchanged
* changed
* partially understood
* failed
* stale

Nebula must never present uncertain or outdated intelligence as current truth.

---

## 9.2 Trusted State

A successful understanding becomes the trusted current state for the domain.

It provides the basis for:

* Executive Brief
* Primary Story
* Secondary Stories
* Infrastructure Overview
* Findings
* Evidence
* Change comparison

A newer understanding replaces the trusted state only when it has completed successfully and meets the publication requirements.

---

## 9.3 Understanding in Progress

While infrastructure is being understood:

* keep the last trusted Workspace visible
* indicate that a new understanding is in progress
* do not replace existing intelligence prematurely
* avoid unnecessary loading screens
* publish the new state only when ready

The user should never lose access to the last known trustworthy state simply because a new understanding is running.

---

## 9.4 No Change

If a new understanding produces no meaningful changes:

```text id="b6gk8w"
Previous Understanding
        ↓
New Understanding
        ↓
No Meaningful Change
        ↓
Keep Workspace Calm
```

Nebula should not create artificial stories or notifications.

The user should understand that the infrastructure remains consistent.

---

## 9.5 Meaningful Change

When meaningful change is detected:

```text id="5u7j2c"
Previous State
      ↓
Current State
      ↓
Meaningful Change
      ↓
Intelligence
      ↓
Primary / Secondary Story
```

The Workspace should communicate the meaning of the change rather than merely displaying a technical diff.

---

## 9.6 Partial Understanding

If the new understanding is incomplete:

* do not silently present incomplete information as authoritative
* preserve the previous trusted state where necessary
* communicate uncertainty where relevant
* publish only conclusions supported by sufficient evidence

Completeness is part of trust.

---

## 9.7 Failed Understanding

If understanding fails:

* preserve the last trusted Workspace
* do not fabricate new intelligence
* do not remove valid historical data
* communicate the failure without unnecessarily disrupting the user

A failed update must never overwrite trusted intelligence.

---

## 9.8 Stale State

A Workspace may become stale when a newer understanding has not been completed within the expected freshness window.

Staleness should be communicated calmly.

The user should still be able to inspect the last trusted intelligence and its timestamp.

Stale does not mean invalid.

It means:

> **This is the latest trusted understanding, but it may not represent the current infrastructure.**

---

## 9.9 Evidence State

Evidence must retain the state in which it was collected.

Historical evidence should not be silently updated to reflect newer infrastructure.

Each snapshot represents what Nebula observed at that point in time.

---

## 9.10 Trust Rules

Nebula must:

* preserve the last trusted state
* never fabricate missing information
* never invent historical changes
* never invent evidence
* never claim unsupported causality
* clearly distinguish observation from inference
* expose uncertainty when necessary
* preserve immutable historical states
* allow users to inspect supporting evidence

The fundamental rule is:

> **When Nebula does not know, it must not pretend to know.**

# 10. Navigation & Interaction Principles

## 10.1 Navigation Philosophy

Workspace navigation should follow the user's questions, not Nebula's backend modules.

Users should think in terms of:

* What matters?
* What changed?
* Why?
* What exists?
* How do we know?
* What happened over time?

They should not need to understand Nebula's internal module structure.

---

## 10.2 Primary Navigation

The primary Workspace navigation should remain minimal.

Current infrastructure intelligence should remain the dominant experience.

Historical exploration belongs to **Infrastructure Memory** rather than competing with the current Workspace.

---

## 10.3 Domain Context

The active domain must remain clear throughout the Workspace.

Changing the active domain changes the entire intelligence context:

```text id="f4r5m9"
Domain
  ↓
Current Understanding
  ↓
Stories
  ↓
Infrastructure
  ↓
Evidence
  ↓
Memory
```

Information from different domains must never be mixed ambiguously.

---

## 10.4 Progressive Navigation

Navigation should follow progressive disclosure:

```text id="f1n4kp"
Workspace
   ↓
Story
   ↓
What Changed
   ↓
Why
   ↓
Evidence
```

Users should be able to stop at any level.

Going deeper should provide additional understanding, not simply repeat the same information.

---

## 10.5 Context Preservation

When investigating a story, finding, change, or snapshot, Nebula should preserve the user's context.

Relevant context may include:

* active domain
* selected story
* selected finding
* selected snapshots
* comparison state
* historical position

The user should be able to return without rebuilding the investigation.

---

## 10.6 Interaction Principles

Interactions should be:

* predictable
* restrained
* contextual
* reversible where appropriate
* accessible
* consistent across the Workspace

Avoid unnecessary:

* modals
* popups
* confirmation dialogs
* notifications
* animations
* page transitions

when they do not improve understanding.

---

## 10.7 Investigation

Investigation should feel like moving deeper into the same piece of intelligence.

For example:

```text id="r8m3j7"
Primary Story
    ↓
What Changed
    ↓
Why
    ↓
Evidence
```

The user should not feel that they have moved into unrelated screens.

---

## 10.8 History Navigation

Infrastructure Memory should allow users to move from:

```text id="g8q0tz"
Timeline
   ↓
Historical Event
   ↓
Snapshot
   ↓
Comparison
   ↓
Evidence
```

Historical investigation should remain separate from the current Workspace unless historical context is relevant to current intelligence.

---

## 10.9 Responsive Behavior

The information hierarchy must remain intact across desktop and mobile.

On smaller screens:

```text id="m2q6df"
Primary Story
    ↓
Secondary Stories
    ↓
Infrastructure Overview
    ↓
Investigation
```

Content should stack naturally.

Desktop card layouts should not be preserved at the cost of usability.

---

## 10.10 Accessibility

Workspace interactions must support:

* keyboard navigation
* visible focus
* logical reading order
* accessible labels
* sufficient contrast
* reduced-motion preferences
* non-color-dependent meaning

Color must never be the only way to communicate severity, state, or change.

---

## 10.11 Motion

Motion should communicate state or relationship, not decoration.

Appropriate uses include:

* meaningful Workspace updates
* opening deeper intelligence
* revealing evidence
* subtle transitions between states

Avoid continuous animation and attention-seeking effects.

The Workspace should remain calm even when infrastructure changes significantly.

---

## 10.12 Navigation Standard

The navigation experience should always preserve the core principle:

> **Follow curiosity, not complexity.**

The user should be able to move naturally from:

```text id="6o6q4s"
What matters?
     ↓
What changed?
     ↓
Why?
     ↓
How do we know?
     ↓
How has it evolved?
```

without being forced to understand how Nebula internally collects or stores the information.

# 11. Visual & Interaction Language

## 11.1 Design Character

The authenticated Workspace should feel:

* Premium
* Calm
* Trustworthy
* Intelligent
* Enterprise-grade
* Technically credible
* Restrained

The interface should communicate confidence through clarity and precision, not through visual excess.

---

## 11.2 Visual Hierarchy

Visual hierarchy must reinforce intelligence hierarchy.

```text
Primary Intelligence
        ↓
Supporting Intelligence
        ↓
Infrastructure Detail
        ↓
Evidence
```

The Primary Story must have the strongest visual presence.

Secondary Stories should be quieter.

Raw evidence should be visually subordinate to the intelligence it supports.

---

## 11.3 Avoid Dashboard Aesthetics

The Workspace should not rely on:

* excessive cards
* large metric tiles
* dense tables
* bright alert colors
* decorative charts
* unnecessary gradients
* excessive badges

Components should exist because they improve understanding.

---

## 11.4 Typography

Typography should prioritize:

* strong hierarchy
* excellent readability
* restrained sizing
* clear technical labels
* comfortable spacing

Headlines should communicate meaning.

Technical metadata should remain visually secondary.

---

## 11.5 Color

Color should communicate meaning rather than decoration.

Severity colors may be used for:

* Critical
* High
* Medium
* Low

But color must not be the only indicator.

The overall interface should remain visually calm even when serious findings exist.

---

## 11.6 Spacing

Generous spacing should separate different levels of intelligence.

The interface should avoid dense information packing.

Whitespace is part of the product's premium character and should help users understand hierarchy.

---

## 11.7 Components

Components should be designed around intelligence concepts rather than backend entities.

Examples:

* Executive Brief
* Primary Story
* Secondary Story
* Infrastructure Overview
* Change
* Evidence
* Timeline
* Snapshot Comparison

Avoid creating a separate visual component for every collector or database model.

---

## 11.8 Interaction Feedback

User actions should receive clear but restrained feedback.

Feedback should communicate:

* action completed
* state changed
* information loaded
* understanding updated
* error occurred

Avoid excessive toasts, animations, or attention-grabbing effects.

---

## 11.9 Loading

Loading states should preserve the existing Workspace context whenever possible.

A background understanding should not replace the entire Workspace with a generic loading screen.

Prefer:

```text
Existing trusted intelligence
        +
Quiet update indication
```

over:

```text
Full-page loading
```

---

## 11.10 Empty States

Empty states should be meaningful and intentional.

Do not use empty states to encourage unnecessary activity.

Examples:

```text
No meaningful changes
```

or simply omit a section when there is nothing relevant to show.

The absence of information should not automatically be treated as a problem.

---

## 11.11 Error States

Errors should be:

* clear
* honest
* contextual
* non-alarming unless genuinely critical

A failed understanding should preserve the last trusted Workspace state where possible.

The interface should explain what happened without exposing unnecessary implementation details.

---

## 11.12 Motion

Motion should be subtle and purposeful.

Use motion to communicate:

* state transition
* new intelligence
* expansion
* navigation relationship

Do not use motion merely to make the interface feel active.

Nebula should never feel restless.

---

## 11.13 Premium Standard

The visual standard is:

> **Less UI, stronger hierarchy, better information.**

Premium character comes from:

* restraint
* consistency
* typography
* spacing
* precision
* subtle interaction
* confidence

not from adding more visual elements.

---

## 11.14 Trust Standard

The visual language must reinforce:

> **If Nebula shows it, Nebula can explain it.**

The interface should therefore make the path from:

```text
Intelligence
    ↓
Context
    ↓
Evidence
```

clear without making evidence visually dominant.


# 12. Workspace Data & Backend Integration

## 12.1 Principle

The Workspace must consume the existing Nebula backend capabilities rather than creating a parallel intelligence or data model in the frontend.

The frontend is the presentation layer.

The backend remains responsible for:

* infrastructure understanding
* snapshots
* findings
* change detection
* evidence
* briefs
* historical state
* monitoring
* domain persistence

---

## 12.2 Primary Backend Capabilities

The Workspace is supported by the existing backend architecture:

| Workspace Experience        | Backend Capability                        |
| --------------------------- | ----------------------------------------- |
| Executive Brief             | Infrastructure Brief / Snapshot           |
| Primary & Secondary Stories | Intelligence / Findings / Changes         |
| Infrastructure Overview     | Discovery / Snapshot                      |
| Evidence                    | Evidence / Finding relationships          |
| Timeline                    | Change History / Snapshots                |
| Infrastructure Memory       | Persistent Snapshots / Change History     |
| Comparison                  | Snapshot comparison                       |
| Continuous Monitoring       | Understanding Jobs / Domain Understanding |

The Workspace should expose these capabilities through coherent product experiences rather than exposing backend modules directly.

---

## 12.3 Snapshot as Trusted State

An Infrastructure Snapshot represents Nebula's understanding of a domain at a specific point in time.

Snapshots provide the foundation for:

* current state
* comparison
* historical memory
* evidence relationships
* change detection

Historical snapshots must remain immutable.

---

## 12.4 Findings

Findings provide structured observations and technical significance.

They may include:

* module
* category
* severity
* occurrence
* explanation
* associated evidence

Findings are inputs to Workspace intelligence.

They should not automatically appear as a raw findings list on the primary Workspace surface.

---

## 12.5 Change History

Change History represents differences between infrastructure states.

It provides the foundation for:

* What Changed
* Primary Stories
* Secondary Stories
* Timeline
* Infrastructure Memory
* Snapshot Comparison

Changes should be interpreted by the Intelligence Layer before becoming Workspace narratives.

---

## 12.6 Evidence

Raw Evidence provides the technical source behind observations.

The Workspace should preserve relationships between:

```text id="5s5w3d"
Snapshot
   ↓
Finding / Change
   ↓
Observation
   ↓
Evidence
```

This allows users to move from a high-level conclusion to its technical proof.

---

## 12.7 Infrastructure Brief

The Infrastructure Brief provides the high-level current-state synthesis used by the Executive Brief experience.

The Workspace should present the brief as product intelligence rather than exposing the underlying storage model.

---

## 12.8 API Principle

Frontend API usage should follow the Workspace information hierarchy.

The frontend should not fetch large amounts of raw data simply because the backend makes it available.

Prefer:

```text id="l6lq6a"
Workspace need
    ↓
Purpose-specific API
    ↓
Relevant intelligence
    ↓
Progressive detail
```

rather than:

```text id="w2l6i6"
Fetch everything
    ↓
Frontend decides what matters
```

The backend remains the source of truth for infrastructure intelligence.

---

## 12.9 No Duplicate Intelligence

The frontend must not independently determine:

* meaningful changes
* significance
* story priority
* historical conclusions
* infrastructure causality

These belong to the Intelligence Layer.

Frontend logic should primarily handle:

* presentation
* interaction
* local UI state
* navigation
* loading/error states
* progressive disclosure

---

## 12.10 Existing Backend First

Workspace implementation should reuse existing backend capabilities wherever they already support the required experience.

New backend functionality should be introduced only where the Workspace requires intelligence or data that the current backend does not provide.

The Workspace Bible defines the experience; backend architecture remains the implementation authority for data and intelligence.


# 13. Workspace UX Rules & Frozen Decisions

## 13.1 Core UX Rules

The Workspace must:

* lead with intelligence
* keep the current state clear
* prioritize what matters
* disclose detail progressively
* preserve evidence
* preserve historical context
* remain calm when nothing important changes
* avoid unnecessary interaction and visual noise

---

## 13.2 Story Rules

* One Primary Story normally.
* 0–3 Secondary Stories normally.
* Selection is owned by the Intelligence Layer.
* Severity does not automatically determine story priority.
* Related observations should be correlated.
* Duplicate stories should be removed.
* Stories must remain grounded and explainable.
* Stable intelligence should not be unnecessarily rewritten.
* No filler stories.

---

## 13.3 Evidence Rules

* Human-readable intelligence comes first.
* Raw evidence remains accessible.
* Evidence must represent actual collected observations.
* Evidence must retain its snapshot/time context.
* The LLM must never fabricate evidence.
* Deeper technical inspection must preserve the user's investigation context.

---

## 13.4 History Rules

* Historical infrastructure state is immutable.
* History is called **Infrastructure Memory**.
* Infrastructure Memory is separate from the primary current-state Workspace.
* Users can access historical snapshots and meaningful evolution.
* Users can compare two snapshots on demand.
* Historical data may inform current intelligence.
* Historical events should not become current stories unless they are relevant to the current state.

---

## 13.5 Monitoring Rules

* Registered domains are continuously understood.
* Monitoring does not mean continuous notification.
* New understanding is compared with the previous trusted state.
* Only meaningful changes are surfaced.
* Failed or incomplete understanding must not silently replace trusted state.
* No meaningful change means no manufactured activity.

---

## 13.6 Registration Rules

After a user registers following the Guest Experience:

* the understood domain should be preserved automatically
* the existing understanding should be preserved/continued where supported
* the user should enter the authenticated Workspace with continuity
* the user should not repeat work unnecessarily

Registration represents **continuity**, not a restart.

---

## 13.7 Visual Rules

The Workspace must remain:

* premium
* calm
* trustworthy
* restrained
* enterprise-grade

Avoid turning the Workspace into:

* a dashboard
* an alert center
* a scanner report
* a dense analytics interface

Visual hierarchy must follow intelligence hierarchy.

---

## 13.8 Navigation Rules

Navigation should follow user questions:

```text id="y0r8na"
What matters?
   ↓
What changed?
   ↓
Why?
   ↓
How do we know?
   ↓
How has it evolved?
```

It should not mirror backend modules.

---

## 13.9 Intelligence Rules

The Intelligence Layer determines:

* what matters
* what changed
* significance
* story selection
* correlation
* historical relevance

The LLM provides grounded language synthesis.

```text id="3x4q5v"
Facts
  ↓
Intelligence
  ↓
LLM
  ↓
Explanation
```

The LLM must not become the source of infrastructure truth.

---

## 13.10 Product Philosophy

The Workspace must consistently reinforce:

> **Know what changed. Understand why.**

And the presentation hierarchy remains:

> **Intelligence before data.**
> **Context before details.**
> **Summary before evidence.**

The product should always prefer meaningful understanding over maximum information density.

# 14. Workspace Definition of Done

## 14.1 Product

The Workspace is complete only when it clearly communicates:

* current infrastructure state
* what matters most
* what else is worth knowing
* what changed
* why it matters
* how it is supported by evidence
* how the infrastructure has evolved

---

## 14.2 Intelligence

The implementation must ensure:

* meaningful changes are prioritized
* Primary Story is selected by the Intelligence Layer
* Secondary Stories are selectively generated
* related observations are correlated
* duplicate intelligence is removed
* significance is distinguished from severity
* historical context can influence intelligence
* unsupported conclusions are not surfaced

---

## 14.3 Evidence

The implementation must provide:

* traceability from intelligence to observation
* source/collector attribution
* observation time
* access to raw technical evidence
* snapshot context
* immutable historical evidence

The user should be able to verify important conclusions.

---

## 14.4 History

The implementation must provide:

* persistent Infrastructure Memory
* historical snapshots
* meaningful timeline/evolution
* historical changes
* snapshot comparison
* access to previous states
* immutable historical records

Users should be able to investigate history without cluttering the current Workspace.

---

## 14.5 Registered Experience

The implementation must support:

* persistent domains
* continuous understanding
* previous trusted state
* meaningful change detection
* "while you were away" intelligence
* guest-to-registered continuity
* Infrastructure Memory

---

## 14.6 Reliability

The Workspace must correctly handle:

* loading
* understanding in progress
* successful understanding
* no meaningful change
* meaningful change
* partial understanding
* failed understanding
* stale state

A failed or incomplete update must not silently replace trusted intelligence.

---

## 14.7 UX

The final experience must preserve:

* progressive disclosure
* calmness
* premium character
* enterprise-grade trust
* responsive behavior
* accessibility
* context preservation
* minimal navigation
* restrained visual hierarchy

---

## 14.8 Final Product Test

A user should be able to enter the Workspace and understand, without inspecting raw technical data:

```text id="9t6t0j"
What is happening?
        ↓
What matters?
        ↓
What changed?
        ↓
Why does it matter?
        ↓
How do we know?
```

And when they want deeper historical understanding:

```text id="3c5b2h"
How has this infrastructure evolved?
        ↓
Infrastructure Memory
        ↓
Compare snapshots
        ↓
Inspect evidence
```

If the Workspace achieves this without becoming a dashboard, scanner, alert feed, or raw data browser, the Workspace experience is aligned with the Nebula product vision.

# 15. Workspace Final Experience Contract

## 15.1 Core Experience

The authenticated Nebula Workspace is the user's current infrastructure intelligence surface.

It must answer:

> **What matters about my infrastructure right now?**

The experience follows:

```text id="p5c6xn"
Executive Brief
      ↓
Primary Story
      ↓
Secondary Stories
      ↓
Infrastructure Overview
      ↓
Evidence
```

Historical investigation is provided separately through:

```text
Infrastructure Memory
```

---

## 15.2 Core Information Contract

Nebula follows:

> **Intelligence before data.**
> **Context before details.**
> **Summary before evidence.**

The user should understand the conclusion before encountering the technical implementation details behind it.

---

## 15.3 Story Contract

### Primary Story

Answers:

> **What matters most right now?**

Normally one story.

### Secondary Stories

Answer:

> **What else is worth knowing?**

Normally zero to three.

Both are selected by the Intelligence Layer and grounded in actual infrastructure understanding.

---

## 15.4 Investigation Contract

Every meaningful story should support deeper investigation where applicable:

```text id="m0br8v"
Story
  ↓
What Changed
  ↓
Why
  ↓
Evidence
```

The user can stop at any level.

Technical depth is available without forcing it onto the primary experience.

---

## 15.5 Memory Contract

Infrastructure Memory answers:

> **How has this infrastructure evolved over time?**

It preserves:

* snapshots
* changes
* historical findings
* evolution
* evidence

Users can compare historical snapshots on demand.

Historical records remain immutable.

---

## 15.6 Monitoring Contract

Registered domains are continuously understood.

Nebula:

```text id="v2k3hj"
Observe
  ↓
Compare
  ↓
Assess
  ↓
Select what matters
  ↓
Update Workspace
```

Monitoring does not mean constant notifications.

Only meaningful intelligence should interrupt the user's attention.

---

## 15.7 Trust Contract

Nebula must never:

* fabricate evidence
* invent changes
* invent historical events
* claim unsupported causality
* present uncertain information as certain
* overwrite trusted state with failed/incomplete understanding

The user must always be able to understand:

> **What Nebula knows, why it matters, and how Nebula knows it.**

---

## 15.8 AI Contract

The Intelligence Layer determines meaning and priority.

The LLM synthesizes grounded information into human-readable language.

```text id="yr7p9v"
Infrastructure Data
        ↓
Intelligence Layer
        ↓
RAG Context
        ↓
LLM
        ↓
Workspace Narrative
```

The LLM is not the source of infrastructure truth.

---

## 15.9 Visual Contract

The Workspace must remain:

* calm
* premium
* trustworthy
* restrained
* enterprise-grade

It must not become:

* a scanner
* a monitoring dashboard
* an alert center
* a findings dump
* an activity feed

The interface should communicate confidence through hierarchy and precision, not visual noise.

---

## 15.10 Final Product Principle

Nebula should make the user feel:

> **"Nebula already did the investigation. I can understand the important part immediately, and I can verify it whenever I want."**

The complete Workspace experience is therefore:

```text id="v9l7tj"
Understand
    ↓
Prioritize
    ↓
Explain
    ↓
Verify
    ↓
Remember
    ↓
Compare
```

This is the intended authenticated Workspace experience for Nebula.

# 16. Workspace Non-Goals

## 16.1 Not a Monitoring Dashboard

Nebula should not become a dashboard of constantly changing metrics,
activities, or alerts.

Monitoring happens continuously in the backend, but the Workspace surfaces
only meaningful intelligence.

---

## 16.2 Not a Scanner Report

The Workspace should not expose raw collector output as the primary
experience.

Discovery data becomes useful only after it is interpreted and prioritized.

---

## 16.3 Not a Findings Dump

Findings remain available, but the Workspace should not simply display every
finding.

The Intelligence Layer determines which findings contribute to current
intelligence.

---

## 16.4 Not an Activity Feed

Nebula should not show every:

- DNS observation
- HTTP observation
- TLS observation
- technology detection
- background job
- snapshot creation

as user-facing activity.

Routine activity remains in the underlying system.

---

## 16.5 Not an Evidence Browser

Raw evidence is important for trust, but it is not the primary Workspace
experience.

Evidence is progressively disclosed when the user wants verification.

---

## 16.6 Not a Historical Archive

Infrastructure Memory is more than an archive.

It provides meaningful infrastructure evolution and comparison.

The Workspace should not force users to browse historical data simply to
understand the current state.

---

## 16.7 Not an AI Chat Interface

The Workspace should not require users to converse with an LLM to understand
their infrastructure.

Nebula should proactively produce useful intelligence.

AI is part of the intelligence pipeline, not the primary interface.

---

## 16.8 Not a Generic DevOps Tool

Nebula should not attempt to become a general-purpose:

- deployment platform
- observability platform
- incident management platform
- infrastructure management console
- DevOps dashboard

Its focus remains:

> **Infrastructure Intelligence.**

---

## 16.9 Not an Action-First Product

Nebula should explain before asking the user to act.

The experience is:

```text
Understand
   ↓
Explain
   ↓
Verify
   ↓
Decide
   ↓
Act if necessary

# 17. Workspace Implementation Boundaries

## 17.1 Frontend Responsibility

The frontend is responsible for:

- presenting Workspace intelligence
- maintaining visual hierarchy
- navigation
- interaction
- progressive disclosure
- local UI state
- loading and error states
- responsive behavior
- accessibility

The frontend must not become a second intelligence engine.

---

## 17.2 Backend Responsibility

The backend remains responsible for:

- discovery
- infrastructure snapshots
- findings
- change detection
- intelligence
- significance
- evidence
- historical state
- monitoring
- domain persistence
- Workspace data aggregation

The frontend consumes these capabilities.

---

## 17.3 No Frontend Reinterpretation

The frontend must not independently decide:

- what change is meaningful
- what finding is significant
- which story is primary
- which historical event matters
- whether two observations represent the same intelligence
- whether an observation proves causality

These decisions belong to the backend Intelligence Layer.

---

## 17.4 API Consumption

Workspace APIs should expose information according to product needs.

Prefer purpose-built Workspace responses over requiring the frontend to
assemble intelligence from many unrelated endpoints.

The frontend should not fetch everything and determine what to display.

---

## 17.5 Existing Backend First

Existing Nebula backend capabilities should be reused wherever they already
support the Workspace.

New backend work should be introduced only when the required Workspace
experience is not adequately supported.

The Workspace Bible defines the desired experience; backend architecture
defines how that experience is implemented.

---

## 17.6 Data Integrity

The Workspace must respect the backend's persistence model.

In particular:

- snapshots remain immutable
- historical evidence remains associated with its original state
- changes remain attributable to the relevant snapshots
- failed understanding must not replace trusted state
- historical records must not be rewritten to fit current presentation

---

## 17.7 Documentation

Workspace implementation must follow Nebula's documentation-first approach.

Significant changes to:

- Workspace behavior
- information hierarchy
- APIs
- intelligence contracts
- historical experience
- navigation
- architecture

must be reflected in the appropriate project documentation.

The Workspace Bible remains the canonical experience reference.

# 18. Workspace Completion Checklist

## 18.1 Current Intelligence

- [ ] Executive Brief communicates the current infrastructure state.
- [ ] One Primary Story is selected when meaningful intelligence exists.
- [ ] Secondary Stories contain only additional meaningful intelligence.
- [ ] No filler or duplicated stories are displayed.
- [ ] Severity and significance remain distinct.
- [ ] Current intelligence is clearly separated from historical information.

## 18.2 Investigation

- [ ] Users can understand what changed.
- [ ] Users can understand why it matters.
- [ ] Users can inspect supporting evidence.
- [ ] Investigation preserves the selected domain and context.
- [ ] Raw technical evidence remains accessible without dominating the primary
      experience.

## 18.3 Infrastructure Understanding

- [ ] Infrastructure Overview communicates meaningful architecture and
      technology.
- [ ] Technologies can include role, version, and confidence where available.
- [ ] Raw discovery output is not exposed as the primary experience.

## 18.4 Infrastructure Memory

- [ ] Historical snapshots are preserved.
- [ ] Meaningful infrastructure evolution is available.
- [ ] Users can access Infrastructure Memory.
- [ ] Users can compare two snapshots on demand.
- [ ] Historical evidence remains tied to its original state.
- [ ] Historical records remain immutable.

## 18.5 Continuous Understanding

- [ ] Registered domains can be continuously understood.
- [ ] New understanding is compared with the previous trusted state.
- [ ] Only meaningful changes reach the Workspace.
- [ ] "While You Were Away" communicates meaningful changes.
- [ ] No-change states remain calm.
- [ ] Failed or incomplete understanding does not replace trusted state.

## 18.6 Guest → Registered Continuity

- [ ] Guest domain is preserved after registration.
- [ ] Existing understanding is preserved or continued where supported.
- [ ] User does not unnecessarily repeat the Guest Experience.
- [ ] Authenticated Workspace begins with continuity.

## 18.7 Trust

- [ ] Intelligence is grounded in actual infrastructure observations.
- [ ] Evidence is accessible.
- [ ] Historical claims are supported by historical state.
- [ ] Unsupported causality is not presented as fact.
- [ ] Uncertainty is communicated when necessary.
- [ ] The LLM does not become the source of infrastructure truth.

## 18.8 Experience Quality

- [ ] Intelligence appears before raw data.
- [ ] Context appears before technical detail.
- [ ] Summary appears before evidence.
- [ ] Workspace remains calm and premium.
- [ ] Workspace remains enterprise-grade and verifiable.
- [ ] Navigation follows user questions rather than backend modules.
- [ ] Responsive and accessible behavior is preserved.
- [ ] The Workspace does not become a dashboard, scanner report, alert feed,
      or evidence browser.

## 18.9 Final Acceptance Principle

The Workspace is complete when a registered user can quickly understand:

> **What is happening?**  
> **What matters?**  
> **What changed?**  
> **Why does it matter?**  
> **How do we know?**  
> **How has it evolved?**

while retaining access to the underlying infrastructure evidence and history.

# 19. Workspace Experience Principles

## 19.1 Intelligence First

The Workspace should always lead with the most useful understanding available.

```text
Data
  ↓
Understanding
  ↓
Intelligence
  ↓
Presentation
```

The user should not need to interpret raw infrastructure data before understanding what matters.

---

## 19.2 Context Before Detail

Every deeper layer should make sense in relation to the layer above it.

```text
What is happening?
        ↓
What matters?
        ↓
What changed?
        ↓
Why?
        ↓
Evidence
```

Technical detail should never appear without sufficient context.

---

## 19.3 Summary Before Evidence

Evidence is essential for trust, but it should not dominate the initial experience.

The preferred experience is:

```text
Summary
  ↓
Explanation
  ↓
Technical Detail
  ↓
Evidence
```

---

## 19.4 Selection Over Volume

Nebula may know considerably more than it displays.

The Workspace should surface only information that improves understanding or decision-making.

```text
Complete Infrastructure Knowledge
            ↓
      Intelligence Selection
            ↓
       Workspace Surface
```

The goal is not maximum information.

The goal is maximum useful understanding with minimum unnecessary cognitive load.

---

## 19.5 Calmness

Nebula should remain calm when:

* nothing changed
* something changed
* a finding is important
* understanding is running
* evidence is incomplete

Visual urgency and language urgency should correspond to actual significance.

---

## 19.6 Trust Through Restraint

Users should develop the expectation:

> **If Nebula shows this, it is worth understanding.**

That requires:

* no filler
* no manufactured activity
* no duplicate stories
* no unsupported claims
* no unnecessary notifications

---

## 19.7 Technical Authenticity

Human-readable intelligence must not remove technical authenticity.

The product should provide:

```text
Meaning
  ↓
Context
  ↓
Observation
  ↓
Evidence
```

Users can remain at the high-level interpretation or continue to the original technical evidence.

---

## 19.8 Persistent Understanding

The authenticated Workspace should feel like Nebula remembers the infrastructure.

Every new understanding contributes to the domain's continuing intelligence and Infrastructure Memory.

The experience therefore becomes more useful over time rather than resetting after every analysis.

---

## 19.9 Decision Support

Nebula should help users decide what deserves attention without forcing them to act.

The intended sequence is:

```text
Understand
  ↓
Assess
  ↓
Verify
  ↓
Decide
  ↓
Act if necessary
```

---

## 19.10 Final Experience Rule

Every Workspace decision should be evaluated against one question:

> **Does this help the user understand their infrastructure better?**

If it adds information without improving understanding, it should not become part of the primary Workspace experience.

# 20. Workspace Final Principles

## 20.1 The Workspace Has One Job

The authenticated Workspace exists to help the user understand their infrastructure.

It should answer:

> **What matters about my infrastructure right now?**

Everything else supports that purpose.

---

## 20.2 Current Intelligence Comes First

The primary experience is:

```text
Executive Brief
    ↓
Primary Story
    ↓
Secondary Stories
    ↓
Infrastructure Overview
    ↓
Evidence

# 21. Workspace Acceptance Criteria

## 21.1 Current Intelligence

The Workspace must make the current infrastructure state understandable without requiring users to inspect raw technical data.

It must provide:

- Executive Brief
- Primary Story
- Secondary Stories where meaningful
- Infrastructure Overview
- access to Evidence

---

## 21.2 Change Intelligence

When meaningful change exists, the Workspace must communicate:

- what changed
- why it matters
- significance
- supporting evidence

Users must be able to investigate the change without manually comparing snapshots.

---

## 21.3 Historical Intelligence

Registered users must have access to Infrastructure Memory containing:

- historical snapshots
- meaningful evolution
- previous states
- historical evidence
- snapshot comparison

Historical data must remain immutable.

---

## 21.4 Continuous Experience

For registered domains:

- new understandings are compared with previous trusted states
- meaningful changes can update the Workspace
- insignificant changes remain out of the primary surface
- no-change states remain calm
- failed updates preserve the previous trusted state

---

## 21.5 Guest-to-Workspace Continuity

After registration following Guest Experience:

- the domain is preserved
- the existing understanding is preserved or continued
- the user enters the authenticated Workspace without unnecessary repetition

---

## 21.6 Trust

The Workspace must provide a clear relationship between:

```text
Story
  ↓
Intelligence
  ↓
Observation
  ↓
Evidence

# 22. Responsive & Mobile Workspace

## 22.1 Principle

The Workspace must preserve the same intelligence hierarchy across desktop, tablet, and mobile. Responsive behavior should adapt the presentation, not change the product experience.

The hierarchy remains:

```text
Executive Brief
      ↓
Primary Story
      ↓
Secondary Stories
      ↓
Infrastructure Overview
      ↓
Investigation
      ↓
Evidence
22.2 Mobile Priority
On smaller screens, the most important information remains first.

The user should encounter:

Current domain/context

Executive Brief

Primary Story

Secondary Stories

Infrastructure Overview

Deeper investigation

Evidence

Historical information remains available through Infrastructure Memory.

22.3 Layout
Desktop layouts may use multiple columns where useful.

Mobile should primarily use a single-column flow.

Do not preserve desktop card grids at the expense of:

Readability

Hierarchy

Touch usability

Context

Investigation flow

22.4 Primary Story
The Primary Story must remain visually dominant on mobile.

Secondary Stories should follow naturally beneath it.

The interface must never make Secondary Stories appear equivalent to the Primary Story simply because of responsive layout changes.

22.5 Evidence on Mobile
Raw evidence should remain accessible but progressively disclosed.

Large technical payloads such as:

HTTP headers

DNS records

TLS details

Hashes

Collector metadata

should not overwhelm the mobile screen.

Technical evidence may use expandable sections or appropriate horizontal scrolling where necessary.

22.6 Historical Experience
Infrastructure Memory should remain fully usable on mobile:

Timeline events should stack vertically.

Snapshot comparison should prioritize meaningful differences before technical detail.

The user should not be required to view two large datasets side-by-side.

22.7 Navigation
Mobile navigation should remain minimal.

The active domain and essential Workspace context must remain clear.

Secondary navigation and profile actions may move into a compact menu where necessary.

Infrastructure Memory remains accessible through the profile/context area.

22.8 Interaction
Touch targets must be appropriately sized.

Interactive elements must provide clear feedback.

Hover-dependent interactions must not be required.

Keyboard accessibility must remain available on supported devices.

## 22.9 Motion
Responsive layouts must not introduce additional motion merely because the screen size changes.

Motion remains:

Subtle

Purposeful

Optional

Respectful of reduced-motion preferences

## 2.10 Responsive Standard
The goal is not:

Make the desktop UI fit on mobile.

The goal is:

Preserve the intelligence experience regardless of screen size.

# 23. Security, Privacy & Access Boundaries

## 23.1 Authentication Boundary

The Workspace is an authenticated experience.

Only authenticated users should access:

- saved domains
- persistent Workspace intelligence
- continuous monitoring
- Infrastructure Memory
- historical snapshots
- user-specific evidence
- user-specific comparisons

Guest capabilities remain separate from the authenticated Workspace.

---

## 23.2 Domain Isolation

A registered user's Workspace must only expose domains and infrastructure data
that belong to the authenticated user's authorized scope.

Data from another user's domain must never appear in:

- Workspace intelligence
- stories
- findings
- evidence
- history
- comparisons
- search results
- navigation

---

## 23.3 Evidence Access

Raw evidence may contain sensitive infrastructure information.

Access must therefore follow the same authorization boundary as the
associated domain, snapshot, finding, and Workspace.

Progressive disclosure is a UX principle, not a security boundary.

Hiding evidence in the UI must never be relied upon as authorization.

---

## 23.4 Historical Data

Infrastructure Memory must respect the same authorization boundaries as current
Workspace data.

A user may only access historical snapshots, changes, and evidence for
domains they are authorized to access.

Historical data must not become an indirect way to access information that is
no longer authorized.

---

## 23.5 Snapshot Comparison

Snapshot comparison must validate access to both snapshots before returning
the comparison.

A user must never be able to compare:

```text
Authorized Snapshot
        +
Unauthorized Snapshot

or infer information about another user's infrastructure through comparison
 responses.

---

## 23.6 API Security

Frontend route protection is not sufficient.

Authorization must be enforced by the backend for every protected Workspace
 resource.

The frontend should assume:

> **The backend is the security authority.**

---

## 23.7 Sensitive Technical Information

The Workspace should avoid unnecessarily exposing sensitive technical details
 on the primary surface.

Technical details should be progressively disclosed when useful.

This provides:

```
Minimal exposure
```

      \+

Authorized access

      \+

Technical verifiability

without compromising the evidence model.

---

## 23.8 Privacy

User-specific Workspace data should remain private to the authorized user and
 authorized tenant/domain scope.

The Workspace must not expose internal identifiers or implementation details
 unless they are intentionally part of the product experience.

---

## 23.9 Security vs UX

Security controls must not unnecessarily damage the calm Workspace experience.

The preferred model is:

```
Secure by default
```

      ↓

Quietly enforced

      ↓

Clear when relevant

Security should not require unnecessary user interaction.

---

## 23.10 Trust Boundary

The Workspace should clearly separate:

```
User-facing intelligence
```

        ↓

Authorized backend data

        ↓

Infrastructure evidence

The presentation layer must never bypass backend authorization or directly
 access infrastructure systems that it is not explicitly permitted to access.

---

## 23.11 Core Security Rule

The Workspace must preserve:

> **The right user sees the right infrastructure intelligence, with the right**
>  **level of evidence, within the right authorization boundary.**

# 24. Final Frozen Workspace Contract

## 24.1 Product Purpose

The authenticated Nebula Workspace exists to provide **Infrastructure
Intelligence**, not raw infrastructure data.

Its primary question is:

> **What matters about my infrastructure right now?**

The experience follows:

```text
Intelligence
    ↓
Context
    ↓
Meaning
    ↓
Evidence
    ↓
Memory

# 24. Final Frozen Workspace Contract

## 24.1 Product Purpose

The authenticated Nebula Workspace exists to provide **Infrastructure
Intelligence**, not raw infrastructure data.

Its primary question is:

> **What matters about my infrastructure right now?**

The experience follows:

```text
Intelligence
    ↓
Context
    ↓
Meaning
    ↓
Evidence
    ↓
Memory

