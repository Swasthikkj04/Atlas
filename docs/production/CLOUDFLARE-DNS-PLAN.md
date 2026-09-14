# Cloudflare DNS & Edge Routing Plan

**Product**: Nebula Intelligence Platform (under Argonion)  
**Primary Domain**: `argonion.com`  
**DNS & Edge Provider**: Cloudflare (Zone ID Managed)  
**Registrar**: GoDaddy (Nameservers pointed to Cloudflare)  
**Document Status**: **READY FOR PROVISIONING EXECUTION (GATES CLOSED VIA PROD-001)**  
**Governing Decisions**: [OD-01](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-01-canonical-nebula-domain-routing), [OD-02](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-02-inbound-email-routing), [OD-03](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-03-outbound-email-identity--resend-senders)  
**Last Updated**: 2026-09-12  

---

## 1. Domain Architecture & Ingress Matrix

Per [ADR-PROD-001](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md) and [OD-01](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-01-canonical-nebula-domain-routing), all production traffic is routed through Cloudflare to Google Cloud Run:

| FQDN | Experience / Target | Origin Service | Proxy Mode | SSL/TLS Mode |
| :--- | :--- | :--- | :--- | :--- |
| **`argonion.com`** | Argonion / Nebula Landing Page | `nebula-prod-web` | Proxied (`Orange Cloud`) | Full (Strict) |
| **`www.argonion.com`** | Permanent Canonical Redirect | Cloudflare Page Rule / Redirect Rule | Proxied (`Orange Cloud`) | Full (Strict) |
| **`app.argonion.com`** | Nebula Guest Experience (GX) | `nebula-prod-web` | Proxied (`Orange Cloud`) | Full (Strict) |
| **`nebula.argonion.com`** | Nebula Workspace (WX) & Auth | `nebula-prod-web` | Proxied (`Orange Cloud`) | Full (Strict) |
| **`api.argonion.com`** | NestJS Backend REST API | `nebula-prod-api` | Proxied (`Orange Cloud`) | Full (Strict) |

---

## 2. DNS Record Classification & Provisioning Phases

To prevent configuration errors and broken routing, DNS records are strictly categorized into 3 distinct operational phases:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: PRE-DEPLOYMENT BASELINE (Configure Before Deploying Services)          │
│ - Cloudflare Email Routing MX Records                                           │
│ - Security Policy Records (DMARC, CAA, DNSSEC)                                  │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: RESEND TRANSACTIONAL EMAIL (Configure After Resend Domain Creation)   │
│ - Exact DKIM Records (from Resend Console)                                      │
│ - Exact SPF TXT Record (from Resend Console)                                    │
│ - Exact Custom Return-Path CNAME (from Resend Console)                          │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: CLOUD RUN CUSTOM DOMAIN MAPPINGS (Configure After Services Are Live)   │
│ - Apex Domain CNAME / ALIAS (`argonion.com` -> `ghs.googlehosted.com`)          │
│ - Subdomain CNAMEs (`app`, `nebula`, `api` -> `ghs.googlehosted.com`)           │
│ - Domain Ownership Verification TXT Records                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: Pre-Deployment Baseline Records

These records can be safely configured prior to service deployment.

### 1. Inbound Cloudflare Email Routing (MX Records)
Per [ADR-PROD-003](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md), [ADR-PROD-006](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md), and [OD-02](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-02-inbound-email-routing):

