# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Morning Analytics: AI-powered psychoanalytic insights and symbolic imagery from morning pages journaling. Users paste morning pages text, receive psychoanalytic-style analysis (~2s), then view 4 AI-generated artistic images. Designed for "Morning Pages" practitioners from "The Artist's Way".

## Development Commands

All npm commands run from the `/app` directory:

```bash
cd app
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

Validation scripts (run from `/validation`):
```bash
cd validation
npm run test-prompt      # Test Gemini prompt
npm run test-discord     # Test Discord connection
npm run test-midjourney  # Test Midjourney integration
```

Set `USE_MOCKS=true` in `/app/.env.local` for testing without API calls.

## Common Development Tasks

### Adding a New Analyst Persona

1. Create new prompt file: `/prompts/{new-persona}.md`
2. Add system instruction (e.g., tone, analysis approach, format)
3. Update `AnalystPicker.tsx` component:
   ```tsx
   const PERSONAS = [
     // ... existing personas
     { value: "new-persona", label: "New Persona", description: "..." }
   ];
   ```
4. Verify it appears in dropdown when app runs

### Adding a New Gemini Model

1. Update `lib/models.ts`:
   ```tsx
   const GEMINI_MODELS = [
     // ... existing models
     { id: "gemini-new-model", displayName: "New Model", description: "..." }
   ];
   ```
2. Update `ModelPicker.tsx` if needed
3. Test via `analyzeText()` with the new model ID

### Modifying Analysis Pipeline

**Text analysis flow** (Gemini response):
- File: `/app/lib/gemini.ts`
- Look for `---IMAGE PROMPT---` delimiter (hardcoded, used to split response)
- If you change Gemini's response format, update the split logic in `app/app/actions.ts`

**Image generation flow** (Discord/Midjourney):
- Trigger: `/app/lib/discord/trigger.ts`
- Listener: `/app/lib/discord/listener.ts` (watch for `messageUpdate` events)
- If Discord API changes, may need to update interaction payload structure

**Markdown rendering**:
- Component: `/app/components/AnalysisPanel.tsx`
- Uses `react-markdown` library
- `allowedElements` restricts which HTML tags are rendered (h1-h3, strong, em, lists, links only)
- Update custom component styles in `components` prop if styling changes needed

### Debugging Image Generation Failures

When images don't generate (common issues):

1. **Check Discord bot connection** (`lib/discord/listener.ts`):
   - Bot must be online in Discord
   - Bot must have permissions in the channel (read messages, embed links)
   - Verify guild ID and channel ID match Discord server

2. **Check Midjourney interaction payload** (`lib/discord/trigger.ts`):
   - Verify app ID, command ID, guild ID, channel ID are correct
   - Check interaction data structure matches Discord API v9

3. **Check image download** (`lib/image-splitter.ts`):
   - Verify image URL is accessible (Discord CDN sometimes rate-limits)
   - Check Sharp can process the image format

4. **Check Supabase upload** (`lib/analytics-storage.ts`):
   - Verify bucket exists and is public
   - Check service role key has upload permissions
   - Watch for quota limits on storage

### Testing Without External APIs

```bash
# Use mock mode (no API calls needed)
USE_AI_MOCKS=true npm run dev
```

Mock responses:
- Gemini returns sample analysis text
- Image generation loads local mock images from `/app/public/mock-images/`
- Everything uploads to real Supabase (good for testing storage flow)

### Changing Storage Paths

Current pattern: `{analysisId}/{index}.jpg`

To change:
1. Update path construction in `lib/analytics-storage.ts` (uploadImagesToStorage function)
2. Update path reading in `lib/analytics-storage-client.ts` (getPublicUrl conversion)
3. No database schema changes needed (paths stored as strings/JSON)

### Adding a New Component

1. Create file: `/app/components/NewComponent.tsx`
2. Follow existing pattern (props interface, export named component)
3. Use Tailwind CSS for styling (no CSS modules)
4. Import in `/app/app/page.tsx` or parent component

### Modifying Supabase Schema

1. Create migration file: `/supabase/migrations/{timestamp}_{description}.sql`
2. Write DDL (ALTER TABLE, CREATE COLUMN, etc.)
3. Push to Supabase via `supabase db push` (if CLI installed)
4. Or apply manually in Supabase SQL editor
5. Update TypeScript types in `lib/supabase.ts` if needed

### Exporting History

Users might request export functionality. Current approach:
- History stored in `analyses` table (accessible via Supabase)
- Images stored in S3 bucket
- Manual export would need to:
  1. Query `listAnalyses()` to get all records
  2. For each record, call `getAnalysisById(id)` to get full data + image URLs
  3. Download images from URLs
  4. Package into JSON/ZIP export

## Database Queries & RLS (Future Multi-User)

Current state (all queries accessible):
```sql
SELECT * FROM analyses;  -- Returns ALL analyses (anon client)
```

Future state (with RLS enabled):
```sql
SELECT * FROM analyses WHERE user_id = auth.uid();  -- Returns only current user's analyses
INSERT INTO analyses (...) VALUES (...);  -- Sets user_id automatically to auth.uid()
```

No code changes needed when RLS is enabled; just requires:
1. Create auth system (JWT, OAuth, etc.)
2. Enable RLS policy on `analyses` table
3. Supabase handles enforcement automatically

## Performance Notes

- **Text analysis**: ~2 seconds (Gemini API latency)
- **Image generation**: ~60-90 seconds (Midjourney processing)
- **Image upload**: ~1-2 seconds for 4 images
- **Total flow**: ~65-95 seconds from input to complete

Bottleneck: Midjourney generation time (unavoidable, external service)

Optimization opportunities:
- Cache Gemini responses (not currently done)
- Parallel image uploads (currently sequential)
- Lazy-load history (currently loads all on demand)
- Preload persona prompts (currently loaded per request)

## Architecture

### High-Level Flow

Morning Analytics is a two-phase processing system designed for minimal wait time:

```
USER INPUT (morning pages text)
    ↓
