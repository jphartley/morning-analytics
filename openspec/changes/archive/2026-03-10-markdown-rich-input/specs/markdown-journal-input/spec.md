## ADDED Requirements

### Requirement: Render Markdown as rich text in the journal input
The JournalInput component SHALL render Markdown content as formatted rich text using a TipTap WYSIWYG editor, displaying headings, bold, italic, and lists as styled elements instead of raw Markdown syntax.

#### Scenario: Headings render as styled text
- **WHEN** the editor content contains a line starting with `#`, `##`, or `###`
- **THEN** the line renders as a styled heading (h1, h2, or h3) with appropriate size and weight, without displaying the `#` characters

#### Scenario: Bold text renders as styled text
- **WHEN** the editor content contains text wrapped in `**`
- **THEN** the text renders with bold font weight, without displaying the `**` markers

#### Scenario: Italic text renders as styled text
- **WHEN** the editor content contains text wrapped in `*`
- **THEN** the text renders with italic font style, without displaying the `*` markers

#### Scenario: Unordered lists render as bulleted lists
- **WHEN** the editor content contains lines starting with `- ` or `* `
- **THEN** the lines render as a bulleted list with appropriate indentation

#### Scenario: Ordered lists render as numbered lists
- **WHEN** the editor content contains lines starting with `1. `, `2. `, etc.
- **THEN** the lines render as a numbered list with appropriate indentation

### Requirement: Parse raw Markdown on paste
The editor SHALL parse raw Markdown pasted from the clipboard and render it as rich text.

#### Scenario: Pasting raw Markdown from an external tool
- **WHEN** a user pastes raw Markdown text (e.g., `# Title\n\nSome **bold** text`)
- **THEN** the editor renders it as formatted rich text (heading, bold, etc.) rather than displaying the raw syntax

#### Scenario: Pasting plain text without Markdown
- **WHEN** a user pastes plain text with no Markdown syntax
- **THEN** the editor displays it as normal paragraph text

### Requirement: Inline Markdown input shortcuts
The editor SHALL convert Markdown syntax typed directly into the editor into rich text formatting.

#### Scenario: Typing a heading prefix
- **WHEN** a user types `# ` (hash + space) at the start of a line
- **THEN** the line converts to a heading and the `# ` characters are removed

#### Scenario: Typing bold markers
- **WHEN** a user types `**text**`
- **THEN** the text converts to bold formatting and the `**` markers are removed

#### Scenario: Typing italic markers
- **WHEN** a user types `*text*`
- **THEN** the text converts to italic formatting and the `*` markers are removed

### Requirement: Serialize editor content to Markdown
The editor SHALL serialize its rich text content back to a Markdown string when content changes, so the downstream pipeline receives the same format as the previous textarea.

#### Scenario: Content change emits Markdown string
- **WHEN** the editor content changes (via typing, pasting, or formatting)
- **THEN** the `onChange` callback receives a Markdown string representation of the editor content

#### Scenario: Round-trip fidelity for supported elements
- **WHEN** raw Markdown with headings, bold, italic, and lists is pasted into the editor
- **THEN** the serialized Markdown output preserves the semantic meaning of those elements

### Requirement: Unsupported Markdown elements are not rendered
The editor SHALL NOT render Markdown elements outside the supported subset (tables, code blocks, images, links, blockquotes, horizontal rules, strikethrough).

#### Scenario: Code blocks are not rendered as code
- **WHEN** pasted Markdown contains triple-backtick code blocks
- **THEN** the content is treated as plain text, not rendered as a styled code block

#### Scenario: Tables are not rendered as tables
- **WHEN** pasted Markdown contains table syntax
- **THEN** the content is treated as plain text, not rendered as a table

### Requirement: Maintain existing component interface
The JournalInput component SHALL maintain its existing props interface (`value: string`, `onChange: (value: string) => void`, `onAnalyze: () => void`, `disabled: boolean`) where the string is Markdown.

#### Scenario: External value prop updates editor content
- **WHEN** the `value` prop changes (e.g., parent resets to empty string)
- **THEN** the editor content updates to reflect the new value

#### Scenario: Disabled state prevents editing
- **WHEN** the `disabled` prop is true
- **THEN** the editor is not editable and appears visually dimmed

### Requirement: Design token styling
The editor SHALL use the project's design token classes for styling, consistent with other input components.

#### Scenario: Editor matches existing visual style
- **WHEN** the editor is rendered
- **THEN** it uses `bg-surface`, `text-ink`, `border-outline`, and focus ring styles consistent with the previous textarea

### Requirement: Render stored input text as Markdown in history view
The history view SHALL render stored `input_text` as formatted Markdown using `react-markdown`, consistent with how analysis text is rendered.

#### Scenario: History input displays formatted Markdown
- **WHEN** a user views a past analysis in the history sidebar
- **THEN** the original input text renders with formatted headings, bold, italic, and lists instead of raw Markdown syntax

#### Scenario: History input restricts rendered elements
- **WHEN** stored input text contains unsupported Markdown (tables, code blocks, images)
- **THEN** those elements are not rendered as their Markdown-specific forms
