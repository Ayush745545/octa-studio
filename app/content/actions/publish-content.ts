"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { publishPublication } from "@/app/publishing/engine/publish";

export async function publishContent(id: string) {
  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      publications: true,
    },
  });

  if (!content) {
    throw new Error("Content not found.");
  }

  if (content.status === "PUBLISHED") {
    throw new Error("Content is already published.");
  }

  if (content.status !== "READY" && content.status !== "SCHEDULED") {
    throw new Error(
      "Only content marked READY or SCHEDULED can be published.",
    );
  }

  if (!content.title.trim()) {
    throw new Error("Content must have a title before publishing.");
  }

  if (!content.body?.trim()) {
    throw new Error("Content must have a body before publishing.");
  }

  if (content.publications.length === 0) {
    throw new Error(
      "Add at least one publishing channel before publishing.",
    );
  }

  const activePublication = content.publications.find(
    (publication) =>
      publication.status === "QUEUED" ||
      publication.status === "SCHEDULED",
  );

  if (!activePublication) {
    throw new Error(
      "No queued publication is available for this content.",
    );
  }

  const result = await publishPublication(activePublication.id);

  if (!result.success) {
    throw new Error(result.error ?? "Publishing failed.");
  }

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/publishing");

  return result;
}
