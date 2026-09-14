# GX-R007 — Idle Micro-Interactions & Motion Language

**Phase:** Guest Experience Redesign (`GX-R`)  
**Ticket:** `GX-R007`  
**Type:** UX / Interaction / Motion / Accessibility Contract  
**Priority:** P1 — Premium Experience  
**Status:** 🔒 Ready for Implementation / Frozen Motion Language Contract  
**Depends on:** `GX-R001` 🔒 $\rightarrow$ `GX-R002` 🔒 $\rightarrow$ `GX-R003` 🔒 $\rightarrow$ `GX-R004` 🔒 $\rightarrow$ `GX-R005` 🔒 $\rightarrow$ `GX-R006` 🔒  
**Unblocks:** `GX-R008` — Understanding Transition  

---

## 🔒 Objective

Define the micro-interaction language of the idle Guest Workspace so Nebula feels alive, responsive, and premium without becoming animated or distracting.

> **Frozen Principle:**  
> **"Motion should communicate state, not decorate the interface."**  
> *The guest should feel that Nebula is quietly responsive, not constantly moving.*

---

## 1. Canonical Motion Philosophy

$$\mathbf{INPUT} \longrightarrow \mathbf{RESPOND} \longrightarrow \mathbf{ACKNOWLEDGE} \longrightarrow \mathbf{SETTLE}$$

- Every interaction has a clear beginning, responsive feedback, and calm resting state.
- **Zero Perpetual Motion**: No infinite background animations, breathing rings, or looping particle simulations.

---

## 2. Three-Tier Motion Hierarchy

| Level | Tier Name | Target Duration | Allowed Use Cases | Easing Tokens |
|:---|:---|:---:|:---|:---|
| **Level 1** | **Micro** | **120–180ms** | Hover states, focus rings, button press/compression, input surface tone, sample chip highlight | `cubic-bezier(0.2, 0, 0, 1)` / `ease-out` |
| **Level 2** | **Interface** | **220–360ms** | Inline validation appearance, CTA state transitions (ready/submitting), contextual messaging, shell state changes | `cubic-bezier(0.4, 0, 0.2, 1)` / `ease-in-out` |
| **Level 3** | **Nebula Transition** | **~520ms** | Deliberate transition from intent submission to understanding initiation (**Nebula Pause**) | `cubic-bezier(0.16, 1, 0.3, 1)` |

---

## 3. Easing & Curve Discipline

- Motion feels precise, mechanical, and restrained rather than playful or bubbly.
- **Permitted**: `ease-out` for entering elements, `ease-in-out` for state transitions, restrained cubic bezier curves.
- **Prohibited**: ❌ Elastic bounce, ❌ spring overshoot, ❌ cartoon easing, ❌ exaggerated scaling, ❌ infinite oscillation.

---

## 4. Domain Input Focus

```
IDLE ───(Focus)───► FOCUS
```
- **Allowed Motion**: Hairline border tone shift and restrained surface depth (120–160ms).
- **Prohibited Motion**:
  - ❌ Glowing outline or neon pulse
  - ❌ Expanding shadow halo
  - ❌ Animated border drawing
  - ❌ Pulsing focus ring

---

## 5. Typing Behavior

While entering a domain:
- No animated validation on every character.
- No bouncing checkmarks.
- No typing progress indicators.
- No shifting placeholder animation.
- Nebula waits for meaningful intent rather than reacting frantically to incomplete input.

---

## 6. Valid State Representation

$$\mathbf{INVALID\ /\ INCOMPLETE} \longrightarrow \mathbf{VALID}$$

- When domain candidate syntax is valid, the primary action button transitions from inactive opacity to ready state.
- **No Validity Celebration**:
  - ❌ No green checkmark animations
  - ❌ No *"Domain verified!"* banners
  - ❌ No success toast notifications
  - ❌ No confetti or burst effects
  - ❌ No glowing CTA pulse

---

## 7. Primary Action (Understand →) Ergonomics

- **Hover**: Restrained opacity shift (0.95) and hairline focus ring.
- **Pointer Down**: Subtle physical compression (`scale(0.99)` / `translateY(0.5px)`).
- **Release**: Smoothly returns to resting state (120ms).
- **Disabled**: Quietly unavailable (`opacity-40`, `cursor-not-allowed`).
- **Active Submission**: Transitions into understanding state rather than showing a spinning loader wheel.

---

## 8. Sample Domain Shortcuts

$$\text{Try an example: } \mathbf{stripe.com} \cdot \mathbf{github.com} \cdot \mathbf{cloudflare.com}$$

- **Hover**: Subtle font color and underline tone transition (120ms).
- **Selection**: Populates domain input and transfers focus.
- **Invariance**: Never triggers auto-submission.

---

## 9. Cursor & Pointer Language

| Surface Element | Canonical Cursor |
|:---|:---:|
| Primary CTA (Enabled) | `pointer` |
| Primary CTA (Disabled/Busy) | `not-allowed` |
| Domain Input Field | `text` |
| Sample Domain Chips | `pointer` |
| Header Navigation Links (`Docs`, `Workspace`) | `pointer` |
| Static Intelligence & Signature Text | `default` |

---

## 10. Spatial Stability (Zero Layout Shift)

