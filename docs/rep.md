.
├── apps
│   ├── api
│   │   ├── apps
│   │   │   └── api
│   │   │       └── src
│   │   │           └── infrastructure
│   │   │               └── discovery
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── eslint.config.mjs
│   │   ├── .gitignore
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── .prettierrc
│   │   ├── prisma
│   │   │   ├── migrations
│   │   │   │   ├── 20260717113719_init
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260718043514_add_snapshot_payload
│   │   │   │   │   └── migration.sql
│   │   │   │   └── migration_lock.toml
│   │   │   └── schema.prisma
│   │   ├── README.md
│   │   ├── src
│   │   │   ├── app.module.ts
│   │   │   ├── common
│   │   │   │   └── interfaces
│   │   │   │       ├── authenticated-request.interface.ts
│   │   │   │       └── authenticated-user-interface.ts
│   │   │   ├── config
│   │   │   │   └── auth.config.ts
│   │   │   ├── infrastructure
│   │   │   │   ├── database
│   │   │   │   ├── discovery
│   │   │   │   │   ├── collector
│   │   │   │   │   │   └── discovery-collector.interface.ts
│   │   │   │   │   ├── contracts
│   │   │   │   │   │   ├── discovery-module.interface.ts
│   │   │   │   │   │   ├── discovery-module-name.type.ts
│   │   │   │   │   │   └── discovery-snapshot.interface.ts
│   │   │   │   │   ├── discovery-analyzer-result.interface.ts
│   │   │   │   │   ├── discovery.module.ts
│   │   │   │   │   ├── dns
│   │   │   │   │   │   ├── dns-discovery.service.ts
│   │   │   │   │   │   └── dns.module.ts
│   │   │   │   │   ├── http
│   │   │   │   │   │   ├── http-discovery.service.ts
│   │   │   │   │   │   └── http.module.ts
│   │   │   │   │   ├── registry
│   │   │   │   │   │   ├── collector-registry.service.ts
│   │   │   │   │   │   └── discovery-registry.service.ts
│   │   │   │   │   ├── ssl
│   │   │   │   │   │   ├── ssl-discovery.service.ts
│   │   │   │   │   │   └── ssl.module.ts
│   │   │   │   │   └── technology
│   │   │   │   │       ├── technology-discovery.service.ts
│   │   │   │   │       └── technology.module.ts
│   │   │   │   ├── logger
│   │   │   │   └── prisma
│   │   │   │       ├── prisma.module.ts
│   │   │   │       └── prisma.service.ts
│   │   │   ├── main.ts
│   │   │   └── modules
│   │   │       ├── auth
│   │   │       │   ├── auth.controller.ts
│   │   │       │   ├── auth.module.ts
│   │   │       │   ├── dto
│   │   │       │   │   ├── auth-response.dto.ts
│   │   │       │   │   ├── login.dto.ts
│   │   │       │   │   ├── register.dto.ts
│   │   │       │   │   └── user-response.dto.ts
│   │   │       │   ├── guards
│   │   │       │   │   └── jwt-auth.guard.ts
│   │   │       │   ├── services
│   │   │       │   │   ├── auth.service.ts
│   │   │       │   │   ├── password.service.spec.ts
│   │   │       │   │   └── password.service.ts
│   │   │       │   └── strategies
│   │   │       │       └── jwt.strategy.ts
│   │   │       ├── domains
│   │   │       │   ├── domains.controller.ts
│   │   │       │   ├── domains.module.ts
│   │   │       │   ├── domains.service.ts
│   │   │       │   ├── dto
│   │   │       │   │   ├── create-domain.dto.ts
│   │   │       │   │   └── domain-response.dto.ts
│   │   │       │   └── repositories
│   │   │       │       └── domains.repository.ts
│   │   │       ├── health
│   │   │       │   ├── health.controller.ts
│   │   │       │   ├── health.module.ts
│   │   │       │   └── health.service.ts
│   │   │       ├── infrastructure-snapshots
│   │   │       │   ├── infrastructure-snapshots.module.ts
│   │   │       │   ├── repositories
│   │   │       │   │   └── infrastructure-snapshot.repository.ts
│   │   │       │   └── services
│   │   │       │       └── infrastructure-snapshot.service.ts
│   │   │       ├── understanding
│   │   │       │   ├── dto
│   │   │       │   ├── repositories
│   │   │       │   │   └── understanding.repository.ts
│   │   │       │   ├── understanding.controller.ts
│   │   │       │   ├── understanding.engine.ts
│   │   │       │   ├── understanding.module.ts
│   │   │       │   ├── understanding.service.ts
│   │   │       │   └── understanding.worker.ts
│   │   │       └── users
│   │   │           ├── repositories
│   │   │           │   └── users.repository.ts
│   │   │           ├── users.module.ts
│   │   │           └── users.service.ts
│   │   ├── test
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   ├── tsconfig.build.json
│   │   └── tsconfig.json
│   └── web
│       ├── eslint.config.js
│       ├── .gitignore
│       ├── index.html
│       ├── package.json
│       ├── public
│       │   ├── favicon.svg
│       │   └── icons.svg
│       ├── README.md
│       ├── src
│       │   ├── App.css
│       │   ├── App.tsx
│       │   ├── assets
│       │   │   ├── hero.png
│       │   │   ├── react.svg
│       │   │   └── vite.svg
│       │   ├── index.css
│       │   └── main.ts
│       ├── tsconfig.app.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       └── vite.config.ts
├── docker-compose.yml
├── docs
│   ├── 00-Development-Environment.md
│   ├── 01-Vision.md
│   ├── 02-Product-Requirements.md
│   ├── 03-System-Architecture.md
│   ├── 04-Databases.md
│   ├── 04.1-Database-Architecture.md
│   ├── 05-API.md
│   ├── 06-Roadmap.md
│   ├── 07-Decisions.md
│   ├── 08-Design-Bible.md
│   ├── 09-Contributing.md
│   ├── 10-Coding-Standards.md
│   ├── 11-Security&Trust-Architecture.md
│   ├── CHANGELOG.md
│   ├── MEETING_NOTES.md
│   └── rep.md
├── .env
├── .env.example
├── .github
│   └── workflows
├── .gitignore
├── infrastructure
│   ├── docker
│   └── postgres
├── LICENSE
├── package.json
├── packages
│   ├── config
│   ├── shared
│   └── types
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma.config.ts
├── README.md
├── turbo.json
└── .vscode
    └── extensions.json