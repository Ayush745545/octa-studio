---
kind: dependency_management
name: npm-based dependency management with lockfiles and Prisma tooling
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - .kilo/package.json
    - .kilo/package-lock.json
    - prisma.config.ts
---

## System / Approach

The repository uses **npm** as the package manager for a single Next.js application. Dependencies are declared in `package.json` (root) and a small isolated workspace under `.kilo/`. There is no monorepo workspaces setup — only one top-level `node_modules` tree plus a separate `.kilo/node_modules` tree.

- **Manifest**: `package.json` at the repo root declares runtime dependencies (`next`, `react`, `@prisma/client`, `pg`, `gsap`, `@gsap/react`, `@studio-freight/lenis`, `dotenv`) and dev dependencies (`typescript`, `eslint`, `tailwindcss`, `@tailwindcss/postcss`, `prisma`, `@types/*`).
- **Lockfile**: `package-lock.json` (lockfileVersion 3) pins every transitive dependency to an exact version and records integrity hashes, sourced from `https://registry.npmjs.org/`. A second lockfile exists under `.kilo/package-lock.json` for the Kilo agent plugin.
- **No vendoring**: No `vendor/`, `third_party/`, or similar directory; all third-party code is installed via npm into `node_modules`.
- **No private registry / auth config**: No `.npmrc`, `NPM_TOKEN`, `NPM_REGISTRY`, or `private-registry` configuration was found anywhere in the repo. All packages resolve against the public npm registry.
- **Prisma integration**: Prisma is treated as a dev dependency (`prisma ^7.9.1`) and its client (`@prisma/client ^7.9.1`) as a runtime dependency. The Prisma config lives in `prisma.config.ts` and reads `DATABASE_URL` / `SHADOW_DATABASE_URL` from environment variables via `dotenv/config`; database credentials are never committed.

## Key Files

- `package.json` — sole source of declared dependencies and scripts (`dev`, `build`, `start`, `lint`).
- `package-lock.json` — deterministic install manifest for the app.
- `.kilo/package.json` + `.kilo/package-lock.json` — isolated dependency scope for the Kilo agent plugin (`@kilocode/plugin@7.4.21`).
- `prisma.config.ts` — Prisma datasource and migrations path configuration, reading secrets from env.
- `prisma/schema.prisma` + `prisma/migrations/` — ORM schema and versioned SQL migrations (database-side artifacts, not npm deps).

## Architecture & Conventions

- **Single-app layout**: Everything depends on one `node_modules`; there are no per-package manifests beyond the root and `.kilo/`.
- **Version ranges use caret (`^`)**: Most dependencies declare compatible minor/patch updates (e.g. `"next": "16.3.0"` pinned exactly, but `"gsap": "^3.15.0"`, `"prisma": "^7.9.1"`). This allows automatic patch/minor bumps while keeping major versions stable.
- **Dev vs runtime split**: Build-time tooling (`prisma`, `eslint`, `tailwindcss`, `@types/*`) is kept in `devDependencies`; only what ships to production (`next`, `react`, `@prisma/client`, `pg`, `gsap`, etc.) is in `dependencies`.
- **Environment-driven configuration**: Database URLs are injected at runtime through `dotenv/config` loaded by `prisma.config.ts`; no secrets live in dependency manifests.
- **Separate tooling scope**: The `.kilo/` subdirectory has its own `package.json` and `node_modules`, isolating the Kilo IDE plugin from the app's dependency tree.

## Conventions & Constraints Observed

- All third-party packages are resolved from the public npm registry (`registry.npmjs.org`); no private registries or scoped packages beyond standard npm scopes are used.
- Deterministic installs are enforced via `package-lock.json` (lockfileVersion 3), which should be committed alongside `package.json`.
- Prisma-related packages follow a paired convention: `prisma` as a dev dependency and `@prisma/client` as a runtime dependency, both aligned to the same major version (`^7.9.1`).
- Database connection strings are externalized via environment variables (`DATABASE_URL`, `SHADOW_DATABASE_URL`) consumed by `prisma.config.ts`; they are not embedded in any dependency configuration file.