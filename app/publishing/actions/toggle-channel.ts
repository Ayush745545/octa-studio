"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function togglePublishingChannel(platform: string) {
  const existing = await prisma.publishingChannel.findUnique({
    where: { platform },
  });

  if (existing) {
    const nextConnected = !existing.connected;

    await prisma.publishingChannel.update({
      where: { platform },
      data: {
        connected: nextConnected,
        ...(nextConnected
          ? {}
          : {
              accountName: null,
              accessToken: null,
              refreshToken: null,
              expiresAt: null,
              externalId: null,
            }),
      },
    });
  } else {
    await prisma.publishingChannel.create({
      data: {
        platform,
        connected: true,
      },
    });
  }

  revalidatePath("/publishing");
}
