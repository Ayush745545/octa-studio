"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function cancelSchedule(id: string) {
  const content = await prisma.content.findUnique({
    where: { id },
  });

  if (!content) {
    throw new Error("Content not found.");
  }

  if (content.status !== "SCHEDULED") {
    throw new Error("Content is not scheduled.");
  }

  const updated = await prisma.content.update({
    where: { id },
    data: {
      status: "READY",
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
