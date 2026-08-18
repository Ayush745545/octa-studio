/**
 * In production (Vercel), scheduled publishing is driven by the cron job in
 * vercel.json which POSTs to /api/publishing/process every minute.
 * Vercel crons do not run in local development, so we start an in-process
 * scheduler here that mirrors the cron behavior.
 *
 * The creator (analysis → clips) pipeline is also driven by an in-process
 * worker. It is normally started lazily when a job is created, but that means
 * after a server restart — or for a job that was reset/left mid-flight — there
 * would be no worker to process it, leaving it stuck at PROCESSING forever.
 * We therefore also ensure the creator worker is running on boot.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "development") return;

  // Guard against duplicate timers across HMR reloads of this module.
  const globalState = globalThis as unknown as {
    __localSchedulerStarted?: boolean;
  };
  if (globalState.__localSchedulerStarted) return;
  globalState.__localSchedulerStarted = true;

  // Start the creator pipeline worker so existing/reset jobs are always
  // picked up, not just jobs created after this server booted.
  const { ensureCreatorWorkerStarted } = await import(
    "@/lib/creator/worker"
  );
  ensureCreatorWorkerStarted();

  const INTERVAL_MS = 30_000;

  const tick = async () => {
    try {
      const { processScheduledPublications } = await import(
        "@/app/publishing/engine/process-scheduled"
      );
      const result = await processScheduledPublications();
      if (result.processed > 0) {
        console.log("[LocalScheduler] Published:", result.results);
      }
    } catch (error) {
      console.error("[LocalScheduler] Scheduled publishing failed:", error);
    }
  };

  // Run once shortly after boot to catch posts whose scheduled time passed
  // while the dev server was stopped, then on an interval after that.
  setTimeout(tick, 5_000);
  setInterval(tick, INTERVAL_MS);

  console.log(
    `[LocalScheduler] Started — checking scheduled posts every ${INTERVAL_MS / 1000}s`,
  );
}
