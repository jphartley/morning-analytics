## Why

The Lightbox component has previous/next arrows and a close button, but no indication of where the user is in the image set. Users navigating through generated images cannot tell which image they are viewing or how many total images exist. A position indicator (e.g., "2 of 4") provides spatial orientation and sets expectations.

## What Changes

- Add a position counter indicator to the Lightbox component (e.g., "2 of 4")
- Display at the bottom center of the lightbox overlay
- Counter updates when navigating between images via arrows or keyboard
- Use a semi-transparent background pill for readability over any image

## Capabilities

### New Capabilities

_(none — this enhancement extends an existing capability)_

### Modified Capabilities

- `image-lightbox`: Adding a position indicator requirement to the existing lightbox navigation spec

## Impact

- **Code**: `app/components/Lightbox.tsx` — add counter element to JSX
- **Dependencies**: None — purely a presentational addition using existing `currentIndex` and `imageUrls.length` state
- **APIs**: No changes
- **Systems**: No changes
