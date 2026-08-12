"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function publishContent(id: string) {
  const content = await prisma.content.findUnique({
    where: { id },
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

  const updated = await prisma.content.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      scheduledAt: null,
    },
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");

  return updated;
}
