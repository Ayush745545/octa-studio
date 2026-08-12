import { notFound } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import ContentEditor from "@/components/content/content-editor";
import ContentStatusSelector from "@/components/content/content-status-selector";
import PublishButton from "@/components/content/publish-button";
import PublicationSelector from "@/components/content/publication-selector";
import { prisma } from "@/lib/prisma";

interface ContentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContentPage({
  params,
}: ContentPageProps) {
  const { id } = await params;

  const content = await prisma.content.findUnique({
    where: {
      id,
    },
    include: {
      idea: true,
      publications: true,
    media: {
      orderBy: {
        createdAt: "desc",
      },
    },
  },
  });

  if (!content) {
    notFound();
  }

  const connectedChannels = await prisma.publishingChannel.findMany({
    where: {
      connected: true,
    },
    select: {
      id: true,
      platform: true,
    },
  });

  return (
    <AppShell>
      <div className="min-h-full">
        <main className="mx-auto max-w-5xl px-8 py-10">
          <div className="mb-8">
            <p className="text-sm text-zinc-400">
              Content Workspace
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Create your content
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Turn your idea into something ready to publish.
            </p>
          </div>

          <ContentEditor
            id={content.id}
            initialTitle={content.title}
            initialBody={content.body ?? ""}
            initialPlatform={content.platform ?? ""}
            initialMedia={content.media.map((media) => ({
              id: media.id,
              url: media.url,
              filename: media.filename,
              mimeType: media.mimeType,
              size: media.size,
              type: media.type,
            }))}
          />

          <div className="mt-8 border-t border-zinc-200 pt-6">
            {content.status === "PUBLISHED" ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium text-zinc-400">
                  Status
                </p>

                <p className="mt-1 text-sm font-medium text-zinc-800">
                  Published
                </p>
              </div>
            ) : (
              <ContentStatusSelector
                id={content.id}
                status={content.status}
                scheduledAt={content.scheduledAt}
              />
            )}

            <div className="mt-6 border-t border-zinc-100 pt-6">
              <PublicationSelector
                contentId={content.id}
                channels={connectedChannels}
                publications={content.publications.map((publication) => ({
                  channelId: publication.channelId,
                  status: publication.status,
                }))}
                disabled={content.status === "PUBLISHED"}
              />

              <PublishButton
                id={content.id}
                status={content.status}
              />

              {content.status === "PUBLISHED" &&
                content.publishedAt && (
                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <p className="text-xs font-medium text-zinc-400">
                      Published
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-800">
                      {new Intl.DateTimeFormat("en-US", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(content.publishedAt)}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
