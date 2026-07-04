## Context

Morning Analytics currently performs image generation inside a single `generateImages` server action. The server action triggers Midjourney through an unofficial Discord user-token interaction, then waits for a Discord bot gateway listener to see a Midjourney completion message, downloads the Discord CDN attachment, splits it with Sharp, uploads quadrants to Supabase Storage, and returns image data to the client.

The local failure reported on July 4, 2026 is specific: text analysis completes, the prompt lands in the same Discord `#generations` channel, and Midjourney creates images visible in Discord, but the app does not display images. A read-only local diagnostic confirmed the bot token can read the configured channel and can see older Midjourney messages with attachments/components, but did not see today's messages in the latest returned channel history. The implementation therefore needs better runtime evidence around which Discord channel/guild/token is being used, whether the bot sees current Midjourney messages, and where the handoff fails.

## Goals / Non-Goals

**Goals:**
- Keep the existing private Discord/Midjourney path.
- Make each image-generation attempt diagnosable from the UI without exposing Discord tokens, full prompts, or sensitive user content.
- Add server-side structured diagnostics for trigger, listener, recent-message recovery, image fetch, split, upload, and final result.
- Make Discord capture more resilient when the gateway listener misses a completion event.
- Preserve mock mode and current successful Midjourney behavior.

**Non-Goals:**
- Replace Midjourney with DALL-E, Flux, Replicate, or a third-party Midjourney API.
- Build a background job queue, websocket stream, or persistent diagnostic database.
- Change Supabase schema or image history storage.
- Solve Discord/Midjourney terms-of-service risk beyond documenting and preserving the private-use assumption.
- Expose raw Discord tokens, full channel IDs by default, full prompts, or signed CDN URLs in the browser.

## Decisions

### 1. Return an attempt diagnostics trace from `generateImages`

`generateImages` and `regenerateImages` will collect a redacted `ImageGenerationDiagnostics` trace and include it in their responses. Each event will have a timestamp, stage, status, short message, and optional redacted metadata such as channel ID suffix, guild ID suffix, listener event type, attachment count, component row count, candidate message age, HTTP status, and image dimensions.

Alternatives considered:
- **Console-only logging:** Easier, but does not help when the browser says "no images" and the user needs local evidence.
- **Persist diagnostics in Supabase:** Useful later, but unnecessary for a personal local debugging loop and adds data retention concerns.
- **Live streaming diagnostics:** Better UX, but it requires a larger architecture change because the current image generation path is one long server action.

### 2. Add a collapsible debug/status disclosure in the result flow

The app shell will show a very small, low-emphasis diagnostics disclosure near the generated-images area throughout the image generation attempt. While waiting, the loading card itself remains unchanged: only the existing spinner, rotating thematic message, and duration hint are shown inside it. A tiny diagnostics row below the loading area can be opened to confirm that the request is still running and see elapsed time. On success, the collapsed state should read like a quiet footnote rather than a result card. On failure, it can include a short failure summary but must still stay visually subtle. Expanding the disclosure after completion will show the redacted chronological trace and actionable summary such as "Discord trigger succeeded; no completed Midjourney grid was observed in the configured channel before timeout."

Alternatives considered:
- **Always-visible debug panel:** Too noisy for daily use.
- **Developer-console only:** Too hidden for the reported problem.
- **Separate admin/debug page:** More navigation and state plumbing than needed.

### 3. Use bounded recent-message recovery for missed gateway events

The listener will keep the gateway event path as the primary capture mechanism, then perform a bounded Discord REST lookup in the configured channel when needed. Recovery should search recent messages from the Midjourney bot after the generation start time, prefer completed-grid candidates with image attachments/components, and use conservative prompt matching where possible. It should not poll aggressively; at most a small number of bounded lookups per generation attempt.

Alternatives considered:
- **Continuous polling:** More reliable for missed gateway events, but wasteful and more likely to hit Discord rate limits.
- **Gateway-only listener:** Current behavior; brittle when events are missed or message updates arrive in an unexpected shape.
- **Manual paste/upload fallback:** Useful someday, but outside this change's scope.

### 4. Correlate by attempt metadata, not nonce alone

The current code passes a trigger nonce to `waitForImages`, but Midjourney completion messages do not reliably expose that nonce to the bot listener. The capture path will instead use attempt metadata: generation start timestamp, configured channel, Midjourney bot ID, prompt snippet/hash, and completion shape. The nonce remains useful for internal trace labels but not as the only correlation key.

Alternatives considered:
- **Strict nonce matching:** Not reliable because the resulting Midjourney message payload does not include the trigger nonce.
- **Accept any Midjourney image in channel:** Can pick up stale or unrelated generations, especially in a reused personal channel.

### 5. Redact sensitive diagnostic values before returning to the client

Diagnostics returned to the UI will avoid secrets and high-risk data. Token values are never logged. Full Discord channel/guild IDs and full prompts will be replaced with suffixes, lengths, hashes, or short snippets. Signed CDN URLs will not be returned in diagnostics.

Alternatives considered:
- **Full raw payload in debug drawer:** Faster to diagnose, but too easy to leak prompt content or signed asset URLs.
- **No metadata:** Safer but too vague to answer "which channel did it inspect?"

## Risks / Trade-offs

- **Unofficial Discord user-token automation can break again** -> Keep the scope private-use only, improve failure evidence, and avoid pretending this path is production-grade.
- **Recent-message recovery may select the wrong Midjourney result** -> Bound candidates to the configured channel, Midjourney author, generation start window, completed-grid shape, and prompt snippet/hash when available.
- **Discord REST lookup may hit rate limits** -> Use a small bounded lookup only on startup/timeout/recovery, respect non-OK statuses, and surface status codes in diagnostics.
- **Server action still cannot show every server event live** -> Keep the waiting UI simple and return the detailed trace when the server action completes or fails.
- **Diagnostics could leak private writing-derived prompt text** -> Redact prompt details and keep the debug drawer local to the current session response.

## Migration Plan

1. Add typed diagnostics helpers and response fields without changing existing success/failure semantics.
2. Harden Discord listener matching and bounded recent-message recovery.
3. Add the collapsible UI disclosure and wire returned diagnostics into current analysis/regeneration flows.
4. Verify mock mode, local Midjourney path, timeout/failure display, and storage upload behavior.

Rollback is straightforward: remove the diagnostics response fields/UI component and revert listener recovery to gateway-only behavior. No database migration is required.

## Open Questions

- The first local diagnostic saw old `#generations` messages but not today's latest messages. Implementation should make it easy to see whether the running app's configured channel, guild, and bot token match the visible Discord client context.
