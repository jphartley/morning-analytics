## Context

See `proposal.md` for motivation and scope. `JournalInput.tsx` uses Tiptap StarterKit with `tiptap-markdown`, converts clipboard text to Markdown rich text, and serializes edits to a Markdown string. Formatted clipboard HTML takes a separate ProseMirror path. Setting the Markdown parser's `html` option to false does not disable that HTML clipboard path.

The inspected lockfile and installed packages contain Tiptap 3.20.1, ProseMirror View 1.41.6, Markdown-it 14.1.1 and linkify-it 5.0.0. An isolated synthetic check confirmed disproportionate processing time for Markdown reference input. The vulnerable paste code path is present, but application-specific script execution has not been reproduced. Other findings need their own reachability assessment; package presence alone does not prove exploitation.

The existing `markdown-journal-input` spec requires headings, bold, italic and lists; it excludes links and other rich media. `auto-analyze-on-paste` requires a qualifying paste to trigger the effective analysis mode exactly once. The current StarterKit implicitly enables some features beyond the documented subset, including links; implementation must align editor extensions with the restricted contract.

## Goals / Non-Goals

**Goals:**

- Establish a cleanup boundary before the editor interprets external HTML or clipboard metadata.
- Preserve supported formatting through paste, Markdown serialization, saving and history display.
- Resolve the reviewed editor dependency findings through compatible updates and verify the resolved dependency graph.
- Keep normal paste, selection replacement, undo and existing analysis triggers predictable.

**Non-Goals:**

- Entry-size limits, a plain-text replacement editor, a separate preview mode, or unrestricted document import.
- General-purpose preservation of fonts, colors, page layouts, images, tables or arbitrary office-document styling.
- Fixing public image access, WebSocket dependencies, other tooling findings or broader security audit gaps.

## Decisions

### 1. Update the editor dependencies as one compatible group

Review current publisher advisories and compatible releases at implementation time. The already reviewed minimum floors are:

| Package group | Reviewed floor | Reason |
| --- | --- | --- |
| Tiptap core and compatible Tiptap family | 3.30.5 | Includes the 3.30.4 attribute-merging fix and 3.30.5 Markdown attribute-parser fix |
| ProseMirror View | 1.42.3 | Validates clipboard context attributes |
| Markdown-it, current 14.x line | 14.3.3 | Reference parsing and HTML parsing fixes |
| linkify-it | 5.0.2 | Covers both reviewed scanning findings |

These floors are review inputs, not a claim that they cover future advisories. Check all installed copies and peer compatibility, including `tiptap-markdown`. Prefer compatible parent updates; use a narrowly documented override only when necessary and supported by the parent range. Do not use a blanket forced dependency fix or change unrelated dependency groups.

Keep `tiptap-markdown` and the Markdown storage interface if compatibility checks pass. A replacement Markdown integration would need separate review if it changes parsing or saved output. Confirm heading, emphasis and list round trips before accepting the update.

### 2. Clean incoming HTML before ProseMirror clipboard parsing

Use a maintained browser HTML sanitizer, with DOMPurify as the proposed choice, in a dedicated helper. Configure an explicit allowed subset; do not rely on its default broad HTML support or a regular expression sanitizer. Select and review its package version during implementation.

Integrate through the pre-parse HTML transformation hook used by paste and external drop. ProseMirror invokes its ordinary `handlePaste` callback after parsing, so cleanup only in the existing `handlePaste` callback would be too late. Keep that callback's analysis-trigger bookkeeping separate from the cleanup.

The canonical output consists of paragraphs, line breaks, headings h1-h3, strong/emphasis, unordered/ordered lists and list items. Allow only a validated integer `start` attribute for ordered lists. Remove all other attributes, including event handlers, URLs, arbitrary styles, classes, ids, `data-*` and `data-pm-slice`. Unwrap harmless unsupported containers while retaining readable text and supported descendants. Remove active or embedded content and its non-journal contents.

Use sanitizer hooks or inert, structured normalization with a final strict sanitization pass. Any normalization after an initial sanitization must be followed by the strict pass; raw clipboard fragments must never be reinserted. Do not execute pasted content, attach it to an active document, load external stylesheets or fetch embedded resources during cleanup.

Plain-text paste continues through the updated Markdown parser. If a clipboard has no meaningful formatted HTML and contains raw Markdown, preserve the existing Markdown interpretation. If cleaning HTML yields no usable content, use the clipboard's plain text when available; never retry the original HTML. A cleanup failure leaves the existing entry intact and reports a simple paste failure without logging journal content.

Alternative considered: plain-text-only paste. Rejected because it loses copied headings and bold, contrary to the user's requirement. Passing HTML directly to the updated parser offers fewer independent controls than the restricted cleanup boundary.