Phase 1: Text Analysis (~2 seconds)
├─ Gemini analyzes text using selected model + analyst persona
├─ Returns: [Analysis] + ---IMAGE PROMPT--- + [Prompt for images]
└─ Display analysis immediately (text-ready state)
    ↓
Phase 2: Image Generation (~60-90 seconds, parallel)
├─ Discord user token sends /imagine to Midjourney
├─ Discord bot token listens for completion message
├─ Downloads 2×2 grid, Sharp library splits into 4 quadrants
├─ Uploads quadrants to Supabase S3 storage
└─ Display 4 images in 2×2 grid (complete state)
    ↓
Phase 3: Persistence (background)
├─ Saves all data to Supabase `analyses` table
└─ History sidebar auto-refreshes
```

Users see analysis text within ~2 seconds, images load while they read.

### Directory Structure

```
/app/
├─ app/                          # Next.js App Router
│  ├─ page.tsx                  # Main UI orchestrator, state machine
│  ├─ layout.tsx                # Root layout
│  └─ actions.ts                # Server actions (3 main ones: analyzeText, generateImages, saveAnalysis)
├─ components/                   # React components
│  ├─ JournalInput.tsx          # Text input + Analyze button
│  ├─ ModelPicker.tsx           # Gemini model dropdown (persisted to localStorage)
│  ├─ AnalystPicker.tsx         # Analyst persona dropdown (jungian, mel-robbins, loving-parent)
│  ├─ AnalysisPanel.tsx         # Renders markdown analysis text (uses react-markdown)
│  ├─ ImageGrid.tsx             # 2×2 grid, clickable for lightbox
│  ├─ Lightbox.tsx              # Full-screen image viewer
│  ├─ HistorySidebar.tsx        # Lists past analyses, "New Analysis" button
│  ├─ LoadingState.tsx          # Spinner + message
│  └─ ErrorState.tsx            # Error message + retry button
├─ lib/                          # Utility libraries
│  ├─ supabase.ts               # Supabase client (server + browser instances)
│  ├─ gemini.ts                 # Gemini API client, loads persona prompts from disk
│  ├─ analytics-storage.ts      # Supabase storage upload (base64 → JPEG) + DB insert
│  ├─ analytics-storage-client.ts # Supabase anon client reads (converts paths → public URLs)
│  ├─ image-splitter.ts         # Sharp: download Discord grid → extract 4 quadrants as base64
│  ├─ models.ts                 # Gemini model definitions
│  └─ discord/
│     ├─ trigger.ts             # Discord user token: POST /imagine to Discord API
│     └─ listener.ts            # Discord bot token: listen for Midjourney responses
└─ public/mock-images/          # 4 local JPEG/PNG files for mock testing

