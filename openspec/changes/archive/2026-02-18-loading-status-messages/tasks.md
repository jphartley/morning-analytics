## 1. LoadingState Component

- [x] 1.1 Define `ANALYSIS_MESSAGES` array (~8-10 playful analysis-themed messages) and `IMAGE_MESSAGES` array (~8-10 image-themed messages) as exported constants in `LoadingState.tsx`
- [x] 1.2 Refactor `LoadingState` props: replace `message?: string` with `messages: string[]`, `durationHint: string`, and optional `intervalMs?: number` (default 7000)
- [x] 1.3 Implement message rotation using `useState` + `useEffect` with `setInterval`, cycling through the messages array
- [x] 1.4 Add CSS fade transition on message text change
- [x] 1.5 Render layout: spinner → rotating message → duration hint (smaller muted text)

## 2. Page Integration

- [x] 2.1 Update the "analyzing" state in `page.tsx` to pass `ANALYSIS_MESSAGES` and duration hint to `LoadingState`
- [x] 2.2 Replace the inline hardcoded image generation spinner in `page.tsx` with a `LoadingState` component using `IMAGE_MESSAGES` and duration hint

## 3. Verification

- [x] 3.1 Run `npm run build` to confirm no build errors
- [x] 3.2 Visually verify rotating messages and duration hints in both phases
