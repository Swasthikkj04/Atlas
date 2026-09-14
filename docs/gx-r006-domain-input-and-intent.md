# GX-R006 — Domain Input & Intent

**Phase:** Guest Experience Redesign (`GX-R`)  
**Ticket:** `GX-R006`  
**Type:** UX / Interaction / Accessibility / Security Contract  
**Priority:** P0 — Foundation  
**Status:** 🔒 Ready for Implementation / Frozen Domain Input & Intent Contract  
**Depends on:** `GX-R001` 🔒 $\rightarrow$ `GX-R002` 🔒 $\rightarrow$ `GX-R003` 🔒 $\rightarrow$ `GX-R004` 🔒 $\rightarrow$ `GX-R005` 🔒  
**Unblocks:** `GX-R007` — Idle Micro-interactions  

---

## 🔒 Objective

Define the complete domain-intent interaction inside the bounded Guest Workspace.

A guest should know exactly what to enter, understand when their input is valid, and begin Nebula's understanding with one confident action.

$$\mathbf{DOMAIN} \longrightarrow \mathbf{VALIDATE} \longrightarrow \mathbf{UNDERSTAND\ \rightarrow} \longrightarrow \mathbf{UNDERSTANDING}$$

The interaction must feel like an intelligence command, not a registration form or security scanner.

---

## 1. Canonical Input Anatomy

```
                 Enter a domain

        ┌──────────────────────────────────────────┐
        │  example.com                         →   │
        └──────────────────────────────────────────┘

                    Understand →
```

The input remains visually integrated with the `GX-R005` idle canvas spatial hierarchy.

### Input Contains:
- Domain value
- Clear placeholder (`example.com`)
- Focus treatment (clean, high-contrast focus ring)
- Validation state (calm, restrained inline messaging)
- Submission affordance (`Understand →`)

### Prohibited Clutter:
- ❌ No URL icon or globe badge
- ❌ No search-engine icon
- ❌ No lock icon
- ❌ No decorative badge or "FREE" label
- ❌ No security marketing copy

---

## 2. Canonical Placeholder

- **Authoritative Placeholder**: `example.com`
- Demonstrates expected format without instructional noise.
- **Prohibited**:
  - ❌ *"Enter your website URL here"*
  - ❌ *"https://www.example.com"*
  - ❌ *"Enter domain to scan"* (The word *"scan"* is strictly prohibited across the GX product vocabulary).

---

## 3. Accepted Input Normalization

The Guest Experience intelligently normalizes standard input variations without forcing manual correction:

| Guest Enters | Canonical Interpretation |
|:---|:---|
| `example.com` | `example.com` |
| `Example.COM` | `example.com` |
| `www.example.com` | `www.example.com` |
| `https://example.com` | `example.com` |
| `https://example.com/` | `example.com` |
| `http://example.com/path?query=1` | `example.com` |
| `https://stripe.com:443/` | `stripe.com` |

---

## 4. Validation Boundary

Client-side validation exists for interaction quality and instant feedback, **not** security authority.

```
Browser (Client)
   │
   ├── Basic input normalization & syntax check
   │
   ▼
Guest API (Server-Side)
   │
   ├── Authoritative validation & rate controls
   ├── Anti-abuse & security controls
   ├── Infrastructure understanding engine
   │
   ▼
Canonical Intelligence Synthesis
```

> **Principle:** The frontend must never assume client validation equals safe or authorized. The backend remains authoritative.

---

## 5. Six Canonical Input States

```
01 — IDLE        [ example.com ]             Quiet and inviting
02 — FOCUSED     [ example.com | ]           Clean focus ring (no neon glow/rings)
03 — ENTERING    [ stripe.c    ]             Natural typing (no per-keystroke error spam)
04 — VALID       [ stripe.com  ]             Active primary action (no checkmark clutter)
05 — INVALID     Enter a valid domain.       Calm inline guidance (no ERROR 400 alarms)
06 — SUBMITTING  [ Understanding... ]        Locked input, zero duplicate submissions
```

---

## 6. Primary Action Contract

- **Canonical Label**: `Understand →`
- **State Logic**:
  - **Enabled**: When input contains a valid domain candidate and no request is in progress.
  - **Disabled/Blocked**: When input is empty, invalid, or submission is currently in progress.
- **Single Primary Action**: No competing alternative buttons or secondary demo CTAs.

---

## 7. Keyboard Ergonomics Contract

- **`Tab`**: Predictably navigates: Domain Input $\rightarrow$ `Understand →`.
- **`Enter`**: Submits normalized domain when valid and triggers understanding immediately.
- **`Escape`**: Does **not** unexpectedly clear the entered domain value (reserved for modal/drawer dismissal).

---

## 8. Sample Domain Interaction

$$\text{Try an example: } \mathbf{stripe.com} \cdot \mathbf{github.com} \cdot \mathbf{cloudflare.com}$$

- **Intentionality Guarantee**: Selecting a sample domain populates the input field with the domain candidate, but **does not auto-submit**.
- The guest maintains complete control to review the domain and activate `Understand →`.

