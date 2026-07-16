# 02 - Product-Requirements.md

---

# Atlas Product Requirements Document (PRD)

**Product:** Atlas

**Version:** v0.1.0

**Document Status:** Approved for Sprint 0

**Related Document:** 01-Vision.md

---

# Product Overview

Atlas is an Infrastructure Intelligence Assistant that continuously understands public web infrastructure and helps engineering teams identify meaningful changes over time.

Unlike traditional infrastructure tools that present isolated metrics, Atlas focuses on delivering understanding.

Atlas answers one question:

> **What changed, and why should I care?**

---

# Product Goal

Build the first version of Atlas that enables users to understand the evolution of a website's public infrastructure through a simple, calm, and intelligent experience.

---

# Problem Statement

Engineering teams currently switch between multiple tools to understand their infrastructure.

Typical workflow:

* Check SSL
* Check DNS
* Check technologies
* Check performance
* Check HTTP headers
* Compare manually

This process is repetitive, fragmented, and time-consuming.

Atlas removes this friction by continuously watching infrastructure and surfacing only meaningful changes.

---

# Target Users

Primary Users

* Software Engineers
* DevOps Engineers
* Technical Leads
* Engineering Managers

Company Size

* 10–200 employees

Industries

* SaaS
* Software Agencies
* Technology Startups

---

# Success Metrics

Atlas V1 is successful if users can:

* Understand a website within one minute.
* See meaningful infrastructure changes without manual comparison.
* Return daily to review their Infrastructure Brief.
* Trust Atlas to monitor their websites.

---

# User Stories

## Guest User

As a visitor,

I want to understand any public website

without creating an account,

so that I can evaluate Atlas before committing.

---

## Registered User

As a registered user,

I want Atlas to remember my websites

and continuously watch them,

so I no longer need to check everything manually.

---

## Engineering Team

As an engineer,

I want to know only what changed,

so I can investigate faster.

---

# Functional Requirements

## FR-001 Guest Understanding

Users can understand any public website without logging in.

Guest sessions are temporary.

No history is stored.

---

## FR-002 User Accounts

Users can:

* Register
* Login
* Logout

Accounts enable:

* Saved domains
* Infrastructure history
* Continuous monitoring

---

## FR-003 Workspace

After login,

users enter their personal Workspace.

The Workspace presents:

* Daily Infrastructure Brief
* Watched domains
* Recent changes
* Timeline

Atlas should never overwhelm users with unnecessary widgets.

---

## FR-004 Add Domain

Users can add one or more public domains.

Example:

* example.com
* github.com
* company.io

---

## FR-005 Infrastructure Understanding

Atlas collects public infrastructure information including:

* DNS
* SSL Certificate
* HTTP Headers
* Response Time
* Technologies
* Redirect Chain

Each understanding creates a historical snapshot.

### Registered Infrastructure Understanding

Registered users can manually trigger an infrastructure understanding for any domain they own.

A manual understanding always performs a fresh infrastructure analysis regardless of previous understandings.

Each manual understanding creates a complete historical understanding cycle consisting of:

* Understanding Job
* Infrastructure Snapshot
* Infrastructure Findings
* Infrastructure Comparison
* Infrastructure Brief

Atlas does not overwrite previous understandings.

Instead, each execution contributes to the domain's historical knowledge, enabling Atlas to identify and explain infrastructure evolution over time.

### Automatic Monitoring

Domains with monitoring enabled may be periodically understood in the background according to the configured monitoring schedule.

Automatic monitoring follows the same understanding pipeline as manual understandings.

The only difference is the trigger source.

Future versions of Atlas may introduce configurable monitoring frequencies such as:

* Manual Only
* Daily
* Twice Daily
* Hourly

Scheduling policies are intentionally excluded from Version 1 to keep the initial product focused and simple.


---

## FR-006 Change Detection

Atlas compares new snapshots with previous ones.

Users should never compare raw data manually.

Atlas identifies:

* Added technologies
* Removed technologies
* SSL changes
* DNS changes
* Performance changes
* Security header changes

---

## FR-007 Infrastructure Timeline

Each domain has a chronological history.

Example:

July 14

↓

SSL Renewed

↓

July 16

↓

HTTP/3 Enabled

↓

July 20

↓

Performance Decreased

---

## FR-008 Infrastructure Brief

