Atlas/
│
├── apps/
│   ├── api/                         # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── exceptions/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── logger/
│   │   │   │   └── pipes/
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── configuration.ts
│   │   │   │   ├── env.validation.ts
│   │   │   │   └── config.module.ts
│   │   │   │
│   │   │   ├── database/
│   │   │   │   └── prisma/
│   │   │   │       ├── prisma.module.ts
│   │   │   │       └── prisma.service.ts
│   │   │   │
│   │   │   ├── modules/
│   │   │   │   ├── health/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── domains/
│   │   │   │   ├── understanding/
│   │   │   │   ├── comparison/
│   │   │   │   ├── briefs/
│   │   │   │   └── workspace/
│   │   │   │
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   │
│   │   ├── test/
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   └── package.json
│   │
│   └── web/
│       └── (React + Vite)
│
├── packages/
│   ├── config/
│   ├── shared/
│   └── types/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── infrastructure/
│   ├── docker/
│   └── postgres/
│
├── docs/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── README.md
└── LICENSE