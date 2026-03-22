## 1. Server-Side: Regeneration Action & Storage

- [x] 1.1 Add `startIndex` parameter to `uploadImagesToStorage` in `lib/analytics-storage.ts` so image indices start from an offset instead of always 0
- [x] 1.2 Add `updateAnalysisImagePaths` function in `lib/analytics-storage.ts` to append new paths to an existing analysis's `image_paths` JSONB array
- [x] 1.3 Create `regenerateImages` server action in `app/actions.ts` that: fetches the existing analysis, validates ownership and cap (MAX_IMAGES=20), calls the image generation pipeline, uploads with startIndex offset, appends paths to DB, returns new image URLs and updated paths

## 2. UI: Regenerate Button & State

- [x] 2.1 Create `RegenerateButton` component with loading/disabled/cap-reached states
- [x] 2.2 Add regeneration state management to `page.tsx`: `isRegenerating` flag, handler that calls `regenerateImages` and appends returned URLs to `imageUrls` state
- [x] 2.3 Show `RegenerateButton` in `complete` state below the image grid when `imagePrompt` is non-null
- [x] 2.4 Show `RegenerateButton` in `viewing-history` state when `historyViewData` has a non-null image prompt (requires fetching `image_prompt` in history data)

## 3. History View: Support Regeneration

- [x] 3.1 Extend `getAnalysisById` response (or `HistoryViewData` type) to include `imagePrompt` so the history view knows whether regeneration is possible
- [x] 3.2 After successful regeneration in history view, refresh the history entry's image list to include newly generated images

## 4. Edge Cases & Polish

- [x] 4.1 Handle initial image generation failure gracefully: when analysis has `image_prompt` but null/empty `image_paths`, show regenerate button as a retry mechanism
- [x] 4.2 Disable regenerate button while regeneration is in progress to prevent concurrent requests
- [x] 4.3 Show toast error on regeneration failure without disrupting existing images
- [x] 4.4 Display cap-reached message when analysis has 20+ images (button disabled with explanatory text)
