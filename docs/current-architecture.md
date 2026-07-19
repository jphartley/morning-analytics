# Current Architecture & Data Flow

## Overview

Morning Analytics follows a memory-assisted processing model:
1. **Memory selection**: Gemini fuzzily selects relevant compact memories for the original journal text.
2. **Phase 1 analysis**: Gemini analyzes text with at most five memories / 150 words and generates an image prompt.
3. **Phase 2 images**: The configured image provider returns normalized images.
4. **Post-save memory update**: The server divides the original writing into exact source blocks; Gemini returns create/update operations that reference block IDs, and the server copies the selected block text into user-scoped memory evidence.

Results are stored in Supabase for historical browsing.

Memory selection degrades to a memory-free analysis when unavailable. Post-save
memory update failures do not invalidate the readable or saved analysis.

For the Midjourney/Discord failure investigation, architectural conclusions, rejected approaches, and recommended direct-provider job architecture, see `docs/image-generation-architecture.md`.

---

## User Journey

```
User Input
    ↓
┌─────────────────────────────────────────┐
│ UI State: idle                          │
│ - User pastes morning pages text        │
│ - Selects Gemini model variant          │
│ - Clicks "Analyze"                      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ UI State: analyzing                     │
│ - Loading spinner displayed             │
│ - Request in flight to Gemini           │
└─────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────┐
│ Gemini Analysis (Phase 1)                               │
│ - Sends system prompt (Jungian analyst)                 │
│ - User's journal text                                   │
│ - Returns: [Analysis] + ---IMAGE PROMPT--- + [Prompt]   │
└──────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ UI State: text-ready                    │
│ - Analysis text displayed immediately   │
│ - Image loading spinner appears         │
│ - User can read analysis while waiting  │
└─────────────────────────────────────────┘
    ↓ (parallel)
┌──────────────────────────────────────────────────────────┐
│ Image Generation (Phase 2)                              │
│ - Resolves one provider for the complete attempt        │
│ - Mock: loads four local fixtures                       │
│ - Midjourney: Discord flow + 2x2 grid splitting         │
│ - BFL: four parallel jobs + polling + immediate download│
│ - Uploads exactly 4 images to Supabase storage          │
└──────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ UI State: complete                      │
│ - 4 images rendered in grid             │
│ - Analysis + images visible together    │
└─────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────┐
│ Save to History                                         │
│ - Creates row in Supabase `analyses` table              │
│ - Stores: text input, analysis, image prompt, model used│
│ - Links to stored image paths                           │
│ - History sidebar updated                               │
└──────────────────────────────────────────────────────────┘
```

---

## Code Architecture

### Pages & Components
- **`app/app/page.tsx`**: Main orchestrator. Manages UI state machine, coordinates API calls.
- **`components/JournalInput`**: Text input + Analyze button.
- **`components/ModelPicker`**: Dropdown for selecting Gemini model variant.
- **`components/AnalysisPanel`**: Displays structured analysis text.
- **`components/ImageGrid`**: Shows 4 images in 2x2 layout.
- **`components/HistorySidebar`**: Lists past analyses for quick access.

### Server-Side Logic
- **`app/actions.ts`**: Server actions for orchestrating Gemini → image generation → storage.
  - `analyzeText(journalText, modelId)`: Calls Gemini, returns analysis + image prompt.
  - `generateImages(imagePrompt)`: Triggers Discord/Midjourney flow, returns image URLs.
  - `saveAnalysis(...)`: Persists analysis and image metadata to Supabase.

### Core Libraries
- **`lib/gemini.ts`**:
  - `getSystemPrompt()`: Loads Jungian analyst prompt from `docs/prompt.md`.
  - `analyzeWithGemini(journalText, modelId)`: Calls Gemini API, parses response.
  - `parseResponse(response)`: Splits on `---IMAGE PROMPT---` delimiter.

- **`lib/image-providers/registry.ts`**: Strictly resolves one provider per attempt.
- **`lib/image-providers/black-forest-labs.ts`**: Submits four FLUX.2 jobs, polls their provider-owned URLs, downloads ready images immediately, and returns data URLs.
- **`lib/image-providers/midjourney.ts`**: Adapter around the existing Discord implementation.
- **`lib/image-providers/mock.ts`**: Adapter around the local four-image fixtures.
- **`lib/discord/trigger.ts`**: Sends `/imagine` via the legacy Midjourney path.
- **`lib/discord/listener.ts`**: Listens for Midjourney completion via Discord bot token.
- **`lib/image-splitter.ts`**: Uses Sharp to split 2x2 grid into 4 quadrants.
- **`lib/analytics-storage.ts`**: Supabase client for reading history.
- **`lib/analytics-storage-client.ts`**: Supabase anon client for browser reads.
- **`lib/memory-ai.ts`**: Structured Gemini relevance selection and block-ID memory-update inference.
- **`lib/memory-service.ts`**: User-scoped selection and post-save update orchestration.
- **`lib/memory-source-blocks.ts`**: Deterministic exact-text journal segmentation and block-ID evidence resolution.
- **`lib/memory-storage.ts`**: Consolidated memory, evidence, reset, and newest-entry persistence operations.
- **`lib/memory-rebuild.ts`**: Test-only bounded sequential rebuild orchestration.

