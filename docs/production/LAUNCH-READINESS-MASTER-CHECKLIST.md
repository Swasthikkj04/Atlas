# Master Launch Readiness Checklist

**Product**: Nebula Intelligence Platform (under Argonion)  
**Target Domain**: `argonion.com` (Approved Topology: `argonion.com` [Landing], `app.argonion.com` [GX], `nebula.argonion.com` [WX], `api.argonion.com` [API])  
**Status**: Repository preparation is complete. Production deployment remains blocked on GCP provisioning, DNS configuration, OAuth registration, and live verification.  
**Document Version**: 2.3.0  
**Status Rule**: All items must strictly use one of the approved status labels: `Verified`, `Prepared locally`, `Pending`, `Blocked until GCP`, `Blocked until DNS`, `Blocked until OAuth configuration`, `Deferred by decision`, or `Not applicable — reason required`.  
**Related Decision Records**:
* [ADR-PROD-001: Domain Routing & Canonical Ingress](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md) (*Status: APPROVED BY PRODUCT OWNER*)
* [ADR-PROD-002: Cloud SQL PostgreSQL Sizing & Cost Gate](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md) (*Status: PENDING COST VERIFICATION*)
* [ADR-PROD-003: Inbound Email Routing & Outbound Sending](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md) (*Status: APPROVED BY PRODUCT OWNER*)
* [ADR-PROD-004: Deployment Region Selection](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md) (*Status: PROPOSED / PENDING VERIFICATION*)
* [ADR-PROD-005: Authoritative Edge Strategy](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-005-EDGE-STRATEGY.md) (*Status: APPROVED / RECOMMENDED*)
* [ADR-PROD-006: Production Public Support & Security Contact Channels](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md) (*Status: APPROVED / RECOMMENDED*)
* [Owner Decision Register](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md) (*Status: ACTIVE REGISTER — OD-01, OD-05 APPROVED*)

---

## 1. Email Security & Deliverability

| ID | Requirement | Priority | Status | Blocking Status | Evidence | Notes | Dependency |
|---|---|---|---|---|---|---|---|
| **EML-001** | **SPF Record**: TXT record defining authorized sending hosts (Cloudflare & Resend) | P0 | Blocked until DNS | Release Blocker (P0) | Resend & Cloudflare Email Routing specifications per ADR-PROD-003 | Add `v=spf1 include:_spf.mx.cloudflare.net include:resend.com ~all` to Cloudflare DNS. | Cloudflare DNS & Resend |
| **EML-002** | **DKIM Record**: Cryptographic signing selector records (2048-bit) | P0 | Blocked until DNS | Release Blocker (P0) | Resend DNS CNAME selector requirements | Resend provides three CNAME records for DKIM public key verification. | Resend Account & Cloudflare DNS |
| **EML-003** | **DMARC Policy**: `_dmarc.argonion.com` TXT record for email alignment & reporting | P0 | Blocked until DNS | Release Blocker (P0) | DMARC policy specification: `v=DMARC1; p=none; rua=mailto:...` | Start with `p=none` for monitoring before transitioning to `p=quarantine` or `p=reject`. | Cloudflare DNS |
| **EML-004** | **MX Records**: Inbound mail exchange routing via Cloudflare Email Routing | P0 | Blocked until DNS | Release Blocker (P0) | Cloudflare Email Routing MX specifications per ADR-PROD-003 | Add Cloudflare MX records (`route1.mx.cloudflare.net`, etc.) to forward to owner inbox. | Cloudflare Email Routing |
| **EML-005** | **MTA-STS & TLS-RPT**: Enforce inbound SMTP TLS encryption and failure reporting | P2 | Pending | Non-Blocking | `_mta-sts.argonion.com` and `_smtp._tls.argonion.com` specifications | Prevents downgrade attacks on inbound SMTP connections. | Cloudflare DNS |
| **EML-006** | **BIMI Record & SVG Logo**: Verified brand indicator for inbox avatar display | P2 | Deferred by decision | Non-Blocking | BIMI standard RFC specification | Requires registered trademark and Verified Mark Certificate (VMC); deferred post-launch. | Trademark & VMC Certificate |
| **EML-007** | **Google Postmaster Tools & SNDS Registration**: Sender reputation monitoring | P1 | Pending | Pre-Launch Blocker | Postmaster verification DNS TXT token | Required to monitor delivery reputation and spam rates once email traffic starts. | Google Postmaster Tools & Cloudflare DNS |
| **EML-008** | **Transactional Email API Secret (`RESEND_API_KEY`)**: Secret Manager injection | P0 | Prepared locally | Release Blocker (P0) | Referenced in `infra/gcp/terraform/secret_manager.tf` & `cloud_run.tf` | Key created in Resend dashboard must be added to GCP Secret Manager. | Resend Account & GCP Secret Manager |