Micro-interactions must never induce layout shifts:
- Input focus maintains exact geometry.
- Inline validation reserves calm vertical spacing.
- Sample domain selection preserves canvas structure.
- Header, subtitle, and signature never jump or jitter.

---

## 11. Nebula Pause Boundary (~520ms)

$$\mathbf{Understand\ \rightarrow} \overset{\text{Intent Acknowledged}}{\longrightarrow} \mathbf{\sim 520ms\ Nebula\ Pause} \longrightarrow \mathbf{UNDERSTANDING}$$

- Deliberately transitions the user from *"I entered a domain"* to *"Nebula is beginning to understand it"*.
- Paired with an intentional visual state shift, not artificial waiting.

---

## 12. Accessibility & Reduced Motion

When `prefers-reduced-motion: reduce` is detected:
- Decorative entrance animations are eliminated.
- State transitions execute near-instantly ($\le 50\text{ms}$).
- Physical scale/compression effects are disabled.
- The 520ms conceptual transition executes cleanly as a state change.
- High-contrast visual indicators remain fully visible.

---

## 13. Touch & Mobile Ergonomics

- Zero hover-dependent intelligence or actions.
- Minimum interactive touch target $\ge 44\text{px}$.
- Immediate visual tap feedback without desktop hover lag.
- Comfortable touch target separation across sample domain chips.

---

## 14. Calm Error Motion

$$\text{Enter a valid domain.}$$

- Appears with a calm 220ms ease-in (`opacity: 0 → 1`, `translateY: -4px → 0`).
- **Prohibited**:
  - ❌ Shaking or vibrating the canvas
  - ❌ Flashing red screen or strobe
  - ❌ Repetitive bouncing loops

---

## 15. Focus Restoration

When contextual overlays or dialogs close:
$$\mathbf{Origin} \longrightarrow \mathbf{Overlay\ Interaction} \longrightarrow \mathbf{Close} \longrightarrow \mathbf{Origin\ Restored}$$

---

## 16. Motion Budget

- Very low simultaneous motion across the idle canvas.
- At any given moment, exactly **one** meaningful interaction visually dominates.

---

## 17. Explicitly Rejected Motion Patterns (14 Items)

1. ❌ Particle animation or floating starfield dust
2. ❌ Perpetual constellation / node drift animations
3. ❌ Floating or levitating cards
4. ❌ Infinite background animation loops
5. ❌ Pulsing or breathing input borders
6. ❌ Neon glow rings or laser outlines
7. ❌ AI sparkle / shimmer effects
8. ❌ Cursor trailing particles or fluid custom cursors
9. ❌ Parallax scrolling hero effects
10. ❌ Magnetic buttons attached to cursor coordinates
11. ❌ Excessive spring physics with overshoot/bounce
12. ❌ Confetti or celebratory particle bursts on valid input
13. ❌ Shake-to-error vibration animations
14. ❌ Spinning loader wheels as primary understanding transition

---

## Acceptance Criteria & Certification Gate

| Criterion | Requirement | Status |
|:---|:---|:---:|
| **Motion Philosophy** | State communication, not decoration | ✅ Frozen |
| **Hierarchy** | Level 1 (120-180ms), Level 2 (220-360ms), Level 3 (~520ms) | ✅ Frozen |
| **Focus** | Hairline border tone, zero glowing/pulsing | ✅ Frozen |
| **Typing** | Stable, zero character-by-character validation spam | ✅ Frozen |
| **Valid State** | Natural availability without celebratory animations | ✅ Frozen |
| **Understand CTA** | Physical response (`scale 0.99`), smooth release | ✅ Frozen |
| **Sample Chips** | Quiet shortcuts, no pill expansion, no auto-submit | ✅ Frozen |
| **Cursor Matrix** | Strict semantic cursor mapping across surfaces | ✅ Frozen |
| **Spatial Stability** | Zero motion-induced layout jumps | ✅ Frozen |
| **Nebula Pause** | ~520ms calibrated transition into understanding | ✅ Frozen |
| **Reduced Motion** | Instant transitions, scale effects disabled | ✅ Frozen |
| **Touch Support** | No hover dependency, $\ge 44\text{px}$ touch targets | ✅ Frozen |
| **Error Motion** | Calm 220ms vertical fade, no screen shaking | ✅ Frozen |
| **Background** | Zero perpetual drifting or particle loops | ✅ Frozen |

---

### 🔒 GX-R007 Definition of Done

This ticket is certified complete when:

> **"Every idle-state interaction has a defined motion or no-motion rule across Level 1 (120–180ms), Level 2 (220–360ms), and Level 3 (~520ms Nebula Pause), strictly prohibiting perpetual animation, bouncy physics, and layout shift."**

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
\mathbf{GX\text{-}R007\ 🔒} & \mathbf{IDLE\ MICRO\text{-}INTERACTIONS\ \&\ MOTION\ LANGUAGE} \\
\downarrow & \\
\mathbf{GX\text{-}R008} & \text{UNDERSTANDING TRANSITION}
\end{matrix}$$

---

## Next Ticket

$$\mathbf{GX\text{-}R008} \text{ — Understanding Transition}$$

*Transition architecture from idle intent into active understanding stage, live telemetry streaming, sentence staging, and boundary contracts.*
