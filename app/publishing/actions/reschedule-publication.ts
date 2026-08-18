"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function reschedulePublication(
  publicationId: string,
  scheduledAt: string,
) {
  const date = new Date(scheduledAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid publication schedule date.");
  }

  if (date <= new Date()) {
    throw new Error("Publication must be scheduled in the future.");
  }

  // The calendar id may be a content id (Creator Studio schedules content
  // directly with no Publication when no channel is connected yet).
  const publication = await prisma.publication.findUnique({
    where: { id: publicationId },
    select: { contentId: true, status: true },
  });

  let contentId: string;
  if (publication) {
    if (publication.status === "PUBLISHED") {
      throw new Error("Published publication cannot be rescheduled.");
    }
    if (
      publication.status !== "SCHEDULED" &&
      publication.status !== "QUEUED"
    ) {
      throw new Error(
        "Only queued or scheduled publications can be rescheduled.",
      );
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
      throw new Error("Published publication cannot be rescheduled.");
    }
    contentId = content.id;
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.publication.updateMany({
      where: { contentId },
      data: { status: "SCHEDULED", scheduledAt: date, error: null },
    });
    await tx.content.update({
      where: { id: contentId },
      data: { status: "SCHEDULED", scheduledAt: date },
    });
    return contentId;
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${contentId}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/publishing");

  return updated;
}
