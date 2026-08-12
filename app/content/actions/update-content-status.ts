"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = [
  "DRAFT",
  "READY",
  "SCHEDULED",
] as const;

type ContentStatus = (typeof VALID_STATUSES)[number];

export async function updateContentStatus(
  id: string,
  status: ContentStatus,
) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid content status");
  }

  const content = await prisma.content.findUnique({
    where: { id },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  if (content.status === "PUBLISHED") {
    throw new Error("Published content cannot change status");
  }

  if (status === "SCHEDULED" && !content.scheduledAt) {
    throw new Error(
      "Scheduled content must have a scheduled date and time.",
    );
  }

  const updated = await prisma.content.update({
    where: { id },
    data: {
      status,
      ...(status !== "SCHEDULED"
        ? { scheduledAt: null }
        : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");

  return updated;
}
