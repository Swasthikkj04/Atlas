# FE-09: Client-Side State Architecture

## 1. Objective
Defines client-side state distribution across Server State (React Query), Global App State (Context/Zustand), and Local Component State.

## 2. State Categorization & Distribution

| State Category | Storage Mechanism | Examples |
| :--- | :--- | :--- |
| **Server State** | TanStack Query | User profile, domain list, findings, sessions, briefs |
| **Global UI State** | React Context / Zustand | Dark/Light theme, sidebar collapsed state, active toast alerts |
| **Transient Form State** | React `useState` / Formik | Registration inputs, login form fields, search filter queries |
| **Guest Job State** | Session Storage / Query State | Active guest session token, live collector log buffer |

## 3. Guiding Rules
* **No Server State Mirroring:** Never duplicate React Query data into local `useState` or Redux/Zustand stores.
* **Immutability & Safety:** All global state updates must use immutable updater functions.
