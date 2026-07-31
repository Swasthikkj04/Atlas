# FE-04: Routing Architecture & Navigation

## 1. Objective
Specifies client-side route maps, layout hierarchies, navigation guards, lazy-loading strategies, and view transitions.

## 2. Route Sitemap & Access Controls

| Path | Component | Guard / Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Domain discovery & guest understanding trigger |
| `/auth/callback` | `AuthCallbackPage` | Public | Universal OAuth & session landing page |
| `/login` | `LoginPage` | Public (Unauthenticated) | Local password login & Google/GitHub OAuth entry |
| `/register` | `RegisterPage` | Public (Unauthenticated) | Account registration form |
| `/verify-email` | `VerifyEmailPage` | Public | Email verification token handler |
| `/forgot-password` | `ForgotPasswordPage` | Public | Password recovery request form |
| `/reset-password` | `ResetPasswordPage` | Public | Password reset execution form |
| `/dashboard` | `DashboardPage` | Protected (`JwtAuthGuard`) | User workspace, domain list, & infrastructure brief |
| `/guest/understanding` | `GuestUnderstandingPage` | Public (Guest Session) | Anonymous understanding job status & results |

## 3. Navigation Guards & Route Boundaries
* **RequireAuth:** Verifies user profile via `GET /api/v1/auth/me`. Redirects to `/login` if unauthenticated.
* **RequireGuest:** Redirects authenticated users from `/login` or `/register` to `/dashboard`.
