## Context

Morning Analytics is currently stateless - each analysis is displayed once and lost on page refresh. The app uses Next.js Server Actions with Gemini for text analysis and Discord/Midjourney for image generation. Images are served from Discord CDN URLs which may expire.

The decision to use Supabase was made based on trade-off analysis (see `docs/research/storage-options.md`). Supabase provides Postgres for structured data, S3-compatible storage for images, and built-in auth for future multi-user support - all in one service with a generous free tier.

## Goals / Non-Goals

**Goals:**
- Persist every analysis automatically after completion
- Store all data: input text, analysis text, 4 images, model identifier, timestamp
- Download and store images durably (not rely on Discord CDN)
- Provide chronological browsing of past analyses
- Same code works in dev and production (no migration needed)
- Prepare for future multi-user support

**Non-Goals:**
- Search or filtering functionality (just chronological browsing)
- Organizing entries by day/week/month (flat list for now)
- User authentication (single-user for now, but schema supports multi-user)
- Offline support
- Export/import functionality

## Decisions

### 1. Database Schema

Single `analyses` table in Supabase Postgres:

```sql
create table analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  input_text text not null,
  analysis_text text not null,
  image_prompt text,
  model_id text not null,
  image_paths text[] -- array of storage paths
);
```

**Rationale:** Flat structure is simplest. `image_paths` stores references to Supabase Storage objects rather than URLs (which would expire). The `user_id` column can be added later when auth is implemented.

### 2. Image Storage Strategy

Store images in Supabase Storage bucket, not in the database:

- Bucket name: `analysis-images`
- Path pattern: `{analysis_id}/{index}.jpg` (e.g., `abc123/0.jpg`)
- Store 4 images per analysis (the quadrants from Midjourney grid)
- Images stored as JPEG blobs, not base64 strings

**Rationale:** Blob storage is cheaper and more efficient than storing base64 in Postgres. Supabase Storage provides signed URLs for retrieval. Path pattern keeps images organized by analysis.

### 3. Save Trigger Timing

Save after images are ready (not after text analysis):

```
analyzeText() → display text → generateImages() → display images → saveAnalysis()
```

**Rationale:** Users expect to see their complete analysis in history. Saving incomplete entries (text without images) would create a degraded experience when browsing history. The 60-90s image generation delay is acceptable since save happens in background after display.

**Alternative considered:** Save text immediately, update with images later. Rejected because it adds complexity (partial records, update logic) for minimal benefit.

### 4. History Browser UI

Left sidebar on the main page showing past analyses:

- **Layout:** Two-column layout with history sidebar on the left, main content (input/analysis) on the right
- **Sidebar content:** Flat list of past entries, sorted reverse chronologically (newest at top)
- **Entry display:** Date and time (e.g., "Feb 13, 10:42 AM"), optionally a short preview snippet
- **Interaction:** Clicking an entry loads that analysis into the main content area
- **Current analysis:** After completing a new analysis, it appears at the top of the sidebar

**Rationale:** Integrated sidebar provides quick access to history without leaving the page. Users can easily compare recent analyses or return to a previous entry. The main page becomes the single hub for both creating and reviewing analyses.

**Alternative considered:** Separate `/history` route. Rejected because it adds navigation friction and separates the "create" and "browse" experiences unnecessarily.

### 5. Supabase Client Architecture

Create a singleton Supabase client in `lib/supabase.ts`:

- Server-side client for Server Actions (using service role key)
- Client-side client for history browsing (using anon key with RLS)
- RLS policies disabled for now (single-user), enabled when auth added

**Rationale:** Separating server/client follows Supabase best practices. Service role key bypasses RLS for writes. Anon key respects RLS for reads (future-proofing).

## Risks / Trade-offs

**Free tier limits** → Monitor usage; 1GB storage supports ~500-700 analyses before upgrade needed. Add logging to track storage consumption.

**Image storage costs at scale** → At ~1.5MB/analysis, 50 users × 30 days = 2.25GB/month. Pro tier ($25/mo) covers this comfortably. Not a concern at current scale.

**No offline support** → Acceptable for web-first MVP. If needed later, can add service worker caching.

**Single point of failure (Supabase)** → Acceptable for hobby project. Postgres and S3-compatible storage are portable if migration needed.

**Save failure doesn't block UI** → Save happens after display, so failures are silent. Add toast notification for save errors so users know to retry.
