/**
 * S-10 — Dependency & Supply Chain Security Allowlist
 *
 * Defines explicit trusted registries, internal package scopes, approved licenses,
 * trusted toolchain bounds, and known trusted core package names for typosquatting defense.
 */

export const TRUSTED_REGISTRIES: readonly string[] = [
  'https://registry.npmjs.org/',
  'https://registry.yarnpkg.com/',
  'https://npm.pkg.github.com/',
] as const;

export const APPROVED_INTERNAL_SCOPES: readonly string[] = [
  '@nebula',
  '@atlas',
] as const;

export const APPROVED_LICENSES: readonly string[] = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
  'Unlicense',
  'BlueOak-1.0.0',
  'Python-2.0',
  'Zlib',
] as const;

export const PROHIBITED_LICENSES: readonly string[] = [
  'GPL-1.0',
  'GPL-2.0',
  'GPL-3.0',
  'AGPL-1.0',
  'AGPL-3.0',
  'LGPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'SSPL-1.0',
  'CPAL-1.0',
  'EUPL-1.1',
  'EUPL-1.2',
  'BUSL-1.1',
  'CC-BY-NC-4.0',
  'Commons-Clause',
] as const;

export interface ToolchainRequirement {
  tool: string;
  minVersion: string;
  maxMajorVersion?: number;
  description: string;
}

export const TRUSTED_TOOLCHAIN_REQUIREMENTS: Record<
  string,
  ToolchainRequirement
> = {
  node: {
    tool: 'node',
    minVersion: '18.0.0',
    maxMajorVersion: 24,
    description: 'Node.js Runtime Engine',
  },
  pnpm: {
    tool: 'pnpm',
    minVersion: '9.0.0',
    maxMajorVersion: 10,
    description: 'pnpm Fast, Disk Space Efficient Package Manager',
  },
  typescript: {
    tool: 'typescript',
    minVersion: '5.0.0',
    maxMajorVersion: 5,
    description: 'TypeScript Language Compiler',
  },
  vite: {
    tool: 'vite',
    minVersion: '5.0.0',
    maxMajorVersion: 8,
    description: 'Vite Frontend Tooling',
  },
  nestjs: {
    tool: 'nestjs',
    minVersion: '10.0.0',
    maxMajorVersion: 11,
    description: 'NestJS Framework Tooling',
  },
  prisma: {
    tool: 'prisma',
    minVersion: '5.0.0',
    maxMajorVersion: 6,
    description: 'Prisma ORM Tooling',
  },
  turborepo: {
    tool: 'turbo',
    minVersion: '2.0.0',
    maxMajorVersion: 2,
    description: 'Turborepo Monorepo Build System',
  },
};

export const KNOWN_TRUSTED_PACKAGES: readonly string[] = [
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/platform-express',
  '@prisma/client',
  'react',
  'react-dom',
  'clsx',
  'tailwind-merge',
  'lucide-react',
  'zod',
  'axios',
  'express',
  'dotenv',
  'helmet',
  'cors',
  'bcrypt',
  'argon2',
  'jsonwebtoken',
  'prisma',
  'typescript',
  'vite',
  'turbo',
  'eslint',
  'prettier',
  'jest',
  'vitest',
] as const;
