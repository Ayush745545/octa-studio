"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type DocItem = {
  id: string;
  title: string;
  group: string;
  soon?: boolean;
};

const NAV: DocItem[] = [
  { id: "getting-started", title: "Getting Started", group: "GETTING STARTED" },
  { id: "concepts", title: "Core concepts", group: "GETTING STARTED" },
  { id: "create-project", title: "Create a project", group: "CREATE" },
  { id: "upload-media", title: "Upload media", group: "CREATE" },
  { id: "generate-clips", title: "Generate clips", group: "CLIPS" },
  { id: "clip-selection", title: "Clip selection", group: "CLIPS" },
  { id: "captions", title: "Captions", group: "CLIPS" },
  { id: "export", title: "Export", group: "CLIPS" },
  { id: "projects", title: "Projects", group: "WORKFLOWS" },
  { id: "assets", title: "Assets", group: "WORKFLOWS" },
  { id: "scheduling", title: "Scheduling", group: "WORKFLOWS" },
  { id: "generations", title: "Generations", group: "WORKFLOWS" },
  { id: "api", title: "API", group: "REFERENCE" },
  { id: "webhooks", title: "Webhooks", group: "REFERENCE" },
  { id: "shortcuts", title: "Shortcuts", group: "REFERENCE" },
  { id: "faq", title: "FAQ", group: "REFERENCE" },
];

const GROUPS = ["GETTING STARTED", "CREATE", "CLIPS", "WORKFLOWS", "REFERENCE"];

/* ---------- small inline icons (no extra deps) ---------- */
type IconType = (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;

const I: Record<string, IconType> = {
  inbox: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4l2 3h6l2-3h4M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  ),
  sparkles: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" />
    </svg>
  ),
  calendar: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
    </svg>
  ),
  send: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  upload: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" />
    </svg>
  ),
  film: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16" />
    </svg>
  ),
  scissors: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a3 3 0 100 6 3 3 0 000-6zm0 6a3 3 0 100 6 3 3 0 000-6zm6-9l9 12M12 6l9-3" />
    </svg>
  ),
  download: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" />
    </svg>
  ),
  folder: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  layers: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />
    </svg>
  ),
  wand: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM4 20l9-9M14 10l3 3" />
    </svg>
  ),
  code: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
    </svg>
  ),
  webhook: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a3 3 0 013 3 3 3 0 01-3 3M9 18a3 3 0 01-3-3 3 3 0 013-3h6M6 12a9 9 0 009-9" />
    </svg>
  ),
  arrow: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
    </svg>
  ),
};

/* ---------- building blocks ---------- */
function Article({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7FFB50]">
          Octa Docs
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">{title}</h1>
        {lede && <p className="text-[17px] leading-relaxed text-zinc-400">{lede}</p>}
        <div className="space-y-5 text-[15px] leading-[1.75] text-zinc-400">{children}</div>
      </motion.div>
    </article>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="flex gap-4 border-t border-zinc-800/70 pt-6"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7FFB50]/10 text-[12px] font-semibold text-[#7FFB50]">
        {n}
      </span>
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        <div className="mt-2">{children}</div>
      </div>
    </motion.div>
  );
}

