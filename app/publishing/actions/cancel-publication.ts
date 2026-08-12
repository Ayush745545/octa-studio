"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function cancelPublication(publicationId: string) {
  const publication = await prisma.publication.findUnique({
    where: {
      id: publicationId,
    },
  });

  if (!publication) {
    throw new Error("Publication not found.");
  }

  if (publication.status !== "SCHEDULED") {
    throw new Error("Publication is not scheduled.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const publicationUpdate = await tx.publication.update({
      where: {
        id: publicationId,
      },
      data: {
        status: "QUEUED",
        scheduledAt: null,
        error: null,
      },
    });

    await tx.content.update({
      where: {
        id: publication.contentId,
      },
      data: {
        status: "READY",
        scheduledAt: null,
      },
    });

    return publicationUpdate;
  });

  revalidatePath("/publishing");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath(`/content/${publication.contentId}`);

  return updated;
}
