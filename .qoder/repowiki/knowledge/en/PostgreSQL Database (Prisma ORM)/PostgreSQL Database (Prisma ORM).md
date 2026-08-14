---
kind: external_dependency
name: PostgreSQL Database (Prisma ORM)
slug: postgresql
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

Primary relational database for octa-studio. Prisma schema declares `provider = "postgresql"`; the app uses `@prisma/adapter-pg` with the native `pg` driver. A shadow database URL (`SHADOW_DATABASE_URL`) is configured in `prisma.config.ts`, which Prisma uses for migration diffing and preview features. The connection string is injected via `DATABASE_URL` (and `SHADOW_DATABASE_URL`) environment variables; no credentials are committed.