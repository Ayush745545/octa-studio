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

  const updated = await prisma.publication.update({
    where: {
      id: publicationId,
    },
    data: {
      status: "QUEUED",
      scheduledAt: null,
      error: null,
    },
  });

  revalidatePath("/publishing");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath(`/content/${publication.contentId}`);

  return updated;
}
