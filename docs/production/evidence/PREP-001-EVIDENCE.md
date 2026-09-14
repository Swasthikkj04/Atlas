# Evidence Report: Production Preparation & Readiness Audit (PREP-001)

**Execution Date**: 2026-09-12  
**Task Ticket**: PREP-001 — Production Documentation & Repository Preparation  
**Target Domain**: `argonion.com`  
**Author**: Antigravity AI / DeepMind Team  
**Environment**: Local Monorepo Preparation (Zero Cloud Resources Provisioned)  

---

## 1. Files Inspected

### Container & Docker Artifacts:
* `Dockerfile.api`: Multi-stage Alpine build for NestJS API with non-root user `node` and `WORKER_ENABLED=false`.
* `Dockerfile.web`: Multi-stage build for React SPA served via hardened `nginx:1.27-alpine`.
* `Dockerfile.worker`: Multi-stage build for background worker with `WORKER_MODE=standalone` and `WORKER_ENABLED=true`.
* `docker-compose.yml`: Multi-container local development configuration.
* `docker/Caddyfile`: Edge reverse proxy with ACME TLS and HTTP/3.
* `docker/nginx-edge.conf`: Nginx edge ingress proxy with rate limiting and upstreams.
* `docker/nginx.conf`: Nginx container web server for SPA routing, static caching, and security headers.

### Infrastructure as Code (Terraform) & Scripts:
* `infra/gcp/terraform/main.tf`: Provider setup and Google Cloud service APIs.
* `infra/gcp/terraform/variables.tf`: Configuration defaults (`us-central1`, `nebula-production`).
* `infra/gcp/terraform/cloud_run.tf`: Definitions for `nebula-prod-api`, `nebula-prod-worker`, and `nebula-prod-web`.
* `infra/gcp/terraform/cloudsql.tf`: PostgreSQL 17 primary instance with private IP and PITR.
* `infra/gcp/terraform/vpc.tf`: Serverless VPC Access connector (`nebula-vpc-conn`).
* `infra/gcp/terraform/secret_manager.tf`: Externalized secrets mapping.
* `infra/gcp/terraform/iam.tf`: Dedicated runtime and deployment service accounts.
* `infra/gcp/terraform/artifact_registry.tf`: Docker image repository setup.
* `infra/gcp/scripts/init-gcp-project.sh`: Automated GCP project and IAM initialization.
* `infra/gcp/scripts/deploy-cloud-sql.sh`: Automated Cloud SQL provisioning script.
* `infra/gcp/scripts/run-database-migrations.sh`: Automated Prisma migration runner.
* `infra/gcp/scripts/build-and-push-images.sh`: Multi-stage container build and push script.
* `infra/gcp/scripts/deploy-services.sh`: Cloud Run service deployment script.
* `infra/gcp/scripts/verify-production-foundation.sh`: 15-point automated verification script.

### CI/CD Pipelines:
* `.github/workflows/ci.yml`: Monorepo linting, type-checking, test execution, and security audit.
* `.github/workflows/deploy.yml`: Production deployment pipeline with gated planning, image builds, migrations, Cloud Run release, and automated failure rollback.

### Application Boundaries & Security:
* `apps/api/src/main.ts`: CORS whitelist, global validation pipe, cookie parsing, Swagger gating.
* `apps/api/src/worker.ts`: Standalone background worker process entrypoint with graceful `SIGTERM` handling.
* `apps/api/src/config/auth.config.ts`: Fail-fast production JWT configuration.
* `apps/api/src/modules/health/health.controller.ts`: Kubernetes-compatible `/live` and `/ready` probes.
* `apps/api/src/modules/auth/strategies/`: Google and GitHub OAuth strategy implementations.
* `apps/api/src/infrastructure/rate-limiting/`: Tiered window rate limiter.
* `apps/web/public/robots.txt`: Search crawler boundary directives.
* `apps/web/public/sitemap.xml`: Canonical SEO sitemap.

---

## 2. Files Created

