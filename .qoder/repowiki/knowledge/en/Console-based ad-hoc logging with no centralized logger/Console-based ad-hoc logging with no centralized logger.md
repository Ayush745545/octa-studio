---
kind: logging_system
name: Console-based ad-hoc logging with no centralized logger
category: logging_system
scope:
    - '**'
source_files:
    - app/api/publishing/process/route.ts
    - app/publishing/engine/process-scheduled.ts
    - app/publishing/engine/providers/simulated.ts
    - app/api/publishing/linkedin/callback/route.ts
    - app/api/publishing/linkedin/connect/route.ts
    - app/api/ai/generate/route.ts
    - app/api/ai/image/route.ts
    - app/api/ai/video/route.ts
    - app/api/media/upload/route.ts
    - app/api/media/[id]/route.ts
---

## What system/approach is used

The repository does not use a dedicated logging framework or library. All log output is produced via Node.js/Next.js built-in `console.log`, `console.error`, and `console.warn` calls scattered directly in API routes, server actions, and business logic modules. There is no logger singleton, no log-level configuration, no structured logging library (e.g., pino, winston, bunyan), and no custom logging utility module.

## Key files and packages

- `app/api/publishing/process/route.ts` — CRON entrypoint logs start/end of scheduled publishing runs and errors when `CRON_SECRET` is missing.
- `app/publishing/engine/process-scheduled.ts` — Scheduler loop logs per-publication attempts and failures.
- `app/publishing/engine/providers/simulated.ts` — Simulated provider emits a structured-ish object payload to `console.log`.
- `app/api/publishing/linkedin/callback/route.ts`, `app/api/publishing/linkedin/connect/route.ts` — LinkedIn OAuth flow logs member identity, connection saved events, and lookup failures.
- `app/api/ai/generate/route.ts`, `app/api/ai/image/route.ts`, `app/api/ai/video/route.ts` — AI generation endpoints log error messages on failure.
- `app/api/media/upload/route.ts`, `app/api/media/[id]/route.ts`, `app/api/media/route.ts` — Media endpoints log upload/create/delete failures.

No file under `lib/` provides logging; the only shared runtime helper there is `lib/prisma.ts` for the Prisma client singleton.

## Architecture and conventions

- **Ad-hoc placement**: Logging statements are co-located with the code they describe (API route handlers, scheduler loops, provider implementations). There is no central logging facade that callers import.
- **Tagged prefixes**: Log lines commonly begin with a bracketed tag such as `[CRON]`, `[Scheduler]`, `[LinkedIn]`, or `[octa-studio]` to visually group related output. This is a convention, not enforced by any tooling.
- **Structured-ish payloads**: Some calls pass an object literal as the second argument to `console.log` (e.g., the simulated provider logs `{ platform, title, channelId, accountName, media: [...] }`) so that downstream log aggregators can parse fields. However, this is inconsistent — many other calls concatenate plain strings.
- **Error handling pattern**: Errors are caught with `try/catch` blocks and logged via `console.error` before returning a JSON error response from the route handler. The error message is extracted with `error instanceof Error ? error.message : "..."` before being sent back to the caller.
- **No log levels**: There is no concept of debug/info/warn/error levels beyond the choice between `console.log` and `console.error`. Conditional log level toggling based on environment variables is not implemented.
- **No sinks or transport**: Output goes to standard stdout/stderr. There is no configuration for file rotation, remote ingestion, correlation IDs, request-scoped context, or redaction of secrets.

## Conventions and constraints

Observed conventions (descriptive):
- Tag every log line with a bracketed source prefix (`[CRON]`, `[Scheduler]`, `[LinkedIn]`, `[octa-studio]`) to aid filtering in console output.
- When emitting multiple fields, prefer passing an object to `console.log` rather than string concatenation.
- Always pair a `console.error` with a non-200 JSON response in API routes so both the operator console and the client receive the error.
- Extract `error.message` from thrown objects before including them in responses to avoid leaking stack traces.

Constraints / enforcement:
- None are formally enforced. There is no ESLint rule, lint config, or build-time check that mandates a specific logger or forbids bare `console.*` calls. The project's `eslint.config.mjs` exists but does not appear to constrain logging usage.
- Because logging is purely side-effectful `console.*` calls, it cannot be unit-tested or swapped out without refactoring each call site.