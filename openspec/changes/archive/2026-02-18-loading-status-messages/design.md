## Context

The `LoadingState` component currently accepts a single `message` string and renders a spinner + static text. It's used in two places in `page.tsx`: once for the "analyzing" state and once inline for the "text-ready" (image generation) state. The inline image generation spinner doesn't use `LoadingState` — it's hardcoded markup.

## Goals / Non-Goals

**Goals:**
- Show time estimate text for each phase (analysis: "~15 seconds", images: "~1 minute")
- Rotate through ~8-10 playful thematic messages per phase, changing every ~7 seconds
- Reuse `LoadingState` for both phases (refactor the inline image spinner to use it too)

**Non-Goals:**
- Actual progress tracking (we don't know real progress, just estimated duration)
- Elapsed time counter
- Persona-aware messages (all phases use the same message sets regardless of persona)

## Decisions

1. **LoadingState props**: Replace the single `message` prop with:
   - `messages: string[]` — array of rotating messages
   - `durationHint: string` — time estimate text (e.g., "Usually takes ~15 seconds")
   - `intervalMs?: number` — rotation speed, defaults to 7000ms

2. **Message sets**: Define two constant arrays in the LoadingState file:
   - `ANALYSIS_MESSAGES` (~8-10 entries): "Reading between the lines...", "Exploring the unconscious...", etc.
   - `IMAGE_MESSAGES` (~8-10 entries): "Painting your insights...", "Mixing the watercolors...", etc.
   - Export these constants so `page.tsx` can pass them as props.

3. **Rotation behavior**: Use `useState` + `useEffect` with `setInterval`. Start from index 0, increment and wrap. Clean up on unmount. Add a CSS fade transition between messages for polish.

4. **Layout**: Spinner on top, rotating message below, duration hint below that in smaller/muted text. All centered.

5. **Image generation spinner**: Replace the inline hardcoded spinner in `page.tsx` with a `<LoadingState>` component using the image message set.

## Risks / Trade-offs

- **Message repetition**: With ~8-10 messages at 7s intervals, the full set cycles in ~56-70s. Image generation can take up to 90s, so users may see one repeat. Acceptable.
- **Hardcoded duration estimates**: If actual API performance changes significantly, the estimates may become inaccurate. These are easy to update later.
