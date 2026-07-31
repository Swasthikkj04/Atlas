# FE-08: Backend API Integration Architecture

## 1. Objective
Defines HTTP client configuration, cookie transport (`credentials: 'include'`), double-submit CSRF token management (`X-CSRF-Token`), React Query caching policies, and error handling.

## 2. HTTP Client Configuration (`src/services/api/client.ts`)
* Uses native `fetch` API wrapped in custom client with `credentials: 'include'`.
* Automatically attaches `X-CSRF-Token` header for state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
* Automatically fetches fresh CSRF token via `GET /api/v1/auth/csrf` if token is missing.

## 3. Server State Query Configuration (TanStack Query)
* **Default Stale Time:** 5 minutes for domain lists and static profiles.
* **Refetch on Window Focus:** Disabled for guest jobs, enabled for active monitoring dashboards.
* **Automatic Refresh Rotation:** Intercepts `401 Unauthorized` responses and triggers `POST /api/v1/auth/refresh` automatically.
