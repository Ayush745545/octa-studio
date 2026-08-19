<div align="center">

  <img src="https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/GSAP-3.15.0-88CE02?style=for-the-badge&logo=greensock&logoColor=black" alt="GSAP" />

</div>

<div align="center">
  <img src="public/images/logo.png" alt="octa-studio Logo" width="100" />
</div>

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/octa-studio-Your_Content_Operating_System-ff66ff?style=for-the-badge">
    <img src="https://img.shields.io/badge/octa-studio-Your_Content_Operating_System-000000?style=for-the-badge" alt="octa-studio" />
  </picture>
</h1>

<div align="center">
  <a href="https://discord.gg/TGtuxX5AG">
    <img src="https://img.shields.io/badge/Discord-Join_Community-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status" />
</div>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=ff66ff&width=435&lines=Plan+%F0%9F%A7%A9;Create+%F0%9F%93%9E;Schedule+%F0%9F%93%85;Publish+%F0%9F%93%A2;One+Workspace+%E2%9C%88%EF%B8%8F" alt="Typing SVG" />
</div>

---

## What is octa-studio?

**octa-studio** is your all-in-one content operating system. Plan, create, schedule, and publish content across multiple platforms from a single, unified workspace. Built for creators who want to move fast without losing control.

- Transform raw ideas into polished content with **AI Studio**
- Manage your content pipeline with a powerful **Calendar view**
- Connect **LinkedIn** and other channels for seamless publishing
- Track performance with built-in **Analytics**
- Organize ideas, media, and publications in one place

---

## ✨ Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 💡 **Ideas** | Capture and organize ideas before they become content |
| ✨ **AI Studio** | Generate text, images, and videos with local AI |
| 📝 **Content Editor** | Full-featured editor for posts and media |
| 📅 **Calendar** | Drag-and-drop scheduling with timezone support |
| 📤 **Publishing** | One-click publish to LinkedIn, Instagram, X, TikTok |
| 📈 **Analytics** | Track performance across all connected channels |
| 🔗 **Link-in-Bio** | Create custom link-in-bio pages |
| 📤 **Media Library** | Upload, manage, and reuse media assets |

</div>

---

## 🔄 Workflow

<div align="center">

  **Step 1:** Capture ideas &nbsp;→&nbsp; **Step 2:** Write &amp; enhance content &nbsp;→&nbsp; **Step 3:** Schedule &amp; publish

  <img src="/public/images/step1-ideas.jpg" alt="Step 1: Ideas" width="180" />
  <img src="/public/images/step2-write.jpg" alt="Step 2: Write" width="180" />
  <img src="/public/images/step3-schedule.jpg" alt="Step 3: Schedule" width="180" />

  *From raw idea to published post in three steps.*

</div>

> **Note:** Screenshots are stored in `public/images/`. On GitHub, they are referenced via `/public/images/...`. For local app preview, they are served from `/images/...`.

---

## 🎬 AI Creator Studio — Video Captioning Pipeline

**Octa Studio** ships a full AI video creator pipeline (inspired by modern creator tools like Captions.ai) that turns a single long-form upload into captioned, platform-ready shorts. It is built on top of the existing **ContentJob / Media** system and does **not** replace any working upload, scheduling, or publishing code.

### End-to-end flow

```
VIDEO ──▶ AUDIO ──▶ WHISPER ──▶ TRANSCRIPT ──▶ CAPTION SEGMENTS
   │                                                          │
   └──────────────────────────────────────────────────────────┘
                          │
                   CAPTION GROUPS ──▶ CAPTION RENDERING ──▶ CREATOR STUDIO PREVIEW
```

The pipeline is modeled as 10 resumable stages (`lib/creator/stages.ts`), each persisted to the database so a failed job can be retried from the exact point of failure:

