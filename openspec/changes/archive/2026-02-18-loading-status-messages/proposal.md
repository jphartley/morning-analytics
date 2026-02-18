## Why

The app has two long-running phases — text analysis (~10-15s) and image generation (~30-60s). The current spinners show a static message ("Analyzing your morning pages..." / "Generating images...") which gives no sense of progress or expected duration. Users may worry something has stalled. Adding time estimates and rotating playful messages keeps users engaged and reassured.

## What Changes

- **Time estimates**: Display expected duration text below the spinner for each phase ("Usually takes ~15 seconds" / "Usually takes about a minute")
- **Rotating status messages**: Replace static spinner messages with a set of ~8-10 playful, thematic messages that rotate every ~7 seconds
  - Phase 1 (analysis): Messages themed around reading, interpreting, exploring the text
  - Phase 2 (images): Messages themed around painting, composing, creating imagery
- **LoadingState component enhancement**: Refactor to accept message lists and duration text, handle rotation with an interval timer

## Capabilities

### New Capabilities
- `loading-feedback`: Rotating status messages and time estimates during analysis and image generation phases

### Modified Capabilities
- `app-shell`: Loading state display changes from static message to rotating messages with time estimate

## Impact

- **Files modified**: `app/components/LoadingState.tsx`, `app/app/page.tsx`
- **No API, dependency, or schema changes**
- **No breaking changes** — LoadingState's current `message` prop callers will need updating to use the new props
