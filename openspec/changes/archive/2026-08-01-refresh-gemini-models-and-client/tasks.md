## 1. Confirm Current Google Baseline

- [x] 1.1 Re-check Google's Gemini model catalog, deprecation schedule, thinking documentation, and the current `@google/genai` release immediately before implementation; record any changed IDs or version in the implementation notes.
- [x] 1.2 Inspect the installed `@google/genai` types and existing `generateContent` callers to confirm the refreshed SDK supports `ThinkingLevel` and `thinkingConfig.thinkingLevel` for all three selected models.

## 2. Refresh Model Catalog And Request Configuration

- [x] 2.1 Update `app/lib/models.ts` to expose `gemini-3.6-flash`, `gemini-3.5-flash-lite`, and `gemini-3.1-pro-preview`, with current display copy, default `gemini-3.1-pro-preview`, and per-model thinking metadata.
- [x] 2.2 Centralize or share construction of the model-specific thinking configuration so journal analysis and contextual-memory requests use validated metadata without enabling thought summaries.
- [x] 2.3 Update `app/lib/gemini.ts` to use the effective supported model and configured thinking level while preserving persona prompts, mock mode, response text handling, and `---IMAGE PROMPT---` parsing.
- [x] 2.4 Update `app/lib/memory-ai.ts` or the shared request helper so contextual-memory selection and update requests use validated model metadata and client configuration consistently.

## 3. Refresh SDK And Picker Compatibility

- [x] 3.1 Update `app/package.json` from the existing `@google/genai` range to the current verified release and regenerate `app/package-lock.json` using the repository's registry-safe workflow.
- [x] 3.2 Verify the lockfile resolves the intended SDK version and passes `npm run check:lockfile-registry`.
- [x] 3.3 Confirm `ModelPicker` exposes exactly three options in the applicable view modes, retains Gemini 3.1 Pro Preview, and no longer exposes the removed 3.1 Flash-Lite or 3.5 Flash IDs.
- [x] 3.4 Preserve `gemini-model` localStorage behavior and ensure removed or unknown saved values fall back to `gemini-3.1-pro-preview` without changing historical database model IDs.

## 4. Tests And Verification

- [x] 4.1 Update model and top-bar preference tests for the new IDs, default, selectable count, and removed-model fallback behavior.
- [x] 4.2 Add focused mocked-client assertions for the selected model ID and thinking level for all three picker models, including the absence of thought summaries.
- [x] 4.3 Verify journal analysis and contextual-memory tests still cover structured output, persona/system instructions, mock mode, and `---IMAGE PROMPT---` extraction.
- [x] 4.4 Run `cd app && npm run lint`, `npm test`, `npm run build`, and `npm run check:lockfile-registry`.
- [x] 4.5 Manually verify each picker option in mock mode, stale localStorage recovery, and at least one real default-model analysis when a valid `GEMINI_API_KEY` is available; confirm no environment variables or migrations are required.
