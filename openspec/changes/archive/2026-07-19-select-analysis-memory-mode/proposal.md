## Why

The blind memory experiment cannot be used reliably with the normal paste-first workflow: pasting 300 or more words immediately starts the default memory-enabled analysis before the user can choose the separate blind-comparison action. The analysis condition must be selected before submission so manual clicks and automatic paste submission run the same intended experiment.

## What Changes

- Replace the separate "Run blind memory comparison" button with a three-option analysis-memory mode selector shown before journal submission in Test view: no memory (one analysis), use memory (one analysis), or blind comparison (two analyses).
- Route both the Analyze button and the 300-word paste auto-trigger through the currently selected mode.
- Add an explicit server-side no-memory analysis path that skips memory selection and injection, while retaining the existing memory-enabled and blind-comparison paths.
- Preserve the existing blind reveal and preferred-result workflow; only the chosen result proceeds to image generation and persistence.
- Keep the normal memory-enabled mode as the default and keep Quiet and Insight views on their current memory-enabled behavior.
- Continue updating durable memory exactly once from the original journal entry after any selected single result is saved, including a result generated without memory; the mode controls context used for the current analysis, not whether the entry may inform future analyses.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `memory-experimentation`: Move experiment selection before submission and define the three analysis-memory modes, their visibility, default, and result behavior.
- `journal-analysis`: Allow the analysis pipeline to explicitly include or exclude contextual memory while preserving post-save memory updates.
- `auto-analyze-on-paste`: Make automatic paste submission execute the selected analysis-memory mode rather than always starting the default analysis.

## Impact

- `app/app/page.tsx`: analysis state, mode dispatch, blind-comparison entry point, and Test-view UI composition.
- `app/components/JournalInput.tsx` and a focused memory-mode control component: pre-submission control placement and auto-submit callback behavior.
- `app/app/actions.ts`: explicit memory-use option or dedicated no-memory orchestration without changing the bounded memory selector itself.
- Component and server-action tests covering all three modes, auto-paste routing, default behavior, Test-view visibility, blind result continuation, and exactly-once post-save memory updates.
- No database migration, new dependency, or environment-variable change is expected.
