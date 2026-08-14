import { notFound } from "next/navigation";
import Link from "next/link";

import WorkspaceLayout from "@/components/layout/workspace-layout";
import ContentEditor from "@/components/content/content-editor";
import ContentStatusSelector from "@/components/content/content-status-selector";
import PublishButton from "@/components/content/publish-button";
import DeleteContentButton from "@/components/content/delete-content-button";
import PublicationSelector from "@/components/content/publication-selector";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    <WorkspaceLayout activeItem="content">
      <div className="min-h-full">
        <header className="flex h-16 items-center border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <Link
            href="/content"
            className="text-sm font-medium text-zinc-500 transition hover:text-white"
          >
            ← Back to Content
          </Link>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm text-zinc-600">Content Workspace</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Create your content</h1>

            <p className="mt-2 text-sm text-zinc-500">Turn your idea into something ready to publish.</p>
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

          <div className="mt-8 border-t border-zinc-800 pt-6">
            {content.status === "PUBLISHED" ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="text-xs font-medium text-zinc-600">Status</p>

                <p className="mt-1 text-sm font-medium text-zinc-700">Published</p>
              </div>
            ) : (
              <ContentStatusSelector
                id={content.id}
                status={content.status}
                scheduledAt={content.scheduledAt}
              />
            )}

            <div className="mt-6 border-t border-zinc-800 pt-6">
              <PublicationSelector
                contentId={content.id}
                channels={connectedChannels}
                publications={content.publications.map((publication) => ({
                  channelId: publication.channelId,
                  status: publication.status,
                }))}
                disabled={content.status === "PUBLISHED"}
              />

              <div className="mt-4 flex items-center gap-3">
                <PublishButton
                  id={content.id}
                  status={content.status}
                />

                <DeleteContentButton
                  id={content.id}
                  status={content.status}
                />
              </div>

              {content.status === "PUBLISHED" &&
                content.publishedAt && (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                    <p className="text-xs font-medium text-zinc-600">Published</p>

                    <p className="mt-1 text-sm font-medium text-zinc-700">
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
    </WorkspaceLayout>
  );
}
