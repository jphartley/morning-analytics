# Feature Backlog

A curated list of straightforward, visible, and testable improvements to Morning Analytics. Each entry is sized for use as a practice backlog for Claude-assisted development workflows.

**Size key:** S = Small, M = Medium, L = Large, XL = Extra Large
**Difficulty key:** Easy, Medium, Hard

---

## 1. Word Count Indicator on Journal Input

**Short description:** Live word count displayed below the editor as the user types.

**Detailed description:** Add a word count indicator beneath the TipTap editor in JournalInput. The counter should update in real time as the user types or pastes text. It should also visually indicate the 300-word threshold that triggers auto-analyze on paste — for example, the count could change color or show a subtle marker at 300 words. This gives users immediate feedback about how much they've written and awareness of the auto-analyze behavior. The word count is already computed internally (for the paste-to-analyze feature), so this is mostly about surfacing it in the UI.

**Category:** UI Polish & Feedback

**Size:** S
**Difficulty:** Easy

---

## 2. Image Counter in Lightbox

**Short description:** Show a "2 of 8" position indicator in the lightbox image viewer.

**Detailed description:** The Lightbox component currently has previous/next arrows and a close button, but no indication of where the user is in the image set. Add a position indicator (e.g., "2 of 8") displayed at the bottom center of the lightbox. The `currentIndex` and `imageUrls.length` are already available in component state, so this is purely a layout addition. The indicator should use a semi-transparent background to stay readable over any image. Consider whether to also add dot indicators or thumbnail strips as a stretch goal, but the core task is just the text counter.

**Category:** UI Polish & Feedback

**Size:** S
**Difficulty:** Easy

---

## 3. Fade-In Animation for Analysis Text

**Short description:** Smooth fade-in transition when the analysis panel first appears.

**Detailed description:** When the app transitions from the "analyzing" loading state to "text-ready", the AnalysisPanel currently appears instantly. Add a CSS transition (opacity 0 to 1, optionally with a slight upward translate) so the analysis text fades in smoothly. This should be a mount animation — triggered when the AnalysisPanel first renders in the DOM. Options include a CSS `@keyframes` animation applied via a class, or a React state-driven transition (e.g., start with opacity-0, flip to opacity-100 after mount). The same treatment could optionally apply to the ImageGrid when it appears in the "complete" state.

**Category:** UI Polish & Feedback

**Size:** S
**Difficulty:** Easy

---

## 4. Date Grouping in History Sidebar

**Short description:** Group history entries under date headers like "Today", "Yesterday", "This Week", "Older".

**Detailed description:** The HistorySidebar currently renders a flat list of entries sorted by date. Introduce date-based grouping so entries are bucketed under contextual headers. Suggested groups: "Today", "Yesterday", "This Week", "This Month", "Older". The grouping logic processes the existing `created_at` timestamps — no backend changes needed. Each group header should be a small, styled label (e.g., uppercase, muted text) that visually separates the sections. If a group has no entries, it should not render. This improves scannability for users with many entries and gives the sidebar a more polished feel.

**Category:** UI Polish & Feedback

**Size:** M
**Difficulty:** Easy

---

## 5. Skeleton Loading Placeholders

**Short description:** Replace the history sidebar spinner with animated skeleton placeholders.

