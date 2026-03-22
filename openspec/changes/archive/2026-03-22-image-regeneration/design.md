## Context

Currently, image generation is a one-shot operation: the `generateImages` server action creates a new UUID (`analysisId`), generates 4 images, uploads them to `{analysisId}/0-3.jpg`, and `saveAnalysis` writes the paths to the `image_paths` JSONB column. There is no mechanism to add more images after the initial save.

The UI state machine (`page.tsx`) transitions from `text-ready` → `complete` and then is done. Historical views load images from the `image_paths` array as-is.

Key constraint: Midjourney always produces a 2×2 grid that Sharp splits into exactly 4 images per generation round.

## Goals / Non-Goals

**Goals:**
- Allow users to regenerate images for any analysis (fresh or historical) using the stored `image_prompt`
- Accumulate images across regeneration rounds (4 → 8 → 12 → ... up to cap)
- Enforce a per-analysis image cap of 20 (5 rounds)
- Keep the existing first-generation flow unchanged — regeneration is additive

**Non-Goals:**
- Editing the image prompt before regeneration (explicitly deferred)
- Deleting individual images or specific rounds
- Changing the Midjourney pipeline itself (timeout, retry logic, etc.)
- Supporting different image counts per round (always 4)

## Decisions

### 1. Storage path indexing: continue sequential numbering

New images use indices continuing from the current count: if an analysis has 8 images (`0.jpg`–`7.jpg`), the next round uploads `8.jpg`–`11.jpg`.

**Why:** Simple, avoids collision, no need for batch/round grouping in the path structure. The existing `uploadImagesToStorage` already uses index-based naming — we just need to pass a `startIndex` offset.

**Alternative considered:** Nested folders per round (`{analysisId}/round-2/0.jpg`). Rejected because it complicates path resolution and the client doesn't need to know about rounds.

### 2. Database update: append to `image_paths` array

A new server action `regenerateImages` will:
1. Call `generateImages` pipeline (same as today, but with the existing `analysisId`)
2. Upload new images starting at `startIndex = currentImagePaths.length`
3. Update the `analyses` row: append new paths to the existing `image_paths` JSONB array

**Why:** The existing `image_paths` is already a JSONB array. PostgreSQL's `||` operator or `array_cat` can append. This avoids schema changes.

**Alternative considered:** Separate `image_batches` table. Rejected — over-engineered for this use case.

### 3. Cap enforcement: server-side check before generation

The server action checks `currentImagePaths.length + 4 > MAX_IMAGES` before triggering Midjourney. If the cap would be exceeded, return an error immediately (don't waste a Midjourney generation).

`MAX_IMAGES = 20` (5 rounds of 4). This is a constant in the server action, not user-configurable.

**Why:** Server-side enforcement prevents wasted API calls. The cap protects storage costs and keeps the UI manageable.

### 4. New server action: `regenerateImages`

Rather than modifying the existing `generateImages` (which serves the initial flow), create a new `regenerateImages(analysisId, userId)` server action that:
1. Fetches the existing analysis record (gets `image_prompt`, `image_paths`)
2. Validates: user owns the analysis, cap not exceeded, `image_prompt` exists
3. Calls the same Midjourney/mock pipeline
4. Uploads with `startIndex` offset
5. Updates `image_paths` in the database (append)
6. Returns new image URLs + updated paths

**Why:** Keeps the initial flow clean. The regeneration action has different inputs (analysisId instead of imagePrompt) and different DB operation (UPDATE instead of INSERT).

### 5. UI: "Regenerate Images" button below the image grid

- Visible in `complete` state and `viewing-history` state when `image_prompt` exists
- Disabled (with tooltip) when cap is reached
- While regenerating: show a loading spinner below existing images (existing images remain visible)
- On success: new images append to the grid, lightbox index range extends
- On failure: toast error, existing images unaffected

**Why:** Non-destructive UX. Users keep seeing what they have while waiting for more.

### 6. ImageGrid: adapt to variable image counts

The current 2-column grid works fine for any multiple of 2. With 4, 8, 12, 16, or 20 images it will lay out naturally. No grid layout changes needed — just pass more URLs.

## Risks / Trade-offs

- **Storage cost growth** → Mitigated by 20-image cap. At ~200KB per JPEG quadrant, max ~4MB per analysis.
- **Midjourney rate limiting** → Same risk as initial generation; no new mitigation needed. User-initiated so frequency is naturally limited.
- **Race condition on concurrent regeneration** → If user clicks regenerate twice quickly, two rounds could race to append. Mitigated by disabling the button while regeneration is in progress (UI-level guard). Server-side, the JSONB append is atomic per UPDATE.
- **Historical analyses without image_prompt** → Some old analyses may have `null` image_prompt. Regenerate button simply won't appear for these.