---

## 2. DNS & Registrar Hardening

| ID | Requirement | Priority | Status | Blocking Status | Evidence | Notes | Dependency |
|---|---|---|---|---|---|---|---|
| **DNS-001** | **Domain Ownership & Registrar Account**: `argonion.com` registered | P0 | Verified | Non-Blocking | GoDaddy registration confirmed active | Domain registered through GoDaddy. | GoDaddy Account |
| **DNS-002** | **Cloudflare Nameserver Delegation**: Authoritative DNS delegated to Cloudflare | P0 | Verified | Non-Blocking | Cloudflare nameservers configured at GoDaddy | Nameserver delegation active. | GoDaddy & Cloudflare |
| **DNS-003** | **DNSSEC (Domain Name System Security Extensions)**: Cryptographic signature chain | P0 | Blocked until DNS | Release Blocker (P0) | DS record specifications in GoDaddy / Cloudflare | Enable DNSSEC in Cloudflare and copy DS record (Key Tag, Algorithm, Digest) to GoDaddy. | GoDaddy & Cloudflare DNS |
| **DNS-004** | **Registrar Transfer Lock**: Prevent unauthorized domain transfers | P0 | Verified | Non-Blocking | GoDaddy Domain Lock setting enabled | Verified active at registrar level. | GoDaddy |
| **DNS-005** | **WHOIS Privacy Protection**: Mask personal contact details from public WHOIS lookups | P1 | Verified | Non-Blocking | GoDaddy Basic Privacy enabled | Protects administrator contact details from automated harvesters. | GoDaddy |
| **DNS-006** | **Registrar & DNS 2FA Security**: Multi-factor authentication on registrar & DNS accounts | P0 | Prepared locally | Release Blocker (P0) | Hardware key / TOTP 2FA policy requirement | Owner must enforce hardware security keys or authenticator TOTP on GoDaddy & Cloudflare. | Owner Security Action |
| **DNS-007** | **CAA (Certificate Authority Authorization) Records**: Restrict authorized SSL issuers | P1 | Blocked until DNS | Pre-Launch Blocker | CAA policy: `issue "letsencrypt.org"`, `issue "digicert.com"`, `issue "googletag.com"` | Prevents rogue certificates from being issued for `argonion.com`. | Cloudflare DNS |
| **DNS-008** | **Auto-Renewal & Secondary Billing**: Guard against domain expiration | P0 | Prepared locally | Release Blocker (P0) | GoDaddy auto-renew status check | Ensure auto-renewal is turned on and secondary payment card is registered. | GoDaddy Account |
| **DNS-009** | **DNS Record Version Control & Backup**: Export zone file | P2 | Prepared locally | Non-Blocking | Cloudflare BIND zone file export procedure | Keep an offline backup of all DNS records in case of DNS provider recovery. | Cloudflare Console |

---

## 3. Web Security & HTTP Headers

