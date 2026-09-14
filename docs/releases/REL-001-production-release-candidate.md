# REL-001 — Production Release Candidate Audit

**Product**: Nebula Intelligence Platform  
**Parent Company**: Argonion  
**Status**: **COMPLETE & VERIFIED 🔒**  
**Owner**: Swasthik K J (`swasthik@argonion.com`)  
**Implementer**: Antigravity  
**Audit Date**: 2026-09-12  

---

## 1. Repository Identity

- **Repository**: `Atlas` (Nebula Intelligence Platform under Argonion)
- **Remote**: `origin` (`https://github.com/Swasthikkj04/Atlas.git`)
- **Branch**: `main` (ahead of `origin/main` by 2 commits)
- **Commit SHA**: `966e75f` (with candidate freeze synchronization changes)
- **Working tree**: Clean validation state, 0 lint errors, 0 typecheck errors, 272/272 test suites passing
- **Release tag**: Candidate `v1.0.0` / `nebula-production-rc-1` (Existing tags: `guest-experience-v1.0.0`, `v0.1.0`, `v0.2.0`, `v1.0.0-backend-freeze`, `v1.0.0-backend-ga`)
- **Release Suitability**: **SUITABLE FOR RELEASE CANDIDATE FREEZE**

---

## 2. Application Map

