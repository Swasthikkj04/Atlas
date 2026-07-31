# FE-00: Frontend Architecture

## 1. Objective & Scope
This document outlines the high-level system architecture, core design principles, structural boundaries, and technical stack for the Nebula frontend application.

## 2. Technology Stack & Framework Choices
* **Core Library:** React 19 / TypeScript 5.7
* **Build System & Dev Server:** Vite 6
* **Styling Paradigm:** Modern Vanilla CSS + CSS Modules / Token variables (Zero runtime CSS-in-JS overhead)
* **Routing:** React Router v7
* **Server State Synchronization:** TanStack Query (React Query v5)
* **Icons & Visual Assets:** Lucide React / Custom SVG vectors

## 3. High-Level System Architecture
```
                                 Browser
                                    │
                                    ▼
                          React Single Page App
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
      App State & Router     Server State Query    Design System Tokens
       (React Router v7)     (TanStack Query)      (CSS Custom Properties)
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    │
                                    ▼
                         HTTP-Only Cookie Client
                        (Fetch API with Credentials)
                                    │
                                    ▼
                         Nebula API (/api/v1)
```

## 4. Architectural Guiding Principles
1. **Server-Managed Cookie Security:** Tokens are never held in `localStorage` or JavaScript state.
2. **Zero-Delay Perceived Load:** Use pessimistic UI updates, skeleton states, and optimistic mutation feedback.
3. **Modular Component Hierarchy:** Decouple presentational design tokens from stateful feature orchestrators.
