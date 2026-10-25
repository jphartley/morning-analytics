## Purpose

Define rich-text Markdown editing behavior for journal input while preserving the Markdown string interface.

## Requirements

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

### Requirement: Preserve supported formatting from external clipboard content

The journal editor SHALL preserve headings, bold, italic, lists, paragraphs and line breaks when the clipboard represents those supported formats. Pasted headings SHALL use the supported h1-h3 hierarchy, with h4-h6 normalized to h3. The editor SHALL preserve the existing raw Markdown paste behavior and SHALL serialize accepted formatting as Markdown for saving and history display.

#### Scenario: Paste semantic headings and bold
- **WHEN** a user pastes formatted content containing headings and bold text
- **THEN** the editor displays the supported heading hierarchy and bold spans
- **AND** surrounding text, paragraph order and line breaks remain intact

#### Scenario: Paste emphasis encoded as inline styles
- **WHEN** copied document content expresses bold or italic with supported inline weight or font-style values
- **THEN** the editor preserves the corresponding emphasis
- **AND** the original style information is discarded after conversion
- **AND** explicitly normal-weight wrapper text is not incorrectly made bold

#### Scenario: Paste document headings with explicit semantics
- **WHEN** a representative document clipboard payload encodes heading levels through semantic heading elements, heading-role metadata or recognized document heading markers
- **THEN** the editor preserves those headings within its supported hierarchy
- **AND** font size alone is not interpreted as evidence of a heading

#### Scenario: Paste raw Markdown
- **WHEN** a user pastes raw Markdown containing `# Title`, `**bold**`, italic and lists
- **THEN** the editor renders those elements as formatted text
- **AND** it does not display the supported Markdown formatting markers literally

#### Scenario: Save and reopen accepted formatting
- **WHEN** a user saves an analysis whose journal contains pasted headings, bold, italic and lists and later reopens it
- **THEN** its original entry displays those supported formats
- **AND** stored journal content remains Markdown rather than clipboard HTML

### Requirement: Restrict external HTML before editor interpretation

The editor SHALL clean incoming clipboard HTML before interpreting document structures or hidden editor metadata. It SHALL accept only supported journal formatting and SHALL discard executable content, embedded resources, hidden editor instructions and unsupported attributes. Cleanup SHALL NOT execute incoming content or fetch its external resources.

#### Scenario: Content carries executable markup and hidden editor metadata
- **WHEN** pasted content includes active markup, event handlers, hidden clipboard instructions or unsupported attributes alongside ordinary journal text
- **THEN** the editor interprets only the cleaned supported content
- **AND** no pasted code executes
- **AND** the removed metadata cannot influence document construction
- **AND** readable journal text and supported formatting are retained

#### Scenario: Content contains links and embedded media
- **WHEN** pasted HTML contains links, images, frames or other embedded resources
- **THEN** readable link text remains ordinary text
- **AND** embedded resources do not become editor content and are not fetched
- **AND** supported surrounding text and formatting remain readable

#### Scenario: Content includes unsupported layout containers
- **WHEN** pasted content places supported text inside unsupported layout elements
- **THEN** the editor retains readable text and supported descendants in reading order
- **AND** it does not preserve the unsupported layout or arbitrary document styling

### Requirement: Handle unavailable or rejected clipboard HTML safely

The editor SHALL use the clipboard's plain text when formatted HTML has no usable content after cleanup. If no usable content remains or cleanup fails, the editor SHALL preserve the existing entry and SHALL NOT trigger automatic analysis. A cleanup failure SHALL provide a simple user-visible failure message without exposing journal content in logs or diagnostics.

#### Scenario: Plain-text fallback is available
- **WHEN** cleaning clipboard HTML yields no usable content and the clipboard includes plain text
- **THEN** the editor inserts the plain text through its existing Markdown paste behavior
- **AND** it does not retry the original HTML

#### Scenario: Clipboard has no usable content
- **WHEN** cleanup removes all clipboard content and no usable plain text is available
- **THEN** the editor leaves the current entry intact
- **AND** automatic analysis is not triggered

#### Scenario: Cleanup fails
- **WHEN** clipboard cleanup fails
- **THEN** the existing entry remains intact and a simple paste failure is shown
- **AND** no automatic analysis is triggered and no journal content is included in diagnostics

### Requirement: Apply the same restrictions to externally dropped HTML

The editor SHALL apply the same supported-format and security restrictions to external HTML introduced by drag and drop. Dropped content SHALL NOT gain a new automatic-analysis trigger as part of this change.

#### Scenario: Drop external formatted content
- **WHEN** a user drops external HTML containing a heading, bold text and unsupported metadata into the editor
- **THEN** supported text and formatting are retained after cleanup
- **AND** unsupported metadata and active content are discarded before editor interpretation
- **AND** the drop does not automatically submit an analysis

### Requirement: Keep cleaned paste compatible with existing editing and analysis behavior

A cleaned paste SHALL behave as one normal user edit, support undo and selection replacement, and respect the disabled state. Automatic analysis SHALL follow the existing paste threshold and effective analysis mode using the accepted visible text, without duplicate submissions or stale paste state.

#### Scenario: Qualifying paste triggers once
- **WHEN** a successful cleaned paste brings the journal to at least 300 words
- **THEN** the existing automatic-analysis behavior runs exactly once for the effective analysis mode
- **AND** cleanup and clipboard fallback do not introduce additional submissions

#### Scenario: Rejected paste does not affect later typing
- **WHEN** a paste is rejected and later typing brings the journal above the threshold
- **THEN** that typing does not trigger analysis as if it were a successful paste

#### Scenario: Replace a selection and undo
- **WHEN** a user pastes accepted formatted content over selected journal text and undoes the edit
- **THEN** the paste replaces only the selection
- **AND** undo restores the preceding text and formatting

#### Scenario: Editor is disabled
- **WHEN** a user attempts to paste or externally drop content while the editor is disabled
- **THEN** the editor content remains unchanged
- **AND** no additional analysis is submitted
