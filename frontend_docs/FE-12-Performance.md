# FE-12: Frontend Performance Standards

## 1. Objective
Defines Core Web Vitals targets, code-splitting guidelines, dynamic imports, asset optimization, and rendering performance.

## 2. Core Web Vitals Targets
* **Largest Contentful Paint (LCP):** `< 1.8 seconds`
* **First Input Delay / Interaction to Next Paint (INP):** `< 100 milliseconds`
* **Cumulative Layout Shift (CLS):** `< 0.05`

## 3. Code-Splitting & Asset Optimization
* Dynamic route lazy loading (`React.lazy()` + `Suspense`).
* Vendor chunk separation in Vite rollup config.
* Image optimization with WebP format and explicit width/height parameters.