/supabase/
└─ migrations/
   └─ 20250214110300_add_analyst_persona_column.sql

/prompts/
├─ jungian.md                   # Jungian analyst system prompt (psychoanalytic depth)
├─ mel-robbins.md               # Mel Robbins system prompt (action-oriented)
└─ loving-parent.md             # Loving parent system prompt (compassionate)

/scripts/
└─ cleanup-history.js           # Admin CLI: delete old analyses + their images
```

### UI State Machine

```
idle (ready for input)
  ↓ [user clicks Analyze]
analyzing (Gemini request in flight, spinner shown)
  ↓ [Gemini returns]
text-ready (analysis displayed, images loading spinner shown)
  ↓ [parallel image generation] [images received]
complete (4 images displayed)
  ↓ [auto-save to Supabase]
✓ (idle ready for next analysis)

ERROR can occur at any phase:
  ├─ Gemini failure → Retry button, return to idle
  ├─ Image generation failure → Analysis saved but no images, Retry button
  └─ Save failure → Non-blocking toast, user can continue
```

### Three Server Actions (in `/app/app/actions.ts`)

**analyzeText(journalText, modelId?, persona?)**
- Calls Gemini API with selected model + persona
- Persona determines system instruction (loaded from `/prompts/{persona}.md`)
- Returns: `{ success, analysisText, imagePrompt, error? }`
- If `imagePrompt` is null (analysis doesn't warrant images), image generation skipped

**generateImages(imagePrompt)**
- **Mock mode** (`NEXT_PUBLIC_IMAGE_PROVIDER=mock`): Reads 4 local images from `/app/public/mock-images/`
- **Real mode**: Discord user token → Midjourney → Discord bot listens → Download grid → Sharp splits → Upload to S3
- Returns: `{ success, imageUrls: base64[], imagePaths: storagePaths[], analysisId, error? }`
- `imageUrls` are base64 data URLs for immediate display
- `imagePaths` are storage paths (e.g., `550e8400-123/0.jpg`) for DB storage

**saveAnalysis(inputText, analysisText, imagePrompt, modelId, imagePaths, analysisId?, persona?)**
- Inserts row into `analyses` table with all metadata
- Returns: `{ success, id, error? }`

### Image Pipeline

```
Mock Images:
  /app/public/mock-images/ → Read as base64

Midjourney Pipeline:
  triggerImagine(prompt)
    ↓ [Discord user token]
    Midjourney bot processes (60-90s)
    ↓
  waitForImages(nonce)
    ↓ [Discord bot token listener]
    Message from Midjourney bot received
    ↓
  extractImageUrls()
    Download from Discord CDN
    ↓
  splitGridImage() with Sharp library
    Download 2×2 grid → Extract 4 quadrants → Convert to JPEG (90% quality)
    ↓ [base64]
  uploadImagesToStorage()
    Convert base64 → buffer → Upload to Supabase bucket `analysis-images`
    Path: `{analysisId}/{index}.jpg`
    ↓ [storage paths]
  saveAnalysis()
    Insert paths into `analyses` table
```

Storage paths (persisted): `550e8400-e29b-41d4/0.jpg`
Public URLs (client-side only): `https://kjfzaflmpaqldrxkfija.supabase.co/storage/v1/object/public/analysis-images/550e8400-e29b-41d4/0.jpg`

### Database Schema

