"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CreateContentInput {
  title: string;
  body: string;
  platform: string | null;
}

export async function createContent(input: CreateContentInput) {
  const content = await prisma.content.create({
    data: {
      title: input.title,
      body: input.body || null,
      platform: input.platform,
      status: "DRAFT",
    },
  });

  revalidatePath("/content");

  return content;
}
