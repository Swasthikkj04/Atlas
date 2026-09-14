# Production Foundation Architecture

**Product**: Nebula Intelligence Platform (under Argonion)  
**Target Domain**: `argonion.com` (Approved Topology: `argonion.com` [Landing], `app.argonion.com` [GX], `nebula.argonion.com` [WX], `api.argonion.com` [API])  
**Target Region**: Proposed `asia-south1` (Mumbai, India) per [ADR-PROD-004](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md)  
**Status**: Repository preparation is complete. Production deployment remains blocked on GCP provisioning, DNS configuration, OAuth registration, and live verification.  
**Document Version**: 2.3.0  
**Related Decision Records**:
* [ADR-PROD-001: Domain Routing & Canonical Ingress](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md) (*Status: APPROVED BY PRODUCT OWNER*)
* [ADR-PROD-002: Cloud SQL PostgreSQL Sizing & Cost Gate](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md) (*Status: PENDING COST VERIFICATION*)
* [ADR-PROD-003: Inbound Email Routing & Outbound Sending](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md) (*Status: APPROVED BY PRODUCT OWNER*)
* [ADR-PROD-004: Deployment Region Selection](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md) (*Status: PROPOSED / PENDING VERIFICATION*)
* [ADR-PROD-005: Authoritative Edge Strategy](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-005-EDGE-STRATEGY.md) (*Status: APPROVED / RECOMMENDED*)
* [ADR-PROD-006: Production Public Support & Security Contact Channels](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md) (*Status: APPROVED / RECOMMENDED*)
* [Owner Decision Register](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md) (*Status: ACTIVE REGISTER — OD-01, OD-05 APPROVED*)

---

## 1. Architecture Overview & Mission Context

The Nebula platform is engineered to run on Google Cloud Platform (GCP) with edge routing managed via Cloudflare and source/deployment pipelines orchestrated through GitHub Actions.

```
                                              INTERNET
                                                 │
                                                 ▼
                              [ GoDaddy Registrar → Cloudflare DNS & Proxy ]
                                       (TLS 1.3 / WAF / DDoS / CDN)
                                                 │
             ┌───────────────────────┬───────────┴───────────┬───────────────────────┐
             │                       │                       │                       │
             ▼                       ▼                       ▼                       ▼
    [ argonion.com ]        [ app.argonion.com ]    [ nebula.argonion.com ]  [ api.argonion.com ]
    (Root Landing Page)     (Guest Experience GX)   (Workspace Portal WX)    (NestJS Backend API)
             │                       │                       │                       │
             └───────────────────────┴───────────┬───────────┘                       │
                                                 ▼                                   ▼
                                       [ nebula-prod-web ]                 [ nebula-prod-api ]
                                       (Cloud Run / Nginx)                 (Cloud Run / NestJS)
                                       - Port: 8080                        - Port: 8080
                                       - Scaling: 0–10                     - Scaling: 0–10
                                                                                     │
                                                                                     ▼
                                                                          [ Serverless VPC Access ]
                                                                          (nebula-vpc-conn: 10.8.0.0/28)
                                                                                     │
                                             ┌───────────────────────────────────────┴───────────────────────────────────────┐
                                             │                                                                               │
                                             ▼                                                                               ▼
                                [ nebula-prod-postgres ]                                                    [ nebula-prod-worker ]
                                (Cloud SQL PostgreSQL 17)                                                   (Cloud Run - Standalone)
                                - Private IP Only                                                           - Internal Ingress Only
                                - Storage & Availability per ADR-PROD-002                                   - CPU Allocated / Asynchronous
```

---

## 2. Frozen Boundaries & Architectural Invariants

The following architectural invariants are strictly frozen and preserved across all production preparation:
1. **Email Platform Invariant (`EMAIL-001` → `EMAIL-010`)**: The transactional email platform implementation, domain verification flow, and dispatch abstractions are frozen.
2. **Single Authoritative System of Record**: PostgreSQL 17 is the sole persistent source of truth. Ephemeral SQLite, in-memory stores as primary persistence, or bypasses of Prisma migrations are strictly forbidden in production.
3. **Decoupled Asynchronous Processing**:
   - `nebula-prod-api` runs with `WORKER_ENABLED=false` strictly serving synchronous client HTTP requests.
   - `nebula-prod-worker` runs with `WORKER_ENABLED=true` and `WORKER_MODE=standalone` executing asynchronous intelligence and polling jobs.
4. **Strict Least-Privilege IAM**: Zero shared service accounts. Zero `roles/owner` or `roles/editor` grants. Dedicated service accounts for API (`nebula-prod-api-sa`), Worker (`nebula-prod-worker-sa`), and Deployment (`nebula-prod-deployer-sa`).
5. **Zero Secret Leakage**: No credentials, tokens, or private keys committed to version control or baked into container images. All runtime secrets are mounted directly from Google Secret Manager.
6. **Isolated Network Boundaries**: Cloud SQL operates with `ipv4_enabled = false` (private IP only). Cloud Run accesses the database via the Serverless VPC Access connector. The worker service accepts no public internet ingress (`INGRESS_TRAFFIC_INTERNAL_ONLY`).

---

## 3. Infrastructure & Artifact Status Classification

To maintain operational integrity, repository artifacts and dependencies are categorized under six strict status classifications:

