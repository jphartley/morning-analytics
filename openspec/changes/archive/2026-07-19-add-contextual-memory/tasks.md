## 1. Data Model and Shared Contracts

- [x] 1.1 Add a Supabase migration for user-scoped `memories` and `memory_evidence` tables, indexes, foreign-key behavior, and RLS policies.
- [x] 1.2 Add a nullable JSONB memory-context snapshot column to `analyses` without changing existing rows.
- [x] 1.3 Add strict TypeScript types and parsers for memory records, evidence, temporal states, confidence/significance, selector output, update operations, and analysis snapshots.
- [x] 1.4 Add database and parser tests covering valid records, malformed AI output, enum rejection, versioning, and user ownership fields.

## 2. Memory Persistence and Ownership

- [x] 2.1 Implement server storage functions that list the compact user memory catalog and fetch complete records with ordered evidence.
- [x] 2.2 Implement validated create/update/consolidation persistence that increments memory versions and appends grounded evidence.
- [x] 2.3 Implement user-scoped full reset while preserving analyses, images, and saved memory-context snapshots.
- [x] 2.4 Extend analysis persistence and history reads to store and return the exact memory-context snapshot used.
- [x] 2.5 Add storage tests for cross-user rejection, reset isolation, evidence ordering, snapshot survival, and empty-store behavior.

## 3. AI Memory Selection and Updating

- [x] 3.1 Add persona-independent prompts and structured-output handling for fuzzy relevance selection over original journal text and the compact memory catalog.
- [x] 3.2 Implement server validation that resolves only current user-owned selector IDs and enforces at most five memories and 150 words.
- [x] 3.3 Extend Gemini analysis input with a clearly separated contextual-memory section that preserves today's writing as primary and uncertainty as uncertainty.
- [x] 3.4 Add a post-save structured memory-update call that receives original journal text, entry date, and compact memory catalog but never generated analysis text.
- [x] 3.5 Validate update operations, ownership, field lengths, enums, and evidence excerpts against the source journal before persistence.
- [x] 3.6 Add deterministic `USE_AI_MOCKS=true` behavior for selection and update flows.
- [x] 3.7 Add tests for indirect selection, no-selection fallback, AI-call failure fallback, subjective attribution, consolidation, evidence grounding, and context bounds.

## 4. Daily Analysis Orchestration

- [x] 4.1 Update the normal analysis flow to select relevant memory before persona analysis in Quiet, Insight, and Test views.
- [x] 4.2 Preserve progressive text display and continue memory-free when selection fails or no memory is relevant.
- [x] 4.3 Save the selected memory snapshot with the completed analysis and invoke memory update exactly once after successful persistence.
- [x] 4.4 Keep pending or failed memory updates out of the state that controls readable analysis, image results, and History availability while exposing a user-safe warning.
- [x] 4.5 Add orchestration tests for empty memory, successful enrichment, selection failure, save failure, update failure, and exactly-once update behavior.

## 5. Test-View Configuration

- [x] 5.1 Reconcile the active `persist-top-bar-presets` change before modifying view-mode restoration and available-mode logic.
- [x] 5.2 Add `NEXT_PUBLIC_TEST_VIEW_ENABLED` with backward-compatible visible behavior when true or unset.
- [x] 5.3 Hide the Test option when disabled and coerce a stored `test` preference to `insight` without affecting contextual memory in other views.
- [x] 5.4 Document the new variable in `.env.example` without secret values and add configuration tests for enabled, disabled, unset, and stored-Test cases.

## 6. Memory Diagnostic Drawer and Rebuild Controls

- [x] 6.1 Build a lightweight Test-only drawer that lists the complete read-only memory store with summary, confidence, temporal state, dates, retrieval terms, and expandable evidence.
- [x] 6.2 Highlight the memory IDs and versions used by the currently displayed saved analysis, with snapshot fallback after a memory changes or reset.
- [x] 6.3 Add confirmed full reset with progress, success, and user-safe failure states.
- [x] 6.4 Add a positive bounded numeric rebuild input defaulting to 7 and a confirmed rebuild action.
- [x] 6.5 Implement rebuild by selecting the newest N owned entries, reversing only the selected window, and replaying it oldest-to-newest after clearing memory.
- [x] 6.6 Show sequential rebuild progress, continue after entry-local failures, and retain attempted, succeeded, and skipped diagnostics while leaving reset/retry available.
- [x] 6.7 Add tests proving rebuild chooses the newest N rather than the oldest N, applies newest evidence last, and never crosses user ownership.

## 7. Ephemeral Blind Comparison

- [x] 7.1 Add a Test-only comparison action for new entries that runs memory selection once and generates memory-on and memory-off text results with the same model and persona.
- [x] 7.2 Randomize unlabeled A/B presentation and keep condition labels hidden until A, B, or no meaningful difference is selected.
- [x] 7.3 Reveal the conditions and selected memories without persisting preference, random order, or comparison outcome.
- [x] 7.4 Allow only an explicitly chosen result to continue through image generation and saving, then update memory once from the original writing.
- [x] 7.5 Keep comparison controls unavailable for historical entries and add UI/orchestration tests for reveal, tie handling, chosen-result persistence, and rejected-result exclusion.

## 8. Verification and Handoff

- [x] 8.1 Run focused unit and component tests for memory, storage, view configuration, drawer, rebuild, and comparison flows.
- [x] 8.2 Run `npm run lint`, `npm run build`, and `npm run check:lockfile-registry` from `app/`.
- [ ] 8.3 Manually verify with `USE_AI_MOCKS=true`: normal analysis, memory-free fallback, Test drawer, reset, rebuild default 7, newest-N ordering, blind comparison, chosen-result image generation, and History reload.
- [x] 8.4 Manually verify a real Gemini run where an indirect reference retrieves appropriate context without evidence excerpts or unrelated memory entering the analyst prompt.
- [x] 8.5 Update `docs/current-architecture.md` and relevant deployment documentation with the three-call memory flow, schema, failure behavior, Test-view flag, and deferred retrieval scaling.
- [x] 8.6 Include an Environment / Railway variables handoff and PR section listing `NEXT_PUBLIC_TEST_VIEW_ENABLED` as new, requiring an update in the Railway `morning-analytics` production environment followed by review and redeploy.
- [x] 8.7 Review `memory-backlog.md` and `TechnicalDebt.md`, adding any newly deferred implementation debt before verification is considered complete.

## 9. Deterministic Evidence and Rebuild Diagnostics

- [x] 9.1 Divide each original journal entry into deterministic exact-text source blocks and send all blocks for that entry together in the memory inference call.
- [x] 9.2 Replace free-form evidence excerpts with separate Gemini `creates` and `updates` arrays that reference validated source block IDs.
- [x] 9.3 Resolve evidence block IDs to exact original text on the server before persistence, while preserving ownership, enum, and field-length validation.
- [x] 9.4 Continue rebuild after entry-local inference or persistence failures and aggregate attempted, succeeded, and skipped results.
- [x] 9.5 Show a detailed, journal-text-free rebuild bug report containing entry date, analysis ID, failure category, and safe diagnostic message.
- [x] 9.6 Add parser, source-block, inference, rebuild, and diagnostic UI tests for the revised contract and failure behavior.
