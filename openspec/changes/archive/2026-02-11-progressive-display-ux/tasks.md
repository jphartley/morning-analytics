## 1. Setup

- [x] 1.1 Install `sharp` dependency
- [x] 1.2 Update `next.config.ts` to externalize `sharp` if needed

## 2. Server Actions

- [x] 2.1 Create `analyzeText` server action (Gemini only, returns analysis + image prompt)
- [x] 2.2 Create `generateImages` server action (Discord/Midjourney, returns split images)
- [x] 2.3 Remove or deprecate combined `analyzeJournal` action

## 3. Image Splitting

- [x] 3.1 Create `lib/image-splitter.ts` with sharp-based grid splitting
- [x] 3.2 Fetch grid image from Discord CDN
- [x] 3.3 Calculate quadrant dimensions from actual image width/height
- [x] 3.4 Extract 4 quadrants and return as base64 data URLs
- [x] 3.5 Integrate splitting into `generateImages` action

## 4. Lightbox Component

- [x] 4.1 Create `components/Lightbox.tsx` with modal overlay
- [x] 4.2 Implement click-outside and Escape key to close
- [x] 4.3 Add body scroll lock when open

## 5. UI Updates

- [x] 5.1 Update page state machine with `text-ready` state
- [x] 5.2 Update `page.tsx` to call actions sequentially (text first, then images)
- [x] 5.3 Add image loading placeholder for `text-ready` state
- [x] 5.4 Update `ImageGrid.tsx` to display larger images
- [x] 5.5 Add click handlers to images to open lightbox

## 6. Testing

- [x] 6.1 Test progressive flow (text appears first, images load after)
- [x] 6.2 Test image splitting with different aspect ratios
- [x] 6.3 Test lightbox open/close behavior
