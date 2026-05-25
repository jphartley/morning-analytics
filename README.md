# Morning Analytics

Morning Analytics is a local-first Next.js app that analyzes Morning Pages
(stream-of-consciousness journaling) using Gemini and generates symbolic
imagery via Midjourney. It also stores analysis history and image metadata in
Supabase for later review.

## Features

- Gemini-powered analysis with a structured, reflective output.
- Midjourney image generation through Discord bot automation.
- Supabase-backed history storage and image uploads.
- Mock modes for fast local testing without external APIs.
- Tailwind-styled UI optimized for a single-user workflow.

## Repository Layout

- `app/`: Next.js application source and configuration.
- `docs/`: Product, prompt, and research documentation.
- `openspec/`: Spec-driven workflow artifacts and change history.

## Requirements

- Node.js 22.x. The app runtime pin is declared in `app/.nvmrc`,
  `app/package.json`, and `app/package-lock.json`.
- npm (or your preferred package manager).
- Gemini, Discord, and Supabase credentials for real integrations.

## Quick Start

```bash
cd app
npm ci
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

## Environment Configuration

All env vars live in `app/.env.local`. Variables prefixed with
`NEXT_PUBLIC_*` are exposed to the browser. Server-required Supabase values are
validated at startup; missing values will stop the app from booting. The repo
root `.env` is not used by the Next.js app.

`app/.env.example` contains safe placeholders for build-only and mock-mode
checks. Those placeholders are not manual-test-ready for signin, signup,
history loading, storage uploads, or any flow that needs a real Supabase
backend.

### Env usage by workflow

| Workflow | Required values |
| --- | --- |
| Static build with placeholders | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` may use safe placeholders from `app/.env.example` |
| Local dev shell boot | Same as build; use mock values only when avoiding backend manual tests |
| Mock AI/image testing | `USE_AI_MOCKS=true`, `NEXT_PUBLIC_IMAGE_PROVIDER=mock`, Supabase values still needed for auth/history code paths |
| Supabase auth manual testing | Real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| History persistence and storage uploads | Real `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; anon read policies for history images |
| Real Gemini analysis | `GEMINI_API_KEY`; optional `GEMINI_MODEL` |
| Real Midjourney image generation | Discord/Midjourney values listed below and `NEXT_PUBLIC_IMAGE_PROVIDER=midjourney` |
| Admin cleanup script | `SUPABASE_SERVICE_ROLE_KEY` and either `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` |

### Gemini (text analysis)

- `GEMINI_API_KEY`: required for real Gemini analysis.
- `GEMINI_MODEL`: optional override for the Gemini model ID.

### Discord + Midjourney (image generation)

- `DISCORD_BOT_TOKEN`: bot token used to listen for Midjourney responses.
- `DISCORD_CHANNEL_ID`: channel to watch for completed Midjourney images.
- `DISCORD_USER_TOKEN`: user token used to trigger `/imagine`.
- `DISCORD_GUILD_ID`: guild where `/imagine` is triggered.
- `MIDJOURNEY_APP_ID`: Midjourney application ID (leave default unless it changes).
- `MIDJOURNEY_IMAGINE_COMMAND_ID`: Midjourney `/imagine` command ID.

### Supabase (analytics history storage)

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (browser + server).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key for client reads.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side key for writes (keep secret).

Supabase setup assumptions:

- Table `analyses` exists for history records.
- Storage bucket `analysis-images` exists for image uploads.
- Storage policies allow anon read (for history) and server writes.

Troubleshooting notes for image uploads live in
`docs/research/image-upload-troubleshooting.md`.

### Auth manual-test readiness

Before handing off signin or signup testing, make sure `app/.env.local`
contains real local Supabase values rather than placeholders:

```bash
cd app
npm run check:auth-env
```

This check reports only which keys are missing or placeholder-like; it does not
print secret values. Passing this check does not prove credentials are valid,
but failing it means auth manual testing is not ready.

### Mocking and local testing

- `USE_AI_MOCKS=true` bypasses Gemini + Discord/Midjourney APIs.
- `NEXT_PUBLIC_IMAGE_PROVIDER=mock` uses local images from
  `app/public/mock-images` (PNG or JPEG).
- Set `NEXT_PUBLIC_IMAGE_PROVIDER=midjourney` for real image generation.

Mock and placeholder values can support build/static checks, but do not use
them for signin, signup, history, storage, or other Supabase-backed manual
tests.

## Clean Worktree Setup

Fresh Git worktrees do not share dependencies. For a clean candidate worktree:

```bash
cd app
npm ci
npm run lint
npm run build
npm run check:lockfile-registry
```

Use the Node 22.x runtime declared in `app/.nvmrc`, `app/package.json`, and
`app/package-lock.json`. If a change modifies `app/package-lock.json`, run
`npm run check:lockfile-registry` before committing; if it fails, run
`npm run fix:lockfile-registry` and re-check.

Do not rely on symlinking `node_modules` from another checkout for Turbopack or
Next.js candidates unless that shortcut has been separately validated as safe.
The predictable path is `npm ci` inside the candidate's `app/` directory.

## Running Common Tasks

```bash
cd app
npm run dev
npm run build
npm run start
npm run lint
npm run check:auth-env
npm run check:lockfile-registry
```

## Queue Verification Policy

Queued candidates still need full app verification with `npm run lint` and
`npm run build`. If a verification failure is caused by the candidate, fix it
inside the candidate. If the failure is unrelated baseline debt that predates
the candidate, stop and report it separately; include unrelated cleanup only
after explicit approval or in a dedicated hygiene change.

## Manual Smoke Test

1. Paste text into the journal input.
2. Click Analyze and wait for output.
3. Confirm the analysis panel shows structured output.
4. Confirm four images render (mock or Midjourney).
5. Confirm history loads when Supabase is configured.

## Notes & Troubleshooting

- If you see a Next.js workspace root warning, keep `turbopack.root` and
  `outputFileTracingRoot` pinned to `app/` in `app/next.config.ts`.
- If images fail to load in history, verify Supabase storage policies and
  anon read access.

## Documentation

- `docs/current-architecture.md`: data flow, system architecture, and code organization.
- `docs/prd.md`: product requirements and MVP scope.
- `docs/prompt.md`: Gemini prompt and analysis structure.
- `docs/technical-feasibility.md`: integration validation notes.

## License

MIT. See `LICENSE`.
