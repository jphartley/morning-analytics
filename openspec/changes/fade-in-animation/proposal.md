## Why

When the app transitions from the "analyzing" loading state to "text-ready", the AnalysisPanel appears instantly — a jarring visual jump. The same abrupt appearance happens when the ImageGrid loads in the "complete" state. Adding smooth fade-in transitions creates visual continuity and makes the experience feel polished and intentional rather than sudden.

## What Changes

- AnalysisPanel gains a mount animation that fades and slides content in when first rendered
- ImageGrid gains the same mount animation when transitioning to the "complete" state
- Both use CSS keyframe animations — no external dependencies or runtime JS animation libraries

## Capabilities

### New Capabilities
- `content-transition`: Mount animations for content panels (AnalysisPanel and ImageGrid) that smooth the appearance of new content during state transitions

### Modified Capabilities

_(none — this is purely additive visual polish with no requirement changes to existing capabilities)_

## Impact

- `app/components/AnalysisPanel.tsx` — add animation class on mount
- `app/components/ImageGrid.tsx` — add animation class on mount
- `app/app/globals.css` or Tailwind config — define the keyframe animation (or use inline Tailwind arbitrary values)
- No API, dependency, or data model changes