| # | Stage | Progress | What it does |
|---|-------|----------|--------------|
| 1 | `VALIDATE` | 5% | Probe source with `ffprobe` (duration, dimensions, video/audio streams), extract a thumbnail |
| 2 | `EXTRACT_AUDIO` | 10% | Pull a mono 16 kHz WAV via FFmpeg |
| 3 | `TRANSCRIBE` | 25% | Speech-to-text (local Whisper if installed, AI-inferred fallback otherwise) |
| 4 | `ANALYZE` | 40% | Detect real speech regions with `silencedetect`, score candidate moments |
| 5 | `FIND_MOMENTS` | 50% | Rank candidates by overall score, pick the best moments |
| 6 | `PLAN_CLIPS` | 60% | Plan vertical clips + assign caption styles & platforms |
| 7 | `RENDER_CLIPS` | 80% | Cut real 9:16 (1080×1920) shorts with `h264_videotoolbox` |
| 8 | `GENERATE_METADATA` | 90% | AI title/caption/hashtags + per-clip SRT caption track |
| 9 | `QUALITY_CHECK` | 97% | Validate video integrity & 9:16 aspect ratio, require title/caption/hashtags |
| 10 | `FINALIZE` | 100% | Build a schedule plan, mark job `READY_FOR_REVIEW` |

The runner lives in `lib/creator/pipeline.ts` and is driven by a persistent, idempotent worker (`lib/creator/worker.ts`) that claims jobs with an optimistic DB lock (`lockedAt` / `workerId`) and reclaims stale-locked jobs across restarts.

### Whisper / transcription

- **Local Whisper** is used when the `whisper` CLI is available (`whisper --model base --output_format json`). Whisper output is written next to `audio.wav` as `<name>.json` and parsed into `TranscriptSegment[]` (`{ start, end, text }`).
- **Fallback:** when no STT is installed, the pipeline keeps the *real* speech-region timestamps produced by FFmpeg `silencedetect` and asks the local LLM to infer plausible narration for each region. This is clearly logged so it is never mistaken for a verbatim transcript.
- The active transcription provider is Ollama (`qwen2.5-coder:7b`) for AI-inferred text and metadata.

### Caption data model

Defined in `lib/creator/captions/types.ts`:

```ts
export type CaptionWord = {
  word: string;
  start: number; // seconds
  end: number;   // seconds
};

export type CaptionSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  words: CaptionWord[];
};
```

### Word-timing limitation & estimate

The current Whisper JSON contains **segment-level** timestamps only (start, end, text) — it does **not** expose native word-level timestamps. To drive word-level caption animation, the segment duration is distributed evenly across its words:

```ts
// lib/creator/captions/parse-whisper.ts  (splitWords)
const duration = Math.max(0.01, end - start);
const wordDuration = duration / words.length;
// each word -> start + i*wordDuration ... start + (i+1)*wordDuration
```

This estimated timing is acceptable for the first caption renderer. Real word-level timestamps can replace the estimate later without changing the data model.

### Caption segmentation & grouping

- `parse-whisper.ts` → `parseWhisperTranscript()` converts a Whisper transcript into `CaptionSegment[]`.
- `segmenter.ts` → `buildCaptionSegments()` further splits long segments into readable chunks (default **5 words per line**).
- `group-captions.ts` → `groupCaptions()` merges words into display groups capped at **`MAX_WORDS = 4`** and **`MAX_CHARS = 24`** so captions stay short and readable on mobile.
- `render-captions.ts` → `renderCaptions()` burns uppercase captions onto the video with FFmpeg `drawtext` (Arial Bold, white fill, black border + shadow, bottom-anchored), enabled per group via `between(t,start,end)`.

### Caption styles

Two style catalogs exist:

- `lib/creator/captions/styles.ts` — `CAPTION_STYLES` record with `captions` (pop), `clean` (none), `gaming` (bounce). Each defines font, size, color, active color, stroke, position, `maxWordsPerLine`, uppercase flag, and animation (`none | pop | bounce | highlight`).
- `lib/creator-studio/types.ts` — the broader UI `CAPTION_STYLES` array used by the planner: `Clean, Bold, Viral, Podcast, Minimal, Gaming, Cinematic`.

### Supported platforms

Clips are planned for vertical, short-form distribution: **Instagram, YouTube, TikTok, Facebook** (`lib/creator-studio/types.ts`).

### Key modules

| File | Responsibility |
|------|----------------|
| `lib/creator/pipeline.ts` | Stage handlers & resumable runner |
| `lib/creator/stages.ts` | Canonical stage definitions + UI mapping |
| `lib/creator/worker.ts` | Persistent job worker with DB lock |
| `lib/creator/db.ts` | Job/stage/clip/bundle persistence |
| `lib/creator-studio/ffmpeg.ts` | `extractAudio`, `detectSpeech`, `cutVerticalClip`, `probeFull` |
| `lib/creator-studio/ai.ts` | LLM calls (transcript/metadata inference) |
| `lib/creator-studio/content.ts` | Candidate scoring & clip detail generation |
| `lib/creator/captions/*` | Caption parsing, segmentation, grouping, rendering, styles |

