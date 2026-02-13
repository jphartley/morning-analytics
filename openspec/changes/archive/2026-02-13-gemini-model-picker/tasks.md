## 1. Fix Broken Default

- [x] 1.1 Update default model in `app/lib/gemini.ts` from `gemini-2.5-pro-preview-05-06` to `gemini-3-pro-preview`

## 2. Model Definitions

- [x] 2.1 Create `app/lib/models.ts` with model definitions (id, displayName, description) for all three models
- [x] 2.2 Export default model constant (`gemini-3-pro-preview`)

## 3. Server-Side Changes

- [x] 3.1 Add optional `modelId` parameter to `analyzeWithGemini` function in `app/lib/gemini.ts`
- [x] 3.2 Use passed `modelId` if provided, otherwise use default
- [x] 3.3 Add optional `modelId` parameter to `analyzeText` server action in `app/app/actions.ts`
- [x] 3.4 Pass `modelId` from `analyzeText` to `analyzeWithGemini`

## 4. ModelPicker Component

- [x] 4.1 Create `app/components/ModelPicker.tsx` with dropdown UI
- [x] 4.2 Display all three models with display names and descriptions
- [x] 4.3 Add localStorage read on mount (key: `gemini-model`)
- [x] 4.4 Add localStorage write on selection change
- [x] 4.5 Handle localStorage unavailable gracefully (fallback to default)
- [x] 4.6 Expose selected model via `onModelChange` callback prop

## 5. Integration

- [x] 5.1 Add ModelPicker to app header (right side)
- [x] 5.2 Wire selected model state to `analyzeText` call
- [ ] 5.3 Test end-to-end: change model, submit analysis, verify correct model used
