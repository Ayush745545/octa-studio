import Link from "next/link";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Ideas", href: "/ideas" },
  { label: "Content", href: "/content" },
  { label: "Calendar", href: "/calendar" },
  { label: "AI Studio", href: "/ai-studio" },
  { label: "Publishing", href: "/publishing" },
  { label: "Analytics", href: "/analytics" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-950"
        >
          ContentOS
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6">
        <div className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
          Workspace
        </div>

        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <Link
          href="/settings"
          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          Settings
        </Link>
      </div>
    </aside>
  );
}
