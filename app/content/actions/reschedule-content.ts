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

  const content = await prisma.content.update({
    where: { id },
    data: {
      scheduledAt: date,
      status: "SCHEDULED",
    },
  });

  revalidatePath("/calendar");
  revalidatePath(`/content/${id}`);
  revalidatePath("/content");

  return content;
}
