## Context

The application already uses the current Google JavaScript client family, `@google/genai`, through `GoogleGenAI.models.generateContent`. The installed dependency is `2.10.0`, while the current published release is `2.13.0`. Model metadata lives in `app/lib/models.ts`; analysis requests are built in `app/lib/gemini.ts`; structured contextual-memory requests share the same client in `app/lib/memory-ai.ts`.

Google's current Gemini catalog lists these current Gemini 3 text models relevant to this product:

| Product choice | Model ID | Product intent | Thinking setting |
|---|---|---|---|
| Gemini 3.6 Flash | `gemini-3.6-flash` | Strong, efficient general analysis | `medium` |
| Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite` | Fastest, lowest-cost analysis | `minimal` |
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | Most advanced reasoning and complex problem solving; default | `high` |

The 3.1 Flash-Lite model has a published migration target of 3.5 Flash-Lite. The 3.1 Pro Preview remains listed by Google with no announced shutdown date and is the advanced reasoning choice, so it remains available alongside the latest stable models. Historical model IDs in saved analyses remain historical data and do not need rewriting.

## Goals / Non-Goals

**Goals:**

- Keep three clear Gemini text choices in the existing picker: the relevant current Flash options plus the still-available advanced Pro Preview.
- Make the model catalog, default, localStorage fallback, and backend request behavior agree.
- Use typed `thinkingConfig.thinkingLevel` settings supported by the current `@google/genai` client.
- Refresh the client dependency and lockfile without changing the server-only API-key boundary.
- Preserve persona prompts, contextual-memory behavior, `generateContent`, mock mode, image-prompt parsing, and analysis persistence contracts.

**Non-Goals:**

- Do not add a user-facing thinking-level control.
- Do not migrate to the Interactions API in this change; the existing `generateContent` path is supported for these requests and preserves the current response shape.
- Do not add Gemini image/video generation; image generation remains owned by the existing image-provider system.
- Do not rewrite historical `model_id` values or change the database schema.
- Do not add or rename environment variables.

## Decisions

### 1. Offer the latest stable lineup plus the strongest available Pro option

Use explicit IDs for Gemini 3.6 Flash, Gemini 3.5 Flash-Lite, and Gemini 3.1 Pro Preview. Make Gemini 3.1 Pro Preview the default because it is the application's advanced reasoning choice for complex journal analysis. Keep the faster Flash options available for users who prefer lower latency or cost.

Alternative: keep Gemini 3.5 Flash as the default stable model. That would prioritize stable-model status over the user's chosen quality-first experience and would duplicate a general-purpose option that is not needed in this picker.

Alternative: use `latest` aliases. Explicit stable IDs make saved preferences and stored analysis metadata reproducible and avoid silent hot-swaps.

### 2. Centralize model capability metadata

Keep model identity, display copy, and thinking support in `app/lib/models.ts`. Represent the configured level using the app's existing `minimal | low | medium | high` union. Add a shared request-config helper or equivalent so both journal analysis and contextual-memory requests use the same validated model metadata without duplicating model-ID conditionals.

Configure `medium` for Gemini 3.6 Flash, `minimal` for Gemini 3.5 Flash-Lite, and `high` for Gemini 3.1 Pro Preview. Omit `thinkingConfig` only if a future model is explicitly marked unsupported; all three selected models currently support Gemini 3 thinking levels.

Alternative: leave thinking configuration only in `gemini.ts`. That would make memory requests behave differently from the selected analysis model and would duplicate future maintenance decisions.

### 3. Refresh the existing SDK in place

Update `@google/genai` from the lockfile's `2.10.0` resolution to the current `2.13.0` release and regenerate the lockfile using the repository's registry-safe workflow. Keep `GoogleGenAI`, `models.generateContent`, `ThinkingLevel`, and the current `response.text` parsing contract.

Alternative: migrate to the Interactions API. Google recommends it for access to all latest features, but this request is a dependency/model refresh and the current Generate Content API already exposes the required typed thinking configuration. A separate migration would change response handling and expand scope.

### 4. Treat stale browser preferences as a normal migration

Continue validating `gemini-model` against `GEMINI_MODELS` and fall back to `DEFAULT_MODEL_ID` when the stored value is unavailable or no longer supported. Do not mutate old database rows; future analyses record the effective selected model as before.

## Risks / Trade-offs

- [Model catalog changes again before implementation] → Re-check Google's model and deprecation pages immediately before editing constants; keep IDs explicit and add a task to record the verification date.
- [The SDK refresh changes TypeScript or response types] → Run lint, tests, build, and a mock analysis; preserve `response.text` and the image-prompt parser in focused tests.
- [Thinking increases latency or token cost] → Use the documented per-model levels, keep Lite at `minimal`, and do not expose thought summaries or store internal reasoning.
- [A selected model rejects a request configuration] → Centralize metadata, only send `thinkingConfig` for models marked supported, and cover each model's request shape with mocked client assertions.
- [Users have removed model IDs in localStorage] → Preserve the existing validated fallback and test both removed IDs and arbitrary stale values.

## Migration Plan

1. Reconfirm the official model/deprecation pages and the current `@google/genai` release.
2. Update model metadata, request configuration sharing, picker copy, and stale-preference tests.
3. Refresh `app/package.json` and `app/package-lock.json`; run the lockfile registry check and normalize URLs if needed.
4. Run the app's baseline checks, then manually verify each model in mock mode and at least one real request when a valid key is available.
5. Deploy normally; no environment-variable or database migration is required.

Rollback is a package/model-constant revert followed by the normal build and deployment process. Historical analyses remain readable because no persisted records are changed.

## Open Questions

- Before implementation, confirm whether Google has changed the stable catalog or SDK release again; if so, update the explicit IDs and recorded package version in this change before coding.
- If the refreshed SDK changes the enum or request shape, should the implementation pin the exact documented version or use the newest compatible patch release? Default to the current published stable release unless verification finds a compatibility issue.
