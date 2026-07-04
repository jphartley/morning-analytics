## Context

The app currently stores Gemini model choices in `app/lib/models.ts` and passes the selected ID through `ModelPicker`, `analyzeText`, and `analyzeWithGemini`. The current default is `gemini-3-pro-preview`, which Google's Gemini API model docs now list as shut down. The same docs, last updated 2026-06-30 UTC, list `gemini-3.5-flash`, `gemini-3.1-flash-lite`, and `gemini-3.1-pro-preview` in the current model catalog.

The app uses `@google/generative-ai@0.24.1`. Google's newer JavaScript examples for Gemini thinking features use `@google/genai` and the Interactions API, including `thinking_level` and `thinking_summaries`. Implementation should verify the SDK path before adding thinking config so the app does not send unsupported request fields.

## Goals / Non-Goals

**Goals:**

- Keep exactly three selectable Gemini model choices.
- Align display names, model IDs, and descriptions with Google's current Gemini offerings and the provided screenshot.
- Default to `gemini-3.5-flash` as the all-around choice.
- Apply extended thinking for models that support it without breaking models that do not.
- Preserve existing storage behavior and safely recover from stale saved model IDs.

**Non-Goals:**

- Add a visible thinking-level picker in this change.
- Store thinking settings per user or per analysis.
- Change analyst persona prompts, analysis parsing, image generation, or history persistence schema.
- Expose thought summaries in the UI.

## Decisions

### 1. Use explicit stable or preview model IDs, not latest aliases

Use explicit model IDs in `GEMINI_MODELS`:

- `gemini-3.1-flash-lite`
- `gemini-3.5-flash`
- `gemini-3.1-pro-preview`

Rationale: Google's docs describe `latest` aliases as hot-swapped over time. This app saves model IDs in localStorage and stores `model_id` with analyses, so explicit IDs make behavior and history easier to reason about.

Alternative considered: use aliases such as `gemini-flash-latest`. That better matches the word "latest" but could change behavior without a code change and make old analysis records less interpretable.

### 2. Make Gemini 3.5 Flash the default

Set `DEFAULT_MODEL_ID` to `gemini-3.5-flash`.

Rationale: The screenshot marks the Flash option as the all-around help choice, and it is the safest replacement for a general default. Pro remains available for deeper analysis, and Flash-Lite remains available for speed.

Alternative considered: default to Pro for highest quality. That would increase latency and cost for the normal path and does not match the screenshot's selected all-around option.

### 3. Add backend model metadata for thinking behavior

Extend the model metadata with a server-usable field such as:

```ts
thinking?: {
  supported: boolean;
  level?: "minimal" | "low" | "medium" | "high";
};
```

Use that metadata in `analyzeWithGemini` to decide whether to request extended thinking. The initial intended settings are:

| Model ID | Thinking behavior |
|----------|-------------------|
| `gemini-3.1-flash-lite` | Omit thinking config unless docs confirm controllable thinking for this exact text model |
| `gemini-3.5-flash` | Request extended/high thinking if supported by the chosen SDK/API path |
| `gemini-3.1-pro-preview` | Request high thinking |

Rationale: The app should not infer support from display names. Model capability metadata keeps UI selection and backend request behavior in one audited place.

Alternative considered: hard-code thinking config inside `gemini.ts` by model ID. That is quicker but spreads model behavior across files.

### 4. Prefer the current official JavaScript SDK path if thinking requires it

During implementation, first verify whether the installed `@google/generative-ai` package supports the required thinking fields. If not, migrate the Gemini text call to `@google/genai` for analysis generation and preserve the existing output parsing contract:

- same system/persona prompt content
- same `---IMAGE PROMPT---` delimiter parsing
- same mock mode behavior
- same server action return shape

Rationale: The current SDK types do not expose thinking configuration, while Google's current thinking docs show `@google/genai` examples. A small migration is acceptable if it is the only typed way to request extended thinking.

Alternative considered: cast unsupported request fields through `as any`. That would avoid dependency churn but would make request shape drift easy to miss.

## Risks / Trade-offs

- Model availability changes again before implementation -> Re-check the official Gemini API model docs before editing constants.
- Thinking config increases token use and latency -> Limit extended thinking to the all-around/deep options and keep Flash-Lite on the fastest path unless support is explicit.
- SDK migration affects response parsing -> Add a focused test or mock around `parseResponse` and manually verify one real or mock analysis path.
- Stale localStorage values point to removed IDs -> Keep the current membership check and ensure fallback uses the new default.
- Preview model has tighter limits or instability -> Preserve graceful errors from `analyzeText` and document Pro as the advanced option rather than the default.

## Migration Plan

1. Update model constants and default ID.
2. Add model lookup helpers that validate supported IDs and expose thinking metadata.
3. Update `analyzeWithGemini` to use the validated model metadata and send thinking settings only when supported.
4. If required, migrate analysis generation from `@google/generative-ai` to `@google/genai` while preserving the existing parsing contract.
5. Run lint/build and lockfile registry check from `app/`.
6. Manually verify each picker option with `USE_AI_MOCKS=true`, then verify at least one real Gemini call when `GEMINI_API_KEY` is available.

Rollback is straightforward: restore the previous model constants and Gemini client implementation, then re-run lint/build. No data migration is required because stored `model_id` values are plain text.

## Open Questions

- Should the implementation use `thinking_summaries` internally for debugging, or only request a higher `thinking_level` without exposing summaries? Current proposal assumes no summaries are shown or stored.
- Should `gemini-3.1-flash-lite` remain strictly fastest with no thinking config, even if Google supports a minimal/high thinking setting for a related model variant?
