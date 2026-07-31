# FE-10: Responsive Architecture & Breakpoints

## 1. Objective
Defines responsive layout breakpoints, mobile UX behaviors, container queries, and fluid typography.

## 2. Breakpoint Token Grid

```css
/* Media Query Breakpoints */
--breakpoint-sm: 640px;   /* Mobile Devices (Portrait/Landscape) */
--breakpoint-md: 768px;   /* Tablets & Small Laptops */
--breakpoint-lg: 1024px;  /* Desktop Monitors */
--breakpoint-xl: 1280px;  /* Large Desktop Displays */
--breakpoint-2xl: 1536px; /* Ultra-Wide Workstations */
```

## 3. Mobile Navigation & Touch Principles
* Collapsible sidebar drawer on screens `< 1024px`.
* Touch-target minimum dimensions of `44x44px` for interactive elements.
* Fluid typography using `clamp()` formulas for hero headers.