**`analyses` Table (PostgreSQL):**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key (auto-generated by Supabase) |
| `created_at` | TIMESTAMP | When analysis was created |
| `input_text` | TEXT | Original morning pages text |
| `analysis_text` | TEXT | Gemini's analysis output |
| `image_prompt` | TEXT | Prompt sent to Midjourney (nullable) |
| `model_id` | TEXT | Gemini model used (e.g., "gemini-3-pro-preview") |
| `image_paths` | JSONB | Array of storage paths: `["id/0.jpg", "id/1.jpg", "id/2.jpg", "id/3.jpg"]` (nullable) |
| `analyst_persona` | TEXT | Selected persona ("jungian", "mel-robbins", "loving-parent") (nullable) |
| `user_id` | UUID | Reserved for multi-user support (currently null for all) |

**Storage Bucket: `analysis-images`**
- Public read access enabled
- Objects: `{analysisId}/{index}.jpg` (e.g., `550e8400-e29b-41d4/0.jpg`)

### Model & Persona Selection

**Gemini Models** (defined in `lib/models.ts`):
- `gemini-3-pro-preview` (default) - Deepest reasoning, slowest
- `gemini-2.5-pro` - High-end reasoning, balanced
- `gemini-2.5-flash` - Balanced quality, fastest

Model choice persisted to browser localStorage by ModelPicker component.

**Analyst Personas** (system instructions in `/prompts/{persona}.md`):
- **Jungian**: Psychoanalytic depth, symbols, spiritual insights
- **Mel Robbins**: Action-oriented, bold moves, practical steps
- **Loving Parent**: Compassionate, empathetic support, nurturing

Persona determines which system prompt is loaded and sent to Gemini.

### Discord Two-Token Strategy

Why two tokens?
- **User Token**: Reddit-style account. POST to Discord API to trigger `/imagine`. Limited API access by design.
- **Bot Token**: Discord bot account. Listen via Discord.js for Midjourney bot's responses. Full event access.

Why not official Midjourney API?
- Midjourney doesn't expose public API (would need partnership/licensing)
- Discord integration is the accessible workaround

### Authentication & Multi-User Design

**Current (Single-User)**:
- No authentication implemented
- All users share all analyses (demo/prototype mode)
- Anon Supabase client used for reads (no restrictions)
- Service role key used for writes (server-side, bypasses RLS)

**Future (Multi-User Ready)**:
- Add auth framework (JWT, OAuth, etc.)
- Enable RLS policies: `SELECT/INSERT WHERE user_id = auth.uid()`
- Anon client + RLS will enforce user isolation automatically
- No code changes needed; infrastructure already supports it

### State Management

**Client-side:**
- Main page state via `useState()` in `/app/app/page.tsx` (no Redux)
- Model selection persisted to localStorage
- Persona selection stored in React state only
- History list fetched client-side on demand

**Server-side:**
- Server actions are stateless (called per request)
- Discord bot client is singleton (initialized once, reused)
- Gemini persona prompts cached at module level

### Complete Request/Response Cycle Example

User pastes "I felt stuck today..." and clicks Analyze with model=gemini-3-pro-preview, persona=jungian:

1. **Client → Server**: `analyzeText("I felt stuck today...", "gemini-3-pro-preview", "jungian")`
2. **Server**: Load `/prompts/jungian.md` system instruction
3. **Server**: Call Gemini API with both model and system instruction
4. **Gemini Response**: `"<analysis about Jung archetypes>...\n---IMAGE PROMPT---\n<surreal imagery prompt>"`
5. **Server**: Split on `---IMAGE PROMPT---` delimiter
6. **Client**: Display analysis text (text-ready state)
7. **Client → Server**: `generateImages("<surreal imagery prompt>")`
8. **Server**:
   - Generate unique analysisId (UUID)
   - Trigger Midjourney via Discord user token (nonce-based)
   - Listen for Midjourney response via Discord bot token (120s timeout)
   - Download 2×2 grid image
   - Use Sharp to extract 4 quadrants
   - Upload each quadrant to Supabase storage
   - Return base64 URLs for display + storage paths
9. **Client**: Display 4 images (complete state)
10. **Client → Server**: `saveAnalysis(input, analysis, imagePrompt, modelId, imagePaths, analysisId, persona)`
11. **Server**: Insert into `analyses` table
12. **Client**: Auto-refresh history sidebar
13. **History Sidebar**: Queries `listAnalyses()`, displays new entry at top

Total time: ~2s (analysis) + ~60-90s (images) = ~65-95s from input to complete

