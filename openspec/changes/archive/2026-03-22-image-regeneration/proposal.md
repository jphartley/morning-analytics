## Why

Image generation via Midjourney can time out (~120s limit) or produce results the user isn't satisfied with. Currently there's no way to retry — the user must start an entirely new analysis. This wastes the already-completed text analysis and forces re-entry of the same journal text.

## What Changes

- Add a "Regenerate Images" button visible when images are displayed (or when image generation failed/timed out)
- Regeneration reuses the original image prompt from the analysis — no prompt editing
- New images accumulate alongside previous sets rather than replacing them (e.g., 4 → 8 → 12)
- Cap total images per analysis (suggested: 20, i.e. 5 regeneration rounds) to prevent runaway storage
- Update the database schema to store accumulated image paths across regeneration rounds
- Update the image grid UI to display all accumulated images
- Regeneration available both during a fresh analysis and when viewing history

## Capabilities

### New Capabilities
- `image-regeneration`: Regenerate images for an existing analysis using the stored image prompt, accumulating new images alongside existing ones with a configurable cap

### Modified Capabilities
- `image-generation`: The image generation pipeline must support appending images to an existing analysis (currently assumes a single batch of 4 per analysis)
- `analysis-storage`: Storage must support updating an existing analysis's `image_paths` array (currently write-once at save time), and storage paths must accommodate multiple batches under the same analysis ID

## Impact

- **Server actions** (`app/actions.ts`): New server action or modification to `generateImages` to support regeneration against an existing analysis ID
- **Database**: `image_paths` JSONB column needs to support growing arrays (UPDATE instead of only INSERT)
- **Storage**: Multiple batches under one analysis ID (e.g., `{analysisId}/0.jpg` through `{analysisId}/19.jpg`)
- **UI components**: `page.tsx` state machine needs a regeneration path; `ImageGrid` needs to handle variable image counts; regeneration button component
- **History view**: Viewing a historical analysis should show all accumulated images and offer regeneration
