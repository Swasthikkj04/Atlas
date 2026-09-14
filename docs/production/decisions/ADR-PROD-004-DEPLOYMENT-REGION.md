# ADR-PROD-004: Production Google Cloud Deployment Region Selection

**Status**: **APPROVED BY PRODUCT OWNER: `asia-south1` (Mumbai, India)**  
**Date**: 2026-09-12  
**Deciders**: Swasthik K J (Product Owner / Lead Engineer)  
**Scope**: Primary Google Cloud region for Cloud Run, Cloud SQL PostgreSQL 17, Secret Manager, Artifact Registry, and Serverless VPC Access  

---

## 1. Context & Problem Statement

Google Cloud operates dozens of geographical regions globally. All core production infrastructure components (`nebula-prod-api`, `nebula-prod-worker`, `nebula-prod-web`, and `nebula-prod-postgres`) must reside in the same primary region to eliminate inter-region latency and cross-region egress fees.

The Product Owner selected **`asia-south1` (Mumbai, India)** as the target production region.

---

## 2. Regional Verification Findings: `asia-south1` vs `us-central1`

| Evaluation Criteria | `asia-south1` (Mumbai) [Approved] | `us-central1` (Iowa) [Alternative] | Verification Finding |
|---|---|---|---|
| **End-User Latency (India / APAC)** | **~10 – 35 ms** | ~200 – 260 ms | Dramatic 85%+ latency reduction for primary target users. |
| **End-User Latency (US / EU)** | ~180 – 220 ms | **~20 – 60 ms** | Cloudflare Edge CDN caches static assets globally; API origin requests routed via Anycast. |
| **Cloud Run Gen2 Availability** | **Supported** (Tier 1 Region) | Supported (Tier 1 Region) | Gen2 execution environment fully supported in `asia-south1`. |
| **Cloud SQL PostgreSQL 17** | **Supported** | Supported | Full private IP, PITR, SSD, and custom vCPU/RAM support in `asia-south1`. |
| **Serverless VPC Access** | **Supported** (`/28` connector) | Supported (`/28` connector) | Low-latency private VPC connector supported. |
| **Secret Manager & Artifact Registry** | **Supported** | Supported | Full regional availability. |
| **Compute & DB Pricing** | ~$50–$60/mo total baseline | ~$45–$55/mo total baseline | Negligible ~$5–$8/mo variance; well within the $250 safety budget. |

---

## 3. Decision Output & Regional Commitment

* **Decision**: **APPROVED: `asia-south1` (Mumbai, India)**
* **Justification**: The 15–35ms sub-second latency for South Asian users provides a superior user experience, while the small regional pricing delta is easily accommodated by the $300 Free Trial credits and $250 safety budget alert.
* **Fallback Region**: If unexpected regional capacity exhaustion occurs during live provisioning, fallback to `us-central1` is documented in `GCP-PROJECT-BOOTSTRAP.md`.
