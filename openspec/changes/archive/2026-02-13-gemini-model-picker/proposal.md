## Why

The current Gemini model (`gemini-2.5-pro-preview-05-06`) is broken and the app is non-functional. Additionally, users have different needs: some want the deepest analysis (slower), others prefer faster responses. A model picker lets users choose their trade-off and fixes the immediate breakage.

## What Changes

- Add a UI component to select between three Gemini models
- Short display names with human-readable trade-off explanations
- Persist selection in localStorage across sessions
- Fix the broken default model ID
- Model selection passed to the server action for API calls

## Capabilities

### New Capabilities

- `model-picker`: UI component for selecting Gemini model with persistence. Covers the dropdown/picker UI, model definitions (ID, display name, description), and localStorage integration.

### Modified Capabilities

(none - the existing journal-analysis spec is model-agnostic; it requires sending text to Gemini and returning analysis, which remains unchanged. The model ID is an implementation detail.)

## Impact

- **Code**: New UI component, modification to `app/lib/gemini.ts` to accept model parameter
- **UI**: Small picker element in the app shell (unobtrusive placement TBD in design)
- **Server Actions**: `analyzeText` action needs to accept and use user's model choice
- **Fix**: Revert broken model ID to a working default (`gemini-3-pro-preview`)