## Environment Variables

All required configuration lives in `/app/.env.local` (not committed to repo).

### Gemini (Text Analysis)

```
GEMINI_API_KEY=...              # Required for real: Google Generative AI key
GEMINI_MODEL=...                # Optional: Override default model (default: gemini-3-pro-preview)
USE_AI_MOCKS=true/false         # Optional: Skip Gemini, use mock response (good for testing UI)
```

### Discord / Midjourney (Image Generation)

```
DISCORD_BOT_TOKEN=...           # Required for real: Bot token for listening to Midjourney responses
DISCORD_USER_TOKEN=...          # Required for real: User token for triggering /imagine command
DISCORD_GUILD_ID=...            # Required for real: Server ID where /imagine is triggered
DISCORD_CHANNEL_ID=...          # Required for real: Channel ID to watch for Midjourney images
MIDJOURNEY_APP_ID=...           # Optional: Midjourney app ID (default: 936929561302675456)
MIDJOURNEY_IMAGINE_COMMAND_ID=...  # Optional: /imagine command ID (default: 938956540159881230)
NEXT_PUBLIC_IMAGE_PROVIDER=mock/midjourney  # Optional: Use local mock images or real Midjourney
DEBUG_DISCORD=true              # Optional: Verbose Discord/Midjourney listener logging
```

### Supabase (History Storage & Images)

```
NEXT_PUBLIC_SUPABASE_URL=...           # Required: Supabase project URL (exposed to browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # Required: Anon key for client reads (exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=...          # Required: Service role key for server writes (secret)
```

### Testing Modes

**Mock-only testing** (no API keys needed except Supabase):
```
USE_AI_MOCKS=true
NEXT_PUBLIC_IMAGE_PROVIDER=mock
```

**Development with real Gemini but mock images**:
```
GEMINI_API_KEY=...
NEXT_PUBLIC_IMAGE_PROVIDER=mock
USE_AI_MOCKS=false
```

**Full real integration** (requires all keys):
```
GEMINI_API_KEY=...
DISCORD_BOT_TOKEN=...
DISCORD_USER_TOKEN=...
DISCORD_GUILD_ID=...
DISCORD_CHANNEL_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_IMAGE_PROVIDER=midjourney
```

## External Services & APIs

### Google Generative AI (Gemini)

- **Endpoint**: `https://generativelanguage.googleapis.com/`
- **Key requirement**: `GEMINI_API_KEY` (from Google Cloud console)
- **Models available**:
  - `gemini-3-pro-preview` - Highest quality, ~1-2s response time
  - `gemini-2.5-pro` - Good quality, ~1-2s response time
  - `gemini-2.5-flash` - Balanced, ~0.5-1s response time
- **Rate limits**: Depends on API key tier, usually sufficient for demo use
- **Cost**: Free tier available for testing (up to quota limits)
- **Integration**: Via `@google/generative-ai` npm package
- **Implementation**: `/app/lib/gemini.ts` loads persona system prompt, sends journalText to selected model

### Discord & Midjourney

**Discord API:**
- **Endpoint**: `https://discord.com/api/v9/`
- **Authentication**: User token (triggers `/imagine`) + Bot token (listens for responses)
- **Integration**: Via `discord.js` npm package for listener, direct HTTP POST for trigger
- **Why two tokens**: User token POSTs to API (limited), bot token uses websocket events (full access)

**Midjourney:**
- **No direct API**: Integrates via Discord bot interface
- **Workflow**: Trigger `/imagine` → Midjourney bot processes → Listens for response message → Downloads grid image
- **Processing time**: 60-90 seconds typically
- **Limitation**: Rate limited by Midjourney (respects user subscription tier)

**Implementation**:
- Trigger: `/app/lib/discord/trigger.ts` - POSTs to Discord interactions API
- Listener: `/app/lib/discord/listener.ts` - Discord.js bot listens for `messageUpdate` events
- Timeout: 120 seconds (Midjourney typically completes in 60-90s)

### Supabase (PostgreSQL + S3 Storage)

