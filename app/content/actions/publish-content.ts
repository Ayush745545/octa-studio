"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function publishContent(id: string) {
  await prisma.content.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath(`/content/${id}`);
}
