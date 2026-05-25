## Why

Long-form analyses can take a few minutes to read, but the results panel gives users no expectation-setting before they begin. A subtle reading time estimate helps users understand the length and depth of the analysis at a glance, especially for longer Jungian responses.

## What Changes

- Add a derived reading time estimate to the AnalysisPanel header.
- Calculate the estimate from analysis text at 200 words per minute, rounded up with a one-minute minimum when text exists.
- Strip common Markdown syntax before counting words so formatting markers do not inflate the estimate.
- Display the estimate in small, muted text without changing analysis generation, storage, or history loading.
- Include the word count alongside the estimate for analysis depth context.

## Capabilities

### New Capabilities
- `analysis-reading-time`: Display-only reading time and word count metadata for rendered analysis text.

### Modified Capabilities
_None — this is additive UI metadata, no existing requirement contract changes._

## Impact

- **Code**: `app/components/AnalysisPanel.tsx` — derive metadata from `analysisText` and render it near the header.
- **Styling**: Tailwind design token classes such as `text-ink-muted`; no hardcoded colors.
- **Dependencies**: None expected.
- **APIs / Storage**: No backend, Supabase, Gemini, or history schema changes.
