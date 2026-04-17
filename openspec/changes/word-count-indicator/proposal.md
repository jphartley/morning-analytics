## Why

Users writing morning pages have no feedback about how much they've written. The 300-word auto-analyze threshold is invisible, so paste behavior feels unpredictable. A live word count gives immediate writing feedback and makes the auto-analyze trigger transparent.

## What Changes

- Add a real-time word count display below the TipTap editor in JournalInput
- Visually indicate the 300-word auto-analyze threshold (color shift or marker)
- Word count updates on every keystroke and paste event
- Counter uses stable width to prevent layout shift

## Capabilities

### New Capabilities
- `word-count-indicator`: Live word count display below the journal editor with visual threshold indicator at 300 words

### Modified Capabilities
_None — this is additive UI, no existing spec requirements change._

## Impact

- **Code**: `app/components/JournalInput.tsx` — primary changes (add counter element, derive word count from existing editor content)
- **Styling**: Tailwind classes using existing design tokens (`text-ink-muted`, `text-accent`, etc.)
- **Dependencies**: None new — uses existing TipTap editor content
- **APIs**: No backend changes
