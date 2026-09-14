# ADR-PROD-006: Production Public Support & Security Contact Channels

**Status**: **APPROVED BY PRODUCT OWNER**  
**Decision Date**: 2026-09-12  
**Deciders**: Swasthik K J (Product Owner / Lead Engineer)  
**Scope**: Public communication routes, RFC 9116 security disclosure, support channels, and legal contact points  

---

## 1. Context & Problem Statement

To satisfy regulatory compliance, user support requirements, and cybersecurity standards (RFC 9116), the Nebula platform must publish authoritative public contact channels for:
1. Vulnerability disclosures and security defect reports.
2. User account support, bug reports, and billing inquiries.
3. Corporate, partnership, and media inquiries.

These channels must be uniform across legal terms, web interfaces, and security manifests while forwarding safely to an owner-controlled destination inbox via Cloudflare Email Routing.

---

## 2. Approved Public Contact Matrix

| Channel / Alias | Primary Function | Publication Locations | Backend Forwarding |
| :--- | :--- | :--- | :--- |
| **`security@argonion.com`** | **RFC 9116 Vulnerability Disclosure & Threat Reports** | `apps/web/public/.well-known/security.txt`, `/security` page | Cloudflare Email Routing → Owner-controlled destination inbox |
| **`support@argonion.com`** | **User Assistance, Incident Inquiries, Privacy Requests** | `/terms`, `/privacy`, `/contact`, in-app help modal | Cloudflare Email Routing → Owner-controlled destination inbox |
| **`hello@argonion.com`** | **General Inquiries, Partnerships, Press** | Landing page footer (`argonion.com`), `/about` | Cloudflare Email Routing → Owner-controlled destination inbox |

---

## 3. RFC 9116 `security.txt` Specification

The security disclosure policy file at `apps/web/public/.well-known/security.txt` is updated to publish the official alias:

```text
Contact: mailto:security@argonion.com
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://argonion.com/.well-known/security.txt
Policy: https://argonion.com/security
Hiring: https://argonion.com/careers
```

---

## 4. Privacy & Operational Invariants

1. **Destination Inbox Confidentiality**: The real destination address (e.g., personal administrative inbox) is never committed to GitHub, exposed via API responses, or listed in client-side bundles.
2. **Forwarding Verification**: The destination inbox must confirm receipt of Cloudflare verification emails upon initial DNS activation.
3. **Outbound Responses**: When responding to users or security researchers, the owner may reply directly from the destination inbox or configure email alias sending in their mail client.

---

## 5. Decision Status & Approvals

**Status**: **APPROVED BY PRODUCT OWNER**  
**Resolution**: The trio of aliases (`security@`, `support@`, `hello@argonion.com`) handled via Cloudflare Email Routing is established as the official public contact standard.
