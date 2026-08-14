"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function deleteScheduledPost(publicationId: string) {
  const publication = await prisma.publication.findUnique({
    where: { id: publicationId },
    select: { contentId: true, status: true },
  });

  if (!publication) {
    throw new Error("Publication not found.");
  }

  if (publication.status === "PUBLISHED") {
    throw new Error("Published posts cannot be deleted.");
  }

  await prisma.$transaction(async (tx) => {
    // Delete the publication
    await tx.publication.delete({
      where: { id: publicationId },
    });

    // Check if the content has any remaining publications
    const remaining = await tx.publication.count({
      where: { contentId: publication.contentId },
    });

    // If no publications left, delete the content too
    if (remaining === 0) {
      // Also delete media attached to this content
      await tx.media.deleteMany({
        where: { contentId: publication.contentId },
      });

      await tx.content.delete({
        where: { id: publication.contentId },
      });
    }
  });

  revalidatePath("/calendar");
  revalidatePath("/publishing");
  revalidatePath("/content");
  revalidatePath("/analytics");
}
