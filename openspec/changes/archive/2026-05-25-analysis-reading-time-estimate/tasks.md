## 1. Reading Metadata Calculation

- [x] 1.1 Add an AnalysisPanel helper that converts supported Markdown analysis text into readable plain text for counting.
- [x] 1.2 Derive word count from the readable text using whitespace splitting with empty-token filtering.
- [x] 1.3 Derive reading minutes with `Math.ceil(wordCount / 200)` and a one-minute minimum for non-empty analysis text.

## 2. AnalysisPanel Display

- [x] 2.1 Render reading metadata near the "Analysis" heading for non-empty analysis text.
- [x] 2.2 Format metadata as `~N min read (M words)` using a singular `word` label when appropriate.
- [x] 2.3 Style metadata with small, muted design-token classes so it remains secondary to the heading and body copy.

## 3. Validation

- [x] 3.1 Verify fresh analysis and history views both show the estimate because they render through AnalysisPanel.
- [x] 3.2 Verify Markdown headings, emphasis, list markers, and links do not inflate the readable word count.
- [x] 3.3 Run `npm run build` from `app/`.
- [x] 3.4 Run `npm run lint` from `app/`.

Note: full lint currently exits non-zero on pre-existing unrelated issues in `ModelPicker.tsx`, auth pages, `app/page.tsx`, and `lib/discord/listener.ts`. A focused lint of `components/AnalysisPanel.tsx` passes.
