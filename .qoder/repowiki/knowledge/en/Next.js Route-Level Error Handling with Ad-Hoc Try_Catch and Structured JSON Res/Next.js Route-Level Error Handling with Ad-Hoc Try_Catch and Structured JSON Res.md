---
kind: error_handling
name: Next.js Route-Level Error Handling with Ad-Hoc Try/Catch and Structured JSON Responses
category: error_handling
scope:
    - '**'
source_files:
    - app/api/media/upload/route.ts
    - app/api/media/route.ts
    - app/api/media/[id]/route.ts
    - app/api/ai/generate/route.ts
    - app/api/ai/image/route.ts
    - app/api/ai/video/route.ts
    - app/api/publishing/process/route.ts
    - app/publishing/engine/publish.ts
    - app/publishing/engine/process-scheduled.ts
    - app/ideas/actions/create-idea.ts
    - app/calendar/actions/create-scheduled-post.ts
    - app/content/actions/cancel-schedule.ts
    - app/content/actions/create-content-from-idea.ts
    - app/content/actions/create-publication.ts
---

## Overview

This Next.js App Router workspace does not define a centralized error-handling framework, custom error classes, or middleware. Instead, error handling is implemented ad-hoc at the boundary of each API route and server action using plain `try`/`catch` blocks that return `NextResponse.json` payloads.

## Approach by Layer

### API Routes (`app/api/*`)
Every mutating API route wraps its body in a `try`/`catch` block and returns structured JSON errors:
- Validation failures return `400` with `{ error: "..." }`, e.g. missing `prompt`, unsupported file type, wrong `Content-Type`, missing `file` or `contentId`.
- Not-found cases return `404`, e.g. media record not found.
- External provider failures return `502` (e.g. AI provider non-`response.ok`) or `503` (image/video generation).
- Unhandled exceptions are caught, logged via `console.error("...")`, and returned as `500` with `{ error: error instanceof Error ? error.message : "..." }`.

Examples observed:
- `app/api/media/upload/route.ts`: validates content-type, file presence, size (50 MB limit), allowed MIME types; catches filesystem/DB errors and returns 500.
- `app/api/ai/generate/route.ts`: validates prompt, forwards to external LLM, maps `!response.ok` to 502, empty response to 502, generic catch to 500.
- `app/api/media/[id]/route.ts`: deletes media, re-throws Prisma-specific errors that carry a `code` property so callers can distinguish them from generic failures.
- `app/api/publishing/process/route.ts`: guards CRON secret, wraps scheduling loop in try/catch and logs `[CRON] Scheduled publishing failed`.

### Server Actions (`app/*/actions/*.ts`)
Server actions use two patterns:
1. **Return an object result** — validation errors return `{ success: false, error: "..." }` (e.g. `create-idea.ts` requires title). Success returns `{ success: true, error: null }`. This lets the client branch on `success` without parsing HTTP status codes.
2. **Throw `new Error(...)`** — business-rule violations throw plain `Error` instances with descriptive messages (e.g. `create-scheduled-post.ts` throws when no platform or connected channels are selected; `cancel-schedule.ts` throws when content not found or not scheduled; `create-content-from-idea.ts` throws when idea not found; `create-publication.ts` throws when content not found). These propagate up to Next.js's default error handler.

### Publishing Engine (`app/publishing/engine/*`)
The engine layer uses thrown errors for invalid state and a `result.success` / `result.error` pattern for downstream provider outcomes:
- `publishPublication()` throws `Error` for precondition failures (publication not found, bad status, missing body, channel not connected).
- When a provider returns `success: false`, the function persists `status: "FAILED"` and `error` on the publication row and returns the provider result unchanged.
- Successful publishes run inside `prisma.$transaction` to atomically mark both `publication` and `content` as `PUBLISHED` and clear `scheduledAt`.
- `processScheduledPublications()` iterates queued publications, wraps each publish call in try/catch, logs failures via `[Scheduler] Failed publication ...`, and accumulates per-publication results including `success`, `externalId`, and `error`.

## Conventions Observed

- **No shared error types**: There is no `errors/` directory, no custom `AppError` class, no error code constants. Errors are plain `Error` objects or inline strings.
- **Consistent JSON shape**: API routes consistently return `{ error: string }` on failure and `{ success?: boolean, ...data }` on success.
- **HTTP status mapping**: 400 for input validation, 404 for missing resources, 500 for unhandled exceptions, 502/503 for third-party/AI provider failures.
- **Logging before responding**: Every catch block calls `console.error("...")` with a contextual message before returning the 500 response.
- **Prisma error passthrough**: In `media/[id]/route.ts`, Prisma errors carrying a `code` property are detected and surfaced rather than swallowed.
- **Transaction safety**: State mutations that span multiple tables use `prisma.$transaction` to ensure consistency.
- **Server action dual style**: Some actions return typed result objects (`create-idea.ts`), others throw `Error` (`create-scheduled-post.ts`, `cancel-schedule.ts`). There is no enforced convention between these two styles within the same feature area.

## Constraints & Gaps

- No global error middleware or `not-found` handler exists in this snapshot.
- No structured logging library (winston, pino) — only `console.error`.
- No retry/backoff logic for transient external provider failures.
- No unified error-response envelope beyond the ad-hoc `{ error }` shape used in API routes.
- Server actions mix throwing `Error` and returning `{ success, error }` without a single documented rule governing which approach to use.