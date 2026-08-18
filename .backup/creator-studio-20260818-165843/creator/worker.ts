import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

const WORKER_ID = randomUUID();
const STALE_LOCK_MS = 15 * 60 * 1000;

let processing = false;
let started = false;

/**
 * One tick of the persistent creator worker. Finds a job that needs work,
 * claims it with an optimistic DB lock (so a second process/instance cannot
 * process the same job), then runs the resumable pipeline. Survives restarts:
 * a job left in PROCESSING with a stale lock is reclaimed here.
 */
export async function creatorWorkerTick(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    const now = new Date();
    const stale = new Date(now.getTime() - STALE_LOCK_MS);

    const job = await prisma.contentJob.findFirst({
      where: {
        OR: [
          { status: "QUEUED" },
          { status: "PROCESSING", lockedAt: { lt: stale } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    if (!job) return;

    // Claim the job atomically.
    const claimed = await prisma.contentJob.updateMany({
      where: {
        id: job.id,
        OR: [{ lockedAt: null }, { lockedAt: { lt: stale } }],
      },
      data: { lockedAt: now, workerId: WORKER_ID },
    });
    if (claimed.count === 0) return;

    if (job.status === "QUEUED") {
      await prisma.contentJob.update({
        where: { id: job.id },
        data: { status: "PROCESSING" },
      });
    }

    console.log(`[CreatorWorker ${WORKER_ID}] Picked job ${job.id}`);
    const { runJob } = await import("./pipeline");
    await runJob(job.id);
    console.log(`[CreatorWorker ${WORKER_ID}] Done job ${job.id}`);
  } catch (error) {
    console.error("[CreatorWorker] Tick failed:", error);
  } finally {
    processing = false;
  }
}

/**
 * Starts the worker interval exactly once per Node process. Called from the
 * Node-runtime API routes (never the edge bundle), so the node-only pipeline
 * modules are never pulled into the edge compile graph.
 */
export function ensureCreatorWorkerStarted(): void {
  if (started) return;
  started = true;
  const INTERVAL_MS = 3000;
  setTimeout(creatorWorkerTick, 4000);
  setInterval(creatorWorkerTick, INTERVAL_MS);
  console.log(
    `[CreatorWorker] Started — scanning for jobs every ${INTERVAL_MS / 1000}s`,
  );
}
