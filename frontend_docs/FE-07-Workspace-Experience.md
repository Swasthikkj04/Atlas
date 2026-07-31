# FE-07: Authenticated Workspace Experience

## 1. Objective
Defines the authenticated user workspace, dashboard layouts, domain monitoring controls, infrastructure briefs, findings inspection, and active session management.

## 2. Dashboard Layout & Navigation
* **Sidebar Navigation:** Workspace Home, Monitored Domains, Infrastructure Briefs, Findings Explorer, Active Device Sessions, Settings.
* **Top Navbar:** Workspace Selector, Global Search Trigger, Security Alert Counter, User Profile Menu.

## 3. Session Management UI (AUTH-003)
* Displays active device sessions (`GET /api/v1/auth/sessions`).
* Shows device icon, browser, operating system, IP address, and last activity time.
* Provides **Revoke Session** button for individual devices and **Logout All Devices** button for global session termination.
