"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createIdea(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (!title) {
    return {
      success: false,
      error: "Idea title is required.",
    };
  }

  try {
    await prisma.idea.create({
      data: {
        title,
        description: description || null,
        category: category || null,
      },
    });

    revalidatePath("/ideas");

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "Unable to save the idea. Please try again.",
    };
  }
}
