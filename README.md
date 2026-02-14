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

- Node.js 20+ recommended (18+ should work).
- npm (or your preferred package manager).
- Gemini, Discord, and Supabase credentials for real integrations.

## Quick Start

```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

## Environment Configuration

All env vars live in `app/.env.local`. Variables prefixed with
`NEXT_PUBLIC_*` are exposed to the browser. Server-required Supabase values are
validated at startup; missing values will stop the app from booting. The repo
root `.env` is not used by the Next.js app.

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

### Mocking and local testing

- `USE_AI_MOCKS=true` bypasses Gemini + Discord/Midjourney APIs.
- `NEXT_PUBLIC_IMAGE_PROVIDER=mock` uses local images from
  `app/public/mock-images` (PNG or JPEG).
- Set `NEXT_PUBLIC_IMAGE_PROVIDER=midjourney` for real image generation.

## Running Common Tasks

```bash
cd app
npm run dev
npm run build
npm run start
npm run lint
```

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

- `docs/prd.md`: product requirements and MVP scope.
- `docs/prompt.md`: Gemini prompt and analysis structure.
- `docs/technical-feasibility.md`: integration validation notes.

## License

MIT. See `LICENSE`.
