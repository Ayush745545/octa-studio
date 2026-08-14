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
    `[Scheduler] Found ${publications.length} publication(s) ready to publish.`,
  );

  const results = [];

  for (const publication of publications) {
    try {
      console.log(
        `[Scheduler] Publishing ${publication.id} scheduled for ${publication.scheduledAt?.toISOString()}`,
      );

      const result = await publishPublication(publication.id);

      results.push({
        publicationId: publication.id,
        success: result.success,
        externalId: result.externalId ?? null,
        error: result.error ?? null,
        executionTimeMs: result.executionTimeMs ?? null,
      });
    } catch (error) {
      console.error(
        `[Scheduler] Failed publication ${publication.id}:`,
        error,
      );

      results.push({
        publicationId: publication.id,
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
