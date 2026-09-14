# Evidence Report: Environment-Driven Email Verification Links (PROD-AUTH-001)

**Execution Date**: 2026-09-12  
**Task Ticket**: PROD-AUTH-001 — Replace Localhost Email Verification Links  
**Target Domain**: `argonion.com` / `nebula.argonion.com`  
**Author**: Antigravity AI / DeepMind Team  
**Status**: Prepared for production provisioning, pending remaining owner decisions and external infrastructure setup.  

---

## 1. Summary of Execution

This task inspected, audited, and corrected all email link generation, authentication redirects, and verification routes across the Nebula platform to guarantee that production transactional emails and OAuth callback handlers never contain `localhost` or `127.0.0.1` URLs, while strictly preserving full local development capabilities.

---

## 2. URL Generation & Environment Mapping

| Surface | Environment Variable | Local Development Value | Production Value |
|---|---|---|---|
| **Nebula Workspace / Auth UI** | `FRONTEND_URL` / `APP_URL` | `http://localhost:5173` | `https://nebula.argonion.com` |
| **Backend API** | `API_URL` | `http://localhost:3000/api/v1` | `https://api.argonion.com/api/v1` |
| **Email Verification Link** | Calculated via `FRONTEND_URL` | `http://localhost:5173/verify-email?token=<token>` | `https://nebula.argonion.com/verify-email?token=<token>` |
| **Password Reset Link** | Calculated via `FRONTEND_URL` | `http://localhost:5173/reset-password?token=<token>` | `https://nebula.argonion.com/reset-password?token=<token>` |
| **Account Reactivation Link** | Calculated via `FRONTEND_URL` | `http://localhost:5173/reactivate?token=<token>` | `https://nebula.argonion.com/reactivate?token=<token>` |
| **Google OAuth Callback** | `GOOGLE_CALLBACK_URL` | `http://localhost:3000/api/v1/auth/google/callback` | `https://api.argonion.com/api/v1/auth/google/callback` |
| **GitHub OAuth Callback** | `GITHUB_CALLBACK_URL` | `http://localhost:3000/api/v1/auth/github/callback` | `https://api.argonion.com/api/v1/auth/github/callback` |

---

## 3. Route & Contract Verification

### Current Frontend Verification Route
* **Canonical URI**: `/verify-email?token=<token>`
* **Legacy / Auth Alias URI**: `/auth/verify-email?token=<token>`
* **Route Resolver**: Both URIs map deterministically to `VERIFY_EMAIL` in [`apps/web/src/routes/routes.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/routes/routes.ts).
* **UI Component**: [`apps/web/src/features/auth/pages/VerifyEmailPage.tsx`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/auth/pages/VerifyEmailPage.tsx).

### Current Backend Verification Endpoint
* **Endpoint**: `POST /api/v1/auth/verify-email`
* **Request DTO**: `{ token: string }` ([`VerifyEmailDto`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/dto/verify-email.dto.ts))
* **Response DTO**: [`VerifyEmailResponseDto`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/dto/verify-email-response.dto.ts) returning `{ message, status, alreadyVerified, accessToken, refreshToken, user }`
* **Controller**: [`apps/api/src/modules/auth/auth.controller.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/auth.controller.ts) (line 529).
* **Service**: [`apps/api/src/modules/auth/services/auth.service.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/services/auth.service.ts) (line 277).

---

## 4. Frontend Security & Privacy Safeguards

The email verification flow on the frontend ([`VerifyEmailPage.tsx`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/auth/pages/VerifyEmailPage.tsx)) incorporates the following defensive engineering controls:

1. **Safe Token Ingestion**: Reads `?token=` safely via standard `URLSearchParams` from `window.location.search`.
2. **Backend Contract Alignment**: Dispatches verification requests to `POST /api/v1/auth/verify-email` using the typed `authService.verifyEmail(token)` client.
3. **Discrete State Management**:
   - `verifying`: Non-blocking loading spinner with security status indicator.
   - `success`: Immediate session establishment, guest conversion claim (if applicable), and automated smooth transition to `/workspace`.
   - `already_verified`: Clear notice informing the user their workspace is active with a 1-click Sign In CTA.
   - `expired`: Explicit expiration notification with a 1-click resend link and masked email preview.
   - `invalid`: Generic safe message preventing enumeration or probing.
4. **Token Privacy**: Raw tokens are strictly excluded from `console.log`, browser history push states, error telemetry, and analytics beacons.
5. **Stack Trace Isolation**: Backend exceptions and Prisma database errors are sanitized by NestJS global filters; raw stack traces are never exposed in the UI.

---

## 5. Files Changed & Detailed Modifications

### 1. [`apps/api/src/infrastructure/email/email.service.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/infrastructure/email/email.service.ts)
* Made `getAppUrl()` environment-driven checking `FRONTEND_URL` and `APP_URL`.
* Added automatic trailing slash trimming (`replace(/\/+$/, '')`).
* Added production-safe fallback (`NODE_ENV === 'production' ? 'https://nebula.argonion.com' : 'http://localhost:5173'`).
* Updated `sendVerificationEmail` to generate `${baseUrl}/verify-email?token=${rawVerificationToken}`.
* Updated `sendPasswordResetEmail` to generate `${baseUrl}/reset-password?token=${rawResetToken}`.
* Updated `sendAccountReactivationEmail` to generate `${baseUrl}/reactivate?token=${rawReactivationToken}`.

