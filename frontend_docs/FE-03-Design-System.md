# FE-03: Design System Tokens & Component Library

## 1. Objective
Defines standardized design tokens, CSS custom properties, typography scales, layout grids, and reusable UI components.

## 2. Global CSS Custom Properties (`index.css`)

```css
:root {
  /* Surface Colors */
  --bg-dark: #090d16;
  --bg-surface: #111827;
  --bg-surface-elevated: #1e293b;

  /* Accent Colors */
  --accent-primary: #38bdf8;
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #f43f5e;

  /* Text Colors */
  --text-main: #f8fafc;
  --text-muted: #94a3b8;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 3. Core Component Library
* **Buttons:** Primary Glowing Button, Secondary Glass Button, Outline Action Button.
* **Cards & Containers:** Glass Card, Stat Metric Card, Severity Finding Card.
* **Badges & Status:** Severity Pill (CRITICAL, HIGH, MEDIUM, LOW, INFO), Verification Status Badge.
* **Feedback:** Skeleton Loading Shimmers, Animated Spinners, Toast Notifications.
