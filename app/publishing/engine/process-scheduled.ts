import { prisma } from "@/lib/prisma";
import { publishPublication } from "./publish";

export async function processScheduledPublications() {
  const now = new Date();

  console.log(
    `[Scheduler] Checking scheduled publications at ${now.toISOString()}`,
  );

  const publications = await prisma.publication.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        not: null,
        lte: now,
      },
    },
    select: {
      id: true,
      scheduledAt: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: 10,
  });

  console.log(
    `[Scheduler] Selected ${publications.length} publication(s) ready to publish.`,
  );

  const results = [];

  for (const publication of publications) {
    console.log("[Scheduler] publication selected:", {
      id: publication.id,
      scheduledAt: publication.scheduledAt?.toISOString(),
    });

    /*
     * Atomic, database-backed claim.
     *
     * The scheduler ticks every ~30s while a single publish can take much
     * longer than that. Two ticks could both SELECT this publication while
     * it is still SCHEDULED and then both publish it.
     *
     * We flip SCHEDULED -> PROCESSING with a conditional UPDATE that only
     * matches when the row is still SCHEDULED. Postgres applies the UPDATE
     * atomically, so only ONE concurrent transaction can change the row and
     * get `count === 1`. Every other tick sees `count === 0` and skips,
     * guaranteeing a publication is published exactly once.
     */
    const claimed = await prisma.publication.updateMany({
      where: {
        id: publication.id,
        status: "SCHEDULED",
      },
      data: {
        status: "PROCESSING",
      },
    });

    if (claimed.count === 0) {
      console.log(
        "[Scheduler] publication skipped (another worker already claimed it):",
        { id: publication.id },
      );
      results.push({
        publicationId: publication.id,
        claimed: false,
        success: false,
        externalId: null,
        error: "Already claimed by another worker.",
      });
      continue;
    }

    console.log("[Scheduler] publication successfully claimed:", {
      id: publication.id,
      status: "PROCESSING",
    });

    try {
      console.log("[Scheduler] publishing started:", { id: publication.id });

      const result = await publishPublication(publication.id);

      if (result.success) {
        console.log("[Scheduler] publishing succeeded:", {
          id: publication.id,
          externalId: result.externalId ?? null,
          executionTimeMs: result.executionTimeMs ?? null,
        });
      } else {
        console.error("[Scheduler] publishing failed:", {
          id: publication.id,
          error: result.error ?? null,
        });
      }

      results.push({
        publicationId: publication.id,
        claimed: true,
        success: result.success,
        externalId: result.externalId ?? null,
        error: result.error ?? null,
        executionTimeMs: result.executionTimeMs ?? null,
      });
    } catch (error) {
      console.error("[Scheduler] publishing failed:", {
        id: publication.id,
        error:
          error instanceof Error ? error.message : "Unknown publishing error.",
      });

      results.push({
        publicationId: publication.id,
        claimed: true,
        success: false,
        externalId: null,
        error:
          error instanceof Error
            ? error.message
            : "Unknown publishing error.",
      });
    }
  }

  return {
    processed: results.length,
    results,
  };
}
