import AppShell from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <h1 className="text-sm font-medium text-zinc-500">
            Workspace
          </h1>

          <button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
            + New Content
          </button>
        </header>

        <section className="px-8 py-10">
          <div className="max-w-5xl">
            <p className="text-sm font-medium text-zinc-500">
              ContentOS
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Your content operating system.
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
              Capture ideas, create content, repurpose it, schedule it,
              publish it, and learn what works.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-sm text-zinc-500">Ideas</p>
                <p className="mt-2 text-3xl font-semibold">0</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-sm text-zinc-500">Drafts</p>
                <p className="mt-2 text-3xl font-semibold">0</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-sm text-zinc-500">Published</p>
                <p className="mt-2 text-3xl font-semibold">0</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
