"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createContentFromIdea(ideaId: string) {
  const idea = await prisma.idea.findUnique({
    where: {
      id: ideaId,
    },
  });

  if (!idea) {
    throw new Error("Idea not found.");
  }

  const content = await prisma.content.create({
    data: {
      title: idea.title,
      body: idea.description,
      status: "DRAFT",
      ideaId: idea.id,
    },
  });

  redirect(`/content/${content.id}`);
}
