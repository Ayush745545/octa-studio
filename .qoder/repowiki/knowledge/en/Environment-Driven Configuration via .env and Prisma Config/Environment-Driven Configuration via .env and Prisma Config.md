---
kind: configuration_system
name: Environment-Driven Configuration via .env and Prisma Config
category: configuration_system
scope:
    - '**'
source_files:
    - .env
    - lib/prisma.ts
    - prisma.config.ts
    - next.config.ts
    - vercel.json
    - app/api/ai/generate/route.ts
    - app/api/ai/image/route.ts
    - app/api/ai/video/route.ts
    - app/api/publishing/process/route.ts
    - app/api/publishing/linkedin/callback/route.ts
    - app/api/publishing/linkedin/connect/route.ts
---

## What system/approach is used

This Next.js application uses a flat, environment-variable-driven configuration approach with no centralized config module. Runtime settings are read directly from `process.env` at the point of use across API routes and shared libraries. The only structured configuration files are:

- `.env` — all runtime secrets and toggles (database URLs, AI provider settings, OAuth credentials, cron secret, third-party API keys)
- `next.config.ts` — Next.js build/runtime options (e.g. `allowedDevOrigins`)
- `prisma.config.ts` — Prisma CLI datasource and migration paths, loaded via `dotenv/config`
- `vercel.json` — deployment-level configuration (cron schedule for `/api/publishing/process`)
- `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` — tooling configuration

There is no config schema validation, no typed config object, no feature-flag system, and no layered config merging.

## Key files and packages

- `.env` — single source of truth for all runtime variables: `DATABASE_URL`, `SHADOW_DATABASE_URL`, `AI_PROVIDER`, `AI_BASE_URL`, `AI_MODEL`, `CRON_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `APP_URL`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`.
- `lib/prisma.ts` — reads `DATABASE_URL` to construct a `PrismaPg` adapter; throws if missing; caches a singleton PrismaClient in `globalThis` during development.
- `prisma.config.ts` — imports `dotenv/config` then uses Prisma's `defineConfig` + `env()` helper to bind `DATABASE_URL` and `SHADOW_DATABASE_URL` to datasource settings.
- `app/api/ai/generate/route.ts` — reads `AI_BASE_URL` and `AI_MODEL` with local defaults (`http://localhost:11434/v1`, `qwen2.5-coder:7b`).
- `app/api/ai/image/route.ts`, `app/api/ai/video/route.ts` — read `COMFYUI_URL` and `AI_UPLOAD_DIR` (defaulting to `public/uploads`).
- `app/api/publishing/linkedin/callback/route.ts`, `app/api/publishing/linkedin/connect/route.ts` — read `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `APP_URL`; return explicit error when not configured.
- `app/api/publishing/process/route.ts` — validates incoming Bearer token against `CRON_SECRET`; returns 500 if secret is absent, 401 otherwise.
- `next.config.ts` — declares `allowedDevOrigins` array (dev-only CORS).
- `vercel.json` — defines a Vercel cron that calls `/api/publishing/process` every minute.

## Architecture and conventions

1. **Direct `process.env` access** — Every module reads its own variables inline. There is no central `config.ts` or `env.ts` file that exports a typed configuration object. This means each route/library owns its own dependency on specific env vars.

2. **Fail-fast on missing secrets** — `lib/prisma.ts` throws an error if `DATABASE_URL` is undefined, preventing the app from starting without a database. Publishing endpoints log and return errors when `CRON_SECRET` or LinkedIn OAuth keys are missing.

3. **Per-feature defaults** — Non-secret runtime values can have sensible fallbacks: `AI_BASE_URL` defaults to a local Ollama endpoint, `AI_MODEL` defaults to `qwen2.5-coder:7b`, `AI_UPLOAD_DIR` defaults to `public/uploads`. Secrets have no defaults and cause failures.

4. **Development vs production distinction** — The Prisma client singleton is attached to `globalThis` only when `NODE_ENV !== "production"`, avoiding re-instantiation during hot reload. `next.config.ts` exposes `allowedDevOrigins` for dev-time CORS.

5. **Prisma CLI env loading is separate from runtime** — `prisma.config.ts` explicitly `import("dotenv/config")` so Prisma migrations and CLI commands pick up `.env`. The runtime Prisma client in `lib/prisma.ts` relies on Next.js's built-in `.env` loading.

6. **Deployment config is externalized** — `vercel.json` declares the cron trigger; secrets themselves live in the platform's environment variables (not committed). The `.env` file in the repo contains local/dev values.

## Conventions and constraints

- **No config schema or validation layer exists.** Variables are consumed as raw strings; there is no Zod/Yup/schema enforcement at load time.
- **Secrets must be present at startup or request time.** Missing `DATABASE_URL` crashes the process; missing `CRON_SECRET` causes a 500 response; missing LinkedIn OAuth keys produce a descriptive error JSON.
- **Non-secret runtime knobs may provide local defaults.** AI endpoints fall back to localhost Ollama and a default model name so they work out-of-the-box locally.
- **Environment variable names are uppercase and underscore-separated**, following Node.js convention (e.g. `DATABASE_URL`, `AI_BASE_URL`, `CRON_SECRET`, `LINKEDIN_CLIENT_ID`).
- **Configuration is not versioned per-environment.** There is no `.env.local`, `.env.production`, or similar split — a single `.env` file is used, with the expectation that deployment platforms inject their own variables at runtime.