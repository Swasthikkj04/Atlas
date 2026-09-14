# Resend Outbound Email Production Plan

**Product**: Nebula Intelligence Platform (under Argonion)  
**Sending Domain**: `argonion.com`  
**Provider**: Resend API (`https://api.resend.com`)  
**Implementation Standard**: Frozen Email Platform (`EMAIL-001` → `EMAIL-010`) & Welcome Email ([`AUTH-EMAIL-001`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md))  
**Document Status**: **READY FOR DOMAIN PROVISIONING (GATES CLOSED VIA PROD-001)**  
**Governing Decisions**: [OD-02](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-02-inbound-email-routing), [OD-03](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-03-outbound-email-identity--resend-senders)  
**Last Updated**: 2026-09-12  

---

## 1. Outbound vs Inbound Email Decoupling

Per [ADR-PROD-003](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md) and [OD-03](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-03-outbound-email-identity--resend-senders), email responsibilities are strictly separated:

* **Inbound Mail (MX Records)**: Handled exclusively by **Cloudflare Email Routing** forwarding `security@`, `support@`, and `hello@argonion.com` to the Product Owner's private destination inbox.
* **Outbound Mail (Transactional API)**: Handled exclusively via **Resend REST API** (`ResendEmailProvider`) over HTTPS (Port 443).

```
                                  EMAIL ARCHITECTURE
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            │                                                           │
            ▼                                                           ▼
 [ INBOUND EMAIL ROUTING ]                                  [ OUTBOUND TRANSACTIONAL ]
 - Provider: Cloudflare Email Routing                       - Provider: Resend API
 - Inbound MX: isaac/linda/amir.mx.cloudflare.net           - Transport: HTTPS REST API (Port 443)
 - Aliases:                                                 - Senders:
   * security@argonion.com                                    * no-reply@argonion.com (System)
   * support@argonion.com                                     * Swasthik K J <swasthik@argonion.com> (Welcome)
   * hello@argonion.com                                     - Reply-To: support@argonion.com
 - Forwarding: Owner-Controlled Private Destination Inbox   - Templates: Verification, Reset, Welcome
```

---

## 2. Sender Identity & Address Governance

| Template / Email Type | From Header | Reply-To Header | Trigger Condition | Idempotency Key Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Account Verification** | `Nebula <no-reply@argonion.com>` | `support@argonion.com` | Email/password registration or resend request | N/A (Token based) |
| **Password Reset** | `Nebula <no-reply@argonion.com>` | `support@argonion.com` | Password reset request | N/A (Token based) |
| **Reset Confirmation** | `Nebula <no-reply@argonion.com>` | `support@argonion.com` | Successful password reset completion | N/A |
| **Personal Welcome** | `Swasthik K J <swasthik@argonion.com>` | `support@argonion.com` | First-time account creation (Password or OAuth Case D) | `welcome-email:{userId}` |

---

## 3. Resend Domain Verification Protocol

> [!IMPORTANT]
> **Do Not Guess DNS Values**: Resend assigns dedicated DKIM public keys and SPF include paths upon adding a domain in the Resend Dashboard. Exactly one SPF record must exist on the root domain.

### Step-by-Step Domain Registration
1. Log in to [Resend Dashboard](https://resend.com/domains).
2. Click **Add Domain** and enter `argonion.com`.
3. Select Region (e.g. `ap-southeast-1` or `us-east-1`).
4. Copy the exact generated records into Cloudflare DNS:
   - **DKIM Record**: Type `TXT` (or `CNAME`), Name `resend._domainkey.argonion.com`, Value *[from Resend]*
   - **SPF Record**: Type `TXT`, Name `argonion.com` (or `bounces.argonion.com`), Value *[from Resend]*
   - **Return-Path Record**: Type `MX` / `CNAME`, Name `bounces.argonion.com`, Value *[from Resend]*
5. Click **Verify Domain** in Resend Dashboard. Status must transition to **Verified**.

---

## 4. Environment Variables & Secret Configuration

Bound in `nebula-prod-api` via Secret Manager:

```ini
# Email Engine Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=projects/argonion-nebula-prod/secrets/nebula-resend-api-key/versions/latest

# System Sender Configuration
EMAIL_FROM=no-reply@argonion.com
EMAIL_REPLY_TO=support@argonion.com

# Personal Welcome Email Configuration (AUTH-EMAIL-001)
EMAIL_FROM_NAME="Swasthik K J"
EMAIL_FROM_ADDRESS=swasthik@argonion.com
NEBULA_APP_URL=https://nebula.argonion.com
```

---

## 5. Reliability & Duplicate Protection Architecture

1. **DB-Backed Delivery Records (`email_delivery_records`)**:
   - Every welcome email is recorded in the PostgreSQL database with unique index `idempotencyKey` (`welcome-email:${userId}`).
   - Lifecycle: `PENDING` → `ATTEMPTED` → `SENT` (or `FAILED`).
   - If marked `SENT`, duplicate calls return early without invoking Resend API.
2. **Non-Blocking Fault Tolerance**:
   - Email dispatch calls in [`AuthService`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/services/auth.service.ts) and [`OAuthIdentityResolver`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/auth/resolvers/oauth-identity.resolver.ts) are wrapped in `.catch(() => null)`.
   - Email delivery issues (e.g. Resend network blip or quota limit) will never fail a user registration, login, or password reset transaction.
3. **Quota & Rate Limits**:
   - Resend Free Tier allows **100 emails/day** (3,000/month).
   - Rate limit: 10 emails/sec.
   - When production traffic approaches 80 emails/day, the operator must upgrade to Resend Pro ($20/mo for 50k emails/mo).
