"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function scheduleContent(
  id: string,
  scheduledAt: string,
) {
  const date = new Date(scheduledAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid scheduled date");
  }

  if (date <= new Date()) {
    throw new Error("Content must be scheduled in the future.");
  }

  const content = await prisma.content.update({
    where: { id },
    data: {
      status: "SCHEDULED",
      scheduledAt: date,
    },
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");

  return content;
}
