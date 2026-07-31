# FE-06: Guest User Experience & Conversion Journey

## 1. Objective
Details the anonymous guest flow (GP-001 through GP-006): domain discovery, real-time understanding job polling, findings rendering, and seamless conversion into a permanent workspace.

## 2. Product Philosophy: Persistence over Repetition
```
Discover Domain
       │
       ▼
Analyze & Understand Infrastructure (Guest Session Token)
       │
       ▼
View Findings & AI Infrastructure Brief
       │
       ▼
Convert to Workspace (POST /api/v1/guest/convert)
       │
       ▼
Open Permanent Nebula Workspace (Domain Data Maintained)
```

## 3. Real-Time Understanding Job Polling
* Polling `GET /api/v1/guest/status` every 2 seconds during active understanding jobs.
* Renders progress indicators, active collectors (HTML, DNS, TLS), and live log output.
