# S-11: Subdomain Discovery & Perimeter Expansion Engine

## 1. Overview & Architecture

The **Subdomain Discovery & Perimeter Expansion Engine** delivers enterprise-grade Attack Surface Management (ASM) by actively discovering perimeter assets, identifying dangling CNAME and SaaS takeover vulnerabilities, and classifying environments across production and non-production domains.

```
                         ┌─────────────────────────────────────────┐
                         │       SubdomainDiscoveryService         │
                         │  - Wildcard DNS Probing & Filtering     │
                         │  - Wordlist Dictionary Prober (Top 40)  │
                         │  - TLS SAN & DNS Record Harvester       │
                         └────────────────────┬────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
        ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
        │ Active DNS Resolution │ │ SubdomainTakeover     │ │ Environment           │
        │ - Concurrent A/AAAA   │ │ AnalyzerService       │ │ Classifier            │
        │ - CNAME Resolution    │ │ - 17 Cloud Signatures │ │ - PROD vs NON-PROD    │
        │ - SSRF IP Filtering   │ │ - Dangling CNAME Risk │ │ - DEV / STAGING / INT │
        └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

## 2. Discovery Capabilities

1. **DNS Wildcard Detection & Anti-Collision Filtering**:
   - Sends randomized canary queries (e.g. `atlas-wc-<random-hex>.<domain>`).
   - If resolved, captures wildcard IPs and suppresses synthetic domain collisions.
2. **Multi-Source Enumeration Pipeline**:
   - **DNS Bruteforce**: Top 40 high-value attack surface targets (`api`, `app`, `auth`, `admin`, `dev`, `staging`, `portal`, `vpn`, `corp`, `internal`, `k8s`, `ingress`, `gateway`, `vault`, etc.).
   - **TLS Certificate Subject Alternative Names (SAN)**: Harvests certificates from apex and discovered hosts to find additional fully-qualified domain names.
   - **DNS Record Aggregation**: Extracts targets from CNAME, MX, and TXT records.
3. **SSRF & Address Safety**:
   - Enforces strict SSRF protection by filtering out private/restricted IP ranges before initiating subsequent HTTP or TLS probes.

---

## 3. Subdomain Takeover Vulnerability Signatures

The engine contains deep pattern matching and unclaimed fingerprint detection for 17 major cloud services:

| Cloud Provider | Service Category | Signature Pattern | Unclaimed Fingerprint |
| :--- | :--- | :--- | :--- |
| **AWS S3** | Cloud Storage | `s3*.amazonaws.com` | `NoSuchBucket`, `The specified bucket does not exist` |
| **GitHub Pages** | Static Hosting | `*.github.io` | `There isn't a GitHub Pages site here` |
| **Heroku** | PaaS | `*.herokuapp.com`, `*.herokudns.com` | `No such app` |
| **Azure App Service** | Cloud App | `*.azurewebsites.net`, `*.cloudapp.net` | `404 Web Site not found` |
| **Azure Traffic Manager** | Traffic Routing | `*.trafficmanager.net`, `*.azureedge.net` | Unresolved pointer |
| **Surge.sh** | Static Hosting | `*.surge.sh` | `project not found` |
| **Readme.io** | Documentation | `*.readme.io` | `Project doesnt exist` |
| **Ghost CMS** | Managed Blog | `*.ghost.io` | `The thing you were looking for is no longer here` |
| **Shopify** | E-commerce | `*.myshopify.com` | `Sorry, this shop is currently unavailable` |
| **Netlify** | Jamstack Hosting | `*.netlify.app` | `Not Found - Request ID:` |
| **Fastly** | Edge CDN | `*.fastly.net` | `Fastly error: unknown domain` |

---

## 4. Environment Classification Hierarchy

- **`PRODUCTION`**: `api.*`, `app.*`, `auth.*`, `login.*`, `www.*`, `cdn.*`, `status.*`, `gateway.*`, `ws.*`
- **`STAGING`**: `staging.*`, `stage.*`, `qa.*`, `uat.*`, `test.*`, `preview.*`, `preprod.*`, `demo.*`
- **`DEVELOPMENT`**: `dev.*`, `development.*`, `sandbox.*`, `local.*`, `poc.*`
- **`INTERNAL`**: `internal.*`, `corp.*`, `vpn.*`, `admin.*`, `grafana.*`, `k8s.*`, `vault.*`
- **`DEPRECATED`**: `legacy.*`, `old.*`, `deprecated.*`, `v1-old.*`, `backup.*`

---

## 5. API Endpoints

- `GET /api/v1/domains/:id/subdomains`: Retrieves cached or discovered subdomains, environment distribution, and takeover risks.
- `POST /api/v1/domains/:id/subdomains/scan`: Initiates on-demand active perimeter enumeration.

---

## 6. Frontend Visual Experience

- **Contract**: [`subdomain-attack-surface.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/contracts/subdomain-attack-surface.contract.ts)
- **Component**: [`SubdomainAttackSurfaceCard.tsx`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/components/attack-surface/SubdomainAttackSurfaceCard.tsx)
  - Interactive inventory table with live search and environment filtering.
  - Metrics cards displaying asset counts, non-production exposure, takeover risk severity, and wildcard DNS state.
  - Visual status badges for TLS encryption, CNAME targets, and cloud takeover alerts.

---

## 7. Verification & Test Suite Metrics

- **Subdomain Discovery Unit Test Suites**: 3 passed (17 tests)
- **Full Backend Test Suite**: **261 passed, 0 failed (2,102 total tests)**
- **Full Frontend Test Suite**: **1,078 passed, 0 failed (1,920 total tests)**
- **Compilation**: 0 TypeScript errors across both `apps/api` and `apps/web`.
