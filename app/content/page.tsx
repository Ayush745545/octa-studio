import Link from "next/link";

import WorkspaceLayout from "@/components/layout/workspace-layout";
import ContentListItem from "@/components/content/content-list-item";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const contents = await prisma.content.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      idea: true,
    },
  });

  return (
    <WorkspaceLayout activeItem="content">
      <style dangerouslySetInnerHTML={{ __html: `
        .content-pickup-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.625rem 1.25rem;
          border-radius: 30em;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: inherit;
          border: 1px solid rgba(255,255,255,0.07);
          position: relative;
          overflow: hidden;
          z-index: 1;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(145deg, #16161b, #0c0c10);
          box-shadow: 6px 6px 14px rgba(0,0,0,0.6), -6px -6px 14px rgba(255,255,255,0.06), inset 0 1px 1px rgba(255,255,255,0.06);
          transition: color 0.5s ease;
        }
        .content-pickup-btn::before {
          content: '';
          height: 100%;
          width: 0;
          border-radius: 30em;
          position: absolute;
          top: 0;
          left: 0;
          background-image: linear-gradient(to right, #0fd850 0%, #f9f047 100%);
          transition: 0.5s ease;
          display: block;
          z-index: -1;
        }
        .content-pickup-btn:hover::before {
          width: 100%;
        }
        .content-pickup-btn:hover {
          color: #06210a;
        }
      ` }} />
      <div className="min-h-screen bg-[#0a0a0c]">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-sm font-semibold text-white">Content Library</h1>
          </div>

          <Link
            href="/ideas"
            className="content-pickup-btn"
          >
            + New from Idea
          </Link>
        </header>

        <main className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-zinc-500">Your content workspace</p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Content</h2>

            <p className="mt-2 text-sm text-zinc-500">Manage every draft created from your ideas.</p>
          </div>

          {contents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 px-6 py-16 text-center">
              <h3 className="text-lg font-semibold text-white">No content yet</h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Turn an idea into content and it will appear here.
              </p>

              <Link href="/ideas" className="content-pickup-btn mt-6">
                Go to Ideas
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {contents.map((content) => (
                <ContentListItem
                  key={content.id}
                  id={content.id}
                  title={content.title}
                  body={content.body}
                  status={content.status}
                  platform={content.platform}
                  ideaTitle={content.idea?.title ?? null}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </WorkspaceLayout>
  );
}
