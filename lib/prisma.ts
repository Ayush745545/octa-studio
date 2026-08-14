import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Build-time safety: next build imports every route module to collect page
// data. DATABASE_URL may be absent then, so only throw when the client is
// actually used — never at module load.
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 300000,
  });
  return new PrismaClient({ adapter });
}

let cachedClient: PrismaClient | undefined = globalForPrisma.prisma;

function getClient(): PrismaClient {
  if (!cachedClient) {
    cachedClient = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = cachedClient;
    }
  }
  return cachedClient;
}

// Lazy proxy: importing this module never touches the database or env vars;
// the real client is created on first property access (first real query).
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
