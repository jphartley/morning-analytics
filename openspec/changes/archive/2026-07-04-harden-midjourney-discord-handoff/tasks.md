## 1. Diagnostic Model

- [x] 1.1 Define image generation diagnostic event/trace response types shared by new analysis and regeneration flows.
- [x] 1.2 Add helper utilities for recording diagnostic stages, redacting Discord IDs/prompts/URLs, and returning safe client metadata.
- [x] 1.3 Extend image generation response types to include diagnostics without breaking existing success/error handling.

## 2. Discord Trigger And Listener Hardening

- [x] 2.1 Add trigger diagnostics for configured provider, redacted guild/channel context, request start time, Discord response status, and trigger success/failure.
- [x] 2.2 Update listener inputs to include attempt start time and prompt correlation context rather than relying on nonce alone.
- [x] 2.3 Record listener diagnostics for bot readiness, channel checks, Midjourney message candidates, attachment/embed/component counts, and rejected candidate reasons.
- [x] 2.4 Add bounded recent-message recovery for completed Midjourney grids missed by live gateway events.
- [x] 2.5 Ensure capture only accepts conservative candidates from the Midjourney bot in the configured channel with a completed-grid shape.

## 3. Image Fetch, Split, And Upload Diagnostics

- [x] 3.1 Add diagnostics around Discord CDN image fetch status and image dimensions before splitting.
- [x] 3.2 Add split diagnostics that confirm four generated quadrants and preserve existing variable-aspect-ratio behavior.
- [x] 3.3 Add upload diagnostics for successful paths, partial failures, and final upload errors without exposing storage secrets.

## 4. App UI Debug Disclosure

- [x] 4.1 Add a compact image-generation status model in `app/app/page.tsx` for success and failure states only.
- [x] 4.2 Create a collapsible diagnostics disclosure component using existing design-token classes.
- [x] 4.3 Render the disclosure near the generated-images area, collapsed by default, while waiting and for both success and failure responses when diagnostics are present.
- [x] 4.4 Preserve the existing analysis-first flow and image grid behavior when generation succeeds.
- [x] 4.5 Keep mock mode simple while avoiding broken or misleading Discord diagnostics in mock responses.

## 5. Verification

- [x] 5.1 Run lint/build checks from `app/` and address scoped issues introduced by this change.
- [ ] 5.2 Verify mock mode still analyzes, shows image loading, displays four local images, and saves history.
- [ ] 5.3 Verify local Midjourney mode shows useful diagnostics when capture fails or times out.
- [ ] 5.4 Verify local Midjourney mode can recover a completed grid from bounded recent-message lookup when the live listener misses it.
- [x] 5.5 Verify diagnostics do not expose Discord tokens, full prompts, full IDs, signed CDN URLs, or Supabase secrets.