### API routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/creator/jobs` | POST | Create a ContentJob from a media asset |
| `/api/creator/jobs/[id]` | GET | Job status + stage progress |
| `/api/creator/jobs/[id]/approve` | POST | Approve a `READY_FOR_REVIEW` job |
| `/api/creator/jobs/[id]/retry` | POST | Retry a failed/cancelled job |
| `/api/creator/schedule` | POST | Schedule generated clips |
| `/api/creator-studio/analyze` | POST | Analyze an uploaded video |
| `/api/creator-studio/projects` | GET, POST | List / create projects |
| `/api/creator-studio/clips/[id]` | GET | Get a generated clip |
| `/api/creator-studio/clips/[id]/regenerate` | POST | Re-render one clip from its real source segment |

---

## 📦 Dependencies & Setup Commands

### System Prerequisites

```bash
# Verify Node.js (v18+ required)
node --version

# Verify npm
npm --version

# Verify PostgreSQL is running
pg_isready -h localhost
```

---

### Install Project Dependencies

```bash
npm install
```

---

### Install Global / CLI Dependencies (if needed)

```bash
# Prisma CLI (if not installed globally)
npm install -g prisma

# Ollama (for local AI features)
# macOS:
brew install ollama
ollama serve
ollama pull qwen2.5-coder:7b

# Linux:
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull qwen2.5-coder:7b

# Local Whisper (optional — enables verbatim transcription in the Creator Studio)
# macOS (Homebrew):
brew install whisper

# Whisper needs ffmpeg (already required) and a model:
whisper --model base "path/to/audio.wav" --output_format json
# If whisper is unavailable, the pipeline falls back to AI-inferred captions
# from real speech regions detected via ffmpeg silencedetect.
```

---

### Environment Setup

```bash
# Copy example env file (if .env.example exists)
cp .env.example .env

# Or create .env manually with:
cat > .env << 'EOF'
DATABASE_URL="postgres://postgres:postgres@localhost:5432/octa-studio"
SHADOW_DATABASE_URL="postgres://postgres:postgres@localhost:5432/octa-studio"
AI_PROVIDER=ollama
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=qwen2.5-coder:7b
CRON_SECRET=$(openssl rand -hex 32)
LINKEDIN_CLIENT_ID="your_client_id"
LINKEDIN_CLIENT_SECRET="your_client_secret"
APP_URL="http://localhost:3000"
EOF
```

---

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (optional, to inspect data)
npx prisma studio
```

---

### Start Development

```bash
# Run dev server
npm run dev

# In another terminal, run Ollama (if using AI features)
ollama serve
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🛠 Tech Stack

<div align="center">

```mermaid
graph TD
    A[Next.js 16.3] --> B[React 19]
    A --> C[TypeScript 5]
    A --> D[Tailwind CSS 4]
    E[Prisma 7] --> F[PostgreSQL]
    G[GSAP 3] --> H[ScrollTrigger]
    I[Lenis] --> J[Smooth Scroll]
    K[Ollama] --> L[Local AI]
```

</div>

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.3.0 (App Router) |
| **Frontend** | React 19.2.8, TypeScript 5, Tailwind CSS 4 |
| **Database** | PostgreSQL + Prisma ORM 7.9.1 |
| **Animations** | GSAP 3.15.0, @gsap/react, Lenis |
| **AI** | Ollama (qwen2.5-coder:7b), Image/Video generation |
| **Auth** | LinkedIn OAuth |
| **Deployment** | Vercel |

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/octa-studio.git
cd octa-studio
```

---

### 2. Install Dependencies

See the **[Dependencies & Setup Commands](#-dependencies--setup-commands)** section above for full details.

```bash
npm install
```

---

### 3. Configure Environment

Create a `.env` file in the project root. See the **[Dependencies & Setup Commands](#-dependencies--setup-commands)** section for the full template.

```bash
# Database
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=disable"
SHADOW_DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=disable"

