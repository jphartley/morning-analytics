## Context

JournalInput uses a TipTap editor with Markdown support. Word count is already computed internally for the auto-analyze-on-paste feature (splits on `\s+`, filters empty strings, triggers at ≥300 words). This count is ephemeral — computed inside the `onUpdate` callback and discarded. The component currently renders the editor container and an Analyze button with a `space-y-4` gap between them.

## Goals / Non-Goals

**Goals:**
- Display a live word count that updates on every content change
- Visually communicate the 300-word auto-analyze threshold
- Zero layout shift as the count changes

**Non-Goals:**
- Character count, sentence count, or other metrics
- Persisting word count anywhere (it's derived from editor content)
- Changing the auto-analyze threshold or behavior

## Decisions

### 1. Derive word count from editor markdown content
**Choice**: Compute word count from the same markdown string the `onUpdate` callback already produces, using the same `split(/\s+/).filter(Boolean).length` formula.
**Why**: Consistent with the auto-analyze threshold logic. No new dependency. Uses the markdown representation (not HTML) so formatting syntax is excluded naturally.
**Alternative**: Use TipTap's `editor.storage.characterCount` extension — rejected because it adds a dependency and counts differently than the existing threshold logic.

### 2. Place counter between editor and button
**Choice**: Insert a small text element in the existing `space-y-4` flex column, between the editor border div and the Analyze button.
**Why**: Natural reading position — users see the count after finishing writing, before hitting Analyze. Does not clutter the editor chrome.
**Alternative**: Place inside the editor border (bottom-right corner) — rejected because it overlaps content on small screens and fights with TipTap's padding.

### 3. Threshold indicator via color change
**Choice**: Use `text-ink-muted` below 300 words, shift to `text-accent` at ≥300 words. Append "(auto-analyze ready)" text at threshold.
**Why**: Subtle but informative. Uses existing design tokens. Color change draws attention without animation overhead.
**Alternative**: Progress bar toward 300 — rejected as over-engineered for this scope.

### 4. Fixed-width counter to prevent layout shift
**Choice**: Use `tabular-nums` font feature and right-align the count so digit changes don't reflow.
**Why**: Prevents the button from jumping as word count grows from 1 to 4 digits.

## Risks / Trade-offs

- **Performance**: Word count recomputes on every keystroke. For morning pages (~1000 words), splitting a string is negligible (~0.01ms). No risk.
- **Markdown artifacts**: Word count includes markdown syntax tokens (e.g., `**bold**` counts as 1 word with asterisks). Acceptable — matches the existing auto-analyze threshold logic, and the difference is minimal for prose-heavy morning pages.
