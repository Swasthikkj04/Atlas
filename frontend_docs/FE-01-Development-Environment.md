# FE-01: Development Environment & Tooling

## 1. Objective
Defines local development setup, package management commands, environment configuration, and code quality tooling for the frontend workspace (`apps/web`).

## 2. Environment Configuration & Variables
The frontend environment is controlled via `.env` files matching the backend specifications:

```env
# Application URLs
VITE_APP_NAME=Nebula
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api/v1

# OAuth Redirect Destinations
VITE_OAUTH_CALLBACK_PATH=/auth/callback
```

## 3. Development Commands & Scripts
* `npm run dev` — Starts Vite local development server with hot module replacement (`HMR`).
* `npm run build` — Runs TypeScript type-checks (`tsc -b`) and bundles production artifacts with Vite.
* `npm run preview` — Locally previews production build bundle.
* `npm run lint` — Executes ESLint checks across JSX/TSX files.

## 4. Code Quality & Format Specifications
* **TypeScript Config:** Strict mode enabled (`strict: true`, `noImplicitAny: true`).
* **Formatting:** Prettier with single quotes, 2-space indentation, trailing commas.