**Detailed description:** The HistorySidebar currently shows a spinner and "Loading history..." text while fetching. Replace this with 4-5 skeleton placeholder rows that mimic the shape of real history entries — a short line for the date and two longer lines for the text preview, all using a pulsing animation (Tailwind's `animate-pulse` on gray rectangles). This is a common modern UI pattern that feels faster to the user because it communicates the shape of incoming content. The skeleton should match the dimensions and spacing of real entries so there's no layout shift when data loads.

**Category:** UI Polish & Feedback

**Size:** S
**Difficulty:** Easy

---

## 6. Persona Badge on Fresh Analysis Results

**Short description:** Show the "Analyzed by: Jungian Analyst" badge on live results, not just in history view.

**Detailed description:** When viewing a historical analysis, the app shows an "Analyzed by: [persona]" badge above the analysis text. However, when viewing a freshly completed analysis (state "text-ready" or "complete"), this badge is absent. Add the same badge to the live results view so the user always sees which persona produced the analysis. The `selectedPersona` state is already available in the page component — the persona display name mapping (jungian -> "Jungian Analyst", etc.) can be extracted into a shared utility since it's currently duplicated in the history view JSX.

**Category:** UI Polish & Feedback

**Size:** S
**Difficulty:** Easy

---

## 7. Copy Analysis to Clipboard

**Short description:** A button on the AnalysisPanel that copies the analysis markdown to the clipboard.

**Detailed description:** Add a small copy icon button in the top-right corner of the AnalysisPanel header (next to the "Analysis" heading). When clicked, it should copy the raw `analysisText` markdown to the clipboard using `navigator.clipboard.writeText()`. After copying, show a brief visual confirmation — either change the icon to a checkmark for 2 seconds, or show a small "Copied!" tooltip/toast. The button should be subtle (muted color, small size) so it doesn't dominate the analysis header. This is useful for sharing analysis text with others or pasting into notes.

**Category:** Small Interactive Features

**Size:** S
**Difficulty:** Easy

---

## 8. Download Image from Lightbox

**Short description:** Add a download button to the lightbox for saving the current image.

**Detailed description:** Add a download button to the Lightbox component, positioned near the existing close button (e.g., top-right area, to the left of the close button). When clicked, it should trigger a browser download of the currently displayed image. For Supabase storage URLs (history view), this can use a dynamically created `<a>` element with the `download` attribute. For base64 data URLs (fresh analysis), convert to a Blob and use `URL.createObjectURL`. The filename should be descriptive (e.g., `morning-analytics-1.jpg`). Note: CORS headers on the Supabase storage bucket may need to be verified — if the bucket is configured for public read, downloads should work. If CORS blocks the download, a fallback of "open in new tab" is acceptable.

**Category:** Small Interactive Features

**Size:** S
**Difficulty:** Medium

---

## 9. Collapsible Original Input in History View

**Short description:** Make the "Original Input" section in history view collapsed by default with a toggle.

**Detailed description:** When viewing a historical analysis, the original journal input is always displayed in full above the analysis. For long entries (morning pages can be 1000+ words), this pushes the analysis far down the page. Make this section collapsible: collapsed by default showing just the header "Original Input" with a chevron toggle, expandable to reveal the full text. Use a simple `useState` boolean for the toggle. Consider showing a brief preview (first line or two) in the collapsed state to give context without taking up space. Add a smooth height transition for the expand/collapse animation using CSS `max-height` or `grid-template-rows` technique.

**Category:** Small Interactive Features

**Size:** S
**Difficulty:** Easy

---

## 10. Keyboard Shortcut for Analyze

**Short description:** Wire up Cmd+Enter (Mac) / Ctrl+Enter (Windows) to trigger the Analyze action, and show the hint on the button.

**Detailed description:** Currently the only way to trigger analysis is clicking the "Analyze" button (or pasting 300+ words for auto-analyze). Add a keyboard shortcut: Cmd+Enter on Mac, Ctrl+Enter on other platforms. This requires a `useEffect` with a `keydown` listener on the document that checks for the modifier key + Enter combo, then calls `onAnalyze` if the input has content and isn't disabled. Also update the button label to show the shortcut hint — e.g., "Analyze (Cmd+Enter)" in a smaller, muted font. The shortcut should only fire when the app is in the "idle" state and text is non-empty. Be careful not to intercept the shortcut when the user might expect it to do something else (e.g., in a modal).

**Category:** Small Interactive Features

**Size:** S
**Difficulty:** Easy

---

## 11. Auto-Save Draft to localStorage

**Short description:** Persist journal input text to localStorage so it survives page refreshes.

**Detailed description:** If a user types a long journal entry and accidentally refreshes the page (or closes the tab), their work is lost. Add auto-save: on every text change (debounced by ~500ms), persist the journal text to `localStorage` under a key like `morning-analytics-draft`. On component mount, check for a saved draft and restore it into the editor. Clear the draft after a successful analysis submission. Consider showing a subtle "Draft saved" indicator so the user knows their work is safe. Edge cases to handle: (1) Don't restore a draft if the user arrived via a history item click. (2) The TipTap editor needs the value set via `editor.commands.setContent()`, which the existing sync logic already handles via the `value` prop.

**Category:** Small Interactive Features

**Size:** M
**Difficulty:** Easy

---

## 12. Mobile History Sidebar (Drawer)

**Short description:** Make the history sidebar accessible on mobile via a hamburger menu / slide-out drawer.

**Detailed description:** The HistorySidebar is currently `hidden md:flex`, making it invisible on mobile. Add a mobile-friendly drawer pattern: a hamburger icon button in the AppHeader (visible only below `md` breakpoint), which toggles a slide-out drawer from the left edge. The drawer should overlay the main content with a semi-transparent backdrop. Tapping the backdrop or selecting a history item should close the drawer. The drawer content is the same HistorySidebar component. Implementation involves: (1) a `useState` toggle in the parent or a new wrapper component, (2) conditional rendering of the overlay + sidebar, (3) a CSS transform transition for the slide-in animation, and (4) body scroll lock when the drawer is open. The existing sidebar remains as-is for `md+` breakpoints.

**Category:** Small Interactive Features

**Size:** M
**Difficulty:** Medium

---

## 13. Welcome Empty State

**Short description:** Show a welcoming message and brief guide when the app is idle and the user has no history.

**Detailed description:** When a new user first lands on the app (idle state, no history entries), the page shows just the editor and button with no context. Add a welcoming empty state that briefly explains the app flow: (1) Paste or type your morning pages, (2) Get an AI-powered psychoanalytic analysis, (3) Receive 4 artistic images inspired by your writing. This could be a simple card below the input area, or a set of 3 small illustrated steps. It should disappear after the user's first analysis. Detection: check if the history sidebar has zero entries (could pass this as a prop, or use a separate lightweight check). Keep it visually lightweight — this is a nudge, not an onboarding wizard.

**Category:** New User Experience

**Size:** S
**Difficulty:** Easy

---

## 14. Persona Description Tooltips

**Short description:** Show a brief description of each analyst persona on hover in the AnalystPicker.

**Detailed description:** The AnalystPicker dropdown shows persona names ("Jungian Analyst", "Mel Robbins", "Loving Parent") but doesn't explain what each one does. New users have to guess. Add tooltip descriptions that appear on hover over each option — for example, "Psychoanalytic depth, symbols, and spiritual insights" for Jungian. Implementation options: (1) use the HTML `title` attribute for zero-dependency tooltips, (2) add a custom positioned tooltip component for a polished look, or (3) add description text below each option name inside the dropdown. The persona descriptions already exist conceptually in CLAUDE.md and the prompt files — extract a one-liner for each. This is a small change with meaningful impact on new user comprehension.

**Category:** New User Experience

**Size:** S
**Difficulty:** Easy

---

## 15. Image Prompt Reveal

**Short description:** Add a toggle below the image grid to show/hide the prompt that was sent to generate images.

**Detailed description:** After images are generated, users may be curious what prompt produced them. Add a "Show image prompt" toggle (or expandable section) below the ImageGrid. When expanded, it displays the `imagePrompt` text in a styled code/quote block. This is educational and interesting — users can see how the AI translated their journal text into visual imagery instructions. The `imagePrompt` is already available in state (`currentImagePrompt` for fresh analyses, `historyViewData.imagePrompt` for history views). The toggle should default to collapsed. Consider a copy button on the prompt text as well, so users can reuse prompts in other tools.

**Category:** New User Experience

**Size:** S
**Difficulty:** Easy

---

## 16. Section Quick-Nav for Long Analyses

**Short description:** Render a pill bar of heading links above long analyses for quick-jumping to sections.

**Detailed description:** Jungian analyses in particular tend to be long and structured with multiple H2/H3 headings (e.g., "Archetypal Themes", "Shadow Work", "Integration"). Add a quick-nav bar above the AnalysisPanel that extracts headings from the markdown text (via regex or a remark plugin), renders them as clickable pills/chips, and scrolls to the corresponding section on click. Implementation: (1) parse `analysisText` for `## Heading` and `### Heading` patterns, (2) render as a horizontal scrollable pill bar, (3) assign `id` attributes to rendered heading elements in the ReactMarkdown `components` config, (4) use `document.getElementById(id).scrollIntoView()` on click. Only show the nav bar if there are 3+ headings. This improves readability for substantive analyses.

**Category:** Analysis Experience

**Size:** M
**Difficulty:** Medium

---

## 17. Reading Time Estimate

**Short description:** Display an estimated reading time (e.g., "~3 min read") on the AnalysisPanel.

**Detailed description:** Add a reading time estimate to the AnalysisPanel header, next to or below the "Analysis" title. Calculate based on average reading speed (~200-250 words per minute). The formula is simple: `Math.ceil(wordCount / 200)` minutes. Display as "~3 min read" in small, muted text. The word count comes from splitting `analysisText` on whitespace. This sets expectations for the user before they start reading, which is especially useful for long Jungian analyses. The estimate should not count markdown syntax characters. Consider also displaying the word count itself (e.g., "~3 min read (650 words)") for users who care about analysis depth.

**Category:** Analysis Experience

**Size:** S
**Difficulty:** Easy

---

## 18. Toggle Image Grid Layout

**Short description:** Add a toggle to switch between 2x2 grid and single-column layout for generated images.

**Detailed description:** The ImageGrid currently always renders images in a 2-column grid (`grid-cols-2`). Some images have detail that's hard to appreciate at half-width. Add a layout toggle (two small icon buttons: grid icon and list icon) in the ImageGrid header that switches between the 2-column grid and a single-column stack. Persist the preference to `localStorage` so it sticks across sessions. The toggle state controls the Tailwind grid class (`grid-cols-2` vs `grid-cols-1`). In single-column mode, consider capping image width at a reasonable max (e.g., `max-w-2xl mx-auto`) so images don't stretch to full page width on large screens. The toggle should be visually subtle and positioned near the "Generated Images" heading.

**Category:** Analysis Experience

**Size:** M
**Difficulty:** Easy