### 2. [`apps/api/src/config/auth.config.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/config/auth.config.ts)
* Updated `frontendUrl` and `appUrl` configuration fallbacks to `https://nebula.argonion.com` when running in production mode.

### 3. [`apps/api/src/modules/auth/auth.controller.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/auth.controller.ts)
* Updated Google and GitHub OAuth callback success redirects to use `isProduction ? 'https://nebula.argonion.com' : 'http://localhost:5173'`.

### 4. [`apps/api/src/modules/auth/filters/oauth-callback-exception.filter.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/filters/oauth-callback-exception.filter.ts)
* Updated OAuth failure redirect fallback to use `isProduction ? 'https://nebula.argonion.com' : 'http://localhost:5173'`.

### 5. [`apps/api/src/modules/auth/strategies/google.strategy.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/strategies/google.strategy.ts)
* Updated Google strategy callback URL fallback to `isProduction ? 'https://api.argonion.com/api/v1/auth/google/callback' : 'http://localhost:3000/api/v1/auth/google/callback'`.

### 6. [`apps/api/src/modules/auth/strategies/github.strategy.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/strategies/github.strategy.ts)
* Updated GitHub strategy callback URL fallback to `isProduction ? 'https://api.argonion.com/api/v1/auth/github/callback' : 'http://localhost:3000/api/v1/auth/github/callback'`.

### 7. [`apps/api/src/infrastructure/email/email.service.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/infrastructure/email/email.service.spec.ts)
* Rewrote and expanded the unit test suite to 11 rigorous test cases verifying:
  - Local development URL generation (`http://localhost:5173/verify-email?token=...`)
  - Production URL generation (`https://nebula.argonion.com/verify-email?token=...`)
  - Production fallback behavior when unset
  - Trailing slash normalization
  - Exact token entropy preservation
  - Complete absence of `localhost` or `127.0.0.1` in production email payloads (HTML and text)
  - Password reset and account reactivation URL generation in dev and prod
  - Password reset confirmation security notice dispatch
  - Resilient error handling for email delivery failures.

---

## 6. Verification & Test Execution Results

| Test Category | Suite / Command | Passed / Total | Status |
|---|---|---|---|
| **Email Service Unit Suite** | `jest apps/api/src/infrastructure/email/email.service.spec.ts` | **11 / 11** | ✅ **PASS** |
| **Auth Domain Suite** | `jest --filter api test auth` | **347 / 347** (36 suites) | ✅ **PASS** |
| **Backend Monorepo Suite** | `pnpm --filter api test` | **2,263 / 2,263** (270 suites) | ✅ **PASS** |
| **Frontend Monorepo Suite** | `pnpm --filter web test` | **2,015 / 2,015** (1,126 suites) | ✅ **PASS** |
| **TypeScript Compilation** | `pnpm typecheck` (`tsc -b` + `tsc --noEmit`) | **2 / 2 packages** | ✅ **PASS** |
| **ESLint Static Analysis** | `pnpm lint` | **0 errors** (9 benign hook warnings) | ✅ **PASS** |

---

## 7. Confirmation of Zero Localhost in Production Email Output

A dedicated automated test asserting against production email generation verifies that:
```typescript
expect(payload.html).not.toContain('localhost');
expect(payload.html).not.toContain('127.0.0.1');
expect(payload.text).not.toContain('localhost');
expect(payload.text).not.toContain('127.0.0.1');
```
All HTML and plaintext template strings, URLs, button hyperlinks, fallback links, and footer disclaimers reference `https://nebula.argonion.com` and `Argonion Inc.` in production with zero localhost or development host leakage.
