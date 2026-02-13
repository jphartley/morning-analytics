## Context

The Morning Analytics app currently uses a single `analyzeJournal` server action that blocks until both Gemini analysis (~2s) and Midjourney image generation (~60-90s) complete. Users see a loading spinner for the entire duration with no intermediate feedback.

Midjourney returns a single image containing a 2x2 grid of four images. The aspect ratio varies based on the prompt, so dimensions are not fixed. This grid is displayed as one small image, making details hard to see.

## Goals / Non-Goals

**Goals:**
- Show analysis text within ~3 seconds of clicking Analyze
- Generate images in background while user reads analysis
- Display 4 separate images instead of 1 grid image
- Allow viewing any image at full size via lightbox

**Non-Goals:**
- Streaming text character-by-character (Gemini response is fast enough)
- Upscaling individual images via Midjourney U1-U4 buttons
- Saving/persisting images locally
- Image download functionality

## Decisions

### 1. Two-Phase Server Action Architecture

**Decision:** Split into two server actions: `analyzeText()` and `generateImages()`.

**Flow:**
1. User clicks Analyze
2. Call `analyzeText(journalText)` → returns analysis + image prompt
3. Display analysis immediately, show image loading state
4. Call `generateImages(imagePrompt)` → returns 4 image URLs
5. Update UI with images

**Rationale:** Clean separation of concerns. Each action is independent and testable. No streaming complexity. Works naturally with React state.

**Alternatives considered:**
- Single action with streaming: More complex, harder to handle errors per-phase
- Polling: Unnecessary complexity, server actions handle this well

### 2. Server-Side Image Splitting with Sharp

**Decision:** Use the `sharp` library to split the grid image on the server.

**Implementation:**
1. Fetch the Midjourney grid image from Discord CDN
2. Get image dimensions (width, height)
3. Use sharp to extract 4 quadrants by dividing width/2 and height/2: top-left, top-right, bottom-left, bottom-right
4. Return as base64 data URLs or save to temp files and return paths

**Rationale:** Sharp is fast, well-maintained, handles edge cases. Server-side processing means the client receives ready-to-display images.

**Alternatives considered:**
- Client-side canvas: Slower, CORS issues with Discord CDN
- ImageMagick CLI: Heavier dependency, shell execution overhead

### 3. Custom Lightbox Component

**Decision:** Build a simple custom lightbox using React portal and CSS.

**Features:**
- Click image → open modal with full-size image
- Click backdrop or press Escape → close
- Prevent body scroll when open

**Rationale:** Requirements are simple. No need for a library. Keeps bundle size small.

**Alternatives considered:**
- react-image-lightbox: Adds dependency for simple use case
- Native `<dialog>` element: Browser support concerns, less styling control

### 4. State Machine for Progressive UI

**Decision:** Extend the existing state machine with intermediate states.

**States:**
- `idle`: Input form
- `analyzing`: Spinner, "Analyzing your morning pages..."
- `text-ready`: Analysis displayed, images loading placeholder
- `complete`: Analysis + images displayed
- `error`: Error with retry

**Rationale:** Clear state transitions, easy to reason about, matches user's mental model.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Sharp adds ~30MB to node_modules | Acceptable for localhost app; could lazy-load if needed |
| Discord CDN image fetch may fail | Retry logic, graceful degradation (show grid if split fails) |
| Race condition if user starts new analysis while images loading | Cancel pending image generation on new analysis |
| Base64 images increase response size | Acceptable for 4 images; alternative is temp file serving |

## Open Questions

- Should we show a skeleton/placeholder for each of the 4 images, or one loading indicator for the whole section? (Leaning toward one indicator for simplicity)
