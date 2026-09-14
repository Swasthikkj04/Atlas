# Evidence Report: Production Decisions & Cost Gate (PREP-002)

**Execution Date**: 2026-09-12  
**Task Ticket**: PREP-002 — Production Architecture Decisions & Cost Gate  
**Target Domain**: `argonion.com`  
**Author**: Antigravity AI / DeepMind Team  
**Status**: Prepared for production provisioning, pending owner decisions and external infrastructure setup.  

---

## 1. Documents Created & Changed

### Newly Created Decision Records & Registers:
1. `docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md`:
   - Analyzed Option A (`argonion.com` as Apex frontend) vs Option B (`app.argonion.com` as Subdomain frontend).
   - Marked explicitly as **OWNER DECISION REQUIRED**.
2. `docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md`:
   - Detailed candidate database tiers, regional pricing dependencies, storage/backup assumptions, billing alert requirements ($250 budget), deletion protection, and scale-up paths.
   - Marked explicitly as **PENDING COST VERIFICATION**.
3. `docs/production/OWNER-DECISIONS.md`:
   - Central register covering all 8 required owner decisions (Canonical domain, security email, GCP region, Cloud SQL size, MX mail provider, edge strategy, GCP account owner, and support route) with rationale, alternatives, and approval requirements.
4. `docs/production/evidence/PREP-002-EVIDENCE.md`:
   - This authoritative task execution evidence report.

### Updated Dependent Documents:
1. `docs/production/PRODUCTION-FOUNDATION.md`:
   - Replaced all unverified readiness language with strict status classification.
   - Parameterized domain topology and linked to ADR-PROD-001, ADR-PROD-002, and OWNER-DECISIONS.md.
2. `docs/production/LAUNCH-READINESS-MASTER-CHECKLIST.md`:
   - Standardized status header and cross-referenced owner decision records.
3. `docs/production/DEPLOYMENT-RUNBOOK.md`:
   - Updated prerequisites to mandate billing budget alerts and resolution of owner decisions before script execution.
   - Parameterized frontend domain and database tier variables.
4. `docs/production/PRODUCTION-VERIFICATION.md`:
   - Updated smoke tests to evaluate parameterized domain targets (`${FRONTEND_DOMAIN}`).
5. `docs/production/evidence/PREP-001-EVIDENCE.md`:
   - Corrected cost estimation language to require live pricing calculator verification.

---

## 2. Claims Corrected

| Previous / Problematic Claim | Corrected Language / Status | Reason for Correction |
|---|---|---|
| *"Repository is 100% production-ready."* | **"Repository preparation is complete. Production deployment remains blocked on GCP provisioning, DNS configuration, OAuth registration, and live verification."** | Accuracy & compliance: Local code preparation does not equate to live cloud production readiness. |
| *"Allows entire stack to run 100% within the $300 GCP Free Trial credits for the full 90-day duration."* | **"Sizing must be verified against live GCP calculator per ADR-PROD-002 before deployment. Status: PENDING COST VERIFICATION."** | Cloud SQL pricing varies by region, dynamic storage growth, and egress; unverified cost guarantees must not be made. |
| *Inconsistent apex vs subdomain description (`argonion.com` vs `app.argonion.com`)* | **Domain routing topology formally documented as Option A vs Option B in ADR-PROD-001 with status `OWNER DECISION REQUIRED`.** | Eliminates contradictory statements across documentation. |

---

## 3. Status Classifications Summary

All repository components and dependencies are categorized under six strict statuses:

* **Locally Verified**: Monorepo codebase, multi-stage Dockerfiles, Prisma schema/migrations, unit & integration test suites (2,256 tests passing), rate limiter, CORS logic.
* **Prepared but Unverified**: Terraform templates (`infra/gcp/terraform`), GCP deployment scripts (`infra/gcp/scripts`), GitHub Actions CI/CD workflows, HTTP security headers in Nginx.
* **Blocked until GCP**: GCP project creation, billing budget configuration, Cloud SQL provisioning, Secret Manager population, Cloud Run release.
* **Blocked until DNS**: Cloudflare CNAME record creation, DNSSEC DS record mapping, SPF/DKIM/DMARC email records, CAA records.
* **Blocked until OAuth Configuration**: Google Cloud OAuth and GitHub OAuth production client IDs and callback URL registration.
* **Pending Owner Decision / Cost Verification**: 8 active items in `OWNER-DECISIONS.md` (Domain routing, Cloud SQL sizing, Security contact email, GCP region, MX mail host, Edge topology, GCP owner, Support route).

---

## 4. Checks Performed

| Check | Scope | Result | Details |
|---|---|---|---|
| **Markdown Link & Syntax Audit** | `docs/production/**` | ✅ **PASS** | Validated relative file paths, ADR cross-references, and code block formatting. |
| **Monorepo Code Verification** | Root / Apps | ✅ **PASS** | Unchanged from PREP-001 baseline (Lint: 0 errors; Typecheck: 0 errors; Unit/Integration tests: 2,256/2,256 passing). |
| **Boundary Invariant Audit** | Email / Workspace | ✅ **PASS** | Frozen boundaries (`EMAIL-001` → `EMAIL-010`, Workspace architecture, Guest Experience) completely untouched. |

---

## 5. Next Recommended Task

1. **Product Owner Review**: Review and resolve the 8 decision items in [docs/production/OWNER-DECISIONS.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md).
2. **Cost Verification Gate**: Verify live pricing for the selected Cloud SQL machine tier in the chosen region using the Google Cloud Pricing Calculator.
3. **Infrastructure Provisioning**: Once owner approvals are recorded and the GCP project is created, execute Step 1 through Step 3 of [docs/production/DEPLOYMENT-RUNBOOK.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/DEPLOYMENT-RUNBOOK.md).
