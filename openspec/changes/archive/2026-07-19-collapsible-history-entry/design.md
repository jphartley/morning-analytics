## Context

The completed Temper feature is already present on `main`. Fresh analyses and saved-history views previously shared an always-expanded original-input presentation even though returning users generally prioritize the analysis and images over rereading their complete journal entry. The project uses a Node-only Vitest environment, so behavior that needs automated coverage is expressed through pure helpers.

## Goals / Non-Goals

**Goals:**

- Reduce the vertical cost of long original entries in history.
- Preserve full Markdown rendering on demand.
- Keep the disclosure accessible and predictable across history selection changes.
- Unit-test threshold, word-count, preview, and date-formatting logic without a DOM harness.

**Non-Goals:**

- Change the fresh-analysis result view.
- Change stored journal data, APIs, or persistence.
- Add a new browser testing framework.

## Decisions

### Use a dedicated history disclosure component

The original-entry presentation moves into `OriginalEntryDisclosure`, separating history-specific information priority from the fresh-analysis rendering path and mirroring the app's established native-button disclosure pattern.

### Use pure helpers for compact metadata

Word counting, threshold decisions, preview truncation, and date formatting are exported as pure helpers. This makes boundary behavior testable in the existing Node-only Vitest setup.

### Use a plain-text preview and Markdown only for the full entry

Truncating rendered Markdown can produce broken structure or misleading formatting. The compact state therefore uses a bounded plain-text preview, while the expanded and short-entry states preserve the existing supported Markdown rendering.

### Reset state by selected-item identity

The page keys the disclosure by the selected analysis identifier. A new selection remounts the component into its collapsed default, while rerenders for the same item preserve local disclosure state without synchronization effects.

## Risks / Trade-offs

- [A fixed threshold may not suit every writing style] → Keep the threshold centralized and cover its boundary behavior with unit tests.
- [Preview truncation can omit important context] → Make the complete entry available through an adjacent, accessible disclosure.
- [Duplicated date formatting can drift from the sidebar] → Preserve the established format in a pure helper; a shared formatter can be introduced separately if the formats diverge.

## Migration Plan

No migration is required. The implementation and tests landed before this specification import. Archive sync adds the `history-entry-disclosure` capability to the canonical OpenSpec specs.

## Open Questions

None for this completed import.
