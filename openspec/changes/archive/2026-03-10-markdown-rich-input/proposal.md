## Why

Users write morning pages in Markdown-capable tools (e.g., Day One) and paste raw Markdown into the journal input. The current plain textarea displays raw syntax (`#`, `**`, `*`) instead of rendered formatting, creating a jarring experience compared to the tool they wrote in. The analysis output already renders Markdown beautifully — the input should match.

## What Changes

- Replace the plain `<textarea>` in JournalInput with a TipTap WYSIWYG editor that renders Markdown as rich text
- Support a limited Markdown subset: headers (h1-h3), bold, italic, and lists (ordered/unordered)
- No toolbar — users type Markdown syntax directly and it renders inline, or paste pre-formatted Markdown from external tools
- Editor serializes back to a Markdown string, so no changes to server actions, Gemini pipeline, or database storage
- Render stored `input_text` as Markdown in the history view (currently displayed as raw text in a `<p>` tag)

## Capabilities

### New Capabilities
- `markdown-journal-input`: WYSIWYG Markdown editing in the journal input box using TipTap, including paste-as-rich-text behavior and Markdown serialization

### Modified Capabilities
- `markdown-analysis-rendering`: No spec-level requirement changes — the history input view will reuse `react-markdown` but this is an implementation detail, not a new rendering requirement

## Impact

- **Components**: `JournalInput.tsx` (replaced internals), `page.tsx` (history view input rendering)
- **Dependencies**: New npm packages — `@tiptap/react`, `@tiptap/starter-kit`, `tiptap-markdown`
- **Bundle size**: ~40-60kB addition for TipTap with selected extensions
- **No backend changes**: Server actions, Gemini API, Supabase schema all unchanged — the editor serializes to the same Markdown string the textarea produced
