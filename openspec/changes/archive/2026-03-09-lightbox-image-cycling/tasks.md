## 1. Update Lightbox props and internal state

- [x] 1.1 Change Lightbox props from `{ imageUrl: string, onClose: () => void }` to `{ imageUrls: string[], initialIndex: number, onClose: () => void }`
- [x] 1.2 Add `currentIndex` state initialized from `initialIndex`, with setter for navigation
- [x] 1.3 Add `isFading` state for crossfade transition control

## 2. Add arrow button navigation

- [x] 2.1 Add previous/next arrow buttons flanking the main image in the backdrop area
- [x] 2.2 Implement wrapping navigation logic (next from last → first, prev from first → last)
- [x] 2.3 Add keyboard arrow key handlers (← →) alongside existing Escape handler

## 3. Refinements after testing

- [x] 3.1 Remove thumbnail strip (too much vertical space for minimal benefit with 4 images)
- [x] 3.2 Make backdrop fully opaque (`bg-black`) to hide UI behind lightbox
- [x] 3.3 Maximize image display size (90vh/80vw)

## 4. Add crossfade transition

- [x] 4.1 Implement ~150ms opacity crossfade when switching images (fade out, swap, fade in)

## 5. Update parent components

- [x] 5.1 Change `ImageGrid` `onImageClick` from `(url: string) => void` to `(index: number) => void`
- [x] 5.2 Update `page.tsx` state from `lightboxImage: string | null` to `lightboxIndex: number | null`
- [x] 5.3 Pass `imageUrls` array and `initialIndex` to Lightbox in `page.tsx`