### 3. Normalize known formatting representations into the supported subset

Preserve semantic headings, `strong`/`b`, `em`/`i`, paragraphs and lists. Map heading levels h4-h6 to the editor's supported h3 level. Preserve inline-style bold and italic from common document clipboard content using narrowly recognized `font-weight` and `font-style` values, then remove the original styles. Treat explicit normal weight correctly rather than turning an entire wrapper into bold.

For representative Word/Google Docs fixtures, normalize explicit heading semantics such as supported heading-role metadata or recognized document heading markers into fixed h1-h3 elements before stripping metadata. Never infer a heading solely from font size, execute CSS, or retain arbitrary document classes. The compatibility promise covers supported semantics, not every visual style that resembles a heading.

Keep readable link text without clickable links, omit media, and preserve readable text from unsupported layouts. Explicitly configure editor extensions to match the supported subset so typing, Markdown paste and HTML paste do not reintroduce excluded features.

Alternative considered: retaining arbitrary source styles to maximize visual similarity. Rejected because the app's formatting contract is deliberately small and source styles can carry unnecessary behavior and metadata.

### 4. Preserve the analysis and persistence contracts

Apply the cleaned paste as one user edit. The word-count decision uses the final visible content, and a qualifying paste invokes the effective analysis mode exactly once. Cleanup, fallback or rejection must not introduce duplicate submissions or stale paste flags. Dropping content must not create a new automatic-analysis trigger; retain existing paste-only semantics. Disabled editing remains enforced.

Store and emit Markdown through the existing component contract. History continues to use its separate restricted Markdown renderer. Existing database rows require no rewrite. Keep raw HTML disabled in Markdown processing and automatic Markdown link recognition disabled.

## Risks / Trade-offs

- **Document clipboard formats vary** → Test representative semantic HTML, styled emphasis, Word/Docs heading wrappers and literal Markdown. Record unsupported visual-only heading conventions rather than promising lossless import.
- **Dependency updates alter parser output or editor behavior** → Test semantic round trips, selection replacement, undo, keyboard shortcuts and the current analysis modes before accepting versions.
- **Cleanup misses metadata or an external-drop path** → Test the earliest parser boundary and both paste/drop paths; assert that removed attributes never reach the editor parser.
- **Sanitizer normalization accidentally restores unsafe markup** → Build only fixed allowed elements and attributes, finish with strict sanitization, and test harmless execution markers with external requests blocked.
- **A sanitation-only change leaves known dependency bugs present** → Require both the resolved dependency update and the clipboard boundary; neither substitutes for the other.
- **Very large inputs can still consume browser resources** → This change fixes the reviewed parsing bugs but makes no general input-size guarantee. Entry limits remain a separate decision, as the user selected options 1 and 2 only.

## Migration Plan

1. Review and approve these artifacts, then implement on the repository's normal `main` workflow.
2. Read the Node runtime runbook, resolve compatible dependencies with the required Node version, and keep lockfile URLs public-registry safe.
3. Implement cleanup and focused regression coverage; run the required local checks and a local mock-provider/browser review using synthetic content. Do not use real journals or paid provider calls for security fixtures.
4. Update the October tracker and debt status with exact versions, checks and remaining risks. This planning change does not close findings.
5. Present a running local review link with copy/paste checks. Deploy only through the separately approved release process.
6. No database or environment migration is needed. **Environment / Railway variables:** none new, changed or removed. Deployment rebuilds the application bundle.

Rollback can restore the previous application/dependency commit without data migration, but that would restore the known dependency risks. Prefer a forward correction; do not describe a vulnerable rollback as a security resolution.

## Evidence References

- [ProseMirror paste advisory](https://github.com/ProseMirror/prosemirror-view/security/advisories/GHSA-c8x8-7fp4-3x9w) and [pre-parse validation fix](https://github.com/ProseMirror/prosemirror-view/commit/2e91a612bbc1248e55b4f6061fc93fe459f977c1).
- [Tiptap attribute merging](https://github.com/ueberdosis/tiptap/security/advisories/GHSA-cp6q-959q-f8rh) and [Markdown attribute parsing](https://github.com/ueberdosis/tiptap/security/advisories/GHSA-j95f-988m-3j2f).
- [Markdown-it reference parsing](https://github.com/markdown-it/markdown-it/security/advisories/GHSA-gfr2-rv44-r23c).
- [linkify-it scanning](https://github.com/markdown-it/linkify-it/security/advisories/GHSA-22p9-wv53-3rq4) and [mailto scanning](https://github.com/markdown-it/linkify-it/security/advisories/GHSA-v245-v573-v5vm).
- [DOMPurify configuration and normalization cautions](https://github.com/cure53/DOMPurify#can-i-configure-dompurify).
