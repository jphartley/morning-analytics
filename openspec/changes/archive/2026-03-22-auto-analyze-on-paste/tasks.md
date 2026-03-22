## 1. Paste Detection in JournalInput

- [x] 1.1 Add a `useRef` flag (`pasteDetected`) to track when a paste event occurs in the TipTap editor
- [x] 1.2 Add `handlePaste` to the editor's `editorProps` that sets the `pasteDetected` flag to `true` and returns `false` (allowing default paste handling to continue)
- [x] 1.3 In the `onUpdate` callback, after getting the markdown content: if `pasteDetected` is true, count words (split on `/\s+/`, filter empties), and if count ≥ 300 and `!disabled`, call `onAnalyze()`
- [x] 1.4 Clear the `pasteDetected` flag after checking it in `onUpdate`

## 2. Scroll to Top on Analysis

- [x] 2.1 In `page.tsx`, add `window.scrollTo({ top: 0, behavior: 'smooth' })` at the start of `handleAnalyze`

## 3. Verification

- [x] 3.1 Test: paste 300+ words of text → analysis auto-triggers and page scrolls to top
- [x] 3.2 Test: paste fewer than 300 words → no auto-trigger, button still works manually
- [x] 3.3 Test: type 300+ words without pasting → no auto-trigger
- [x] 3.4 Test: manual "Analyze" button still works for any word count
