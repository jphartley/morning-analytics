## Why

Long original journal entries push the analysis and generated images far below the fold when a user revisits history. The completed Temper feature improves that reading experience, but its behavior is not yet represented in the canonical OpenSpec specs.

## What Changes

- Collapse long original entries by default when a history item is selected.
- Show a compact date, word-count, and plain-text preview in the collapsed state.
- Provide a keyboard-accessible disclosure for revealing and hiding the full Markdown-rendered entry.
- Keep short entries fully visible without a redundant disclosure control.
- Reset disclosure state when the selected history item changes.

## Capabilities

### New Capabilities

- `history-entry-disclosure`: Compact and accessible presentation of original journal entries in the saved-analysis history view.

### Modified Capabilities

None.

## Impact

This capability covers the history-view rendering path, `OriginalEntryDisclosure`, its pure preview and word-count helpers, and the history selection integration in the root page. It introduces no API, storage, database, dependency, or environment-variable change.

This OpenSpec change imports a completed Temper feature already present on `main`; it records the durable product contract rather than proposing new implementation work.
