import Link from "next/link";
import WorkspaceLayout from "@/components/layout/workspace-layout";
import { prisma } from "@/lib/prisma";
import NewIdeaModal from "@/components/ideas/new-idea-modal";
import IdeaInbox from "@/components/ideas/idea-inbox";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const ideas = await prisma.idea.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <WorkspaceLayout activeItem="ideas">
      <div className="min-h-screen bg-[#0a0a0c]">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-zinc-500">Workspace</p>
          </div>

          <NewIdeaModal />
        </header>

        <main className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-7xl">
              <style dangerouslySetInnerHTML={{ __html: `
                .idea-folder {
                  --folder-back-1: #24242c;
                  --folder-back-2: #16161c;
                  --folder-front-1: #30303a;
                  --folder-front-2: #24242e;
                  --folder-edge: #C7E34F;
                  --paper: #f3f9d8;
                  --paper-2: #e7f1bf;
                  --ink: #e8e8ea;
                  --ink-soft: #9aa0a6;
                  --ring: #C7E34F;
                  --radius: 0.875em;
                  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);

                  position: relative;
                  display: inline-block;
                  width: 16em;
                  font-size: 16px;
                  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
                  color: var(--ink);
                  cursor: pointer;
                  user-select: none;
                  background: transparent;
                  border: none;
                  padding: 0;
                  margin: 0;
                  text-align: center;
                }

                .idea-folder__toggle {
                  position: absolute;
                  width: 1px;
                  height: 1px;
                  opacity: 0;
                  pointer-events: none;
                }

                .idea-folder__shape {
                  position: relative;
                  display: block;
                  width: 100%;
                  aspect-ratio: 5 / 4;
                  transition: transform 0.45s var(--ease);
                }

                .idea-folder__back {
                  position: absolute;
                  inset: 14% 0 0 0;
                  background: linear-gradient(135deg, var(--folder-back-1), var(--folder-back-2));
                  border-radius: 0.25em var(--radius) var(--radius) var(--radius);
                  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
                }

                .idea-folder__back::before {
                  content: "";
                  position: absolute;
                  top: -13%;
                  left: 0;
                  width: 46%;
                  height: 16%;
                  background: linear-gradient(135deg, var(--folder-back-1), var(--folder-back-2));
                  border-radius: 0.375em 0.375em 0 0;
                  clip-path: polygon(0 0, 82% 0, 100% 100%, 0 100%);
                }

                .idea-folder__papers {
                  position: absolute;
                  inset: 6% 8% 12% 8%;
                  z-index: 2;
                  display: block;
                }

                .idea-paper {
                  position: absolute;
                  left: 50%;
                  bottom: 0;
                  width: 86%;
                  height: 78%;
                  translate: -50% 0;
                  background: var(--paper);
                  border-radius: 0.375em;
                  box-shadow: 0 0.25em 0.875em rgba(0, 0, 0, 0.35);
                  transition: transform 0.45s var(--ease), bottom 0.45s var(--ease);
                  overflow: hidden;
                }

                .idea-paper::before,
                .idea-paper::after {
                  content: "";
                  position: absolute;
                  left: 14%;
                  right: 24%;
                  height: 6%;
                  border-radius: 0.2em;
                  background: var(--paper-2);
                }
                .idea-paper::before { top: 22%; }
                .idea-paper::after { top: 40%; right: 40%; }

                .idea-paper--1 { width: 78%; height: 70%; background: #eef7cf; }
                .idea-paper--2 { width: 82%; height: 74%; background: #f6fadf; }
                .idea-paper--3 { width: 86%; }

                .idea-folder__front {
                  position: absolute;
                  inset: 38% 0 0 0;
                  z-index: 3;
                  background: linear-gradient(150deg, var(--folder-front-1), var(--folder-front-2));
                  border-radius: var(--radius);
                  box-shadow:
                    inset 0 1px 0 rgba(255, 255, 255, 0.12),
                    0 -1px 0 var(--folder-edge),
                    0 0.875em 1.375em -0.75em rgba(0, 0, 0, 0.6);
                  transform-origin: bottom center;
                  transition: transform 0.45s var(--ease);
                }

                .idea-folder__front::after {
                  content: "";
                  position: absolute;
                  inset: 0;
                  border-radius: var(--radius);
                  background: linear-gradient(120deg, rgba(199, 227, 79, 0.25) 0%, transparent 45%);
                  pointer-events: none;
                }

                .idea-folder__meta {
                  display: block;
                  margin-top: 1.1em;
                  text-align: center;
                }
                .idea-folder__title {
                  display: block;
                  font-weight: 700;
                  font-size: 1.05em;
                  letter-spacing: -0.01em;
                }
                .idea-folder__count {
                  display: block;
                  margin-top: 0.15em;
                  font-size: 0.85em;
                  color: var(--ink-soft);
                }

                @media (hover: hover) {
                  .idea-folder:hover .idea-folder__shape { transform: translateY(-0.375em); }
                  .idea-folder:hover .idea-folder__front { transform: rotateX(-32deg); }
                  .idea-folder:hover .idea-paper { transform: translateY(-26%); }
                  .idea-folder:hover .idea-paper--1 { transform: translate(-26%, -18%) rotate(-7deg); }
                  .idea-folder:hover .idea-paper--2 { transform: translate(22%, -22%) rotate(6deg); }
                }

                .idea-folder:active .idea-folder__shape {
                  transform: translateY(-0.125em) scale(0.99);
                }

                .idea-folder__toggle:checked ~ .idea-folder__shape { transform: translateY(-0.375em); }
                .idea-folder__toggle:checked ~ .idea-folder__shape .idea-folder__front { transform: rotateX(-32deg); }
                .idea-folder__toggle:checked ~ .idea-folder__shape .idea-paper { transform: translateY(-26%); }
                .idea-folder__toggle:checked ~ .idea-folder__shape .idea-paper--1 { transform: translate(-26%, -18%) rotate(-7deg); }
                .idea-folder__toggle:checked ~ .idea-folder__shape .idea-paper--2 { transform: translate(22%, -22%) rotate(6deg); }

                .idea-folder__toggle:focus-visible ~ .idea-folder__shape .idea-folder__back {
                  outline: 3px solid var(--ring);
                  outline-offset: 4px;
                  border-radius: var(--radius);
                }

                @media (prefers-reduced-motion: reduce) {
                  .idea-folder__shape, .idea-folder__front, .idea-paper { transition: none; }
                }

                .idea-card-link {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  width: 100%;
                  text-decoration: none;
                  color: var(--ink);
                  outline: none;
                  transition: transform 0.25s var(--ease);
                }
                .idea-card-link:hover {
                  transform: translateY(-6px);
                }
                .idea-card-link .idea-folder__meta { width: 100%; }
                .idea-card-link .idea-folder__title {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  padding: 0 0.25em;
                }

                .idea-card-link:focus-visible .idea-folder__shape { transform: translateY(-0.375em); }
                .idea-card-link:focus-visible .idea-folder__front { transform: rotateX(-32deg); }
                .idea-card-link:focus-visible .idea-paper { transform: translateY(-26%); }
                .idea-card-link:focus-visible .idea-paper--1 { transform: translate(-26%, -18%) rotate(-7deg); }
                .idea-card-link:focus-visible .idea-paper--2 { transform: translate(22%, -22%) rotate(6deg); }

                .idea-card-link:focus-visible .idea-folder__back {
                  outline: 3px solid var(--ring);
                  outline-offset: 4px;
                  border-radius: var(--radius);
                }

                .idea-folder--lg {
                  width: clamp(17em, 44vw, 22em);
                }
                .idea-folder--lg:focus-visible .idea-folder__shape { transform: translateY(-0.375em); }
                .idea-folder--lg:focus-visible .idea-folder__front { transform: rotateX(-32deg); }
                .idea-folder--lg:focus-visible .idea-paper { transform: translateY(-26%); }
                .idea-folder--lg:focus-visible .idea-paper--1 { transform: translate(-26%, -18%) rotate(-7deg); }
                .idea-folder--lg:focus-visible .idea-paper--2 { transform: translate(22%, -22%) rotate(6deg); }
                .idea-folder--lg:focus-visible .idea-folder__back {
                  outline: 3px solid var(--ring);
                  outline-offset: 4px;
                  border-radius: var(--radius);
                }
              ` }} />

              <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h1 className="text-lg font-medium tracking-tight text-white">Ideas worth exploring.</h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    Capture ideas before they disappear. Later, turn the strongest
                    ones into real content.
                  </p>
                </div>

                <div className="shrink-0">
                  <IdeaInbox count={ideas.length} />
                </div>
              </div>

            <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2">
              {ideas.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-10 text-center">
                  <p className="text-sm font-medium text-white">No ideas yet.</p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Capture your first idea to start building your content
                    pipeline.
                  </p>
                </div>
              ) : (
                ideas.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    className="idea-folder idea-card-link"
                    aria-label={idea.title}
                    title={idea.title}
                  >
                    <span className="idea-folder__shape">
                      <span className="idea-folder__back" />
                      <span className="idea-folder__papers">
                        <span className="idea-paper idea-paper--1" />
                        <span className="idea-paper idea-paper--2" />
                        <span className="idea-paper idea-paper--3" />
                      </span>
                      <span className="idea-folder__front" />
                    </span>
                    <span className="idea-folder__meta">
                      <span className="idea-folder__title">{idea.title}</span>
                      <span className="idea-folder__count">
                        {idea.category ?? idea.status}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </WorkspaceLayout>
  );
}
