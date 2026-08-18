import pkg from "@prisma/client";
import { config } from "dotenv";
const { PrismaClient } = pkg;
import { existsSync } from "node:fs";
import path from "node:path";

config();
const prisma = new PrismaClient();

const jobs = await prisma.contentJob.findMany({
  orderBy: { createdAt: "desc" },
  take: 3,
  select: {
    id: true,
    status: true,
    currentStage: true,
    progress: true,
    lockedAt: true,
    createdAt: true,
    sourceUrl: true,
  },
});

for (const j of jobs) {
  const abs = j.sourceUrl
    ? path.join(process.cwd(), "public", j.sourceUrl.replace(/^\//, ""))
    : null;
  const exists = abs ? existsSync(abs) : false;
  console.log(
    JSON.stringify({
      id: j.id,
      status: j.status,
      stage: j.currentStage,
      progress: j.progress,
      lockedAt: j.lockedAt,
      createdAt: j.createdAt,
      sourceUrl: j.sourceUrl,
      sourceExists: exists,
    }),
  );
}
await prisma.$disconnect();
