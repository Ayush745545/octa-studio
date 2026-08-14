---
kind: build_system
name: Next.js + Vercel Build & Deployment Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.ts
    - vercel.json
    - prisma.config.ts
    - tsconfig.json
    - eslint.config.mjs
    - postcss.config.mjs
---

## Build System Overview

This is a single Next.js application (not a monorepo) built and deployed via the standard Next.js toolchain on Vercel. There are no custom Makefiles, Dockerfiles, shell build scripts, or CI/CD pipelines in this repository — the entire build and deployment strategy is delegated to Next.js and Vercel.

## Build Tooling

- **Framework**: Next.js 16.3.0 with TypeScript (`next build` / `next dev` / `next start`).
- **TypeScript**: Compiled with `target: ES2017`, `module: esnext`, `moduleResolution: bundler`, `strict: true`, `noEmit: true` (Next.js handles emission). Path aliases `@/*` resolve to the project root.
- **Styling pipeline**: PostCSS + Tailwind CSS v4 via `@tailwindcss/postcss` (`postcss.config.mjs`).
- **Linting**: ESLint 9 with `eslint-config-next` (core-web-vitals + TypeScript rules), configured in `eslint.config.mjs`. No pre-commit hooks or lint-staged configuration present.
- **Database migrations**: Prisma 7.9.1 with external config file `prisma.config.ts` pointing at `prisma/schema.prisma` and `prisma/migrations/`. Uses `DATABASE_URL` and optional `SHADOW_DATABASE_URL` from environment variables.

## Scripts

Defined in `package.json`:
- `npm run dev` → `next dev`
- `npm run build` → `next build`
- `npm run start` → `next start`
- `npm run lint` → `eslint`

No test runner, no release/publish script, no version bump script.

## Deployment

- **Platform**: Vercel, configured via `vercel.json`.
- **Build**: Vercel auto-detects the Next.js app; no custom build command overrides are set.
- **Cron jobs**: A Vercel cron runs `/api/publishing/process` every minute (`* * * * *`) to process scheduled publishing tasks.
- **Environment**: Database connection strings are expected as environment variables (`DATABASE_URL`, `SHADOW_DATABASE_URL`) — consumed by Prisma's `defineConfig` + `env()` helper in `prisma.config.ts`.

## Versioning

- Application version is declared as `"version": "0.1.0"` in `package.json` but is not referenced by any build or release script. No changelog, tagging, or release automation exists in the repo.

## Constraints & Conventions Observed

- The project relies entirely on Vercel's implicit Next.js build pipeline; there is no local Docker image, Makefile, or CI YAML to reproduce builds outside of Vercel.
- All runtime configuration (database URLs, etc.) is injected via environment variables rather than checked-in files.
- Prisma migrations live under `prisma/migrations/` and must be applied against the target database before the app can function; the schema path and migration directory are explicitly declared in `prisma.config.ts`.
- Dev-only origins for cross-origin requests are whitelisted in `next.config.ts` via `allowedDevOrigins`.