"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function deleteScheduledPost(publicationId: string) {
  // Creator Studio schedules Content rows directly (no Publication yet when no
  // channel is connected), so the calendar id may be a content id. Resolve it.
  const publication = await prisma.publication.findUnique({
    where: { id: publicationId },
    select: { contentId: true, status: true },
  });

  let contentId: string;
  if (publication) {
    if (publication.status === "PUBLISHED") {
      throw new Error("Published posts cannot be deleted.");
    }
    contentId = publication.contentId;
  } else {
    const content = await prisma.content.findUnique({
      where: { id: publicationId },
      select: { id: true, status: true },
    });
    if (!content) {
      throw new Error("Publication not found.");
    }
    if (content.status === "PUBLISHED") {
      throw new Error("Published posts cannot be deleted.");
    }
    contentId = content.id;
  }

  await prisma.$transaction(async (tx) => {
    if (publication) {
      // Publication-based post: delete just this publication, and only the
      // content + media when it was the last publication for that content
      // (preserves other channel publications of the same post).
      await tx.publication.delete({ where: { id: publicationId } });
      const remaining = await tx.publication.count({
        where: { contentId },
      });
      if (remaining === 0) {
        await tx.media.deleteMany({ where: { contentId } });
        await tx.content.delete({ where: { id: contentId } });
      }
    } else {
      // Content-only post (Creator Studio scheduled without a channel): remove
      // the content and everything attached to it.
      await tx.publication.deleteMany({ where: { contentId } });
      await tx.media.deleteMany({ where: { contentId } });
      await tx.content.delete({ where: { id: contentId } });
    }
  });

  revalidatePath("/calendar");
  revalidatePath("/publishing");
  revalidatePath("/content");
  revalidatePath("/analytics");
}