---

## Contextual Memory Flow

```text
Original journal entry + compact memory catalog
                    ↓
          AI relevance selector
                    ↓
      Server validates IDs and applies
         maximum 5 / 150-word bound
                    ↓
       Persona analysis + image prompt
                    ↓
       Image generation and History save
                    ↓
 Server creates exact blocks b1, b2, ...
                    ↓
 Gemini returns separate creates and updates
      referencing one evidence block ID each
                    ↓
 Server resolves IDs to exact original evidence
```

Memories are persona-independent and active in Quiet, Insight, and Test views.
The Test-only diagnostic drawer displays the complete read-only store, dated
evidence, confidence, temporal state, and the memory snapshot used by a saved
analysis. It also provides reset, newest-N rebuild (default 7), and ephemeral
blind memory-on/off comparison controls.

All source blocks for one journal entry are sent together in one memory inference
call. Entries remain separate calls. Gemini never reproduces evidence quotations;
it selects a block ID, which the server validates and resolves to exact source
text before persistence.

Rebuild selects the newest N entries first, then replays only that window
oldest-to-newest so the newest evidence is applied last. An entry-local failure
is skipped rather than stopping the run. Progress distinguishes attempted,
succeeded, and skipped entries, and the drawer retains a journal-text-free bug
report with the model, entry date, analysis ID, failure category, and safe
diagnostic message. The initial selector uses the compact consolidated catalog
directly; semantic/vector pre-filtering is deferred until catalog growth
demonstrates a need.

---

## System Prompt & Analysis Structure

**File:** `docs/prompt.md`

The current prompt instructs Gemini to adopt a **Jungian analyst** persona and produce three sections:

1. **Reflective Analysis** (2-3 sentences + Key Word)
   - Identifies emotional/spiritual undercurrent
   - Distills to a single theme word

2. **Left-Field Insight** (unexpected observation)
   - Spiritually provocative question or reframe

3. **Follow-Up Prompt** (reflective question)
   - Suggests next step for user contemplation

4. **Image Prompt** (after `---IMAGE PROMPT---` delimiter)
   - Rich, artistic description for Midjourney
   - Incorporates symbolic elements (alchemical, sacred geometry)
   - Specifies artistic style (watercolor, oil, etc.)
   - Never photographic

---

## Environment & Configuration

**Key ENV variables for flow:**
- `GEMINI_API_KEY`: Enables real Gemini analysis
- `IMAGE_GENERATION_PROVIDER`: Server-side deployment default: `mock`, `midjourney`, or `black-forest-labs`
- `BLACK_FOREST_LABS_API_KEY`: Server-only BFL credential
- `BLACK_FOREST_LABS_MODEL`: Pinned BFL model; defaults to `flux-2-pro`
- `DISCORD_USER_TOKEN`, `DISCORD_BOT_TOKEN`: Enable Midjourney generation
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Enable history storage
- `USE_AI_MOCKS=true`: Bypasses Gemini + Discord, uses mock responses
- `NEXT_PUBLIC_TEST_VIEW_ENABLED`: Optional build-time visibility for Test view; false hides Test diagnostics while memory continues in other views
- `NEXT_PUBLIC_IMAGE_PROVIDER=mock`: Uses local images from `app/public/mock-images`

`NEXT_PUBLIC_IMAGE_PROVIDER` remains a compatibility fallback only. In Test view, a provider menu is visible only when `NEXT_PUBLIC_IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED=true`; the server independently requires `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED=true` before accepting that override.

---

## Data Model

### `analyses` table (Supabase)
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | User (not currently used) |
| input_text | TEXT | Original journal text |
| analysis_text | TEXT | Gemini's structured analysis |
| image_prompt | TEXT | Image prompt sent to Midjourney |
| model_id | TEXT | Which Gemini model was used |
| image_paths | JSONB | Array of storage paths for 4 quadrant images |
| created_at | TIMESTAMP | When analysis was created |
| memory_context | JSONB | Immutable IDs, versions, titles, and summaries supplied to the analysis |

### `memories` table (Supabase)

Stores consolidated, user-scoped summaries with retrieval terms, confidence,
significance, temporal state, version, and first/last observation dates.

### `memory_evidence` table (Supabase)

Stores dated exact source blocks from original journal entries. Evidence supports
inspection and future features but is never injected into daily analysis context.

### `analysis-images` storage bucket
Stores 4 image files per analysis:
- `{analysisId}/1.png`, `{analysisId}/2.png`, `{analysisId}/3.png`, `{analysisId}/4.png`

---

## Model Selection

Currently, the system supports **multiple Gemini model variants** via the ModelPicker dropdown:
- User selects a model variant in the header
- Model ID is passed through `analyzeText()` → `analyzeWithGemini()`
- Same system prompt is used regardless of model
- Model preference is stored in analysis history

This precedent is important for the multi-persona feature: we already have a "picking" pattern in the UI.
