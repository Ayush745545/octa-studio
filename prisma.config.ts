import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // `prisma generate` (e.g. Vercel postinstall) must not require a live
    // DATABASE_URL; fall back to a placeholder when the env var is absent.
    url: process.env.DATABASE_URL ?? "postgresql://prisma:prisma@localhost:5432/prisma",
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
});
