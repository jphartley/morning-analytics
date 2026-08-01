## Why

The product's Gemini picker and server integration are based on a model catalog that has already moved on. Google now lists Gemini 3.6 Flash, Gemini 3.5 Flash, and Gemini 3.5 Flash-Lite as the latest stable Gemini 3 text models, while the currently exposed Gemini 3.1 Flash-Lite is scheduled for replacement by 3.5 Flash-Lite. The application should present current stable choices and keep its Google client aligned with the current SDK so model and thinking configuration remain supported.

## What Changes

- Keep three current Gemini text-model options in the picker:
  - Gemini 3.6 Flash (`gemini-3.6-flash`) for strong, efficient general analysis.
  - Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`) for fast, low-cost analysis.
  - Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`) for the most advanced reasoning and complex problem solving, and the default experience.
- Remove `gemini-3.1-flash-lite` and `gemini-3.5-flash` from the user-facing picker; retain the still-available 3.1 Pro Preview option.
- Update the default model and stale-preference fallback to `gemini-3.1-pro-preview` while preserving the existing `gemini-model` localStorage key.
- Reconcile model thinking metadata and request configuration with the current Gemini 3 thinking guidance, including supported levels and the SDK's typed `thinkingConfig` path.
- Refresh `@google/genai` and its lockfile entry to the current supported release, preserving the existing server-side client and response parsing contracts.
- Add focused coverage for the new catalog, stale model fallback, thinking configuration, and the unchanged `---IMAGE PROMPT---` parsing behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-picker`: Update the selectable model catalog, default, stale-value fallback, and thinking-capability behavior.
- `journal-analysis`: Keep model selection and persona analysis behavior intact while updating the supported Gemini request configuration and client dependency.

## Impact

- `app/lib/models.ts`, `app/lib/gemini.ts`, and shared Gemini callers such as `app/lib/memory-ai.ts`.
- `app/components/ModelPicker.tsx`, top-bar preference validation, and model-related tests.
- `app/package.json` and `app/package-lock.json` for the `@google/genai` refresh.
- OpenSpec model-picker and journal-analysis requirements plus implementation verification.
- No new environment variables, data migration, or stored-analysis schema change is expected. Existing saved records may retain historical model IDs; only future picker selections and validated runtime requests use the current catalog.

The model choices are based on Google's [Gemini model catalog](https://ai.google.dev/gemini-api/docs/models), [deprecation schedule](https://ai.google.dev/gemini-api/docs/deprecations), and [thinking guidance](https://ai.google.dev/gemini-api/docs/generate-content/thinking).
