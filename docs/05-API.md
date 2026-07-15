# 05 - API-Specification.md

---

# Atlas API Specification

**Product:** Atlas

**Version:** v0.1.0

**API Style:** REST

**Data Format:** JSON

**Authentication:** JWT (Version 1)

**Status:** Sprint 0 – Approved

**Related Documents**

* 01-Vision.md
* 02-Product-Requirements.md
* 03-System-Architecture.md
* 04-Database-Design.md

---

# Overview

Atlas exposes a REST API that connects the frontend Workspace with the backend services.

The API is responsible for:

* Authentication
* Domain management
* Understanding requests
* Historical timeline
* Infrastructure Brief
* Workspace data

The frontend never communicates directly with the database.

---

# API Design Principles

Atlas APIs follow these principles.

* Stateless
* Predictable
* RESTful
* Human-readable
* Versioned
* Secure

All responses use JSON.

Future API versions will be exposed under:

```text
/api/v1
```

---

# Authentication APIs

## Register

**POST**

```text
/api/v1/auth/register
```

Purpose

Create a new Atlas account.

Request

```json
{
  "name": "Swasthik Gowda",
  "email": "user@example.com",
  "password": "********"
}
```

Response

```json
{
  "success": true,
  "message": "Account created successfully."
}
```

---

## Login

**POST**

```text
/api/v1/auth/login
```

Request

```json
{
  "email": "user@example.com",
  "password": "********"
}
```

Response

```json
{
  "token": "<jwt_token>",
  "user": {
    "id": 1,
    "name": "Swasthik Gowda"
  }
}
```

---

## Current User

**GET**

```text
/api/v1/auth/me
```

Returns the authenticated user's profile.

---

## Logout

**POST**

```text
/api/v1/auth/logout
```

Invalidates the current session on the client.

---

# Guest Understanding API

## Start Guest Understanding

**POST**

```text
/api/v1/guest/understand
```

Purpose

Allows visitors to understand a public website without creating an account.

Request

```json
{
  "domain": "github.com"
}
```

Response

```json
{
  "jobId": "job_12345",
  "status": "started"
}
```

Guest reports are temporary.

---

# Understanding APIs

## Start Understanding

**POST**

```text
/api/v1/domains/{domainId}/understand
```

Purpose

Begins a new understanding job.

Response

```json
{
  "jobId": "job_98765",
  "status": "running"
}
```

---

## Understanding Progress

**GET**

```text
/api/v1/jobs/{jobId}
```

Example Response

```json
{
  "status": "running",
  "progress": 62,
  "currentStep": "Understanding SSL"
}
```

The frontend uses this endpoint (or future WebSockets) to display live progress.

---

## Understanding Result

**GET**

```text
/api/v1/jobs/{jobId}/result
```

Returns the completed understanding.

---

# Workspace APIs

## Workspace Home

**GET**

```text
/api/v1/workspace
```

Returns:

* Infrastructure Brief
* Watched domains
* Recent changes
* Workspace summary

---

## Daily Infrastructure Brief

**GET**

```text
/api/v1/workspace/brief
```

Example

```json
{
  "message": "While you were away...",
  "changes": 3,
  "healthy": 7
}
```

---

# Domain APIs

## List Domains

**GET**

```text
/api/v1/domains
```

Returns every watched domain.

---

## Add Domain

**POST**

```text
/api/v1/domains
```

Request

```json
{
  "domain": "example.com"
}
```

Response

```json
{
  "message": "Domain added successfully."
}
```

---

## Remove Domain

**DELETE**

```text
/api/v1/domains/{domainId}
```

Removes a watched domain.

---

## Domain Details

**GET**

```text
/api/v1/domains/{domainId}
```

Returns:

* Current understanding
* Latest snapshot
* Status
* Timeline summary

---

# Timeline APIs

## Timeline

**GET**

```text
/api/v1/domains/{domainId}/timeline
```

Returns chronological infrastructure events.

Example

```json
[
  {
    "date": "2026-07-14",
    "title": "SSL Certificate Renewed"
  },
  {
    "date": "2026-07-20",
    "title": "HTTP/3 Enabled"
  }
]
```

---

# Snapshot APIs

## Latest Snapshot

**GET**

```text
/api/v1/domains/{domainId}/snapshot/latest
```

Returns the most recent infrastructure snapshot.

---

## Snapshot History

**GET**

```text
/api/v1/domains/{domainId}/snapshots
```

Returns historical snapshots.

---

# Change APIs

## Recent Changes

**GET**

```text
/api/v1/domains/{domainId}/changes
```

Returns detected infrastructure changes.

Example

```json
[
  {
    "severity": "medium",
    "title": "Performance decreased by 8%",
    "reason": "JavaScript bundle increased"
  }
]
```

---

# Health API

## API Health

**GET**

```text
/api/v1/health
```

Purpose

Allows deployment platforms and monitoring systems to verify that Atlas is running.

Example Response

```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

---

# HTTP Status Codes

Atlas follows standard HTTP status codes.

| Code | Meaning               |
| ---: | --------------------- |
|  200 | Success               |
|  201 | Resource Created      |
|  400 | Invalid Request       |
|  401 | Unauthorized          |
|  403 | Forbidden             |
|  404 | Resource Not Found    |
|  409 | Conflict              |
|  422 | Validation Error      |
|  429 | Too Many Requests     |
|  500 | Internal Server Error |

---

# Error Response Format

Every error follows the same structure.

```json
{
  "success": false,
  "error": {
    "code": "DOMAIN_NOT_REACHABLE",
    "message": "The website could not be reached."
  }
}
```

---

# API Versioning

All public endpoints include an API version.

Example

```text
/api/v1
```

Future breaking changes will be introduced using new versions such as:

```text
/api/v2
```

without affecting existing clients.

---

# Future APIs (Not Version 1)

The following endpoints are intentionally excluded from Atlas V1.

* Team Management
* Notifications
* AI Assistant
* Billing
* Plugin Marketplace
* Integrations
* Public Developer API
* Webhooks

These features belong to future releases.

---

# API Summary

The Atlas API is designed around one responsibility:

Transform infrastructure understanding into a clean, predictable interface that allows the frontend to present meaningful insights without exposing backend complexity.

Every endpoint ultimately supports Atlas's core promise:

> **Know what changed. Understand why.**
