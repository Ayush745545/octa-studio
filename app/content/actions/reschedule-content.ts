"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function rescheduleContent(
  id: string,
  scheduledAt: string,
) {
  const date = new Date(scheduledAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid schedule date.");
  }

  if (date <= new Date()) {
    throw new Error("Content must be rescheduled in the future.");
  }

  const content = await prisma.content.findUnique({
    where: { id },
  });

  if (!content) {
    throw new Error("Content not found.");
  }

  if (content.status === "PUBLISHED") {
    throw new Error("Published content cannot be rescheduled.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.content.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        scheduledAt: date,
      },
    });

    await tx.publication.updateMany({
      where: {
        contentId: id,
        status: "SCHEDULED",
      },
      data: {
        scheduledAt: date,
        error: null,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/publishing");
}
