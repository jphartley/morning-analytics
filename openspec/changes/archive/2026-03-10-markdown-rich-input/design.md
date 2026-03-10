## Context

The journal input is currently a plain `<textarea>` that stores and displays raw text. Users who write in Markdown-capable tools (e.g., Day One) paste raw Markdown and see unrendered syntax (`#`, `**`, `*`). The analysis output already renders Markdown via `react-markdown` in AnalysisPanel, but the input side has no Markdown awareness.

The JournalInput component exposes a simple interface: `value: string`, `onChange: (value: string) => void`. The parent (`page.tsx`) manages the string state and passes it to server actions unchanged. The history view displays stored `input_text` in a plain `<p>` tag with `whitespace-pre-wrap`.

## Goals / Non-Goals

**Goals:**
- Replace the textarea with a TipTap WYSIWYG editor that renders Markdown as rich text
- Parse raw Markdown on paste (Day One workflow: copy raw MD → paste → see rich text)
- Support typing Markdown syntax inline (e.g., type `# ` at line start → becomes heading)
- Serialize editor content back to Markdown string for the existing data pipeline
- Render stored input text as Markdown in the history view
- Maintain the existing component interface (`value`/`onChange` as Markdown strings)

**Non-Goals:**
- Toolbar or floating menu — users type Markdown syntax or paste pre-formatted text
- Tables, code blocks, links, images, or other advanced Markdown elements
- Changing the data pipeline — server actions, Gemini, Supabase all receive the same Markdown string
- Collaborative editing or real-time sync

## Decisions

### Decision 1: TipTap with `tiptap-markdown` for the editor

**Choice**: Use `@tiptap/react` + `@tiptap/starter-kit` + `tiptap-markdown`

**Alternatives considered**:
- **Lexical (Meta)**: Newer, lighter, but Markdown paste/serialize support is less mature and requires more custom code
- **Milkdown**: Markdown-native but smaller community, fewer escape hatches for edge cases
- **MDXEditor**: Purpose-built for Markdown but heavier (~80-100kB) and more opinionated than needed

**Rationale**: TipTap is the most battle-tested ProseMirror wrapper in React. The `tiptap-markdown` package provides exactly the two features we need: (1) parse Markdown on paste, and (2) serialize editor state back to Markdown. The extension model means we include only the nodes we support — no bloat from unused features.

### Decision 2: Limited extension set

**Choice**: Include only these TipTap extensions from StarterKit:
- `Document`, `Paragraph`, `Text` (structural, always required)
- `Heading` (levels 1-3)
- `Bold`, `Italic`
- `BulletList`, `OrderedList`, `ListItem`
- `HardBreak`

Explicitly disable from StarterKit: `Blockquote`, `CodeBlock`, `Code`, `HorizontalRule`, `Strike`, `Dropcursor`, `Gapcursor`

**Rationale**: Matches the agreed Markdown subset. StarterKit bundles all common extensions, and we disable what we don't need. This is cleaner than importing each extension individually.

### Decision 3: Keep the same component interface

**Choice**: JournalInput keeps `value: string` and `onChange: (value: string) => void` where the string is Markdown.

```
page.tsx (unchanged)
  │
  │  value={journalText}       ← Markdown string
  │  onChange={setJournalText}  ← receives Markdown string
  │
  ▼
JournalInput
  │
  │  internally: TipTap editor with ProseMirror document model
  │  on change: serialize to Markdown via tiptap-markdown → call onChange
  │  on value prop change: parse Markdown into editor content
  │
  ▼
TipTap EditorContent (renders rich text)
```

**Rationale**: Zero changes to the parent component or anything upstream. The rich text editing is fully encapsulated. The Markdown string that reaches Gemini, Supabase, and server actions is identical to what a textarea would have produced.

### Decision 4: Use `react-markdown` for the history input view

**Choice**: Render stored `input_text` in the history view using `react-markdown` with the same `allowedElements` subset as AnalysisPanel, rather than embedding a read-only TipTap instance.

**Rationale**: The history view is read-only — no need for an editor. `react-markdown` is already a project dependency used by AnalysisPanel. Reusing it avoids loading TipTap's editor machinery for a display-only context. The allowed elements list will be consistent between both rendering contexts.

### Decision 5: Styling approach

**Choice**: Apply design token classes (`bg-surface`, `text-ink`, `border-outline`, etc.) to the TipTap editor container and use the existing prose-like styles from AnalysisPanel as a reference for headings, lists, and emphasis within the editor.

**Rationale**: Consistent with the project's palette system. The editor should feel like a natural part of the existing UI, not a foreign embedded widget.

## Risks / Trade-offs

**Bundle size increase (~40-60kB)** → Acceptable for the UX improvement. TipTap with a minimal extension set is comparable to adding one medium-sized dependency. Could lazy-load the editor component if it becomes a concern.

**Markdown round-trip fidelity** → `tiptap-markdown` may not preserve every whitespace nuance of the original Markdown when serializing back. For morning pages content (prose with basic formatting), this is unlikely to matter. The content reaching Gemini will be semantically identical even if minor whitespace differs.

**Paste behavior with rich text from other sources** → If a user pastes HTML from a web page (not raw Markdown), TipTap may interpret rich formatting. The `tiptap-markdown` plugin normalizes paste content, but unusual sources could produce unexpected results. Low risk for the target workflow (Day One pastes raw Markdown).

**Editor state vs prop sync** → TipTap manages its own internal document. When `value` prop changes externally (e.g., history navigation clears the input), we need to update the editor content without creating an infinite update loop. Standard pattern: only call `editor.commands.setContent()` when the prop differs from the current serialized content.
