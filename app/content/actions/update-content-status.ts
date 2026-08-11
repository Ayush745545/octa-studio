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

  const content = await prisma.content.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/content");
  revalidatePath(`/content/${id}`);

  return content;
}
