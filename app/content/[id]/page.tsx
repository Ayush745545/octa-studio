import Link from "next/link";
import { notFound } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import ContentEditor from "@/components/content/content-editor";
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
  });

  if (!content) {
    notFound();
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <Link
            href="/ideas"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
          >
            ← Back to Ideas
          </Link>

          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {content.status}
          </span>
        </header>

        <main className="px-8 py-10">
          <div className="max-w-4xl">
            <div className="mb-10">
              <p className="text-sm font-medium text-zinc-400">
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
            />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
