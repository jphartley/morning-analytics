## Why

The analysis output currently displays raw Markdown syntax (e.g., `###`, `**bold**`) because it's rendered as plain text in the AnalysisPanel component. This breaks readability and looks unfinished. Adding proper Markdown rendering will make the analysis output look polished and easier to scan.

## What Changes

- Add `react-markdown` as a dependency
- Replace plain text rendering in AnalysisPanel with Markdown rendering
- Style headers (h1, h2, h3) with appropriate sizing and spacing
- Support headers, bold, italics, lists (ordered and unordered), and links
- Maintain copy-paste functionality (Markdown syntax hidden from copied text)

## Capabilities

### New Capabilities
- `markdown-analysis-rendering`: Renders Markdown-formatted analysis output in the AnalysisPanel component, supporting headers, emphasis, lists, and links while maintaining clean copy-paste behavior

### Modified Capabilities
<!-- No existing capabilities have requirement changes -->

## Impact

- **Code**: AnalysisPanel component (`app/components/AnalysisPanel.tsx`)
- **Dependencies**: Added `react-markdown` (~15KB gzipped)
- **Behavior**: Analysis text now displays with proper formatting instead of raw Markdown syntax
- **No breaking changes**: This is a pure enhancement to how existing analysis text is displayed
