## Why

Image generation takes 60-90 seconds while text analysis completes in ~2 seconds. Users currently wait for the entire pipeline to finish before seeing any results. Additionally, Midjourney returns a single 2x2 grid image that's difficult to view, with no way to see individual images at full size.

## What Changes

- Display analysis text immediately when Gemini responds, before images are ready
- Start image generation in the background while text is displayed
- Split the Midjourney 4-in-1 grid image into 4 separate images (slice horizontally and vertically)
- Display each image larger in the grid
- Add click-to-enlarge lightbox for viewing full-size images

## Capabilities

### New Capabilities

- `image-lightbox`: Modal/overlay component for viewing images at full size. Click image to open, click outside or press Escape to close.

### Modified Capabilities

- `app-shell`: Change from single blocking request to progressive display. Show analysis text immediately, then update UI when images arrive. Add loading placeholder for images section.
- `image-generation`: Split the single grid image from Midjourney into 4 separate images by slicing at center points.

## Impact

- **app/actions.ts**: Split into two server actions or restructure for streaming/progressive response
- **app/page.tsx**: New state management for partial results (text ready, images pending)
- **lib/discord/listener.ts**: Add image splitting logic after capture
- **components/ImageGrid.tsx**: Larger images, click handlers for lightbox
- **New component**: Lightbox/modal for full-size image viewing
