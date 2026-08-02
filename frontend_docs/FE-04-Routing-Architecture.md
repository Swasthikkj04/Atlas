# FE-04 — Routing Architecture

**Document ID:** FE-04

**Version:** 1.0.0

**Status:** Architecture Freeze

**Owner:** Argonion Engineering

---

# 1. Purpose

This document defines Nebula's routing and navigation architecture.

It establishes how users move throughout the application, how experiences are organized, and how routes integrate with authentication and backend services.

---

# 2. Objectives

The routing architecture exists to:

- Organize user experiences
- Provide predictable navigation
- Protect authenticated resources
- Support scalability
- Maintain consistent layouts

---

# 3. Routing Principles

Routing follows these principles:

- Experience-driven
- Authentication-aware
- Backend-aligned
- Predictable
- REST-compatible
- Deep-link friendly

---

# 4. Route Groups

Nebula is divided into five primary route groups.

## Public

Accessible without authentication.

Examples:

- Landing
- Privacy
- Terms

---

## Authentication

Identity-related workflows.

Examples:

- Login
- Register
- Verify Email
- Forgot Password
- Reset Password
- OAuth Callback

---

## Guest

Anonymous infrastructure understanding.

Examples:

- Guest Understanding
- Understanding Progress
- Executive Summary
- Guest Conversion

---

## Workspace

Authenticated product experience.

Examples:

- Dashboard
- Domains
- Timeline
- Findings
- Explorer
- Search
- Settings

---

## Error

Application fallback routes.

Examples:

- 404
- 403
- 500

---

# 5. High-Level Navigation

```
Landing

├── Authentication

├── Guest Experience

└── Workspace
```

Navigation always begins from the landing experience.

---

# 6. Authentication Boundaries

Routes are classified as:

Public

↓

Guest

↓

Authenticated

Access transitions occur only through backend authentication.

The frontend never elevates privileges independently.

---

# 7. Layout Architecture

Each route group owns its layout.

Primary layouts:

- Public Layout
- Authentication Layout
- Guest Layout
- Workspace Layout
- Error Layout

Layouts define structure, not business logic.

---

# 8. Navigation Components

Navigation consists of:

- Global Header
- Sidebar
- Breadcrumb
- Search
- Context Navigation
- User Menu

Navigation components remain consistent across experiences.

---

# 9. Protected Routes

Protected routes require an active authenticated session.

Session validation occurs through the backend.

Unauthenticated access redirects users to the authentication experience.

---

# 10. Guest Routes

Guest routes are isolated from authenticated workspaces.

Guest navigation is session-based.

Guest users cannot access workspace resources.

---

# 11. Authentication Routes

Authentication routes include:

- Login
- Register
- Email Verification
- Password Recovery
- Password Reset
- OAuth Callback

Authenticated users should not revisit authentication routes unless required.

---

# 12. Workspace Navigation

Workspace navigation prioritizes user goals.

Primary navigation includes:

- Dashboard
- Domains
- Infrastructure
- Findings
- Timeline
- Search
- Settings

Secondary navigation is contextual.

---

# 13. Deep Linking

Every meaningful experience should support direct linking.

Shared links should restore the appropriate experience whenever possible.

---

# 14. Route Guards

Route protection includes:

- Authentication validation
- Session validation
- Authorization awareness
- Backend permission enforcement

Route guards must never replace backend authorization.

---

# 15. Navigation Feedback

Navigation should clearly indicate:

- Current location
- Available actions
- Loading state
- Navigation errors

Users should never lose orientation.

---

# 16. URL Philosophy

URLs should be:

- Human-readable
- Predictable
- Stable
- Resource-oriented

URLs should avoid implementation details.

---

# 17. Browser Integration

Routing should support:

- Browser Back
- Browser Forward
- Refresh
- Deep Links
- Bookmarking

Application state should recover gracefully after refresh.

---

# 18. Search Integration

Global search is available throughout authenticated experiences.

Search should remain accessible regardless of the current workspace section.

---

# 19. Error Routing

Application errors should route users to dedicated error experiences.

Errors should preserve as much user context as possible.

---

# 20. Routing Summary

Nebula's routing architecture organizes the application around user experiences rather than technical implementation.

Navigation remains predictable, authentication-aware, and tightly aligned with the backend platform, ensuring users move through the application with clarity and confidence.