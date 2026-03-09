## Why

The lightbox currently shows a single image with no way to navigate to other images. Users must close the lightbox and click the next image in the grid, repeating this for all 4 images. This makes browsing generated artwork tedious.

## What Changes

- Add left/right arrow navigation to the lightbox (wrapping cycle: 4→1, 1→4)
- Add keyboard arrow key support (← →) for cycling
- Subtle ~150ms crossfade transition when switching images
- Fully opaque backdrop so the UI behind is not visible
- Lightbox receives the full image set + starting index instead of a single URL

## Capabilities

### New Capabilities

_(none — this extends an existing capability)_

### Modified Capabilities

- `image-lightbox`: Adding navigation between images (arrow buttons, keyboard arrows, wrapping cycle, crossfade transitions, opaque backdrop)

## Impact

- `components/Lightbox.tsx` — Major changes: new props interface, internal state for current index, arrow buttons, thumbnail strip, crossfade, keyboard nav
- `components/ImageGrid.tsx` — Minor: `onImageClick` callback changes from URL to index
- `app/page.tsx` — Minor: state changes from `lightboxImage: string` to `lightboxIndex: number`, passes full image array to Lightbox
