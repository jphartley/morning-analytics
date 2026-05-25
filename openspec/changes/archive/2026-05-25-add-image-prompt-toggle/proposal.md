## Why

Generated images are more useful and educational when users can inspect the prompt that produced them. The image prompt is already available for fresh analyses and saved history, but the UI does not currently expose it.

## What Changes

- Add a collapsed-by-default "Show image prompt" disclosure below generated images.
- Reveal the stored image prompt in a styled readable block when expanded.
- Support the prompt disclosure in both fresh analysis results and history views.
- Include an optional copy control so users can reuse the prompt outside the app.

## Capabilities

### New Capabilities
- `image-prompt-disclosure`: Users can reveal, hide, read, and optionally copy the image prompt associated with generated images.

### Modified Capabilities
- None.

## Impact

- Affected UI: `app/app/page.tsx` and likely a new or existing component under `app/components/`.
- Affected data: uses existing `currentImagePrompt` and `historyViewData.imagePrompt` state only.
- APIs, database, auth, and image-generation integrations are not expected to change.
- Source issue: https://github.com/jphartley/morning-analytics/issues/18