Whenever users return,

Atlas summarizes important changes.

Example:

Good Morning.

While you were away...

• Performance decreased by 8%

• SSL expires in 14 days

• CDN changed

Everything else remains healthy.

---

## FR-009 Guest Conversion

Guest users may freely understand websites.

When they wish to preserve understanding,

Atlas politely offers:

> Would you like Atlas to remember this for you?

Creating an account unlocks persistence rather than access.

---

# Non-Functional Requirements

Atlas must be:

* Fast
* Calm
* Reliable
* Understandable
* Secure
* Responsive

The interface should feel minimal and intentional.

---

# User Experience Requirements

Atlas follows these principles:

* One primary action per screen.
* Progressive disclosure.
* Meaningful motion.
* Calm visual design.
* Human language.
* Minimal cognitive load.

---

# Product Language

Atlas avoids technical terminology wherever possible.

Preferred vocabulary:

* Understand
* Remember
* Watch
* Explain
* Workspace
* Timeline
* Insight

Avoid:

* Scan
* Dashboard
* Report
* Execute
* Process

---

# Out of Scope (Version 1)

The following features are intentionally excluded from Atlas V1.

* AI Chat Assistant
* Team Collaboration
* Billing
* Browser Extension
* GitHub Integration
* Kubernetes Monitoring
* Slack Integration
* Email Alerts
* SEO Analysis
* Accessibility Analysis
* Mobile Application
* Plugin Marketplace
* Public API

These ideas belong to future versions.

---

# Acceptance Criteria

Atlas V1 is considered complete when a user can:

1. Open Atlas without creating an account.
2. Understand any public website.
3. Create an account only after experiencing value.
4. Add domains to a personal Workspace.
5. View historical infrastructure changes.
6. Receive a Daily Infrastructure Brief.
7. Understand what changed and why.

---

# Product Principles

Every feature added to Atlas must satisfy all of the following:

* Solves a real user problem.
* Reinforces the product vision.
* Reduces manual investigation.
* Keeps the interface calm.
* Earns its place in the product.
* Can be explained in one sentence.

If a feature fails these principles,

it does not belong in Atlas V1.

---

# MVP Definition

Atlas V1 is complete when users trust Atlas to quietly watch their public web infrastructure and surface only the changes that matter.

The objective is not to build the biggest infrastructure platform.

The objective is to build the most understandable one.

---

### Smart Refresh Protection

If a domain was understood recently (for example, within the last five minutes), Atlas informs the user before starting another understanding.

Example:

"This domain was understood 2 minutes ago. Running another understanding may produce identical results."

Users remain in full control and may continue if desired.

Atlas informs rather than restricts.

---

### Automatic Monitoring

When monitoring is enabled, Atlas periodically performs infrastructure understandings in the background according to the configured monitoring schedule.

Automatic understandings follow the same processing pipeline as manual understandings.

The only difference is the trigger source.

---

### Future Monitoring Frequencies

Future versions of Atlas may support configurable monitoring schedules such as:

- Manual Only
- Daily
- Twice Daily
- Hourly

These capabilities are intentionally outside Version 1.

### Smart Refresh Behaviour

Atlas informs users when a domain has been understood recently.

If a manual understanding is requested shortly after a previous understanding, Atlas may display a message similar to:

> "This domain was understood recently. Running another understanding may produce identical results."

Users remain in full control and may choose to continue.

Atlas informs rather than restricts.

This behaviour reflects the platform's Trust by Design philosophy.

### Historical Infrastructure Timeline

Atlas continuously builds historical knowledge rather than replacing previous observations.

Every completed understanding becomes part of the domain's historical timeline.

Historical understandings enable Atlas to answer questions such as:

* What changed?
* When did it change?
* How has the infrastructure evolved?
* What differences exist between two understandings?

Historical observations are immutable and remain available for future comparison and analysis.

### Infrastructure Brief

Every completed infrastructure understanding generates an Infrastructure Brief.

The Infrastructure Brief provides a concise, human-readable explanation of the observed infrastructure state.

Rather than presenting only technical findings, Atlas summarizes the understanding in natural language, allowing users to quickly understand significant technologies, infrastructure characteristics, and detected changes.

Infrastructure Briefs become part of the domain's historical timeline and are preserved alongside the corresponding Infrastructure Snapshot.
