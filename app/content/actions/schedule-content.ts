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

  const content = await prisma.content.update({
    where: { id },
    data: {
      status: "SCHEDULED",
      scheduledAt: date,
    },
  });

  revalidatePath("/content");
  revalidatePath(`/content/${id}`);

  return content;
}
