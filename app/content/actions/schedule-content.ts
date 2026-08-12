"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function scheduleContent(
  id: string,
  scheduledAt: string,
) {
  const date = new Date(scheduledAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid scheduled date.");
  }

  if (date <= new Date()) {
    throw new Error("Content must be scheduled in the future.");
  }

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      publications: true,
    },
  });

  if (!content) {
    throw new Error("Content not found.");
  }

  if (content.status === "PUBLISHED") {
    throw new Error("Published content cannot be scheduled.");
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
        status: {
          in: ["QUEUED", "SCHEDULED"],
        },
      },
      data: {
        status: "SCHEDULED",
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
