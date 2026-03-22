## Why

Users who write morning pages in Day One (or similar apps) always paste their text into the journal input and immediately click "Analyze." For pastes of 300+ words — which represent a complete morning pages session — the extra manual click adds unnecessary friction. Auto-triggering analysis on substantial pastes streamlines the primary workflow.

## What Changes

- Detect paste events in the journal input that result in 300+ words of content
- Automatically trigger the `onAnalyze` callback when the word threshold is met
- Scroll the page to the top after auto-triggering so the user sees the analysis loading state
- No change to manual "Analyze" button behavior — it remains available for shorter entries or typed input

## Capabilities

### New Capabilities
- `auto-analyze-on-paste`: Automatically trigger analysis when a paste event adds 300+ words to the journal input, and scroll to top

### Modified Capabilities
_(none — existing journal-analysis and markdown-journal-input specs are unchanged; the button and manual flow remain as-is)_

## Impact

- **Code**: `JournalInput.tsx` (paste detection + auto-trigger), `page.tsx` (scroll-to-top after analyze)
- **UX**: Users pasting full morning pages skip one click; users typing or pasting short text see no change
- **Dependencies**: None — uses existing TipTap editor events and browser scroll APIs
