# FE-05: Authentication Experience

## 1. Objective
Defines user experience workflows for Local Registration, Email Verification (AUTH-001), Password Reset (AUTH-002), Stateful Sessions (AUTH-003), Google OAuth (AUTH-004), and GitHub OAuth (AUTH-005).

## 2. Universal OAuth Callback Landing Page (`/auth/callback`)
* Automatically handles browser redirects from Google (`GET /api/v1/auth/google/callback`) and GitHub (`GET /api/v1/auth/github/callback`).
* Displays a sleek dark loader (*"Authenticating with Nebula..."*).
* Calls `GET /api/v1/auth/me` with `credentials: 'include'`.
* Navigates user to `/dashboard` upon success or `/login` upon error.

## 3. Cookie-Based Browser Model
* Access and refresh tokens are stored exclusively in HTTP-Only cookies (`nebula_access_token`, `nebula_refresh_token`).
* Frontend never stores tokens in `localStorage`, `sessionStorage`, or URL query parameters.
* All state-changing requests attach the `X-CSRF-Token` header.
