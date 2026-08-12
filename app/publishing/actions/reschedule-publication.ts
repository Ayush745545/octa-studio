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

  const publication = await prisma.publication.findUnique({
    where: { id: publicationId },
  });

  if (!publication) {
    throw new Error("Publication not found.");
  }

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

  const updated = await prisma.publication.update({
    where: { id: publicationId },
    data: {
      status: "SCHEDULED",
      scheduledAt: date,
      error: null,
    },
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${publication.contentId}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/publishing");

  return updated;
}
