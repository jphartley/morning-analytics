## 1. Server Analysis Modes

- [x] 1.1 Add a typed single-analysis memory option with memory-enabled default behavior, and make No memory skip relevance selection while returning an empty memory-context snapshot.
- [x] 1.2 Extend server-action tests to prove Use memory selects and injects context, No memory never calls the selector, selector failure still degrades safely, and blind comparison selects memory only once.

## 2. Pre-Submission Mode Control

- [x] 2.1 Add an accessible three-option Test-view control for No memory, Use memory, and Blind comparison, including concise descriptions of the one- versus two-analysis outcomes and future-memory learning behavior.
- [x] 2.2 Add page-level mode state and one submission dispatcher that sends both manual Analyze and automatic paste submissions to the selected single-analysis or blind-comparison path.
- [x] 2.3 Remove the standalone blind-comparison button, keep Use memory as the initial mode, and ensure Quiet, Insight, and historical-analysis views do not expose or execute experimental modes.
- [x] 2.4 Preserve the existing reveal, explicit-result selection, image generation, persistence, stored memory-context snapshot, and exactly-once post-save memory update for all modes.

## 3. UI and Workflow Tests

- [x] 3.1 Add component tests for the selector labels, default selection, accessible radio semantics, change handling, helper text, and disabled state.
- [x] 3.2 Add workflow tests proving the Analyze button routes all three modes correctly and non-Test views always route to the memory-enabled single analysis.
- [x] 3.3 Add paste interaction coverage proving a 300-word paste honors each selected mode and Blind comparison does not first generate or save a single analysis.
- [x] 3.4 Add regression coverage for choosing A, B, no meaningful difference, or neither so only an explicitly selected comparison result can continue and update memory.

## 4. Verification and Handoff

- [x] 4.1 Run the targeted Vitest suites and then the complete `npm test` suite from `app/`.
- [x] 4.2 Run `npm run lint`, `npm run build`, and `npm run check:lockfile-registry` from `app/`.
- [x] 4.3 With `USE_AI_MOCKS=true`, manually verify all three modes in Test view using both the Analyze button and a 300-word paste, and verify Quiet and Insight retain memory-enabled behavior.
- [x] 4.4 Capture an updated Test-view screenshot for the pull request and confirm that no Railway environment variables or database migrations changed.

## 5. Comparison Reading Layout

- [x] 5.1 Stack Analysis A above Analysis B at full width and add regression coverage that prevents the responsive two-column layout from returning.
