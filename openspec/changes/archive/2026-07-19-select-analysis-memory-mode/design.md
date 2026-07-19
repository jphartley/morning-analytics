## Context

The current client has two independent submission handlers. `JournalInput` calls the normal handler for both the Analyze button and any paste that brings the editor to at least 300 words; that handler always calls `analyzeText`, which selects and injects contextual memory. A separate Test-view button calls `compareTextAnalyses`, but a qualifying paste fires the normal handler before the user can use that button.

The server already supports the two expensive generation shapes needed by the experiment: one memory-enabled analysis and a blind pair generated from one memory selection. The missing shape is an explicit single analysis that bypasses memory selection, and the missing orchestration is a pre-submission choice shared by manual and automatic submission.

The memory store is updated only after the selected analysis has been saved, using the original journal entry rather than generated analysis text. That separation allows a no-memory current analysis to remain a clean experimental condition while still contributing the entry to future memory.

## Goals / Non-Goals

**Goals:**

- Let a Test-view user choose no memory, use memory, or blind comparison before entering or pasting a journal entry.
- Make the Analyze button and paste auto-trigger execute the same selected mode.
- Guarantee that no-memory mode skips the relevance selector as well as prompt injection.
- Preserve the existing blind randomization, reveal, chosen-result continuation, image generation, saving, and exactly-once post-save memory update.
- Keep current behavior unchanged outside Test view.

**Non-Goals:**

- Providing a global opt-out from memory storage or deleting inferred memory.
- Persisting the selected experiment mode across browser reloads or devices.
- Saving comparison preference, rejected results, or experiment metrics.
- Changing memory relevance, inference, prompt construction, image generation, or database schemas.
- Exposing the experimental selector in Quiet or Insight view.

## Decisions

### Use one three-option selector before the journal editor

Test view will render an accessible radio group or segmented selector above the journal editor with three explicit options:

- **No memory** — one analysis without memory selection or context.
- **Use memory** — one analysis using the existing selection and bounded context path.
- **Blind comparison** — two unlabeled analyses using the existing comparison path.

`Use memory` is the initial value. The selection remains in client state while the user stays on the page so repeated Test-view runs can use the same condition. Quiet and Insight views hide the selector and always use the memory-enabled single-analysis path.

Placing the selector before the editor makes the condition visible before paste can submit. A separate button was rejected because it competes with the automatic submission trigger and models the comparison as a second action rather than a run configuration. A binary switch plus a separate comparison button was rejected because it does not represent the three mutually exclusive outcomes clearly.

### Route every submission through one mode dispatcher

`JournalInput` will continue to expose one `onAnalyze` callback. The page will pass a dispatcher that reads the effective mode and calls either the single-analysis handler or blind-comparison handler. Both a button click and the post-paste effect therefore use identical routing, loading-state preparation, authentication/model/persona inputs, and error handling.

The selector is disabled or absent after a run begins, so the mode cannot change mid-request. The page state remains the authority for whether the result enters the existing single-result completion pipeline or the comparison reveal screen.

Duplicating mode logic inside `JournalInput` was rejected because the editor should detect submission intent, not know about server orchestration or experimental conditions.

### Make the single-analysis memory condition explicit at the server boundary

The single-analysis server action will accept a typed memory-use option with a backward-compatible default of memory enabled. In `with-memory` mode it will retain the current selector, bounded context, warning, and Gemini invocation. In `without-memory` mode it will skip the selector entirely, call Gemini with an empty context, and return an empty `memoryContext` snapshot without a selector warning.

The blind action remains separate because it has a different response shape and must select memory once before generating both conditions. Implementing no-memory mode by resetting, hiding, or temporarily mutating the memory store was rejected as unsafe and unnecessary.

### Keep learning after save independent from current-analysis context

All three modes continue through `completeChosenAnalysis` only when one result has been selected. After persistence succeeds, the client invokes the existing memory update exactly once using the saved original entry. For no-memory mode this update occurs after generation and therefore cannot contaminate the current analysis; it only affects later entries.

Treating “No memory” as a storage opt-out was rejected for this experiment because it would mix two concerns, make future conditions depend on prior mode choices, and silently erode the built memory catalog. A future durable opt-out would require separate product language and requirements.

### Keep comparison artifacts ephemeral

Blind comparison continues to randomize A/B positions on the client, reveal the conditions only after the user records A, B, or no meaningful difference, and persist only an explicitly chosen result. No result, preference, or mode metadata is added to storage in this change.

### Stack comparison results for reading width

The comparison screen will render Analysis A first and Analysis B directly below it, with each analysis using the full content width. A responsive side-by-side layout was rejected because long-form analysis text becomes narrow and harder to consume even on larger screens.

## Risks / Trade-offs

- **[Risk] “No memory” could be read as disabling future memory learning** → Label the option description as applying to the current analysis and explain in Test-view helper text that saved entries still update memory for future runs.
- **[Risk] A qualifying paste may use a stale mode callback** → Keep the mode dispatcher in the page, pass the current callback into `JournalInput`, and add an interaction test that selects each mode before paste.
- **[Risk] The selector adds Test-view visual density** → Use a compact three-option group with one-line outcome descriptions and remove the redundant blind-comparison button.
- **[Risk] A caller omits the new single-analysis option** → Default the server action to `with-memory`, preserving existing behavior for current and overlooked callers.
- **[Trade-off] Mode is not durable across reloads** → Keep scope small and predictable; the safe default is restored after reload, while in-session repeated experiments remain convenient.

## Migration Plan

1. Add the shared mode type, Test-view selector, and unified submission dispatcher.
2. Extend the single-analysis server action with the explicit no-memory path and retain memory-enabled default behavior.
3. Remove the standalone blind-comparison button and connect blind mode to the existing comparison UI.
4. Add server and component tests, then run lint, targeted tests, and the production build.
5. Deploy normally; no data migration or Railway variable update is required. Rollback is a code-only revert because storage contracts remain compatible.

## Open Questions

None. A persistent product-wide memory opt-out is intentionally separate from this experiment-mode fix.
