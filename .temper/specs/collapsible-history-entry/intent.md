# Intent: Collapsible original entry in history view

**Status: COMPLETED** — committed as c598183 on feature/collapsible-history-entry (2026-07-15)

## Problem
Historical analyses render the complete original journal input in an always-expanded
card before the analysis. For long entries this pushes the analysis and generated
images far below the fold, so returning readers must scroll past text they already
wrote to reach the insight they came back for.

## Success Criteria
- Original input is collapsed by default when a history item is newly selected.
  Validate: scenario — covered by "Long entry is collapsed by default on selection"
- Collapsed state shows a useful preview plus entry date and word count.
  Validate: scenario — covered by "Collapsed state shows date, word count, and preview"
- "Show full entry" reveals the complete formatted journal text without a scroll jump.
  Validate: scenario — covered by "Show full entry reveals the complete formatted text"
- "Hide entry" returns to the compact state and is keyboard operable.
  Validate: scenario — covered by "Hide entry returns to the compact state via keyboard"
- Disclosure exposes correct aria-expanded and aria-controls relationships.
  Validate: code — button has aria-expanded bound to open state and aria-controls
  referencing the panel id (useId)
- Short entries do not receive a redundant collapse control.
  Validate: scenario — covered by "Short entry renders without a collapse control"
- Expansion state persists while the same item is selected and resets on switch.
  Validate: scenario — covered by "Expansion state resets when a different item is selected"

## Constraints
- Follow project Tailwind design tokens (bg-surface, bg-page, text-ink, text-ink-muted,
  border-outline, focus:ring-accent) — no hardcoded colors (per CLAUDE.md).
- Mirror the existing disclosure pattern in components/ImagePromptDisclosure.tsx
  (native <button>, useId, useState, chevron, focus ring).
- Tests run under vitest environment "node" (no jsdom/RTL) — behavior that must be
  unit-tested has to live in exported pure helper functions.
- No API, storage, or DB schema changes. RLS and data flow untouched.

## Target Users
Returning journalers reviewing past analyses who want to reach the analysis and
imagery quickly without re-reading their full entry.

## Scenarios (BDD)
<!-- Note legend: unit = pure logic; mock = external dep; integration = cross-boundary; manual = human/UI verification -->

### Scenario: Long entry is collapsed by default on selection
Given a saved history item whose original input exceeds the collapse threshold
When the user selects that item from the history sidebar
Then the original entry renders collapsed, showing date, word count, and a preview
And the full journal text is not shown until requested
Note: manual

### Scenario: Collapsed state shows date, word count, and preview
Given a long original entry rendered collapsed
Then the header shows the entry date and the word count
And a short preview of the first lines of the entry is visible
Note: unit

### Scenario: Show full entry reveals the complete formatted text
Given a collapsed original entry
When the user activates "Show full entry"
Then the complete journal text renders with markdown formatting
And the toggle control stays in place so scroll position is preserved
Note: manual

### Scenario: Hide entry returns to the compact state via keyboard
Given an expanded original entry
When the user focuses the toggle and presses Enter or Space
Then the entry returns to the compact preview state
And "Hide entry" label returns to "Show full entry"
Note: manual

### Scenario: Disclosure exposes correct ARIA relationships
Given the collapse control is rendered
Then the toggle button has aria-expanded reflecting the open state
And aria-controls references the id of the full-text panel
Note: manual

### Scenario: Short entry renders without a collapse control
Given a saved history item whose original input is at or below the threshold
When the user selects that item
Then the full original input is shown with no "Show full entry" control
Note: unit

### Scenario: Expansion state resets when a different item is selected
Given the user expanded the original entry for one history item
When the user selects a different history item
Then the newly selected item's original entry renders collapsed by default
Note: manual
