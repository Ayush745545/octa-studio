"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";

export async function deleteContent(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      media: {
        select: { url: true },
      },
    },
  });

  if (!content) {
    throw new Error("Content not found.");
  }

  if (content.status === "PUBLISHED") {
    throw new Error("Published content cannot be deleted.");
  }

  // Remove uploaded files from disk (ignore missing ones).
  for (const media of content.media) {
    const filePath = path.join(
      process.cwd(),
      "public",
      media.url.replace(/^\/+/, ""),
    );

    try {
      await unlink(filePath);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined;

      if (code !== "ENOENT") {
        throw error;
      }
    }
  }

  // Publications and media cascade-delete with the content.
  await prisma.content.delete({
    where: { id: contentId },
  });

  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath("/publishing");
  revalidatePath("/analytics");
}