# AI (Ollama - optional)
AI_PROVIDER=ollama
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=qwen2.5-coder:7b

# LinkedIn OAuth (optional)
LINKEDIN_CLIENT_ID="your_client_id"
LINKEDIN_CLIENT_SECRET="your_client_secret"
APP_URL="https://your-app.vercel.app"

# Cron Security (auto-generated)
CRON_SECRET=your_random_secret_here
```

> **Security Note**: Never commit `.env` to version control. It is already in `.gitignore`.

---

### 4. Set Up the Database

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

---

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma studio` | Open Prisma Studio |
| `npx prisma db push` | Sync schema without migrations |

---

## ⚙️ Configuration

### Next.js Configuration (`next.config.ts`)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "support-happiness-backlash.ngrok-free.dev",
  ],
};

export default nextConfig;
```

### Prisma Configuration (`prisma.config.ts`)

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
```

### Vercel Cron Jobs (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/publishing/process",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 📡 API Endpoints

<div align="center">

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/generate` | POST | Generate AI text content |
| `/api/ai/image` | POST | Generate AI images |
| `/api/ai/video` | POST | Generate AI videos |
| `/api/media` | GET, POST | List and upload media assets |
| `/api/media/[id]` | GET, DELETE | Get or delete a specific media asset |
| `/api/media/upload` | POST | Upload media files |
| `/api/publishing/linkedin/connect` | GET | Initiate LinkedIn OAuth |
| `/api/publishing/linkedin/callback` | GET | LinkedIn OAuth callback |
| `/api/publishing/process` | POST | Process queued publications |

</div>

---

## 🗄️ Database Schema

<div align="center">

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Prisma Data Models                          │
├─────────────┬─────────────┬─────────────┬───────────────────────────┤
│    Idea     │   Content   │    Media    │    PublishingChannel       │
├─────────────┼─────────────┼─────────────┼───────────────────────────┤
│ id (cuid)   │ id (cuid)   │ id (cuid)   │ id (cuid)                 │
│ title       │ title       │ contentId   │ platform (unique)         │
│ description │ body        │ url         │ connected                 │
│ category    │ status      │ filename    │ accountName               │
│ status      │ platform    │ mimeType    │ accessToken               │
│ createdAt   │ scheduledAt │ size        │ refreshToken              │
│ updatedAt   │ publishedAt │ type        │ expiresAt                 │
│ contents[]  │ createdAt   │ createdAt   │ externalId                │
│             │ updatedAt   │ updatedAt   │ authorUrn                 │
│             │ ideaId      │             │ publications[]            │
│             │ idea[]       │             │ createdAt                 │
│             │ publications[]│           │ updatedAt                 │
│             │ media[]      │             │                           │
├─────────────┴─────────────┴─────────────┴───────────────────────────┤
│                        Publication                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id (cuid) | contentId | channelId | status | scheduledAt | publishedAt │
│ externalId | error | createdAt | updatedAt                            │
└─────────────────────────────────────────────────────────────────────┘
```

</div>

---

## 🎨 Animations

octa-studio uses **GSAP 3.15.0** with ScrollTrigger for scroll-based animations and **Lenis** for smooth scrolling.

### Key Animation Features

- **Scroll-triggered reveals** with GSAP ScrollTrigger
- **Smooth scrolling** via Lenis
- **CSS keyframe animations** for modals, toasts, and transitions
- **Interactive AI Studio** demo with animated generation states
- **Landing page** animations for feature cards and phone mockup

```css
/* Available animation classes */
.modal-enter    /* Modal scale-in */
.overlay-enter  /* Overlay fade-in */
.slide-in-right /* Right slide */
.slide-in-left  /* Left slide */
.fade-in        /* Generic fade */
.toast-enter    /* Toast notification */
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 octa-studio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Links

<div align="center">

| Resource | Link |
|----------|------|
| **Discord** | [Join our Community](https://discord.gg/TGtuxX5AG) |
| **Documentation** | [Coming Soon] |
| **Live Demo** | [Coming Soon] |

</div>

---

<div align="center">

  Made with ❤️ by the octa-studio Team

  <a href="https://discord.gg/TGtuxX5AG">
    <img src="https://img.shields.io/badge/Join_our_Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
  </a>

</div>
