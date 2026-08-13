<div align="center">

  <img src="https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/GSAP-3.15.0-88CE02?style=for-the-badge&logo=greensock&logoColor=black" alt="GSAP" />

</div>

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/ContentOS-Your_Content_Operating_System-ff66ff?style=for-the-badge">
    <img src="https://img.shields.io/badge/ContentOS-Your_Content_Operating_System-000000?style=for-the-badge" alt="ContentOS" />
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

## What is ContentOS?

**ContentOS** is your all-in-one content operating system. Plan, create, schedule, and publish content across multiple platforms from a single, unified workspace. Built for creators who want to move fast without losing control.

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

  <p>
    <strong>Step 1:</strong> Capture ideas &nbsp;→&nbsp; <strong>Step 2:</strong> Write &amp; enhance content &nbsp;→&nbsp; <strong>Step 3:</strong> Schedule &amp; publish
  </p>

  <img src="/images/step1-ideas.jpg" alt="Step 1: Ideas" width="280" />
  <img src="/images/step2-write.jpg" alt="Step 2: Write" width="280" />
  <img src="/images/step3-schedule.jpg" alt="Step 3: Schedule" width="280" />

  <p>
    <em>From raw idea to published post in three steps.</em>
  </p>

</div>

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or remote)
- Ollama (optional, for AI features)
- LinkedIn Developer App (optional, for publishing)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/contentos.git
cd contentos
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the project root:

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

ContentOS uses **GSAP 3.15.0** with ScrollTrigger for scroll-based animations and **Lenis** for smooth scrolling.

### Key Animation Features

- **Scroll-triggered reveals** with GSAP ScrollTrigger
- **Smooth scrolling** via Lenis
- **CSS keyframe animations** for modals, toasts, and transitions
- **Interactive AI Studio** demo with animated generation states

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

Copyright (c) 2026 ContentOS

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

  Made with ❤️ by the ContentOS Team

  <a href="https://discord.gg/TGtuxX5AG">
    <img src="https://img.shields.io/badge/Join_our_Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
  </a>

</div>
