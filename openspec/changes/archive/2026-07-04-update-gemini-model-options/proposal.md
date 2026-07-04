## Why

The model picker currently exposes Gemini model IDs that are no longer aligned with Google's current Gemini API lineup, including a default model that is now listed as shut down in the official model docs. Users should still have three clear Gemini choices, but those choices should match the latest Google offering and use extended thinking where the selected model supports it.

## What Changes

- Replace the three model picker options with the current Google Gemini lineup reflected in the provided screenshot:
  - Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`) for fastest, lightweight analysis.
  - Gemini 3.5 Flash (`gemini-3.5-flash`) for all-around help and the default experience.
  - Gemini 3.1 Pro (`gemini-3.1-pro-preview`) for deeper reasoning.
- Update model display names and descriptions to match the new speed/quality trade-offs.
- Change the default model from the shut-down `gemini-3-pro-preview` to `gemini-3.5-flash`.
- Add model metadata for thinking support so the Gemini call can request extended thinking for models that support configurable thinking.
- Preserve existing localStorage behavior while gracefully handling older saved model IDs by falling back to the new default.
- Verify current model IDs against Google's Gemini API docs during implementation before committing the final constants.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-picker`: Update the three selectable Gemini model options, default selection, fallback behavior, and selected-model analysis behavior to support current model IDs and extended thinking where available.

## Impact

- `app/lib/models.ts`: model constants, default model ID, and model metadata.
- `app/lib/gemini.ts`: Gemini request configuration for thinking-capable models.
- `app/components/ModelPicker.tsx` and any dependent UI text if assumptions about the selected model label change.
- `openspec/specs/model-picker/spec.md`: requirement updates for current model choices, default behavior, and thinking support.
- Manual verification should include selecting each model, analyzing journal text, and confirming stale localStorage values do not crash the app.
