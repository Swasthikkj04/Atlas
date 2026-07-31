# FE-13: Implementation Guide & Engineering Conventions

## 1. Objective
Defines engineering conventions, file naming standards, component directory patterns, and coding practices.

## 2. Directory Structure Blueprint
```
apps/web/src/
├── components/          # Shared presentational UI design system components
├── features/            # Feature-driven modules (auth, guest, workspace, domains)
│   ├── auth/
│   ├── guest/
│   └── workspace/
├── hooks/               # Custom React utility hooks
├── services/            # API client and server communication services
├── styles/              # Global CSS custom properties and token variables
└── types/               # Shared TypeScript data models and interfaces
```

## 3. Naming & Coding Conventions
* **Components:** PascalCase (`GlassCard.tsx`, `SeverityBadge.tsx`).
* **Hooks:** camelCase starting with `use` (`useAuthSession.ts`, `useGuestJob.ts`).
* **Utilities/Services:** camelCase (`apiClient.ts`, `formatDate.ts`).
