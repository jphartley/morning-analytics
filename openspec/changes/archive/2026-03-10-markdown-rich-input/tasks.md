## 1. Dependencies

- [x] 1.1 Install TipTap packages: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`, `tiptap-markdown`

## 2. TipTap Editor Component

- [x] 2.1 Replace textarea in `JournalInput.tsx` with a TipTap `useEditor` + `EditorContent` setup
- [x] 2.2 Configure StarterKit with only the supported extensions: Heading (levels 1-3), Bold, Italic, BulletList, OrderedList, ListItem, HardBreak — disable Blockquote, CodeBlock, Code, HorizontalRule, Strike, Dropcursor, Gapcursor
- [x] 2.3 Configure `tiptap-markdown` extension for Markdown paste parsing and serialization
- [x] 2.4 Wire `onChange` to serialize editor content to Markdown string via `editor.storage.markdown.getMarkdown()`
- [x] 2.5 Sync external `value` prop changes into editor (e.g., when parent resets to empty string) without creating update loops
- [x] 2.6 Implement `disabled` prop to toggle editor editability and apply dimmed visual style

## 3. Styling

- [x] 3.1 Style the TipTap editor container with design token classes (`bg-surface`, `text-ink`, `border-outline`, focus ring) to match the previous textarea appearance
- [x] 3.2 Style rendered headings, bold, italic, and lists inside the editor to match AnalysisPanel's prose styles

## 4. History View

- [x] 4.1 Replace the plain `<p>` tag for `inputText` in the history view (`page.tsx` line 270) with a `react-markdown` renderer using the same `allowedElements` subset as AnalysisPanel

## 5. Verification

- [x] 5.1 Verify paste workflow: copy raw Markdown from an external source, paste into editor, confirm it renders as rich text
- [x] 5.2 Verify inline typing: type `# `, `**text**`, `*text*`, `- ` in the editor and confirm live conversion to rich text
- [x] 5.3 Verify serialization: confirm the Markdown string received by `onChange` preserves headings, bold, italic, and lists
- [x] 5.4 Verify disabled state: confirm editor is not editable when `disabled` is true
- [x] 5.5 Verify history view: view a past analysis and confirm input text renders as formatted Markdown
- [x] 5.6 Verify unsupported elements: paste Markdown with code blocks or tables and confirm they are not rendered as their special forms
