"use server";

import { revalidatePath } from "next/cache";
import { publishPublication } from "@/app/publishing/engine/publish";

export async function publishNow(publicationId: string) {
  try {
    const result = await publishPublication(publicationId);

    revalidatePath("/publishing");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    revalidatePath("/content");

    return {
      success: result.success,
      error: result.error ?? null,
      executionTimeMs: result.executionTimeMs ?? null,
      externalId: result.externalId ?? null,
    };
  } catch (error) {
    revalidatePath("/publishing");

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown publishing error.",
      executionTimeMs: null,
      externalId: null,
    };
  }
}
