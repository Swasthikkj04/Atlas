# OAuth 2.0 Production Integration Plan

**Product**: Nebula Intelligence Platform (under Argonion)  
**Target Domain**: `argonion.com` (API Host: `api.argonion.com`, Workspace Host: `nebula.argonion.com`, Guest Host: `app.argonion.com`)  
**Application Owner**: Swasthik K J (`swasthik@argonion.com`) per [OD-07](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-07-oauth-production-ownership)  
**Document Status**: **READY FOR REGISTRATION (GATES CLOSED VIA PROD-001)**  
**Supported Providers**: Google Identity Services & GitHub OAuth  
**Last Updated**: 2026-09-12  

---

## 1. Canonical Production Callback Endpoints

All OAuth 2.0 provider exchanges in production must use the canonical API domain (`https://api.argonion.com`):

| Provider | Production Authorization Callback URL | Target Strategy / Controller |
| :--- | :--- | :--- |
| **Google OAuth 2.0** | `https://api.argonion.com/api/v1/auth/google/callback` | [`GoogleStrategy`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/strategies/google.strategy.ts) → [`AuthController.googleAuthCallback`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/auth.controller.ts) |
| **GitHub OAuth 2.0** | `https://api.argonion.com/api/v1/auth/github/callback` | [`GitHubStrategy`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/strategies/github.strategy.ts) → [`AuthController.githubAuthCallback`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/auth.controller.ts) |

---

## 2. Google OAuth 2.0 Setup Plan (Google Cloud Console)

### 1. OAuth Consent Screen Configuration
* **User Type**: External
* **App Name**: `Nebula`
* **User Support Email**: `support@argonion.com` (forwarded via Cloudflare per [OD-02](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-02-inbound-email-routing))
* **Application Home Page**: `https://argonion.com`
* **Application Privacy Policy**: `https://argonion.com/privacy`
* **Application Terms of Service**: `https://argonion.com/terms`
* **Authorized Domains**:
  - `argonion.com`
* **Developer Contact Information**: `security@argonion.com`
* **OAuth Scopes**:
  - `openid`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`

### 2. OAuth 2.0 Web Client Credentials
* **Application Type**: Web Application
* **Name**: `Nebula Production Web Client`
* **Authorized JavaScript Origins**:
  - `https://argonion.com`
  - `https://nebula.argonion.com`
  - `https://app.argonion.com`
  - `https://api.argonion.com`
* **Authorized Redirect URIs**:
  - `https://api.argonion.com/api/v1/auth/google/callback`

---

## 3. GitHub OAuth 2.0 Setup Plan (GitHub Developer Settings)

### 1. Register New OAuth Application
* **Application Name**: `Nebula`
* **Homepage URL**: `https://argonion.com`
* **Application Description**: `Nebula Infrastructure Intelligence Platform`
* **Authorization Callback URL**:
  - `https://api.argonion.com/api/v1/auth/github/callback`
* **Enable Device Flow**: Disabled

---

## 4. Environment Configuration for `nebula-prod-api`

When provisioning the `nebula-prod-api` Cloud Run service, the following environment variables and secret references must be bound:

```ini
# Canonical URLs
FRONTEND_URL=https://nebula.argonion.com
APP_URL=https://nebula.argonion.com
API_URL=https://api.argonion.com/api/v1

# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CALLBACK_URL=https://api.argonion.com/api/v1/auth/google/callback
GOOGLE_CLIENT_SECRET=projects/argonion-nebula-prod/secrets/nebula-google-client-secret/versions/latest

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CALLBACK_URL=https://api.argonion.com/api/v1/auth/github/callback
GITHUB_CLIENT_SECRET=projects/argonion-nebula-prod/secrets/nebula-github-client-secret/versions/latest
```

---

## 5. Security Invariants & Identity Resolution

1. **Deterministic Identity Resolution (Case A–D)**:
   - Evaluated exclusively by [`OAuthIdentityResolver`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/resolvers/oauth-identity.resolver.ts).
   - **Case A**: Existing OAuth link → Issue session.
   - **Case B**: Existing verified user with matching email → Auto-link OAuth provider to existing user.
   - **Case C**: Existing unverified user with matching email → Auto-verify email and link OAuth provider.
   - **Case D**: Brand new user → Create user with `ACTIVE` status and dispatch welcome email ([`AUTH-EMAIL-001`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/auth-welcome-email.spec.ts)).
2. **State & Callback Validation**:
   - OAuth redirect flow requires cryptographic state validation to prevent Cross-Site Request Forgery (CSRF).
   - Errors during OAuth callbacks are trapped by [`OAuthCallbackExceptionFilter`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/filters/oauth-callback-exception.filter.ts) and redirect users safely to `https://nebula.argonion.com/login?error=oauth_failed`.
3. **Session Cookie Boundary**:
   - Refresh token cookies issued post-OAuth callback must carry `HttpOnly; Secure; SameSite=Lax; Domain=.argonion.com; Path=/`.