| ID | Requirement | Priority | Status | Blocking Status | Evidence | Notes | Dependency |
|---|---|---|---|---|---|---|---|
| **WEB-001** | **Automated HTTPS & TLS 1.3**: Complete end-to-end encryption | P0 | Blocked until GCP | Release Blocker (P0) | Cloud Run managed SSL + Cloudflare Full (Strict) SSL mode | End-to-end encryption from browser to Cloudflare to Cloud Run backend. | Cloudflare & GCP Cloud Run |
| **WEB-002** | **HSTS (HTTP Strict Transport Security)**: Force HTTPS across all subdomains | P0 | Prepared locally | Release Blocker (P0) | Injected in `docker/nginx.conf` (`max-age=31536000; includeSubDomains; preload`) | Cloudflare edge also enforces HSTS header across all subdomains. | Cloudflare & Nginx |
| **WEB-003** | **Content Security Policy (CSP)**: Mitigate XSS and unauthorized script injection | P0 | Prepared locally | Release Blocker (P0) | Configured in `docker/nginx.conf` line 14 | Restricts `default-src`, `script-src`, `style-src`, `connect-src`, `img-src`. | Web Container |
| **WEB-004** | **Frame & MIME Protection**: `X-Frame-Options`, `X-Content-Type-Options` | P0 | Prepared locally | Release Blocker (P0) | Configured in `docker/nginx.conf` and `apps/api/src/common/middleware` | Injects `X-Frame-Options: SAMEORIGIN` and `X-Content-Type-Options: nosniff`. | Web Container & API |
| **WEB-005** | **Referrer & Permissions Policies**: Protect user privacy and disable unused hardware APIs | P1 | Prepared locally | Pre-Launch Blocker | Configured in `docker/nginx.conf` lines 12–13 | Injects `Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy`. | Web Container & API |
| **WEB-006** | **API Rate Limiting & Abuse Prevention**: Protect against brute force and scraping | P0 | Verified | Non-Blocking | Implemented in `RateLimiterService` and tested in test suite | Tiered window-based rate limiting on authentication, search, and sensitive endpoints. | API Container |
| **WEB-007** | **Strict CORS Policy**: Whitelisted origin enforcement | P0 | Verified | Non-Blocking | Implemented in `apps/api/src/main.ts` and audited in CORS test suite | Production mode restricts origins to `argonion.com`, `app.argonion.com`, `nebula.argonion.com`. | API Container |
| **WEB-008** | **Cloudflare WAF & Bot Management**: Layer 7 DDoS and bot protection | P1 | Blocked until DNS | Pre-Launch Blocker | Cloudflare Security Rules & Managed WAF ruleset | Enforce Cloudflare Managed Ruleset and challenge suspicious automated scrapers. | Cloudflare Plan & DNS |
| **WEB-009** | **CSRF & Cookie Protection**: Secure, HttpOnly, SameSite cookie attributes | P0 | Verified | Non-Blocking | Implemented in `apps/api/src/modules/auth/` and `csrf.guard.ts` | Refresh tokens and session tokens stored with `httpOnly: true`, `secure: true`, `sameSite: 'lax'/'strict'`. | API Container |
| **WEB-010** | **WebAuthn FIDO2 Admin Security**: Phishing-resistant hardware MFA for administrators | P0 | Verified | Non-Blocking | Complete implementation in `apps/api/src/modules/admin-webauthn/` | Dedicated WebAuthn enrollment and biometric authentication for administrative actions. | API Container |

---

## 4. Standards, Discovery & SEO

| ID | Requirement | Priority | Status | Blocking Status | Evidence | Notes | Dependency |
|---|---|---|---|---|---|---|---|
| **SEO-001** | **Vulnerability Disclosure Policy (`security.txt`)**: RFC 9116 compliance | P1 | Prepared locally | Pre-Launch Blocker | Created at `apps/web/public/.well-known/security.txt` | Configured with `mailto:security@argonion.com` per ADR-PROD-006. | Destination Inbox Verification |
| **SEO-002** | **Robots Directives (`robots.txt`)**: Search crawler boundary definition | P1 | Verified | Non-Blocking | Existing in `apps/web/public/robots.txt` | Allows public docs/legal routes; disallows authenticated `/workspace`, `/admin`, `/api/`. | Web Container |
| **SEO-003** | **Search Sitemap (`sitemap.xml`)**: Canonical search indexing map | P1 | Verified | Non-Blocking | Existing in `apps/web/public/sitemap.xml` | Maps canonical URLs for `https://argonion.com/` and documentation. | Web Container |
| **SEO-004** | **Google Search Console Verification**: Domain ownership verification | P1 | Blocked until DNS | Pre-Launch Blocker | Google Search Console DNS TXT verification token | Add Google verification TXT record to Cloudflare DNS for crawl monitoring. | Cloudflare DNS & Search Console |
| **SEO-005** | **Bing Webmaster Tools Verification**: Indexing for Bing / DuckDuckGo / Yahoo | P2 | Pending | Non-Blocking | Bing Webmaster DNS / meta tag verification | Can import directly from Google Search Console once verified. | Google Search Console |
| **SEO-006** | **OpenGraph & Twitter Card Metadata**: Social media preview cards | P2 | Prepared locally | Non-Blocking | Configured in `apps/web/index.html` and `useSeoMetadata.ts` | Dynamic social sharing cards, titles, descriptions, and preview images. | Web Frontend |
| **SEO-007** | **Canonical Hostname Redirects**: Enforce non-www to www (or apex) and HTTP to HTTPS | P1 | Blocked until DNS | Pre-Launch Blocker | Cloudflare Page Rules / Redirect Rules | Redirect `http://argonion.com` → `https://argonion.com` and `www.argonion.com` → `argonion.com` per ADR-PROD-001. | Cloudflare Rules |

---

## 5. Monitoring & Reliability

