## Context

The AnalysisPanel component currently displays the Gemini analysis output as plain text, splitting by paragraph breaks and rendering each as a `<p>` tag. The Gemini API outputs well-formatted Markdown (with headers, emphasis, lists), but this syntax displays as raw text to users (e.g., `###` instead of a styled header). This creates a visually unpolished experience and reduces readability.

## Goals / Non-Goals

**Goals:**
- Render Markdown syntax correctly in the AnalysisPanel component
- Support headers (h1, h2, h3), bold, italic, unordered lists, ordered lists, and links
- Maintain clean copy-paste behavior (Markdown syntax hidden in DOM)
- Keep visual styling consistent with existing stone-based design system
- Maintain current component structure and props interface

**Non-Goals:**
- Support tables, code blocks, images, or other advanced Markdown features
- Modify the Gemini prompt or analysis generation
- Change the AnalysisPanel layout or overall page structure
- Implement Markdown editing capability

## Decisions

### Decision: Use react-markdown for rendering
**Choice**: Add `react-markdown` as a dependency

**Rationale**:
- Industry standard for React Markdown rendering, well-maintained and tested
- Handles all required elements (headers, emphasis, lists, links)
- Small bundle impact (~15KB gzipped)
- Simple API: configure allowed elements via `components` prop
- Alternative considered: markdown-it (slightly lighter but requires manual React wiring)

### Decision: Configure to allow only safe elements
**Choice**: Use react-markdown's `allowedElements` to restrict rendering to: h1, h2, h3, strong, em, ul, ol, li, a

**Rationale**:
- Ensures consistent, predictable output
- Prevents rendering of unsupported elements like tables and code blocks
- Reduces surface area for unexpected Markdown features
- Keeps styling simple and focused

### Decision: Style headers with Tailwind
**Choice**: Use Tailwind classes to style h3 headers with slight size increase, bold weight, and margin spacing

**Rationale**:
- Consistent with existing design system (stone color palette already in place)
- h3 is the primary header level in Gemini output
- Slight sizing (1-2px larger) and spacing maintains visual hierarchy without overwhelming
- Easier to maintain than custom CSS

### Decision: Minimal component changes
**Choice**: Replace only the rendering logic in AnalysisPanel; keep component interface and surrounding styling unchanged

**Rationale**:
- Reduces risk and keeps changes focused
- AnalysisPanel props remain the same (`analysisText: string`)
- Existing Tailwind wrapper and stone styling unchanged
- Copy-paste works naturally because Markdown syntax is not in DOM

## Risks / Trade-offs

**Risk**: Dependency management
→ **Mitigation**: react-markdown is stable with infrequent updates; add to lock file for reproducibility

**Risk**: Malformed Markdown from Gemini
→ **Mitigation**: react-markdown is resilient to most malformed input. If issues arise, can adjust Gemini prompt or filter input.

**Risk**: Link targets in analysis
→ **Mitigation**: react-markdown does not execute JavaScript; links are safe. Consider adding `rel="noopener noreferrer"` if linking to external sites, though analysis likely contains relative paths only.

**Trade-off**: XSS exposure
→ **Mitigation**: react-markdown sanitizes by default and does not evaluate Markdown as code. No additional risk compared to rendering any user-controlled text.

## Migration Plan

1. Add `react-markdown` to `package.json` dependencies
2. Replace AnalysisPanel rendering logic to use `<ReactMarkdown>`
3. Configure allowed elements and add Tailwind styling for headers
4. Test with existing analysis samples (no user-facing changes needed—all existing analyses already have Markdown content)
5. Deploy; no rollback needed (purely additive enhancement)
