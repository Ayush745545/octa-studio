import { prisma } from "@/lib/prisma";
import { publishPublication } from "./publish";

export async function processScheduledPublications() {
  const now = new Date();

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
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: 10,
  });

  const results = [];

  for (const publication of publications) {
    try {
      const result = await publishPublication(publication.id);

      results.push({
        publicationId: publication.id,
        success: result.success,
        externalId: result.externalId ?? null,
        error: result.error ?? null,
      });
    } catch (error) {
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
