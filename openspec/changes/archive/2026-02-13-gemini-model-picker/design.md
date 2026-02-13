## Context

The app currently uses a hardcoded fallback model ID `gemini-2.5-pro-preview-05-06` which doesn't exist, breaking the app. The model ID is set in `app/lib/gemini.ts:69` with an env var override. Users have no way to choose between speed and quality trade-offs.

Current flow:
1. User submits journal text
2. `analyzeText` server action calls `analyzeWithGemini(journalText)`
3. `analyzeWithGemini` uses hardcoded/env model ID

## Goals / Non-Goals

**Goals:**
- Fix the broken app by using a valid default model
- Let users choose between three Gemini models with clear trade-off explanations
- Persist model selection across sessions
- Keep the UI unobtrusive

**Non-Goals:**
- Custom model ID input (only predefined options)
- Per-analysis model selection (one global setting)
- Server-side model persistence (localStorage only)

## Decisions

### 1. Model Definitions

**Choice:** Three models with short names and trade-off descriptions

| Display Name | Model ID | Description |
|-------------|----------|-------------|
| Gemini 3 Pro | `gemini-3-pro-preview` | Deepest reasoning – best insights, slowest |
| Gemini 2.5 Pro | `gemini-2.5-pro` | High-end reasoning – stable, long context |
| Gemini 2.5 Flash | `gemini-2.5-flash` | Balanced – good quality, faster |

**Rationale:** User-verified model IDs. Descriptions focus on the trade-off (speed vs quality) which is what users care about.

### 2. Default Model

**Choice:** `gemini-3-pro-preview`

**Rationale:** Users want the deepest analysis by default. Those prioritizing speed can downgrade. This also immediately fixes the broken app.

### 3. UI Placement

**Choice:** Small dropdown in the app header, right side

**Rationale:** Always visible but unobtrusive. Users can see current selection at a glance. No modal or settings page needed.

**Alternatives considered:**
- Settings modal: Overkill for one setting, adds friction
- Footer: Less discoverable, feels hidden
- Inline with submit button: Clutters the main action area

### 4. State Management

**Choice:** React state with localStorage sync via `useEffect`

```
localStorage key: "gemini-model"
value: model ID string (e.g., "gemini-2.5-flash")
```

**Rationale:** Simple, standard pattern. No external state library needed. The app already uses React.

### 5. Server Action Interface

**Choice:** Add optional `modelId` parameter to `analyzeText`

```typescript
analyzeText(journalText: string, modelId?: string)
```

**Rationale:** Optional parameter maintains backwards compatibility. Defaults to `gemini-3-pro-preview` if not provided.

**Flow:**
1. Client reads model from localStorage (or uses default)
2. Client passes `modelId` to `analyzeText` server action
3. Server action passes `modelId` to `analyzeWithGemini`
4. `analyzeWithGemini` uses provided model (ignores env var if model passed)

### 6. Component Structure

**Choice:** Single `ModelPicker` component

```
app/components/ModelPicker.tsx
- Dropdown with model options
- Reads/writes localStorage
- Exports current model via callback or context
```

**Rationale:** Self-contained, reusable. Parent component gets the selected model to pass to server action.

## Risks / Trade-offs

**[Model ID Changes]** → Google may change model IDs. Mitigation: model definitions are in one place, easy to update.

**[localStorage Unavailable]** → SSR or private browsing. Mitigation: graceful fallback to default model, no crash.

**[API Cost Variance]** → Gemini 3 Pro likely costs more. Mitigation: description mentions "slowest" implying trade-off; not our cost anyway (user's API key).
