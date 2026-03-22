## Context

Users paste morning pages from Day One into the TipTap editor (`JournalInput.tsx`), then manually click "Analyze." The editor already has paste-to-Markdown conversion via the `tiptap-markdown` extension (`transformPastedText: true`). The parent page (`page.tsx`) owns the `handleAnalyze` callback and the app state machine.

## Goals / Non-Goals

**Goals:**
- Auto-trigger analysis when a paste event adds content that brings the editor to 300+ words
- Scroll to the top of the page so the user sees the loading state immediately
- Keep the existing manual "Analyze" button fully functional

**Non-Goals:**
- Detecting paste from specific apps (Day One, etc.) — treat all paste events equally
- Configurable word threshold — 300 is hardcoded for now
- Auto-triggering on typed input that crosses 300 words — only paste events

## Decisions

### 1. Detect paste via TipTap's `onPaste` editor prop, trigger via word count on `onUpdate`

**Approach**: Set a `pasteDetected` ref flag in the editor's `handlePaste` prop. In the existing `onUpdate` callback, check the flag — if a paste just happened and the total word count is ≥ 300, set a `shouldAutoAnalyze` ref flag. A `useEffect` watching `[value, onAnalyze]` then fires `onAnalyze()` after React re-renders.

**Why deferred via `useEffect` instead of calling `onAnalyze()` directly in `onUpdate`**: TipTap's `onUpdate` fires synchronously. Calling `onChange(md)` queues a React state update in the parent (`setJournalText`), but it hasn't flushed yet. If `onAnalyze()` is called in the same synchronous block, `handleAnalyze` reads the stale (empty) `journalText` from its closure, causing the server action to reject with "Please enter some text to analyze." The `useEffect` runs after React commits the state update and re-renders, so `onAnalyze` is a fresh closure with the correct `journalText`.

**Why not pure `onPaste`**: The `handlePaste` callback fires before the editor content is updated, so we can't reliably count words at that point. By deferring to `onUpdate`, we get the final content after TipTap has processed the Markdown transformation.

**Why not `InputEvent` with `inputType === 'insertFromPaste'`**: TipTap abstracts away raw DOM events; hooking into ProseMirror's paste handling is cleaner and more reliable.

**Alternative considered — diffing word count**: Track previous word count and check if the delta from a single update exceeds a threshold. Rejected because what matters is the total content length (a user might paste in two chunks), and counting total words is simpler.

### 2. Word counting uses simple whitespace split

Count words by splitting on `/\s+/` and filtering empty strings. This matches user expectations ("300 words") without needing a locale-aware tokenizer.

### 3. Scroll-to-top happens in `page.tsx` at the start of `handleAnalyze`

Add `window.scrollTo({ top: 0, behavior: 'smooth' })` at the top of `handleAnalyze`. This benefits both auto-triggered and manual analyses — scrolling to top when analysis starts is always useful.

### 4. Debounce / guard against double-trigger

The `onAnalyze` callback already transitions state to `"analyzing"` and disables the editor (`disabled` prop). The `pasteDetected` ref is cleared after each check. This naturally prevents double-triggers.

## Risks / Trade-offs

- **Accidental trigger on small pastes that combine with existing text**: A user with 250 typed words pastes 50 more → auto-triggers. This is acceptable because 300+ words total means they have substantial content. → Mitigated by the threshold being total words, which is intentional.
- **User surprise**: Auto-submitting without explicit action could feel unexpected. → Mitigated by the scroll-to-top making it immediately visible that analysis started. Users can always click "New Analysis" if unintended.
- **TipTap `handlePaste` compatibility**: If TipTap's API changes the paste hook signature, this could break. → Low risk; `handlePaste` is a stable ProseMirror editor prop.
