"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, parseSessionToken } from "@/lib/auth";

export async function togglePublishingChannel(platform: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = parseSessionToken(token);

  if (!userId) {
    throw new Error("You must be logged in.");
  }

  const existing = await prisma.publishingChannel.findUnique({
    where: {
      userId_platform: {
        userId,
        platform,
      },
    },
  });

  if (existing) {
    const nextConnected = !existing.connected;

    await prisma.publishingChannel.update({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
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
              authorUrn: null,
            }),
      },
    });
  } else {
    await prisma.publishingChannel.create({
      data: {
        userId,
        platform,
        connected: true,
      },
    });
  }

  revalidatePath("/publishing");
}
