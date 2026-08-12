"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function publishContent(id: string) {
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
    throw new Error("Content is already published.");
  }

  if (content.status !== "READY") {
    throw new Error(
      "Only content marked READY can be published.",
    );
  }

  if (!content.title.trim()) {
    throw new Error("Content must have a title before publishing.");
  }

  if (!content.body?.trim()) {
    throw new Error("Content must have a body before publishing.");
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const updatedContent = await tx.content.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        scheduledAt: null,
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
        status: "PUBLISHED",
        publishedAt: now,
        scheduledAt: null,
        error: null,
      },
    });

    return updatedContent;
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/publishing");

  return updated;
}
