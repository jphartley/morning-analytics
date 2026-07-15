# Tasks: Collapsible original entry in history view

## Task 1 — Create OriginalEntryDisclosure component [SEQUENTIAL]
Traced to: Scenario: "Long entry is collapsed by default on selection",
"Collapsed state shows date, word count, and preview",
"Show full entry reveals the complete formatted text",
"Hide entry returns to the compact state via keyboard",
"Disclosure exposes correct ARIA relationships",
"Short entry renders without a collapse control"

- Create app/components/OriginalEntryDisclosure.tsx as a "use client" component.
- Props: { inputText: string; createdAt?: string | null }.
- Export pure helpers (module scope, testable under node vitest):
  - countWords(text): number — words = non-empty tokens split on whitespace.
  - COLLAPSE_WORD_THRESHOLD constant (e.g. 60).
  - shouldCollapseEntry(text, threshold = COLLAPSE_WORD_THRESHOLD): boolean.
  - getEntryPreview(text, maxLines = 3, maxChars = 240): string (first lines,
    trimmed, ellipsis when truncated).
  - formatEntryDate(iso): string — mirror HistorySidebar formatDateTime
    (toLocaleDateString en-US, month short / day numeric / hour / minute).
- Behavior:
  - If !shouldCollapseEntry(inputText): render the full ReactMarkdown card with no
    toggle (reuse the markdown component config + omitMarkdownNode moved from page.tsx).
  - Else: render a disclosure mirroring ImagePromptDisclosure — collapsed by default
    (useState(false)); header shows formatEntryDate + word count + getEntryPreview;
    native <button> with aria-expanded={isOpen}, aria-controls={useId()},
    label "Show full entry" / "Hide entry", chevron rotate; expanded panel (id =
    useId) renders full ReactMarkdown journal text.
  - Use only design tokens: bg-surface, border-outline, text-ink, text-ink-muted,
    hover:bg-page, focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2.
- Validate: cd app && npm run lint

## Task 2 — Unit-test the pure helpers [SEQUENTIAL: after Task 1]
Traced to: Scenario: "Collapsed state shows date, word count, and preview",
"Short entry renders without a collapse control"

- Create app/components/OriginalEntryDisclosure.test.ts (vitest, node env; import
  helpers from ./OriginalEntryDisclosure — no DOM rendering).
- Cover: countWords (empty, single, multi, whitespace-heavy);
  shouldCollapseEntry (below/at/above threshold boundary);
  getEntryPreview (short text unchanged; long text truncated with ellipsis;
  respects maxLines).
- Validate: cd app && npx vitest run components/OriginalEntryDisclosure.test.ts

## Task 3 — Wire component into the history view [SEQUENTIAL: after Task 1]
Traced to: Scenario: "Long entry is collapsed by default on selection",
"Expansion state resets when a different item is selected"

- In app/app/page.tsx:
  - Add createdAt?: string | null to the HistoryViewData interface.
  - In handleHistorySelect, set createdAt: result.data.created_at in setHistoryViewData.
  - Replace the inline "Original Input" card (approx lines 523-553) with
    <OriginalEntryDisclosure key={historyViewData.id}
      inputText={historyViewData.inputText} createdAt={historyViewData.createdAt} />.
    The key forces a remount on item switch so expansion resets (collapsed default)
    while persisting within the same selected item.
  - Add the import for OriginalEntryDisclosure.
  - Remove the now-unused ReactMarkdown and omitMarkdownNode imports from page.tsx
    (they were only used by the moved block — confirm no other usage first).
- Validate: cd app && npm run lint && npm run build

## Task 4 — Manual UI verification [SEQUENTIAL: after Task 3]
Traced to: Scenario: "Show full entry reveals the complete formatted text",
"Hide entry returns to the compact state via keyboard",
"Disclosure exposes correct ARIA relationships",
"Long entry is collapsed by default on selection"

- cd app && USE_AI_MOCKS=true npm run dev; open a history item with a long entry.
- Confirm: collapsed by default; date + word count + preview shown; Show full entry
  expands in place (no scroll jump); Hide entry collapses; Tab-to-button + Enter/Space
  toggles; a short entry shows no toggle; switching items resets to collapsed.
- Validate: manual
