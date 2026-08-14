const CATEGORY_COLORS: Record<string, string> = {
  Creative: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  Design: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Photography: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Video: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Music: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Writing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  AI: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Tech: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Lifestyle: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Business: "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

const DEFAULT_CATEGORY_COLOR = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

export default function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR
      }`}
    >
      {category}
    </span>
  );
}