---

## 9. Error Philosophy

Errors describe the state calmly without dramatization:

- ✅ **Good**:
  - *"Enter a valid domain."*
  - *"We couldn't understand that domain. Try another."*
- ❌ **Forbidden**:
  - *"Scan failed!"*
  - *"Website is insecure!"*
  - *"Vulnerability detected!"*
  - *"Something went wrong!!! 🚨"*
  - *"Please sign up to continue."*

---

## 10. Security & Guest Session Isolation

1. Guest input cannot create a user account.
2. Guest input cannot create a persistent Workspace.
3. Guest input cannot access historical intelligence lineage.
4. Guest input cannot access Admin endpoints or influence authorization.
5. Guest session remains ephemeral and isolated from other guest sessions.
6. Server-side validation is authoritative.

---

## 11. Accessibility Contract (WCAG 2.1 AA)

- Semantic accessible label (`aria-label`, `htmlFor`).
- Programmatically associated validation message (`aria-describedby`, `aria-invalid`).
- High-contrast visible focus state.
- Screen-reader compatible state announcements (`aria-live="polite"`).
- Minimum touch target size ($\ge 44\text{px}$).
- Reduced-motion compatibility.
- No color-only validation indicators.

---

## 12. Responsive Behavior

- **Desktop ($\ge 1024\text{px}$)**: Restrained central measure.
- **Tablet ($768\text{px}-1023\text{px}$)**: Input scales smoothly with canvas width.
- **Mobile ($\le 640\text{px}$)**: Vertically stacked; full-width container; `Understand →` button placed underneath; zero horizontal overflow.

---

## 13. Submission Transition Boundary

$$\mathbf{GX\text{-}R005\ (Idle)} \longrightarrow \mathbf{GX\text{-}R006\ (Domain\ Intent)} \overset{\text{Understand}\ \rightarrow}{\longrightarrow} \mathbf{UNDERSTANDING\ (GX\text{-}R008+)}$$

`GX-R006` ends precisely when understanding begins.

---

## 14. Explicitly Rejected Domain Patterns (12 Items)

1. ❌ "Scan" or "Scanner" terminology in labels, buttons, or errors
2. ❌ Search-engine style mega search box with browsing filters
3. ❌ Multi-step domain setup wizards before initial understanding
4. ❌ Email capture or registration form before understanding starts
5. ❌ Mandatory account creation or credit card requirement
6. ❌ CAPTCHA or anti-bot challenge interrupting first intent
7. ❌ Artificial domain security scoring (e.g., "Domain Score: 45/100")
8. ❌ Client-only security validation assuming browser trust
9. ❌ Auto-submission of sample domains upon selection
10. ❌ Aggressive inline error validation on initial typing
11. ❌ Competing primary action buttons (e.g., "Scan" vs "Deep Audit")
12. ❌ Marketing conversion prompts or registration popups on submit

---

## Acceptance Criteria & Certification Gate

| Criterion | Requirement | Status |
|:---|:---|:---:|
| **Input Anatomy** | Domain-first interaction, no search/globe clutter | ✅ Frozen |
| **Placeholder** | Canonical `example.com` | ✅ Frozen |
| **Normalization** | Strips protocols, trailing slashes, paths, ports | ✅ Frozen |
| **Validation** | Calm, accessible, client feedback + authoritative server | ✅ Frozen |
| **Primary CTA** | `Understand →` | ✅ Frozen |
| **Keyboard** | `Enter` submits when valid, `Tab` navigates | ✅ Frozen |
| **Sample Domains** | Optional, populates input without auto-submitting | ✅ Frozen |
| **Race Conditions** | Duplicate submissions blocked during submission | ✅ Frozen |
| **Security** | Strict guest session boundary & isolation | ✅ Frozen |
| **Accessibility** | WCAG 2.1 AA compliant, visible focus, ARIA bindings | ✅ Frozen |
| **Mobile** | Stacked full-width layout, zero horizontal overflow | ✅ Frozen |
| **Terminology** | Zero "scan" vocabulary | ✅ Frozen |
| **Transition** | Ends cleanly at `UNDERSTANDING` | ✅ Frozen |

---

### 🔒 GX-R006 Definition of Done

This ticket is certified complete when:

> **"A guest can enter, paste, or select any standard domain notation, receive calm and accessible feedback, submit via Enter or click without duplicate submission, and cleanly transition into the Understanding state without account friction or scan vocabulary."**

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
\mathbf{GX\text{-}R006\ 🔒} & \mathbf{DOMAIN\ INPUT\ \&\ INTENT} \\
\downarrow & \\
\mathbf{GX\text{-}R007} & \text{IDLE MICRO-INTERACTIONS}
\end{matrix}$$

---

## Next Ticket

$$\mathbf{GX\text{-}R007} \text{ — Idle Micro-interactions}$$

*Micro-interaction dynamics: hover states, subtle typography shifts, focus transitions, hairline accent reactions, and sample chip hover physics.*
