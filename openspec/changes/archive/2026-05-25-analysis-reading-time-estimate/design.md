## Context

`AnalysisPanel` receives a single `analysisText` prop and renders it with `react-markdown`. The component is used for both newly generated analyses and historical analyses, so metadata derived from `analysisText` will naturally cover both views without storage changes. The rendered analysis may contain Markdown headings, emphasis, lists, and links; the estimate should reflect readable prose rather than Markdown control characters.

## Goals / Non-Goals

**Goals:**
- Display a subtle reading time estimate near the AnalysisPanel title.
- Calculate the estimate client-side from the current `analysisText` at 200 words per minute.
- Strip common Markdown syntax before word counting so formatting markers do not inflate the estimate.
- Show the word count alongside the estimate for analysis depth context.

**Non-Goals:**
- Persisting reading time or word count in Supabase.
- Changing Gemini prompts, analysis output format, or history schemas.
- Adding a markdown parser dependency solely for word counting.
- Estimating reading time for journal input text.

## Decisions

### 1. Derive metadata inside AnalysisPanel
**Choice**: Compute readable word count and reading minutes directly from the `analysisText` prop in `AnalysisPanel`.
**Why**: The component is the shared rendering point for fresh and history views, so colocating the calculation avoids duplicated page-level logic and keeps the metadata display-only.
**Alternative**: Store reading metadata when saving an analysis. Rejected because the value is deterministic, cheap to compute, and would require avoidable schema/API surface.

### 2. Strip Markdown with a local helper
**Choice**: Add a small local helper that removes common Markdown syntax before splitting on whitespace. It should handle headings, emphasis markers, inline links by keeping link text, list markers, blockquote markers, and inline code delimiters.
**Why**: The supported Markdown surface in `AnalysisPanel` is intentionally small. A local helper keeps the implementation lightweight while satisfying the issue requirement not to count Markdown syntax characters.
**Alternative**: Use `react-markdown` internals or add a Markdown-to-text package. Rejected because it would add complexity for a simple display estimate.

### 3. Reading-time formatting
**Choice**: Use `Math.ceil(wordCount / 200)` with a minimum of 1 minute for non-empty analysis text, formatted as `~N min read (M words)`.
**Why**: This matches the GitHub issue acceptance criteria and gives users both time expectation and depth context.
**Alternative**: Hide the word count and show only time. Rejected because the issue explicitly suggested word count as useful context and it costs little visual space.

### 4. Header placement and styling
**Choice**: Render metadata next to or just below the `Analysis` heading using `text-sm text-ink-muted` and token-based spacing.
**Why**: It keeps the estimate discoverable without competing with the analysis content.
**Alternative**: Place metadata at the bottom of the panel. Rejected because users need the estimate before they start reading.

## Risks / Trade-offs

- **Markdown stripping misses rare syntax** -> The helper targets the syntax currently rendered by `AnalysisPanel`; unsupported Markdown is not part of the expected analysis contract.
- **Tiny analyses display one minute** -> A one-minute minimum is more readable than `~0 min read` for non-empty content.
- **Long unbroken tokens skew word count** -> Splitting readable text on whitespace is acceptable for prose-heavy analysis output.