| Component | Status Classification | Notes |
|---|---|---|
| **Multi-stage Dockerfiles** | **Locally Verified** | `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.worker` verified with rootless Alpine execution. |
| **Monorepo Codebase & Tests** | **Locally Verified** | Linting passes; TypeScript typecheck passes; all 2,256 unit/integration tests pass. |
| **Prisma Schema & Migrations** | **Locally Verified** | Authoritative schema in `apps/api/prisma/schema.prisma` with validated migration files. |
| **Terraform Configuration** | **Prepared but Unverified** | `infra/gcp/terraform/*.tf` fully written; not applied against any live GCP project. |
| **GCP Provisioning Scripts** | **Prepared but Unverified** | `infra/gcp/scripts/*.sh` written and hardened with dry-run safe flags. |
| **GitHub Actions CI/CD** | **Prepared but Unverified** | `.github/workflows/ci.yml` and `deploy.yml` configured; deployment awaits GCP credentials. |
| **Google Cloud Project** | **Blocked until GCP** | No GCP project created or billed yet. |
| **Cloud SQL PostgreSQL** | **Blocked until GCP** | Provisioning blocked on project creation and tier approval per ADR-PROD-002. |
| **Domain Registrar** | **Locally Verified** | Domain `argonion.com` registered at GoDaddy; nameservers pointed to Cloudflare. |
| **DNS & Edge Proxy** | **Blocked until DNS** | Cloudflare active for DNS zone; CNAME records pending Cloud Run custom domain mapping. |
| **OAuth Providers** | **Blocked until OAuth Configuration** | Google Cloud OAuth & GitHub OAuth apps need production callback URLs registered. |
| **Resend Email API** | **Blocked until DNS** | Resend account active; API key and domain verification pending DNS records. |
| **Inbound Email Routing** | **Approved by Owner** | Cloudflare Email Routing forwarding `security@`, `support@`, `hello@` per ADR-PROD-003. |
| **Domain Ingress Strategy** | **Approved by Owner** | Multi-surface routing approved per ADR-PROD-001 (`argonion.com`, `app`, `nebula`, `api`). |
| **Cloud SQL Sizing & Budget** | **Pending Cost Verification** | Initial tier sizing and billing alerts pending cost check per ADR-PROD-002. |
| **GCP Region Selection** | **Proposed / Pending Verification** | `asia-south1` proposed per ADR-PROD-004. |

---

## 4. Edge Proxy Strategy & Ingress Routing

The repository contains three proxy / web server configurations:
1. `docker/Caddyfile`: Reverse proxy featuring automatic ACME TLS, HTTP/3 (QUIC), HSTS headers, and proxy upstreams.
2. `docker/nginx-edge.conf`: Nginx reverse proxy featuring rate limiting zones (`api_limit`, `static_limit`), compression, and upstreams.
3. `docker/nginx.conf`: Container-internal web server for `apps/web` (React SPA) serving static files on port 8080 with client body limits, SPA fallback routing, and cache-control headers.

### Architectural Ingress Options (Tracked in OD-06 / ADR-PROD-005):

| Option | Architecture | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **Option A: Cloudflare + Cloud Run Native (Serverless)** | `Cloudflare Edge → Cloud Run (Web / API)` | Zero extra VMs/containers to maintain; leverages Cloudflare CDN/WAF and Cloud Run auto-scaling directly; lowest monthly cost. | Cloudflare custom domain mapping to Cloud Run must be configured via CNAME. | **(Approved / Recommended)** Primary production path for low cost and high scalability. |
| **Option B: Dedicated Caddy Ingress Container** | `Cloudflare → Caddy Container → Cloud Run / VMs` | Built-in HTTP/3 and automated ACME TLS. | Redundant when Cloudflare + Cloud Run already provide TLS; requires dedicated compute instance. | Retain as alternative containerized edge for non-GCP deployments. |
| **Option C: Dedicated Nginx Edge Ingress** | `Cloudflare → Nginx Edge → Cloud Run / VMs` | Custom granular rate limiting at edge. | Duplicate security headers with internal `docker/nginx.conf`; adds operational complexity. | Retain for self-hosted container cluster topologies. |

> [!IMPORTANT]
> **Duplicate Security Headers Warning**: When running behind Cloudflare or an edge proxy, ensure `docker/nginx.conf` and `Caddyfile` do not emit duplicate `X-Frame-Options` or `Content-Security-Policy` headers if the edge already injects them.

---

## 5. Security & Runtime Isolation Matrix

| Layer | Implementation | Verification Status |
|---|---|---|
| **Transport Layer** | TLS 1.3 via Cloudflare; HTTPS enforced | Blocked until DNS & GCP |
| **HTTP Security Headers** | HSTS (`max-age=31536000`), CSP, `nosniff`, `SAMEORIGIN`, `Referrer-Policy` | Prepared but Unverified (in `docker/nginx.conf`) |
| **API Rate Limiting** | Tiered rate limiter (`RateLimiterService`) on auth/search endpoints | Locally Verified in test suite |
| **Cross-Origin Resource Sharing (CORS)** | Strict origin whitelist (`argonion.com`, `app`, `nebula`) | Locally Verified in test suite |
| **Authentication Boundaries** | JWT Access (15m expiry) + Rotating Refresh Tokens (7d) + WebAuthn Admin | Locally Verified in test suite |
| **Database Access** | Private IP only; accessed strictly via Serverless VPC Access connector | Prepared but Unverified (IaC written) |
| **Background Processing** | Standalone worker container with no public ingress route | Prepared but Unverified (IaC written) |