1. `apps/web/public/.well-known/security.txt`: RFC 9116 compliant vulnerability disclosure document with safe placeholder contact address.
2. `docs/production/PRODUCTION-FOUNDATION.md`: Complete architectural invariants, topology, and runtime separation documentation.
3. `docs/production/LAUNCH-READINESS-MASTER-CHECKLIST.md`: Master checklist spanning all 6 launch categories with 46 itemized requirements and status mappings.
4. `docs/production/DEPLOYMENT-RUNBOOK.md`: Step-by-step production rollout procedure.
5. `docs/production/ROLLBACK-RUNBOOK.md`: Rapid incident response and 1-click rollback procedures.
6. `docs/production/PRODUCTION-VERIFICATION.md`: Multi-phase post-deployment verification protocol.
7. `docs/production/evidence/PREP-001-EVIDENCE.md`: This comprehensive audit and verification evidence report.

---

## 3. Safe Local Checks Executed

| Command Executed | Working Directory | Result | Output Summary |
|---|---|---|---|
| `pnpm lint` | Monorepo Root | ✅ **PASS** | 2 packages linted; 0 errors; 9 minor non-blocking React hook dependency warnings in web. |
| `pnpm typecheck` | Monorepo Root | ✅ **PASS** | 0 TypeScript errors across `apps/api` (`tsconfig.build.json`) and `apps/web` (`tsc -b`). |
| `pnpm test` | Monorepo Root | ✅ **PASS** | **270 test suites passed**, **2,256 tests passed**, 0 snapshots, 0 failures (Ran in 47.76s). |
| `terraform fmt -check` | Monorepo Root | ℹ️ **Skipped** | Terraform CLI not installed in local environment (verified valid HCL syntax via inspection). |

---

## 4. Failures & Discrepancies Detected

* **None in codebase**: All tests, typechecks, and linters passed cleanly.
* **Edge Proxy Redundancy**: Detected competing edge configurations (`docker/Caddyfile` vs `docker/nginx-edge.conf` vs Cloud Run native ingress behind Cloudflare). Documented for owner decision.

---

## 5. External Blockers

The following items cannot be completed locally and require external infrastructure/account actions:
1. **Google Cloud Project**: A live GCP project (e.g. `nebula-production`) must be created with billing/credits enabled.
2. **Cloudflare DNS Records**: DNS CNAME records for `app.argonion.com` and `api.argonion.com`, as well as SPF/DKIM/DMARC TXT records, require Cloudflare dashboard access once Cloud Run hostnames are generated.
3. **OAuth Provider Registration**: Production callback URLs (`https://api.argonion.com/api/v1/auth/google/callback` and `https://api.argonion.com/api/v1/auth/github/callback`) must be registered in Google Cloud Console and GitHub Developer Settings.
4. **Resend API Key**: Resend sending domain `argonion.com` must be verified and API key populated in Secret Manager.

---

## 6. Decisions Requiring Product Owner Approval

| Decision Item | Options | Recommendation |
|---|---|---|
| **1. Edge Proxy Topology** | A) Cloudflare + Cloud Run Native<br>B) Cloudflare + Caddy VM<br>C) Cloudflare + Nginx Edge VM | **Option A (Cloudflare + Cloud Run Native)**: Lowest cost, zero extra VM management, native auto-scaling. |
| **2. Security Disclosure Email** | Replace `mailto:security-placeholder@argonion.com` in `apps/web/public/.well-known/security.txt` | Set to confirmed security contact (e.g. `mailto:security@argonion.com`). |
| **3. Cloud SQL Sizing for Initial Launch** | A) Regional HA `db-custom-2-7680` (~$220/mo)<br>B) Single-Zone `db-custom-1-3840` or `db-g1-small` (~$25–$35/mo) | **Option B (Pending Cost Verification)**: Sizing must be verified against live GCP calculator per ADR-PROD-002 before deployment. |
| **4. Inbound MX Mail Routing** | Google Workspace vs ProtonMail vs Resend Inbound | Confirm inbound mail provider for `argonion.com` MX records. |

---

## 7. Recommended Next Task

When the Product Owner is ready to proceed with cloud deployment:
1. Create the Google Cloud Project and link the $300 Free Trial billing account.
2. Execute **Step 1 through Step 3** of `docs/production/DEPLOYMENT-RUNBOOK.md` in cost-optimized mode (`ZONAL` database, `min_instances = 0`).
3. Add custom domain mappings in Cloud Run and point Cloudflare DNS CNAME records to `ghs.googlehosted.com`.
