## Context

The current `Lightbox` component receives a single `imageUrl` string and renders it full-screen with a close button. Users must close and reopen the lightbox for each of the 4 generated images. The `ImageGrid` component passes a URL string via `onImageClick`, and `page.tsx` stores that URL as `lightboxImage: string | null`.

## Goals / Non-Goals

**Goals:**
- Enable cycling through all images without closing the lightbox
- Support arrow button clicks and keyboard arrow keys
- Wrapping navigation (last→first, first→last)
- Subtle crossfade transition (~150ms) between images
- Fully opaque backdrop to hide the UI behind the lightbox
- Maximize image display size

**Non-Goals:**
- Touch/swipe gestures (desktop-focused)
- Dot indicators or "1 of 4" text
- Thumbnail strip (tested and removed — took up too much space, reduced image size for minimal benefit with only 4 images)
- Zoom or pan within the lightbox
- Animation on open/close of the lightbox itself

## Decisions

### Pass full image array to Lightbox instead of single URL

**Decision**: Change `Lightbox` props from `{ imageUrl: string }` to `{ imageUrls: string[], initialIndex: number }`. Lightbox manages `currentIndex` internally.

**Rationale**: Keeps navigation state local to the lightbox. The parent only needs to know which index was clicked and that the lightbox is open/closed — not which image is currently being viewed.

**Alternative considered**: Parent manages current index and passes it down. Rejected because it leaks navigation state upward unnecessarily.

### Arrow buttons flanking the image in the backdrop

**Decision**: Place prev/next arrow buttons in the dark backdrop area on either side of the image, not overlaid on the image itself.

**Rationale**: The generated artwork is visually busy. Overlaid buttons would obscure the content. Backdrop placement provides large, clear click targets without interfering with the art.

### Fully opaque backdrop

**Decision**: Use `bg-black` (fully opaque) instead of semi-transparent backdrop.

**Rationale**: The 2×2 image grid is visible behind a semi-transparent overlay, which is distracting. A fully opaque backdrop focuses attention entirely on the enlarged image.

### CSS opacity crossfade for transitions

**Decision**: Use CSS `opacity` transition (~150ms) when switching images. Fade out current image, swap src, fade in new image.

**Rationale**: Simple, performant, no additional dependencies. React state change + CSS transition handles this cleanly. No need for a carousel library.

**Alternative considered**: Slide/swipe animation. Rejected — adds complexity and a horizontal-swipe metaphor is more suited to mobile.

### ImageGrid passes index instead of URL

**Decision**: Change `onImageClick` from `(url: string) => void` to `(index: number) => void`. Parent stores `lightboxIndex: number | null` instead of `lightboxImage: string | null`.

**Rationale**: The lightbox needs to know position in the array, not just which URL. Index is the natural identifier.

### No thumbnail strip

**Decision**: Omit the thumbnail strip below the main image.

**Rationale**: Tested with thumbnails and they consumed too much vertical space, making the enlarged image only slightly larger than the grid thumbnails. With only 4 images and arrow navigation, a thumbnail picker adds minimal value. Removing it maximizes image display area.

## Risks / Trade-offs

- **Image loading flicker on nav**: If images aren't cached, switching could show a blank frame during the crossfade. → Mitigation: Images are already loaded in the grid (browser cache), so re-fetching in lightbox should be instant. Base64 data URLs (mock mode) are already in memory.
- **Accessibility**: Arrow buttons need proper `aria-label` attributes. Keyboard nav must not trap focus unexpectedly. → Mitigation: Escape still closes, tab order should flow naturally through arrows and thumbnails.