**Database (PostgreSQL)**:
- **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
- **Anon key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side, respects RLS)
- **Service key**: `SUPABASE_SERVICE_ROLE_KEY` (server-side, bypasses RLS)
- **Table**: `analyses` (history of all past analyses)
- **Connection**: Via `@supabase/supabase-js` npm package

**Storage (S3-compatible)**:
- **Bucket**: `analysis-images`
- **Public access**: Enabled (required for client to fetch image URLs)
- **Path pattern**: `{analysisId}/{index}.jpg`
- **Implementation**: Upload in `/app/lib/analytics-storage.ts`, read in `/app/lib/analytics-storage-client.ts`

### Image Processing (Sharp)

- **Library**: `sharp` npm package (Node.js image library)
- **Purpose**: Download Discord grid image, extract 4 quadrants
- **Input**: JPEG/PNG from Discord CDN
- **Process**:
  1. Fetch image dimensions
  2. Calculate half-width, half-height
  3. Extract 4 regions (top-left, top-right, bottom-left, bottom-right)
  4. Convert each to JPEG (90% quality)
  5. Encode as base64 data URLs
- **Output**: 4 base64 JPEG data URLs
- **Implementation**: `/app/lib/image-splitter.ts`

## Error Handling & Resilience

### Graceful Degradation

**Phase 1 (Text Analysis)**: Blocking
- If Gemini fails → Error state, "Retry" button, return to idle
- User input not saved

**Phase 2 (Image Generation)**: Non-blocking
- If Midjourney fails or times out → User sees analysis, image error message
- Analysis already saved without images
- User can continue to next analysis

**Phase 3 (Save to History)**: Non-blocking
- If Supabase save fails → Toast error message (bottom right, non-blocking)
- Images already uploaded to S3
- User can continue; save can be retried without losing uploaded images

**Partial Failures**: Accepted
- If 2 of 4 images fail to upload → Saves with 2 images instead of failing
- If database insert fails but images uploaded → Images exist in S3 (can be deleted manually via admin cleanup)

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Missing required env var" | `.env.local` incomplete or wrong path | Copy `.env.example` → `.env.local`, fill in secrets |
| Gemini returns empty response | Model overloaded or API key invalid | Check GEMINI_API_KEY validity, try different model |
| Midjourney timeout (120s) | Image generation taking too long or Discord bot not connected | Check Discord bot is online, Midjourney has capacity, try again |
| Images don't appear after generation | Upload to Supabase failed | Check SUPABASE_SERVICE_ROLE_KEY, bucket permissions, storage quota |
| History doesn't refresh | listAnalyses() query failed | Check NEXT_PUBLIC_SUPABASE_ANON_KEY, table exists |
| Images show 403 Forbidden | Public read access not enabled on bucket | Enable public read on `analysis-images` bucket in Supabase UI |
| Script cleanup-history.js fails | Dependencies not installed | Run `npm install` at project root |

### Debugging

**Enable verbose Discord logging:**
```bash
DEBUG_DISCORD=true npm run dev
```
Shows Discord bot connection, message events, Midjourney bot detection

**Use mock mode for fast iteration:**
```bash
USE_AI_MOCKS=true npm run dev
```
Skips Gemini API calls, uses mock responses. 2-second total time instead of 65-95s.

**Check Supabase storage:**
1. Open Supabase dashboard
2. Storage → `analysis-images` bucket
3. Verify images are being uploaded (folders for each analysisId)
4. Check bucket policies: Editor → Public access should be ON

**Inspect network requests:**
1. Browser DevTools → Network tab
2. Watch for `/api/analyze`, `/api/generate-images`, `/api/save-analysis` (if API routes) or see server action responses
3. Check response status codes and error messages

**Check Discord bot status:**
1. In Discord, right-click bot name → View Profile
2. Should show "Online" status
3. If offline, bot.login() failed in listener.ts (check token validity)

This project uses OpenSpec for structured change management. Feature specs live in `/openspec/specs/`. Use the OpenSpec skills (`/opsx:new`, `/opsx:continue`, `/opsx:apply`, etc.) for creating and implementing changes.

**After archiving a change with `/opsx:archive`, commit the archived artifacts:**
```bash
git add openspec/changes/archive/
git commit -m "Archive: [change-name] - completed and verified"
git push origin main
```
