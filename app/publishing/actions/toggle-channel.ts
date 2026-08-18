"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, parseSessionToken } from "@/lib/auth";

export async function togglePublishingChannel(platform: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = parseSessionToken(token);

  if (!userId) {
    cookieStore.delete(COOKIE_NAME);
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // Session points to a deleted/non-existent database user.
  if (!user) {
    cookieStore.delete(COOKIE_NAME);
    redirect("/login");
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
    await prisma.publishingChannel.update({
      where: {
        id: existing.id,
      },
      data: {
        connected: !existing.connected,
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
