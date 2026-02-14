## 1. Setup & Configuration

- [x] 1.1 Create `prompts/` directory in project root
- [x] 1.2 Write `prompts/jungian.md` with Jungian analyst persona prompt
- [x] 1.3 Write `prompts/mel-robbins.md` with action-oriented Mel Robbins persona prompt
- [x] 1.4 Write `prompts/loving-parent.md` with compassionate Loving Parent persona prompt
- [x] 1.5 Create Supabase migration to add `analyst_persona TEXT` column (nullable) to `analyses` table

## 2. Backend Prompt Loading

- [x] 2.1 Update `lib/gemini.ts` to load all three persona prompts at server startup
- [x] 2.2 Implement `loadPersonaPrompts()` function that caches all three prompts in memory
- [x] 2.3 Implement `getPromptForPersona(persona: string)` function to retrieve the correct prompt
- [x] 2.4 Add error handling for missing or unreadable prompt files

## 3. Frontend: Analyst Picker Component

- [x] 3.1 Create `components/AnalystPicker.tsx` with dropdown UI (mirrors ModelPicker pattern)
- [x] 3.2 Add persona options (Jungian, Mel Robbins, Loving Parent) with descriptions
- [x] 3.3 Set default persona to "jungian"
- [x] 3.4 Implement onChange callback to update parent state

## 4. Frontend: State Management & Header Integration

- [x] 4.1 Add `selectedPersona` state to `app/page.tsx` (initialize to "jungian")
- [x] 4.2 Add `handlePersonaChange` callback function
- [x] 4.3 Integrate AnalystPicker component into header alongside ModelPicker
- [x] 4.4 Pass `selectedPersona` through to `analyzeText` call

## 5. Server Actions & Analysis Flow

- [x] 5.1 Update `analyzeText()` signature to accept `selectedPersona` parameter
- [x] 5.2 Pass `selectedPersona` to `analyzeWithGemini()` to select the correct system prompt
- [x] 5.3 Store `analyst_persona` in the analysis result object
- [x] 5.4 Update `saveAnalysis()` to accept and store `analyst_persona` in Supabase

## 6. History Display & Retrieval

- [x] 6.1 Update `getAnalysisById()` in `lib/analytics-storage-client.ts` to fetch `analyst_persona`
- [x] 6.2 Update `HistoryViewData` interface to include `analystPersona` field
- [x] 6.3 Display persona name in the analysis view when viewing a historical entry (e.g., "Analyzed by: Jungian Analyst")
- [x] 6.4 Handle legacy analyses without `analyst_persona` gracefully (show no label or default to Jungian context)

## 7. Testing & Validation

- [x] 7.1 Test AnalystPicker UI: verify dropdown displays all three personas with descriptions
- [x] 7.2 Test default persona: verify "Jungian" is selected on first load
- [x] 7.3 Test persona persistence: verify selected persona is passed through analysis flow
- [x] 7.4 Test Jungian persona analysis: verify Gemini generates analysis with correct Jungian sections and mystical image prompt
- [x] 7.5 Test Mel Robbins persona analysis: verify Gemini generates analysis with correct action-oriented sections and bold image prompt
- [x] 7.6 Test Loving Parent persona analysis: verify Gemini generates analysis with correct compassionate sections and nurturing image prompt
- [x] 7.7 Test with mock mode: verify all three personas work with `USE_AI_MOCKS=true`
- [x] 7.8 Test with real Gemini: verify all three personas produce valid outputs with actual API
- [x] 7.9 Test image generation: verify each persona generates persona-specific image prompts to Midjourney
- [x] 7.10 Test history storage: verify `analyst_persona` is saved correctly to Supabase
- [x] 7.11 Test history retrieval: verify personas display correctly when viewing historical analyses
- [x] 7.12 Test legacy data: verify existing analyses without persona display gracefully
