---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### octa-studio
- Definition：The product name of this project, described in the README as a "content operating system" that lets creators plan, create, schedule, and publish content across multiple platforms from one workspace.
- Aliases：ContentOS、Your Content Operating System

### Ideas
- Definition：A top-level feature/module where raw content ideas are captured and organized before being turned into published content. Stored in the `Idea` Prisma model with status values like `INBOX`.

### Content
- Definition：A drafted or scheduled piece of copy/media that originates from an Idea and may be published to one or more channels. Has lifecycle statuses such as `DRAFT`, `QUEUED`, and timestamps for `scheduledAt` and `publishedAt`.

### Publication
- Definition：A single attempt to push a `Content` item to a specific `PublishingChannel`. Each publication tracks its own status (`QUEUED`, etc.), `externalId` returned by the platform, and any `error` message.

### PublishingChannel
- Definition：A connected external platform account (currently LinkedIn) that content can be published to. Stores OAuth tokens, expiry, and platform-specific identifiers like `authorUrn`.
- Aliases：channel、platform

### Media
- Definition：Uploaded assets (images, GIFs, etc.) attached to a `Content` item, stored as URLs under `public/uploads/` with metadata including filename, MIME type, size, and type.

### AI Studio
- Definition：The feature area for generating text, images, and videos using a local Ollama-backed AI model. Exposed via `/api/ai/generate`, `/api/ai/image`, and `/api/ai/video` routes.

### Unified Scheduling Workspace
- Definition：The user-facing concept promoted on the landing page — a single interface where users plan ideas, write content, schedule posts on a calendar, and publish to channels without switching apps.
