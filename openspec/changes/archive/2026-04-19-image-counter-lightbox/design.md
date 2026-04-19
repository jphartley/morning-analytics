## Context

The Lightbox component (`app/components/Lightbox.tsx`) renders a full-screen overlay with previous/next arrows and keyboard navigation. It already tracks `currentIndex` (state) and receives `imageUrls` (props), so all data needed for a position indicator is available. The component uses design token classes (`bg-surface`, `text-ink`) and Tailwind utilities.

## Goals / Non-Goals

**Goals:**
- Add a "2 of 4" position indicator visible at the bottom center of the lightbox
- Ensure readability over both light and dark images via semi-transparent background
- Update counter on all navigation methods (arrows, keyboard)

**Non-Goals:**
- Thumbnail strip or filmstrip navigation (separate feature)
- Swipe/touch gesture navigation
- Image download or share from lightbox

## Decisions

**Position indicator placement: bottom center of the overlay**
- Rationale: Standard convention for image viewers (Google Photos, iOS, etc.). Bottom center avoids conflict with the close button (top-right) and nav arrows (left/right).
- Alternative: Top center — rejected because it competes with the close button area.

**Styling: semi-transparent dark pill**
- Rationale: A `bg-black/60 text-white` pill ensures readability over any image content. This is the same approach used by Google Photos and iOS lightboxes.
- Alternative: Design token-based colors — rejected because the lightbox uses a full-black backdrop, so white-on-dark is the only reliable combination here.

**Implementation: inline JSX, no new component**
- Rationale: This is a single `<span>` element using existing state variables. Extracting a component would be over-engineering.

## Risks / Trade-offs

- [Visual overlap on very short viewports] → The counter is placed below the image container with absolute positioning relative to the overlay, so it won't overlap the image itself.
- [Hardcoded "of" text not i18n-ready] → Acceptable for current single-locale app. Can be extracted later if i18n is added.
