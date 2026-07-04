## 1. Model Catalog Update

- [x] 1.1 Re-check Google's Gemini API model docs and thinking docs before editing implementation constants.
- [x] 1.2 Update `app/lib/models.ts` to expose exactly three model options: `gemini-3.1-flash-lite`, `gemini-3.5-flash`, and `gemini-3.1-pro-preview`.
- [x] 1.3 Update display names and descriptions to match the spec.
- [x] 1.4 Change `DEFAULT_MODEL_ID` to `gemini-3.5-flash`.
- [x] 1.5 Add model metadata or helper functions for supported model validation and thinking behavior.

## 2. Gemini Analysis Request Path

- [x] 2.1 Inspect the installed Gemini SDK types and decide whether `@google/generative-ai` can send the required thinking settings safely.
- [x] 2.2 If needed, migrate the text analysis call to the current official JavaScript SDK path while preserving persona prompt loading and response parsing.
- [x] 2.3 Update `analyzeWithGemini` to validate the requested model ID and fall back to the default for unsupported IDs.
- [x] 2.4 Send extended/high thinking settings only for models whose metadata confirms support.
- [x] 2.5 Preserve mock mode behavior and the `---IMAGE PROMPT---` parsing contract.

## 3. Picker And Persistence Behavior

- [x] 3.1 Verify `ModelPicker` continues to show exactly three choices in the header.
- [x] 3.2 Verify current saved model IDs still restore correctly from `localStorage`.
- [x] 3.3 Verify stale saved model IDs fall back to `gemini-3.5-flash` without crashing.
- [x] 3.4 Update any user-facing labels or assumptions that still refer to old model names.

## 4. Verification

- [x] 4.1 Run `cd app && npm run lint`.
- [x] 4.2 Run `cd app && npm run build`.
- [x] 4.3 Run `cd app && npm run check:lockfile-registry`.
- [x] 4.4 Manually test analysis in mock mode with each model option.
- [x] 4.5 When a valid `GEMINI_API_KEY` is available, manually test at least one real analysis request using the default model.
- [x] 4.6 Confirm the generated analysis still includes an image prompt after the `---IMAGE PROMPT---` delimiter.
