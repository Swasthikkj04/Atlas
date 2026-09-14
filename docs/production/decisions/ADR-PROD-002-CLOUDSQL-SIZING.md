# ADR-PROD-002: Cloud SQL PostgreSQL 17 Sizing, Availability & Cost Gate

**Status**: **APPROVED BY PRODUCT OWNER**  
**Date**: 2026-09-12  
**Deciders**: Swasthik K J (Product Owner / Lead Engineer)  
**Scope**: Cloud SQL tier, multi-zone availability, storage sizing, and GCP budget constraints  

---

## 1. Context & Problem Statement

Google Cloud SQL for PostgreSQL 17 serves as the single authoritative persistence engine for the Nebula platform. The database instance stores workspace models, security findings, normalized snapshots, authentication state, and background worker job queues.

Initial infrastructure configurations specified a high-end enterprise tier (`db-custom-2-7680` with `REGIONAL` High Availability), which incurs estimated charges of **~$215–$230/month**. If a $300 Google Cloud Free Trial credit is utilized, this enterprise configuration would exhaust credits within approximately 22–25 days.

A cost gate was established to evaluate candidate tiers, establish pricing dependencies, enforce safety mechanisms, and select a balanced production tier.

---

## 2. Selected Tier Decision & Evaluation

* **Selected Cloud SQL Tier**: **Tier 2: `db-custom-1-3840` (1 vCPU, 3.75 GB RAM)**
* **Region**: `asia-south1` (Mumbai, India)
* **Storage Configuration**: 10 GB SSD with `disk_autoresize = true` (auto-expanding)
* **Backup Configuration**: Daily automated backups at `02:00 UTC` + 7-day Point-in-Time Recovery (PITR)
* **Availability / HA**: `ZONAL` (Single Zone; Multi-zone Regional HA deferred post-launch to conserve trial runway)
* **Expected Monthly Baseline**: ~$45.00 – $55.00 / month (Compute: ~$48.00/mo, Storage: ~$1.70/mo, Backups: ~$2.00/mo)
* **Trial Credit Impact**: Consumes ~$50/month of the $300 Free Trial credits, providing ~5–6 months of development/production runway.
* **Reason for Selection**: Provides dedicated vCPU and 3.75 GB RAM to comfortably handle Prisma migrations, connection pooling, and background worker loads without throttling risk of shared-core instances (`db-g1-small`), while remaining well under the $250 safety budget alert.

---

## 3. Mandatory Safety & Protection Requirements

1. **Deletion Protection**:
   ```hcl
   deletion_protection = true
   ```
   Must remain enabled in `infra/gcp/terraform/cloudsql.tf` and Google Cloud Console.
2. **Automated Backups & PITR**:
   Automated daily backups (02:00 UTC) with 7-day transaction log retention active on the production database.
3. **Billing Alerts & Budgets**:
   A GCP Billing Budget of **$250** with programmatic alerts at **50% ($125)**, **80% ($200)**, and **100% ($250)** configured with email notifications to `swasthik@argonion.com`.

---

## 4. Non-Destructive Scale-Up Path

When production traffic expands or after trial credits expire:
1. **Vertical Scale-Up**: Seamlessly upgrade machine tier from `db-custom-1-3840` (1 vCPU) to `db-custom-2-7680` (2 vCPU, 7.5GB RAM) via `gcloud sql instances patch nebula-prod-postgres --tier=db-custom-2-7680` (incurs ~2–3 min planned maintenance window).
2. **High Availability Transition**: Enable `REGIONAL` HA standby replica when monthly revenue justifies the ~$220/mo cost.
