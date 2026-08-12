"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface UpdateContentInput {
  id: string;
  title: string;
  body: string;
  platform: string;
}

export async function updateContent(input: UpdateContentInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  const content = await prisma.content.findUnique({
    where: {
      id: input.id,
    },
  });

  if (!content) {
    throw new Error("Content not found.");
  }

  if (content.status === "PUBLISHED") {
    throw new Error("Published content cannot be edited.");
  }

  const updatedContent = await prisma.content.update({
    where: {
      id: input.id,
    },
    data: {
      title,
      body: input.body,
      platform: input.platform || null,
    },
  });

  redirect(`/content/${updatedContent.id}`);
}
