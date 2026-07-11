# Current Architecture & Data Flow

## Overview

Morning Analytics follows a two-phase processing model:
1. **Phase 1 (≈2s)**: Gemini analyzes text and generates an image prompt
2. **Phase 2**: The configured image provider returns exactly four normalized images

Results are stored in Supabase for historical browsing.

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
