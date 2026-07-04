## Why

The private Midjourney/Discord image pipeline is currently failing locally after text analysis: prompts appear in the `#generations` Discord channel and images are generated, but the app does not reliably receive, split, upload, or display them. This path was built several months ago on an unofficial Discord interaction flow, so it needs better diagnostics and recovery around the handoff between Discord and the Morning Analytics server.

## What Changes

- Keep the existing unofficial Discord/Midjourney provider path; do not replace Midjourney with another image provider.
- Add structured image-generation progress/debug events across trigger, listener, Discord message matching, image fetch, image split, upload, and completion/failure.
- Add a tucked-away, collapsible in-app debug/status disclosure for the current image generation attempt so local failures can be diagnosed from the UI without exposing secrets.
- Harden Discord capture by making listener failures more observable and by adding recovery for missed live gateway events through a bounded recent-message lookup in the configured channel.
- Improve error reporting so a completed text analysis with failed image generation surfaces a specific, actionable image-generation status instead of silently completing without images.
- Preserve current mock mode behavior for fast no-API testing.

## Capabilities

### New Capabilities
- `image-generation-diagnostics`: Debug/status visibility for image-generation attempts, including user-visible status summaries and redacted diagnostic detail.

### Modified Capabilities
- `image-generation`: Add resilient Discord capture and clearer image-generation failure behavior while preserving the Midjourney/Discord provider.
- `app-shell`: Display a collapsible current-attempt image-generation debug/status disclosure in the analysis result flow.

## Impact

- Affected app code:
  - `app/app/actions.ts`
  - `app/app/page.tsx`
  - new image-generation diagnostics component
  - `app/lib/discord/trigger.ts`
  - `app/lib/discord/listener.ts`
  - `app/lib/image-splitter.ts`
  - `app/lib/analytics-storage.ts`
- Affected specs:
  - `openspec/specs/image-generation/spec.md`
  - `openspec/specs/app-shell/spec.md`
  - new `image-generation-diagnostics` capability
- External systems:
  - Discord Bot Gateway and REST channel-message APIs
  - Unofficial Discord user-token interaction request to Midjourney
  - Discord CDN signed attachment URLs
  - Supabase Storage upload path
- No new provider dependency is intended for this change.
