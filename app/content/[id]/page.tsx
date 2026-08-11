import { notFound } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import ContentEditor from "@/components/content/content-editor";
import ContentStatusSelector from "@/components/content/content-status-selector";
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
    },
  });

  if (!content) {
    notFound();
  }

  return (
    <AppShell>
      <div className="min-h-full">
        <main className="mx-auto max-w-5xl px-8 py-10">
          <div className="mb-8">
            <p className="text-sm text-zinc-400">Content Workspace</p>
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
          />

          <div className="mt-8 border-t border-zinc-200 pt-6">
            <ContentStatusSelector
              id={content.id}
              status={content.status}
            />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