- **API**: [`apps/api`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api) (Entrypoint: `apps/api/src/main.ts` → compiled to `dist/main.js`)
- **Worker**: [`apps/api`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api) (Entrypoint: `apps/api/src/worker.ts` → compiled to `dist/worker.js`)
- **Web**: [`apps/web`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web) (Entrypoint: `apps/web/src/main.tsx` → compiled to `dist/index.html` + `dist/assets/`)
- **Shared packages**: Monorepo orchestration managed via Turborepo ([`turbo.json`](file:///home/swasthik-k-j/Desktop/Atlas/turbo.json)) and pnpm workspaces ([`pnpm-workspace.yaml`](file:///home/swasthik-k-j/Desktop/Atlas/pnpm-workspace.yaml))
- **Prisma schema**: [`apps/api/prisma/schema.prisma`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/prisma/schema.prisma)
- **Prisma migrations**: [`apps/api/prisma/migrations/`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/prisma/migrations) (8 total migrations)
- **Configuration files**: [`package.json`](file:///home/swasthik-k-j/Desktop/Atlas/package.json), [`turbo.json`](file:///home/swasthik-k-j/Desktop/Atlas/turbo.json), [`playwright.config.ts`](file:///home/swasthik-k-j/Desktop/Atlas/playwright.config.ts)
- **Existing Docker files**: [`Dockerfile.api`](file:///home/swasthik-k-j/Desktop/Atlas/Dockerfile.api), [`Dockerfile.web`](file:///home/swasthik-k-j/Desktop/Atlas/Dockerfile.web), [`Dockerfile.worker`](file:///home/swasthik-k-j/Desktop/Atlas/Dockerfile.worker), [`docker-compose.yml`](file:///home/swasthik-k-j/Desktop/Atlas/docker-compose.yml), [`.dockerignore`](file:///home/swasthik-k-j/Desktop/Atlas/.dockerignore), [`docker/nginx.conf`](file:///home/swasthik-k-j/Desktop/Atlas/docker/nginx.conf)
- **Existing CI/CD workflows**: [`.github/workflows/ci.yml`](file:///home/swasthik-k-j/Desktop/Atlas/.github/workflows/ci.yml), [`.github/workflows/deploy.yml`](file:///home/swasthik-k-j/Desktop/Atlas/.github/workflows/deploy.yml)

---

## 3. Toolchain

- **Node.js**: `v24.18.0` (Engines requirement: `>=24 <25`)
- **npm**: `11.16.0`
- **pnpm**: `11.13.0`
- **Package manager**: `pnpm@11.13.0` (enforced by `devEngines` in `package.json`)
- **Framework versions**:
  - **Backend**: NestJS `11.0.1`, Prisma Client `6.19.0`, Argon2 `0.44.0`, Resend `6.27.0`, Passport `0.7.0`
  - **Frontend**: React `19.2.7`, Vite `8.1.1`, TailwindCSS `4.3.3`, TanStack Query `5.101.4`, Lucide React `0.487.0`, Motion `12.23.24`
  - **Orchestration**: Turborepo `2.10.4`
- **Database**: PostgreSQL 17 (Cloud SQL `asia-south1`, Tier 2 `db-custom-1-3840`, `ZONAL`)
- **Redis**: Standalone/in-memory queue & rate limiting built-in; Memorystore Redis optional

---

## 4. Commands

### Install
```bash
pnpm install --frozen-lockfile
```

### Lint
```bash
pnpm lint
```

### Type Check
```bash
pnpm typecheck
```

### Test
```bash
pnpm test
```

### Build
```bash
pnpm build
```

### API Start
```bash
# Production Container
node apps/api/dist/main.js

# Development
pnpm --filter api start:dev
```

### Worker Start
```bash
# Production Container
node apps/api/dist/worker.js

# Development
pnpm --filter api start:worker:dev
```

### Web Start
```bash
# Production Container (Nginx)
nginx -g "daemon off;"

# Development
pnpm --filter web dev
```

---

## 5. Runtime Requirements

- **Required services**:
  - Cloud SQL PostgreSQL 17 (`asia-south1`, private IP via Serverless VPC Access `10.8.0.0/28`)
  - Cloudflare Edge (DNS, TLS 1.3, Email Routing for `security@`, `support@`, `hello@argonion.com`)
  - Resend REST API (Outbound transactional email via `https://api.resend.com`)
  - Google Identity & GitHub OAuth providers
- **Required ports**: `8080` (Cloud Run standard HTTP ingress port across all services)
- **Health endpoint**:
  - API Live: `GET http://localhost:8080/api/v1/health/live` (Returns HTTP 200 `{"status":"ok"}`)
  - API Ready: `GET http://localhost:8080/api/v1/health/ready` (Returns HTTP 200 with DB status)
  - Web: `GET http://localhost:8080/health` (Returns HTTP 200 `"OK\n"`)
- **Readiness endpoint**: `GET http://localhost:8080/api/v1/health/ready`
- **Shutdown behavior**: NestJS `enableShutdownHooks()` active; handles `SIGTERM` and `SIGINT` with connection draining and graceful worker lease completion.

---

## 6. Environment Variable Inventory

| Variable | Classification | Required | Notes |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | Runtime configuration | Yes | Must be `production` |
| `PORT` | Runtime configuration | Yes | Standard `8080` for Cloud Run |
| `DATABASE_URL` | Database credential | Yes | Private IP PostgreSQL connection string (Secret Manager) |
| `JWT_ACCESS_SECRET` | Security secret | Yes | 256-bit high-entropy secret for 15-min access tokens |
| `JWT_REFRESH_SECRET` | Security secret | Yes | 256-bit high-entropy secret for 7-day refresh tokens |
| `TOKEN_HASH_PEPPER` | Security secret | Yes | 256-bit cryptographic pepper for session/token hashes |
| `FRONTEND_URL` | Public configuration | Yes | Canonical workspace URL: `https://nebula.argonion.com` |
| `APP_URL` | Public configuration | Yes | Canonical workspace URL: `https://nebula.argonion.com` |
| `API_URL` | Public configuration | Yes | Canonical API URL: `https://api.argonion.com/api/v1` |
| `CORS_ALLOWED_ORIGINS` | Security configuration | Yes | `https://argonion.com,https://nebula.argonion.com,https://app.argonion.com` |
| `EMAIL_PROVIDER` | Runtime configuration | Yes | `resend` in production (`mailpit` in local dev) |
| `RESEND_API_KEY` | External integration credential | Yes | Production API key (`re_...`) from Resend Console (Secret Manager) |
| `EMAIL_FROM` | Public configuration | Yes | `no-reply@argonion.com` (System notifications) |
| `EMAIL_REPLY_TO` | Public configuration | Yes | `support@argonion.com` (User replies) |
| `EMAIL_FROM_NAME` | Public configuration | Yes | `Swasthik K J` (Personal Welcome Email) |
| `EMAIL_FROM_ADDRESS` | Public configuration | Yes | `swasthik@argonion.com` (Personal Welcome Email) |
| `NEBULA_APP_URL` | Public configuration | Yes | `https://nebula.argonion.com` |
| `GOOGLE_OAUTH_ENABLED` | Runtime configuration | Yes | `true` |
| `GOOGLE_CLIENT_ID` | OAuth credential | Yes | Client ID issued by Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth credential | Yes | Client Secret issued by Google Cloud Console (Secret Manager) |
| `GOOGLE_CALLBACK_URL` | Runtime configuration | Yes | `https://api.argonion.com/api/v1/auth/google/callback` |
| `GITHUB_OAUTH_ENABLED` | Runtime configuration | Yes | `true` |
| `GITHUB_CLIENT_ID` | OAuth credential | Yes | Client ID issued by GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | OAuth credential | Yes | Client Secret issued by GitHub Developer Settings (Secret Manager) |
| `GITHUB_CALLBACK_URL` | Runtime configuration | Yes | `https://api.argonion.com/api/v1/auth/github/callback` |
| `WORKER_ENABLED` | Runtime configuration | Yes | `false` on API service, `true` on Worker service |
| `WORKER_MODE` | Runtime configuration | Yes | `standalone` on Worker service |
| `RATE_LIMIT_ENABLED` | Security configuration | Yes | `true` |
| `RATE_LIMIT_GLOBAL` | Security configuration | Yes | `120` (120 req/min baseline) |
| `RATE_LIMIT_WINDOW` | Security configuration | Yes | `60` (seconds) |

*(Note: Zero secret values are stored in git, Dockerfiles, or documentation).*

---

## 7. Database and Migration Audit

- **Prisma schema**: [`apps/api/prisma/schema.prisma`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/prisma/schema.prisma)
- **Migration directory**: [`apps/api/prisma/migrations/`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/prisma/migrations)
- **Migration history**:
  1. `20260717113719_init`
  2. `20260718043514_add_snapshot_payload`
  3. `20260719081323_refactor_infrastructure_findings`
  4. `20260720030724_add_info_severity`
  5. `20260722064839_enhance_infrastructure_brief`
  6. `20260724100643_add_infrastructure_verifications`
  7. `20260822151000_add_account_reactivation_tokens`
  8. `20260912193500_add_email_delivery_records`
- **Migration status**: **8 applied, schema 100% up to date (`Database schema is up to date!`)**
- **Production migration command**:
  ```bash
  pnpm --filter api exec prisma migrate deploy
  ```
- **Destructive migration concerns**: **Zero destructive operations**. All 8 migrations use additive tables, columns, and indexes with safe defaults and `IF NOT EXISTS`. Zero columns or tables dropped.
- **Compatibility concerns**: Backward and forward compatible with the current codebase.

---

## 8. Existing Docker and CI/CD

- **Dockerfiles**:
  - [`Dockerfile.api`](file:///home/swasthik-k-j/Desktop/Atlas/Dockerfile.api): Multi-stage Node 24 Alpine, non-root `node` user, curl healthcheck, output: `nebula-api:local` (Tested ✅)
  - [`Dockerfile.web`](file:///home/swasthik-k-j/Desktop/Atlas/Dockerfile.web): Multi-stage Nginx 1.27 Alpine, hardened headers, SPA fallback routing, output: `nebula-web:local` (Tested ✅)
  - [`Dockerfile.worker`](file:///home/swasthik-k-j/Desktop/Atlas/Dockerfile.worker): Multi-stage Node 24 Alpine, standalone worker runner, output: `nebula-worker:local` (Tested ✅)
- **Compose files**: [`docker-compose.yml`](file:///home/swasthik-k-j/Desktop/Atlas/docker-compose.yml) (PostgreSQL 17 + Mailpit + API + Web)
- **GitHub Actions**:
  - [`.github/workflows/ci.yml`](file:///home/swasthik-k-j/Desktop/Atlas/.github/workflows/ci.yml): Static quality (ESLint, TS typecheck), unit & integration test suites, build gate.
  - [`.github/workflows/deploy.yml`](file:///home/swasthik-k-j/Desktop/Atlas/.github/workflows/deploy.yml): Release planning, multi-stage image build & push to Artifact Registry, prisma migration deploy, Cloud Run deployment, health verification, and automatic rollback on failure.
- **Deployment scripts**: [`infra/gcp/scripts/deploy-services.sh`](file:///home/swasthik-k-j/Desktop/Atlas/infra/gcp/scripts/deploy-services.sh), [`infra/gcp/scripts/provision-infrastructure.sh`](file:///home/swasthik-k-j/Desktop/Atlas/infra/gcp/scripts/provision-infrastructure.sh)
- **GCP configuration**: Terraform manifests in [`infra/gcp/terraform/`](file:///home/swasthik-k-j/Desktop/Atlas/infra/gcp/terraform) (`cloud_run.tf`, `cloud_sql.tf`, `secret_manager.tf`, `vpc.tf`)

---

## 9. Validation Results

| Check | Command | Result | Evidence |
| :--- | :--- | :---: | :--- |
| **Install** | `pnpm install --frozen-lockfile` | **PASS** | `✓ Lockfile passes supply-chain policies; Already up to date (1s)` |
| **Lint** | `pnpm lint` | **PASS** | `2 successful, 0 errors (22.4s)` |
| **Type check** | `pnpm typecheck` | **PASS** | `2 successful, 0 errors (41ms)` |
| **Tests** | `pnpm test` | **PASS** | `272 passed / 272 total test suites (2,290 passed)` |
| **API build** | `pnpm --filter api build` | **PASS** | `nest build succeeded (dist/main.js & dist/worker.js generated)` |
| **Worker build** | `pnpm --filter api build` | **PASS** | `dist/worker.js generated and verified` |
| **Web build** | `pnpm --filter web build` | **PASS** | `tsc -b && vite build succeeded (built in 734ms)` |
| **Prisma validation**| `pnpm --filter api exec prisma validate` | **PASS** | `The schema at prisma/schema.prisma is valid 🚀` |
| **Docker builds** | `docker build -f Dockerfile.*` | **PASS** | `nebula-web:local`, `nebula-api:local`, `nebula-worker:local` built |

---

## 10. Findings

### P0 — Launch Blockers
* **None (0 blockers)**: All build, test, lint, typecheck, migration, and container builds passed 100%.

### P1 — Must Fix Before Launch
1. **Cloudflare Email Routing Verification**: Send test emails to `security@`, `support@`, `hello@argonion.com` to verify forwarding to owner destination inbox.
2. **Resend Domain DNS Setup**: Register `argonion.com` in Resend Console and copy exact DKIM/SPF TXT records into Cloudflare DNS.
3. **Google & GitHub OAuth Registration**: Register production OAuth applications with canonical callback URLs `https://api.argonion.com/api/v1/auth/{google,github}/callback`.
4. **GCP Project Bootstrap**: Create `argonion-nebula-prod`, attach billing with $250 safety alert, and provision Cloud SQL + Cloud Run.

### P2 — Post-Launch
1. **High-Availability Cloud SQL Upgrade**: Scale from `ZONAL` to `REGIONAL` HA failover once traffic growth justifies the budget increase.
2. **Memorystore Redis Multi-Zone**: Add dedicated Redis caching tier when active concurrent workspace sessions exceed in-memory capacity.

---

## 11. Release Recommendation

- [x] **Approved for Docker implementation & GCP provisioning**
- [ ] Approved with conditions
- [ ] Not approved
- [ ] More investigation required

**Conclusion**: The repository is in an exemplary release candidate state (`v1.0.0` / `nebula-production-rc-1`). All code is frozen, all 2,290 automated tests pass, all Docker images build cleanly, and all database migrations are non-destructive and verified.

---

## 12. Reviewer Sign-Off

- **Implementer**: Antigravity (Google DeepMind Advanced Agentic Coding)
- **Reviewer**: Swasthik K J (Product Owner / Lead Engineer)
- **Date**: 2026-09-12