| ID | Requirement | Priority | Status | Blocking Status | Evidence | Notes | Dependency |
|---|---|---|---|---|---|---|---|
| **MON-001** | **API Liveness & Readiness Probes**: Automated health checks | P0 | Verified | Non-Blocking | Implemented in `HealthController` (`/api/v1/health/live`, `/ready`) | Probes verify container responsiveness and PostgreSQL connectivity before routing traffic. | API Container |
| **MON-002** | **Cloud Run Auto-Healing Probes**: Native GCP container health monitoring | P0 | Prepared locally | Release Blocker (P0) | Defined in `infra/gcp/terraform/cloud_run.tf` lines 104–122 | Cloud Run continuously polls `/api/v1/health/live` and restarts dead containers. | GCP Cloud Run |
| **MON-003** | **External Uptime Monitoring**: External synthetic pinging and alert notifications | P0 | Pending | Release Blocker (P0) | Better Stack / UptimeRobot / Google Cloud Uptime check | Monitor `argonion.com/health`, `app.argonion.com/health`, `nebula.argonion.com/health`, and `api.argonion.com/api/v1/health/live`. | Uptime Service Setup |
| **MON-004** | **SSL Expiration Monitoring**: Proactive alerting on certificate renewal failures | P1 | Pending | Pre-Launch Blocker | UptimeRobot / Cloudflare automated SSL alerts | Alert at 30 days and 7 days prior to certificate expiration. | Monitoring Service |
| **MON-005** | **Structured Logging & Correlation IDs**: End-to-end request tracing | P0 | Verified | Non-Blocking | Implemented in `StructuredLoggerService` and `CorrelationIdMiddleware` | JSON-formatted logs with `X-Correlation-ID` and `X-Request-ID` sent to Cloud Logging. | API & Worker |
| **MON-006** | **Database Backups & Point-in-Time Recovery**: Cloud SQL automated backups | P0 | Prepared locally | Release Blocker (P0) | Configured in `infra/gcp/terraform/cloudsql.tf` per ADR-PROD-002 | Daily backups at 02:00 UTC, 30-day retention, 7-day transaction log PITR. | GCP Cloud SQL |
| **MON-007** | **Automated Rollback on Deployment Failure**: Safe traffic reversion | P0 | Prepared locally | Release Blocker (P0) | Implemented in `.github/workflows/deploy.yml` (`rollback-on-failure` job) | Automatically shifts traffic back to previous healthy revision if smoke verification fails. | GitHub Actions |

---

## 6. Legal & Compliance

| ID | Requirement | Priority | Status | Blocking Status | Evidence | Notes | Dependency |
|---|---|---|---|---|---|---|---|
| **LEG-001** | **Privacy Policy**: Public disclosure of data collection, processing, and storage | P0 | Verified | Non-Blocking | Static page in React SPA (`/privacy`) and listed in `sitemap.xml` | Explains telemetry collection, user data retention, and contact route (`support@argonion.com`). | Web Frontend |
| **LEG-002** | **Terms of Service**: User contract governing platform usage and acceptable use | P0 | Verified | Non-Blocking | Static page in React SPA (`/terms`) and listed in `sitemap.xml` | Outlines platform scope, security boundaries, and contact route (`support@argonion.com`). | Web Frontend |
| **LEG-003** | **Cookie & Tracking Consent (If Applicable)**: GDPR/ePrivacy compliance | P1 | Not applicable — reason required | Non-Blocking | Application relies strictly on essential session cookies | Nebula V1 does not use third-party tracking or advertising cookies. Essential cookies do not require consent banners under GDPR/ePrivacy Directive. | None |
| **LEG-004** | **Supply Chain & Open Source License Compliance**: Verified zero AGPL/GPL violations | P0 | Verified | Non-Blocking | Checked in monorepo security suite (`security/license-policy.json`) | All runtime and dev dependencies comply with MIT/Apache-2.0/BSD license policy. | CI Quality Gate |
| **LEG-005** | **Vulnerability Disclosure Policy Page**: Explains bug bounty and response SLA | P1 | Prepared locally | Pre-Launch Blocker | Linked from `apps/web/public/.well-known/security.txt` (`/security`) | Publishes contact route (`security@argonion.com`) and responsible disclosure guidelines. | Web Frontend |

---

## 7. Master Status Summary Matrix

| Category | Total Items | Verified | Prepared Locally | Pending / Blocked | Deferred / N/A |
|---|---|---|---|---|---|
| **1. Email Security & Deliverability** | 8 | 0 | 1 | 6 | 1 |
| **2. DNS & Registrar Hardening** | 9 | 4 | 2 | 3 | 0 |
| **3. Web Security & HTTP Headers** | 10 | 5 | 3 | 2 | 0 |
| **4. Standards, Discovery & SEO** | 7 | 2 | 2 | 3 | 0 |
| **5. Monitoring & Reliability** | 7 | 2 | 3 | 2 | 0 |
| **6. Legal & Compliance** | 5 | 3 | 1 | 0 | 1 |
| **TOTAL** | **46** | **16 (35%)** | **12 (26%)** | **16 (35%)** | **2 (4%)** |