| Type | Name | Content / Target | Priority | TTL | Proxy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MX` | `@` | `isaac.mx.cloudflare.net` | `10` | Auto | DNS Only |
| `MX` | `@` | `linda.mx.cloudflare.net` | `20` | Auto | DNS Only |
| `MX` | `@` | `amir.mx.cloudflare.net` | `30` | Auto | DNS Only |

*Cloudflare Email Routing Rules (Forwarding to Owner Destination Inbox):*
* `security@argonion.com` → Owner destination inbox
* `support@argonion.com` → Owner destination inbox
* `hello@argonion.com` → Owner destination inbox

> [!NOTE]
> Destination inbox email addresses are private to the Product Owner and must never be committed to repository code or documentation.

### 2. Baseline Security Records (CAA, DMARC, DNSSEC)

| Type | Name | Content / Value | TTL | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:security@argonion.com; ruf=mailto:security@argonion.com; sp=none; fo=1` | Auto | Initial monitoring policy; upgrade to `p=quarantine` post-launch. |
| `CAA` | `@` | `0 issue "letsencrypt.org"` | Auto | Permit Let's Encrypt certificates. |
| `CAA` | `@` | `0 issue "pki.goog"` | Auto | Permit Google Trust Services (Cloud Run managed SSL). |
| `CAA` | `@` | `0 issuewild "letsencrypt.org"` | Auto | Wildcard issuance policy. |
| `CAA` | `@` | `0 issuewild "pki.goog"` | Auto | Wildcard issuance policy. |
| `CAA` | `@` | `0 iodef "mailto:security@argonion.com"` | Auto | Certificate violation reporting. |

* **DNSSEC**: Enable One-Click DNSSEC in Cloudflare Dashboard; add DS record to GoDaddy registrar.

---

## 4. Phase 2: Resend Outbound Transactional Mail Records

> [!CAUTION]
> **Do Not Guess DNS Values**: Resend generates unique public DKIM selectors and SPF include tokens upon adding the domain in the Resend Dashboard. The table below illustrates the structure; exact values must be copied directly from Resend.

| Record Role | Type | Name | Target Content | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Resend DKIM** | `TXT` or `CNAME` | `resend._domainkey` (or selector provided by Resend) | *Exact value supplied by Resend* | Cryptographic signature for transactional emails. |
| **Resend SPF** | `TXT` | `@` (or `bounces.argonion.com`) | `v=spf1 include:resend.com ~all` (or exact Resend record) | Authorizes Resend infrastructure to send mail. |
| **Return-Path / MX** | `MX` / `CNAME` | `bounces` | `feedback-smtp.resend.com` (or exact Resend host) | Handles delivery bounce notifications. |

---

## 5. Phase 3: Cloud Run Custom Domain Mappings

Configure these records **after** Cloud Run services are deployed and custom domain mappings are generated in the GCP Console:

| Type | Name | Target Hostname | Proxy Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| `CNAME` | `@` (Flattened) | `ghs.googlehosted.com` | Proxied (`Orange Cloud`) | Routes `argonion.com` to `nebula-prod-web` |
| `CNAME` | `www` | `argonion.com` (or redirect rule) | Proxied (`Orange Cloud`) | Redirects to apex `argonion.com` |
| `CNAME` | `app` | `ghs.googlehosted.com` | Proxied (`Orange Cloud`) | Routes `app.argonion.com` to `nebula-prod-web` (GX) |
| `CNAME` | `nebula` | `ghs.googlehosted.com` | Proxied (`Orange Cloud`) | Routes `nebula.argonion.com` to `nebula-prod-web` (WX) |
| `CNAME` | `api` | `ghs.googlehosted.com` | Proxied (`Orange Cloud`) | Routes `api.argonion.com` to `nebula-prod-api` |

### Cloudflare Page / Redirect Rules
1. **Rule 1: Canonical WWW Redirect**
   - Matching URL: `https://www.argonion.com/*`
   - Setting: Forwarding URL (301 Permanent Redirect)
   - Destination: `https://argonion.com/$1`

2. **Rule 2: Edge Cache Invalidation for API**
   - Matching URL: `https://api.argonion.com/*`
   - Setting: Cache Level: Bypass (Cache-Control passthrough to NestJS backend).

---

## 6. Edge Security & Performance Settings

* **SSL/TLS Mode**: **Full (Strict)** — Cloudflare validates the Google-managed SSL certificate on Cloud Run origins.
* **Minimum TLS Version**: **TLS 1.2** (TLS 1.3 enabled).
* **HTTP/3 (QUIC)**: Enabled.
* **Automatic HTTPS Rewrites**: Enabled.
* **HSTS (HTTP Strict Transport Security)**:
  - Max-Age: `31536000` (1 year)
  - Include subdomains: `true`
  - Preload: `true`
* **WAF Rules**:
  - Cloudflare Managed Ruleset enabled.
  - Rate limiting on `https://api.argonion.com/api/v1/auth/*` (100 requests per minute per IP).