function Callout({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "tip" }) {
  const styles =
    tone === "tip"
      ? "border-[#7FFB50]/30 bg-[#7FFB50]/[0.06]"
      : "border-zinc-800 bg-zinc-950";
  return (
    <div className={`rounded-xl border p-4 text-[14px] text-zinc-300 ${styles}`}>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[13px] text-[#7FFB50]">
      {children}
    </code>
  );
}

function Link2({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1 text-[#7FFB50] transition hover:underline">
      {children}
      <I.arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SurfaceCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: IconType;
  title: string;
  desc: string;
  href: string;
}) {
  const Icon = icon;
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#7FFB50]/0 blur-2xl transition-colors duration-300 group-hover:bg-[#7FFB50]/10" />
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-white/[0.03] text-[#7FFB50]">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <h3 className="mt-4 text-[15px] font-semibold text-white">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{desc}</p>
      </motion.div>
    </Link>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-300">
      {children}
    </span>
  );
}

function ClipMock({ time, title }: { time: string; title: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] text-[#7FFB50]">{time}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">clip</span>
      </div>
      <p className="mt-2 text-[14px] text-zinc-200">{title}</p>
    </div>
  );
}

/* ---------- articles ---------- */
const ARTICLES: Record<string, React.ReactNode> = {
  "getting-started": (
    <Article
      title="Getting Started"
      lede="Octa is a creative workspace for turning one idea into many pieces of content. Start with a single video or idea, and Octa helps you take it further — clips, captions, and posts for every channel."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SurfaceCard icon={I.inbox} title="Idea inbox" desc="Capture and organize what you want to make." href="/ideas" />
        <SurfaceCard icon={I.sparkles} title="AI Studio" desc="Create from a prompt, link, or video." href="/ai-studio" />
        <SurfaceCard icon={I.calendar} title="Calendar" desc="Schedule and publish to every channel." href="/calendar" />
        <SurfaceCard icon={I.send} title="Publishing" desc="Connect profiles and ship." href="/publishing" />
      </div>
      <Callout tone="tip">
        Phase 1 focus: take a long video, get a transcript, find the best moments, and turn them
        into short clips you actually want to post.
      </Callout>
      <p>
        From here, the fastest path is to open <Link2 href="/ai-studio">AI Studio</Link2> and create
        something. The docs below walk through each step.
      </p>
    </Article>
  ),
  "create-project": (
    <Article
      title="Create a project"
      lede="A project in Octa starts in AI Studio. Pick what you want to make from the creation tool in the top bar, then describe it."
    >
      <Step n={1} title="Open AI Studio">
        <p>
          Go to <Link2 href="/ai-studio">AI Studio</Link2>. The bar at the top lets you switch between
          creation tools.
        </p>
      </Step>
      <Step n={2} title="Pick a creation tool">
        <p>Choose the tool that fits the job:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>Auto edit</Chip>
          <Chip>Generate video</Chip>
          <Chip>Generate image</Chip>
          <Chip>Add captions</Chip>
          <Chip>Smart Cut</Chip>
        </div>
        <ul className="mt-4 space-y-1 text-zinc-300">
          <li><Code>Auto edit</Code> — upload a video and let Octa refine it.</li>
          <li><Code>Generate video</Code> — create a video from a prompt.</li>
          <li><Code>Generate image</Code> — create an image from a prompt.</li>
          <li><Code>Add captions</Code> — turn a video&apos;s speech into captions.</li>
          <li><Code>Smart Cut</Code> — find the best moments and make clips.</li>
        </ul>
      </Step>
      <Step n={3} title="Describe and create">
        <p>
          Write what you want, attach a file if the tool needs one, and let Octa build the first
          version. You can refine from there.
        </p>
      </Step>
      <Callout>
        Everything you create lives in one workspace, so a single source video can feed clips,
        captions, and scheduled posts without starting over.
      </Callout>
    </Article>
  ),
  "upload-media": (
    <Article
      title="Upload media"
      lede="Tools like Add captions and Auto edit work from a source video. Upload it once and Octa stores it in your media library."
    >
      <Step n={1} title="Choose a tool that needs media">
        <p>
          In AI Studio, select <Code>Add captions</Code> or <Code>Auto edit</Code>.
        </p>
      </Step>
      <Step n={2} title="Add your video">
        <p>
          Press the upload button and pick a playable video file. Octa uploads it through the media
          endpoint and shows the file as ready.
        </p>
      </Step>
      <Step n={3} title="Continue">
        <p>
          Once the video is ready, choose what you want Octa to do next — generate captions or prepare
          a cut.
        </p>
      </Step>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
          Supported formats
        </div>
        <div className="grid grid-cols-3 divide-x divide-zinc-800 text-center text-[13px]">
          <div className="px-2 py-3 text-zinc-300">mp4</div>
          <div className="px-2 py-3 text-zinc-300">mov</div>
          <div className="px-2 py-3 text-zinc-300">webm</div>
        </div>
      </div>
      <Callout>
        Files are uploaded via the media API and stored with their original metadata. Use widely
        supported formats for the smoothest processing.
      </Callout>
    </Article>
  ),
  "generate-clips": (
    <Article
      title="Generate clips"
      lede="The first real workflow turns one long video into several short-form clips. The pipeline is deliberately simple."
    >
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 font-mono text-[13px] text-zinc-300">
        <div>Video</div>
        <div className="pl-4 text-zinc-500">↓ speech-to-text</div>
        <div className="pl-4">Timestamped transcript</div>
        <div className="pl-4 text-zinc-500">↓ LLM segment selection</div>
        <div className="pl-4">Best moments</div>
        <div className="pl-4 text-zinc-500">↓ FFmpeg</div>
        <div className="pl-4 text-[#7FFB50]">Real clips</div>
      </div>
      <Step n={1} title="Add your video">
        <p>Upload the source in AI Studio (see Upload media).</p>
      </Step>
      <Step n={2} title="Let Octa analyze it">
        <p>
          Octa transcribes the audio and identifies sections that can stand on their own — strong
          openings, useful information, and natural endings.
        </p>
      </Step>
      <Step n={3} title="Review the clips">
        <p>Choose the moments you want to keep. Each becomes its own short.</p>
      </Step>
      <Step n={4} title="Export">
        <p>Download your finished clips, or send them to the calendar to schedule.</p>
      </Step>
      <Callout tone="tip">
        You get more than cuts: each clip keeps its transcript, so captions and hashtags can be
        generated in the same pass.
      </Callout>
    </Article>
  ),
  "clip-selection": (
    <Article
      title="Clip selection"
      lede="Octa favors moments worth keeping. The selector prefers clips with a clear reason to exist."
    >
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <li className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">Strong hooks and natural beginnings</li>
        <li className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">Complete, useful thoughts</li>
        <li className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">Emotional or surprising insights</li>
        <li className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">Natural endings</li>
      </ul>
      <p>It avoids silence, filler, duplicate sections, and incomplete sentences.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ClipMock time="00:12 — 00:38" title="“The thing nobody tells you about editing…”" />
        <ClipMock time="02:04 — 02:41" title="“Here&apos;s the mistake that cost us a week.”" />
        <ClipMock time="04:50 — 05:19" title="“And that&apos;s why we switched tools.”" />
        <ClipMock time="07:22 — 07:55" title="“The shortcut I wish I knew sooner.”" />
      </div>
      <Callout>
        Initial target length is 20–90 seconds. That is a guideline, not a rigid rule — a great
        moment can be shorter or longer.
      </Callout>
    </Article>
  ),
  export: (
    <Article
      title="Export"
      lede="When your clips are ready, review them and export. One source video becomes several finished pieces."
    >
      <ul className="space-y-2 text-zinc-300">
        <li className="flex items-center gap-2"><I.download className="h-4 w-4 text-[#7FFB50]" /> Download finished clips individually.</li>
        <li className="flex items-center gap-2"><I.calendar className="h-4 w-4 text-[#7FFB50]" /> Send them to the <Link2 href="/calendar">calendar</Link2> to schedule across channels.</li>
        <li className="flex items-center gap-2"><I.sparkles className="h-4 w-4 text-[#7FFB50]" /> Attach captions and hashtags before publishing.</li>
      </ul>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">Publish checklist</p>
        <ul className="mt-3 space-y-2 text-[14px] text-zinc-300">
          <li>✓ Caption text reviewed</li>
          <li>✓ Hashtags attached</li>
          <li>✓ Channel &amp; time selected</li>
          <li>✓ Queued to calendar</li>
        </ul>
      </div>
      <p>
        That is the whole point of Octa — one idea, many finished pieces, ready to ship.
      </p>
    </Article>
  ),
  projects: (
    <Article
      title="Projects"
      lede="A project turns one source video into a managed job — transcription, clip generation, captions, and scheduling, all tracked in one place."
    >
      <Step n={1} title="Start a project">
        <p>
          Send the source to <Code>POST /api/creator-studio/projects</Code>. Pass a{" "}
          <Code>mediaId</Code> you already uploaded, or a <Code>url</Code> and Octa will register the
          source for you.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Create a project
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
{`POST /api/creator-studio/projects
Authorization: Bearer <token>
Content-Type: application/json

{ "mediaId": "<mediaId>" }

→ { "project": { "id": "…", "status": "PROCESSING", "clips": [] } }`}
          </pre>
        </div>
      </Step>
      <Step n={2} title="Octa processes it">
        <p>
          The job runs speech-to-text, selects the best segments, and generates clips. Poll{" "}
          <Code>GET /api/creator-studio/projects</Code> to list every project and its current status.
        </p>
      </Step>
      <Step n={3} title="Review and schedule">
        <p>
          Once clips are ready, send them to the calendar with <Code>/api/creator-studio/schedule</Code>{" "}
          (see Export). Each clip keeps its transcript so captions travel with it.
        </p>
      </Step>
      <Callout>
        <span className="text-[#7FFB50]">Early access.</span> Projects are available via the API
        today; the in-app Projects workspace is rolling out. Errors: <Code>401</Code> not signed in,{" "}
        <Code>400</Code> when neither <Code>mediaId</Code> nor <Code>url</Code> is supplied,{" "}
        <Code>500</Code> on failure.
      </Callout>
    </Article>
  ),
  assets: (
    <Article
      title="Assets"
      lede="Assets are your media library — every source video and imported link lives here, available to any project you create."
    >
      <Step n={1} title="Upload a file">
        <p>
          <Code>POST /api/media/upload</Code> accepts a multipart form with the video and returns a
          stored media record.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Upload media
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
{`POST /api/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

→ { "success": true, "media": { "id": "…", "url": "…" } }`}
          </pre>
        </div>
      </Step>
      <Step n={2} title="Large files use chunked upload">
        <p>
          For big videos, stream in parts with <Code>POST /api/media/upload/chunk</Code> and finish
          with <Code>POST /api/media/upload/finalize</Code> to assemble the final asset.
        </p>
      </Step>
      <Step n={3} title="Or import a link">
        <p>
          <Code>POST /api/media/import</Code> pulls a remote URL straight into the library without a
          manual upload.
        </p>
      </Step>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
          Manage assets
        </div>
        <ul className="divide-y divide-zinc-800 text-[14px] text-zinc-300">
          <li className="px-4 py-3"><Code>GET /api/media</Code> — list library assets</li>
          <li className="px-4 py-3"><Code>GET /api/media/[id]</Code> — fetch one asset</li>
          <li className="px-4 py-3"><Code>POST /api/media/import</Code> — import by URL</li>
        </ul>
      </div>
      <Callout>
        <span className="text-[#7FFB50]">Tip.</span> Upload once, reuse everywhere — the same media
        id can back multiple projects, so clips stay consistent across campaigns.
      </Callout>
    </Article>
  ),
  generations: (
    <Article
      title="Generations"
      lede="Generations is the log of every AI output Octa has created for you — text, images, and captions — saved with the prompt that produced them."
    >
      <Step n={1} title="View your history">
        <p>
          <Code>GET /api/ai/generations</Code> returns your latest 50 generations, newest first.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            List generations
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
{`GET /api/ai/generations
Authorization: Bearer <token>

→ { "items": [ { "id": "…", "type": "text", "prompt": "…" } ] }`}
          </pre>
        </div>
      </Step>
      <Step n={2} title="Save a result">
        <p>
          <Code>POST /api/ai/generations</Code> stores a generation. Include the <Code>prompt</Code>{" "}
          plus optional <Code>type</Code>, <Code>tool</Code>, <Code>platform</Code>, and{" "}
          <Code>result</Code>. A missing prompt returns <Code>400</Code>.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Save a generation
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
{`POST /api/ai/generations
Authorization: Bearer <token>
Content-Type: application/json

{ "prompt": "Hook for a fitness reel", "type": "text", "tool": "caption" }

→ { "item": { "id": "…", "createdAt": "…" } }`}
          </pre>
        </div>
      </Step>
      <Step n={3} title="Reuse it">
        <p>
          Copy a saved prompt back into AI Studio to regenerate, tweak the wording, or compare
          variants of the same idea.
        </p>
      </Step>
    </Article>
  ),
  api: (
    <Article
      title="API"
      lede="The Octa API lets you drive media, projects, generations, and scheduling from your own tools over REST."
    >
      <Step n={1} title="Authenticate">
        <p>
          Get a session with <Code>POST /api/auth/login</Code> (or <Code>/api/auth/google</Code>) and
          send the token as a bearer header on every request.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Auth header
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
{`Authorization: Bearer <token>
Content-Type: application/json`}
          </pre>
        </div>
      </Step>
      <Step n={2} title="Call the endpoints">
        <p>These are the live routes used by the product:</p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Endpoints
          </div>
          <ul className="divide-y divide-zinc-800 text-[14px] text-zinc-300">
            <li className="px-4 py-3"><Code>POST /api/media/upload</Code> — upload a source video</li>
            <li className="px-4 py-3"><Code>POST /api/media/import</Code> — import media by URL</li>
            <li className="px-4 py-3"><Code>POST /api/creator-studio/projects</Code> — start a project</li>
            <li className="px-4 py-3"><Code>GET /api/creator-studio/projects</Code> — list projects</li>
            <li className="px-4 py-3"><Code>POST /api/creator-studio/schedule</Code> — schedule clips</li>
            <li className="px-4 py-3"><Code>GET /api/ai/generations</Code> — list AI generations</li>
            <li className="px-4 py-3"><Code>POST /api/ai/generations</Code> — save a generation</li>
          </ul>
        </div>
      </Step>
      <Step n={3} title="Read errors">
        <p>
          Failures return a JSON <Code>error</Code> with a standard HTTP status — <Code>401</Code> when
          you must sign in, <Code>400</Code> for a missing field, <Code>500</Code> for server errors.
        </p>
      </Step>
      <Callout tone="tip">
        The base URL for every path above is your workspace origin — for example{" "}
        <Code>https://your-domain.com/api/…</Code>.
      </Callout>
    </Article>
  ),
  webhooks: (
    <Article
      title="Webhooks"
      lede="Webhooks notify your systems the moment Octa finishes work, so you can move clips into your own pipeline without polling."
    >
      <Step n={1} title="Receive events">
        <p>
          Octa posts a JSON body to your endpoint for each event. The shape mirrors the project and
          clip models used by the API.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Example — clip ready
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
{`POST https://your-app.com/hooks/octa
{
  "event": "clip.ready",
  "projectId": "…",
  "clips": [ { "id": "…", "start": 12, "end": 38 } ]
}`}
          </pre>
        </div>
      </Step>
      <Step n={2} title="Subscribe to what you need">
        <p>Events follow the real pipeline stages a project moves through:</p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <ul className="divide-y divide-zinc-800 text-[14px] text-zinc-300">
            <li className="px-4 py-3"><Code>project.created</Code> — a new project job started</li>
            <li className="px-4 py-3"><Code>clip.ready</Code> — clips finished generating</li>
            <li className="px-4 py-3"><Code>captions.ready</Code> — captions finished</li>
            <li className="px-4 py-3"><Code>content.scheduled</Code> — a clip was queued to publish</li>
          </ul>
        </div>
      </Step>
      <Step n={3} title="Verify the source">
        <p>
          Validate the request signature (or a shared secret) before trusting the payload, and return
          a <Code>2xx</Code> quickly — do heavy work asynchronously.
        </p>
      </Step>
      <Callout>
        <span className="text-[#7FFB50]">Coming soon.</span> Webhook delivery is being finalized; the
        event names above already match the pipeline your projects run through today.
      </Callout>
    </Article>
  ),
  concepts: (
    <Article
      title="Core concepts"
      lede="Octa turns one piece of source media into many finished pieces. A handful of concepts show up everywhere, so it helps to know them."
    >
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 font-mono text-[13px] text-zinc-300">
        <div>Source video</div>
        <div className="pl-4 text-zinc-500">↓ transcribe</div>
        <div className="pl-4">Transcript (timestamps)</div>
        <div className="pl-4 text-zinc-500">↓ select moments</div>
        <div className="pl-4">Clips</div>
        <div className="pl-4 text-zinc-500">↓ style text</div>
        <div className="pl-4">Captions</div>
        <div className="pl-4 text-zinc-500">↓ queue</div>
        <div className="pl-4 text-[#7FFB50]">Scheduled posts</div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SurfaceCard icon={I.film} title="Source" desc="The video (or idea) you start from." href="/ai-studio" />
        <SurfaceCard icon={I.code} title="Transcript" desc="Speech turned into timestamped text." href="/docs#generate-clips" />
        <SurfaceCard icon={I.scissors} title="Clips" desc="The best moments, cut into shorts." href="/docs#generate-clips" />
        <SurfaceCard icon={I.sparkles} title="Captions" desc="Styled text synced to speech." href="/docs#captions" />
      </div>
      <Step n={1} title="Source">
        <p>Everything begins with one video, or a prompt you want to build from in AI Studio.</p>
      </Step>
      <Step n={2} title="Transcript">
        <p>Octa listens to the audio and writes it out with timestamps, so moments can be found later.</p>
      </Step>
      <Step n={3} title="Clips &amp; captions">
        <p>The transcript drives both — clips are pulled from strong sections, and captions are synced to the words.</p>
      </Step>
      <Step n={4} title="Schedule">
        <p>Finished pieces are queued to the calendar and pushed to your connected channels.</p>
      </Step>
      <Callout tone="tip">
        Keep the source in mind: the better the original, the better every downstream piece. A clear
        voice and a quiet room help more than any setting.
      </Callout>
    </Article>
  ),
  captions: (
    <Article
      title="Captions"
      lede="Captions put styled, readable text on screen, synced to what is being said. They are the fastest way to make a clip watchable with the sound off."
    >
      <Step n={1} title="Open Add captions">
        <p>
          In AI Studio, switch the creation tool to <Code>Add captions</Code>, then upload a video
          through <Code>POST /api/media/upload</Code>.
        </p>
      </Step>
      <Step n={2} title="Let Octa transcribe">
        <p>
          Octa converts the speech to a timestamped transcript and groups it into caption segments,
          the same way a project builds its clips.
        </p>
      </Step>
      <Step n={3} title="Choose a style">
        <p>Pick how the text looks. Common controls:</p>
        <div className="overflow-hidden rounded-xl border border border-zinc-800">
          <ul className="divide-y divide-zinc-800 text-[14px] text-zinc-300">
            <li className="px-4 py-3"><Code>Size</Code> — large enough to read on a phone</li>
            <li className="px-4 py-3"><Code>Color &amp; outline</Code> — high contrast against the frame</li>
            <li className="px-4 py-3"><Code>Position</Code> — usually the lower third</li>
            <li className="px-4 py-3"><Code>Highlight</Code> — emphasize keywords</li>
          </ul>
        </div>
      </Step>
      <Step n={4} title="Review and export">
        <p>Play the clip back, fix any misheard words, then export with the captions baked in.</p>
      </Step>
      <Callout>
        Captions are generated from the same transcript as clips, so a project&apos;s <Code>captions.ready</Code>{" "}
        event means both the cuts and the text are finished together.
      </Callout>
      <p className="text-zinc-300">Best practices:</p>
      <ul className="space-y-1 text-zinc-300">
        <li>Keep one idea per line so it is easy to read</li>
        <li>Use a bold outline so text survives busy backgrounds</li>
        <li>Place captions low so they never cover faces</li>
      </ul>
    </Article>
  ),
  scheduling: (
    <Article
      title="Scheduling"
      lede="Scheduling puts finished clips on the calendar and pushes them to your connected channels — Instagram and LinkedIn today."
    >
      <Step n={1} title="Pick the clips">
        <p>From a project, choose the clips you want to publish. Each becomes a slot you can time.</p>
      </Step>
      <Step n={2} title="Send them to the calendar">
        <p>
          Call <Code>POST /api/creator-studio/schedule</Code> with the project and a list of slots.
          Each slot names a <Code>clipId</Code>, a <Code>platform</Code>, and a <Code>scheduledAt</Code>.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Schedule clips
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
{`POST /api/creator-studio/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "<id>",
  "slots": [
    { "clipId": "<id>", "platform": "Instagram", "scheduledAt": "2026-09-01T10:00:00Z" }
  ]
}

→ { "ok": true, "contentCreated": 1, "failed": [] }`}
          </pre>
        </div>
      </Step>
      <Step n={3} title="Connect a channel">
        <p>
          Before a post can go out, connect a profile in{" "}
          <Link2 href="/publishing">Publishing</Link2> — Instagram and LinkedIn both use an OAuth
          connect flow, then <Code>POST /api/publishing/process</Code> ships the queued content.
        </p>
      </Step>
      <Callout>
        Manage the full queue visually in the{" "}
        <Link2 href="/calendar">Calendar</Link2>. Errors: <Code>401</Code> not signed in,{" "}
        <Code>400</Code> when <Code>projectId</Code> or slots are missing.
      </Callout>
    </Article>
  ),
  shortcuts: (
    <Article
      title="Shortcuts"
      lede="A few keys keep you moving — especially inside these docs and AI Studio."
    >
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
          Docs
        </div>
        <ul className="divide-y divide-zinc-800 text-[14px] text-zinc-300">
          <li className="flex items-center justify-between px-4 py-3">
            <span>Open search</span>
            <span><kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400">⌘K</kbd> / <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400">Ctrl K</kbd></span>
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <span>Move through results</span>
            <span><kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400">↑</kbd> <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400">↓</kbd></span>
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <span>Open the highlighted result</span>
            <span><kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400">Enter</kbd></span>
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <span>Close search</span>
            <span><kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400">Esc</kbd></span>
          </li>
        </ul>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-[12px] font-medium uppercase tracking-wider text-zinc-500">
          AI Studio
        </div>
        <ul className="divide-y divide-zinc-800 text-[14px] text-zinc-300">
          <li className="flex items-center justify-between px-4 py-3">
            <span>Switch creation tool</span>
            <span className="text-zinc-500">use the top bar selector</span>
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <span>Open the docs</span>
            <span><Link2 href="/docs">Docs</Link2></span>
          </li>
        </ul>
      </div>
      <Callout tone="tip">
        Press <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400">⌘K</kbd>{" "}
        from anywhere on this page to jump straight to a topic.
      </Callout>
    </Article>
  ),
  faq: (
    <Article
      title="FAQ"
      lede="Quick answers to the questions people ask most when they start with Octa."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-[14px] font-semibold text-white">What video formats can I upload?</p>
          <p className="mt-1 text-[14px] text-zinc-400">mp4, mov, and webm are supported. Use widely compatible codecs for the smoothest processing.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-[14px] font-semibold text-white">How long should a clip be?</p>
          <p className="mt-1 text-[14px] text-zinc-400">Aim for 20–90 seconds. It is a guideline, not a rule — a great moment can be shorter or longer.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-[14px] font-semibold text-white">Which channels can I publish to?</p>
          <p className="mt-1 text-[14px] text-zinc-400">Instagram and LinkedIn today, connected from the Publishing page.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-[14px] font-semibold text-white">Do I need an account?</p>
          <p className="mt-1 text-[14px] text-zinc-400">Browsing docs is open. Creating projects, saving generations, and scheduling require you to be signed in.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-[14px] font-semibold text-white">Is there an API?</p>
          <p className="mt-1 text-[14px] text-zinc-400">Yes — media, projects, generations, and scheduling are all driven by REST endpoints. See the <Link2 href="/docs#api">API</Link2> reference.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-[14px] font-semibold text-white">Can I automate from my own tools?</p>
          <p className="mt-1 text-[14px] text-zinc-400">Webhooks are on the way and will post events as your projects move through the pipeline.</p>
        </div>
      </div>
    </Article>
  ),
};

/* ---------- command palette ---------- */
function CommandPalette({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(
    () =>
      NAV.filter(
        (i) => !i.soon && i.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const safeActive = results.length ? Math.min(active, results.length - 1) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0f] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
              <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const item = results[safeActive];
                    if (item) onSelect(item.id);
                  } else if (e.key === "Escape") {
                    onClose();
                  }
                }}
                placeholder="Search Octa documentation…"
                className="w-full bg-transparent py-4 text-[15px] text-white outline-none placeholder:text-zinc-600"
              />
              <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-500">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <p className="px-3 py-6 text-center text-[13px] text-zinc-600">No matching docs.</p>
              )}
              {results.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[14px] transition ${
                    i === safeActive ? "bg-[#7FFB50]/10 text-white" : "text-zinc-400 hover:bg-white/5"
                  }`}
                >
                  <span>{item.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">{item.group}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DocsView() {
  const [active, setActive] = useState("getting-started");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function syncHash() {
      const id = window.location.hash.replace(/^#/, "");
      if (id && NAV.some((n) => n.id === id)) setActive(id);
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [active]);

  const select = (id: string) => {
    setActive(id);
    setPaletteOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#0a0a0c]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
              octa-studio
            </Link>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/40">
              DOCS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-400 transition hover:border-zinc-600 hover:text-white"
            >
              <svg className="h-3.5 w-3.5 transition-colors group-hover:text-[#7FFB50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              Search
              <kbd className="ml-1 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">⌘K</kbd>
            </button>
            <Link
              href="/login"
              className="hidden rounded-full border border-zinc-800 px-5 py-2 text-[13px] font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white sm:inline-block"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-zinc-800 px-4 py-8 md:block">
          <nav className="space-y-6">
            {GROUPS.map((group) => {
              const items = NAV.filter((i) => i.group === group);
              return (
                <div key={group}>
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    {group}
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {items.map((item) => {
                      const isActive = active === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.soon}
                          onClick={() => !item.soon && select(item.id)}
                          className={`relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition ${
                            isActive
                              ? "text-white"
                              : item.soon
                              ? "cursor-not-allowed text-zinc-600"
                              : "text-zinc-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg bg-[#7FFB50]/10"
                              transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            />
                          )}
                          <span className="relative z-10">{item.title}</span>
                          {item.soon && (
                            <span className="relative z-10 text-[9px] uppercase tracking-wider text-zinc-700">soon</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <main ref={mainRef} className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {ARTICLES[active] ?? ARTICLES["getting-started"]}
            </motion.div>
          </AnimatePresence>
          <div className="mx-auto max-w-3xl px-6 pb-20">
            <div className="border-t border-zinc-800 pt-8 text-[13px] text-zinc-600">
              Didn&apos;t find what you need? The docs are growing — start in{" "}
              <Link href="/ai-studio" className="text-[#7FFB50] hover:underline">
                AI Studio
              </Link>
              .
            </div>
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={select} />
    </div>
  );
}
