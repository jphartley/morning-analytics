## Context

Morning Analytics currently sends one journal entry and one persona prompt to Gemini, displays the text result, generates images, and saves the completed analysis. Historical entries are available in Supabase, but no earlier context participates in a new analysis. This causes the analyst to misidentify recurring people and miss context such as a named holiday, ongoing emotional state, or recent life transition.

The initial memory feature is a personal, low-key experiment. It must be inspectable and tunable, but it must not become a general research platform or let historical material dominate a roughly 750-word daily entry. The application already has authenticated, user-scoped analysis history, three analyst personas, progressive text-first display, and a client-selectable Test view. It does not yet have a configurable Test-view visibility flag or a durable memory schema.

The active `persist-top-bar-presets` change may touch the same view-mode restoration code. Implementation must reconcile that overlap before editing top-bar preset behavior. Memory writes also inherit the documented production debt that server actions trust a client-supplied user ID; this change must enforce ownership consistently but does not introduce the broader cookie-based authentication redesign.

## Goals / Non-Goals

**Goals:**

- Improve daily interpretation by supplying only relevant, compact historical context.
- Infer significant memories from original journal writing without clarification questions.
- Preserve uncertainty, subjective attribution, temporal history, and source evidence.
- Keep memory persona-independent, user-scoped, inspectable, and bounded to five records and 150 words per analysis.
- Provide simple Test-view tools to rebuild, inspect, reset, and informally compare memory-on and memory-off analyses.
- Preserve the existing text-first experience when selection or update fails.

**Non-Goals:**

- Learning autobiographical facts or associations from AI-generated analyses.
- Remembering analyst suggestions or tasks.
- Weekly or monthly thematic summaries.
- Individual memory correction or deletion.
- Defining how deleting History entries propagates to memory evidence.
- Persisting blind-comparison preferences or experiment results.
- Building a scalable embedding/vector retrieval system before the compact catalog proves insufficient.
- Turning Test view into an authorization boundary.

## Decisions

### 1. Use consolidated memory records with separate evidence

Store one evolving record per inferred subject or theme rather than one row per extracted fact. A memory contains a title, compact summary, retrieval terms and associations, confidence, significance, temporal state, first/last observation timestamps, and a monotonically increasing version. Evidence rows contain a dated excerpt from the original journal entry, the originating analysis ID when available, and whether the excerpt supports, revises, or conflicts with the record.

Suggested tables:

- `memories`: `id`, `user_id`, `title`, `summary`, `retrieval_terms`, `confidence`, `significance`, `temporal_status`, `version`, `first_observed_at`, `last_observed_at`, timestamps.
- `memory_evidence`: `id`, `memory_id`, `user_id`, `source_analysis_id`, `source_entry_at`, `excerpt`, `effect`, timestamp.
- `analyses.memory_context`: JSONB snapshot of the memory IDs, versions, and exact compact summaries supplied to that analysis.

RLS policies scope memory and evidence reads and mutations to `auth.uid()`. Service-role server writes must explicitly verify the supplied user owns referenced analyses and memory records. Evidence is deliberately separate from prompt context so provenance can grow without consuming the daily memory allowance.

Alternatives considered:

- Atomic fact rows are easier to update independently but create the clutter the experiment is trying to avoid.
- Storing evidence inside one JSONB record simplifies the first migration but makes provenance querying, deduplication, and future correction harder.
- A normalized analysis-memory join table was considered, but a JSONB usage snapshot preserves exactly what the analyst saw even after a memory evolves or the experimental store is reset.

### 2. Separate confidence from temporal state

Confidence represents evidential support and can increase or decrease as later entries reinforce or conflict with a memory. Temporal state represents whether context is `active`, `inactive`, or `uncertain`. Newly inferred claims may remain low-confidence; an event whose outcome is unknown after its expected date becomes uncertain rather than automatically historical. Inactive records remain retrievable for retrospective references.

Subjective descriptions are stored from the writer's perspective. For example, the record may state that the writer has experienced a person's behavior as narcissistic; it must not transform that description into an objective diagnosis.

### 3. Use deterministic source blocks for post-analysis memory updates

After the chosen analysis has been saved, the server divides the original journal entry into small, stable source blocks such as `b1`, `b2`, and `b3`. It sends all blocks for that one entry together, along with the entry date and the user's compact current memory catalog, to a dedicated structured-output Gemini call. The request never contains the generated analyst response.

Gemini returns separate `creates` and `updates` arrays. Each operation identifies one strongest evidence block by ID instead of reproducing a free-form evidence quote. The server validates update memory IDs, ownership, block IDs, enum values, and length limits, then resolves the selected block ID back to the exact original text before persistence. Gemini therefore decides which source passage supports an inference, while the server remains responsible for copying source evidence exactly.

All blocks for one journal entry are supplied in a single call so Gemini can understand the entry as a whole and consolidate related observations. Rebuild still processes journal entries one at a time, oldest-to-newest. A memory-update failure is reported separately and does not remove or hide the completed analysis. Mock mode follows the same block-ID contract with deterministic operations.

Alternatives considered:

- Extracting memory in the analysis call saves one request but entangles persona output with persona-independent autobiographical state.
- Learning from the generated analysis could preserve suggested tasks, but creates a feedback loop in which AI interpretations become progressively anchored. That experiment remains in `memory-backlog.md`.

### 4. Use a dedicated AI relevance selector before analysis

Before daily analysis, a persona-independent structured-output call receives today's original journal text and the compact memory catalog. It receives summaries, retrieval terms, confidence, significance, temporal state, and dates, but not evidence excerpts or previous AI analyses. It returns ranked memory IDs only. The server resolves those IDs from the authenticated user's current store, rejects unknown IDs, and injects at most five compact summaries totaling at most 150 words.

The selector is the fuzzy matching layer needed to resolve indirect references such as “the holiday” or “the narcissists in my life.” The daily analyst receives only the selected summaries, with instructions to treat them as potentially uncertain background and keep today's writing primary.

For the initial single-user experiment, all significant consolidated records can form the compact selector catalog. Adding embeddings or a semantic pre-filter now would add infrastructure before catalog size demonstrates a problem. Retrieval terms remain useful for diagnostics and a future high-recall pre-filter.

Selection failure degrades to analysis without memory. No selection or no sufficiently relevant result injects no memory context.

### 5. Preserve chronological semantics during rebuild

“Rebuild N” queries the newest N analysis rows for the current user, using `created_at DESC LIMIT N`, then reverses that selected window and applies the same memory-update pipeline oldest-to-newest. Thus a rebuild of 14 chooses the most recent 14 entries, never the oldest 14, while applying recent evidence last so it wins temporal and summary updates.

Every rebuild clears the user's current memory and evidence first. It is intentionally sequential and inefficient because it is an occasional Test-view experiment control. A failure for one entry is recorded and skipped so later entries can still contribute. The final diagnostic report identifies every skipped entry by date and analysis ID, classifies the failure, and includes a user-safe technical message without journal text. The numeric input defaults to 7 and accepts a positive bounded integer chosen by implementation to protect request duration.

### 6. Keep diagnostics and destructive controls in Test view

Add a lightweight read-only drawer that lists the complete current memory store and expands each record to show status, confidence, dates, retrieval terms, and dated evidence. When a saved analysis is displayed, compare its `memory_context` snapshot to current records and highlight those used for that analysis.

The drawer includes explicit reset and rebuild actions with destructive confirmation and visible progress/errors. It does not edit or delete individual memories.

Add `NEXT_PUBLIC_TEST_VIEW_ENABLED`, defaulting to the current visible behavior when unset. When false, omit Test from the mode control and coerce a stored `test` preference to `insight`. This only hides UI; reset, rebuild, and all memory mutations must still verify user ownership server-side.

### 7. Keep blind comparison ephemeral and limited to new entries

In Test view, the user may opt to run a new entry as a blind comparison. Relevance selection runs once; the app generates one text analysis with the selected memory and one without it using the same journal entry, model, and persona. Results are randomly assigned to A and B and remain unlabeled until the user chooses A, B, or no meaningful difference.

After reveal, only a preferred result can continue to image generation and saving. If the user selects no meaningful difference, the UI asks them to choose which result to save or leave without saving; it must not invent a preference. The saved result receives the memory-context snapshot it actually used, and the original entry updates memory exactly once afterward. Preference, random order, and comparison outcome remain client-only and are not persisted.

### 8. Preserve progressive display and persona independence

Normal operation uses three AI calls: relevance selection, persona analysis, and post-save memory update. The selector adds pre-analysis latency, while the updater runs after the analysis is already readable and after persistence is available for evidence provenance. Memory operates in Quiet, Insight, and Test views and is identical for all personas; only diagnostics and comparison controls depend on Test view.

## Risks / Trade-offs

- **AI-inferred memory may be wrong or overly salient** → Favor omission, preserve confidence and subjective attribution, cap context, retain evidence, and expose the store in Test view.
- **The selector adds latency and cost** → Use compact records, one selector call, structured IDs, and graceful fallback to memory-free analysis.
- **A growing catalog may eventually overwhelm selection** → Monitor catalog size during the experiment and defer lexical/vector pre-filtering until observed need.
- **Sequential rebuild may partially fail** → Continue past entry-local failures, distinguish attempted/succeeded/skipped counts, and retain a detailed failure report so malformed model output can be diagnosed without exposing journal text.
- **Reset invalidates links to current records** → Preserve per-analysis memory snapshots in JSONB; complete-store highlighting is best-effort after a reset.
- **Fire-and-forget work is unreliable in serverless execution** → Start memory update only through an awaited server action after save, but keep it outside the state that controls readable analysis and image display.
- **Client-selected Test view is not authorization** → Treat the flag as visibility only and enforce ownership in every server action and RLS policy.
- **New public configuration can drift in Railway** → Document the variable in `.env.example`, set it in the production `morning-analytics` service, and redeploy because public values are compiled into the client bundle.

## Migration Plan

1. Add Supabase tables, indexes, RLS policies, and the nullable `analyses.memory_context` JSONB column. Existing analyses remain valid with no memory context.
2. Deploy server-side memory types, validation, selector, updater, persistence, reset, and rebuild actions behind code paths that tolerate an empty store.
3. Add deterministic mock behavior and automated tests before enabling UI controls.
4. Add the Test-view flag, diagnostic drawer, and blind comparison UI.
5. Add `NEXT_PUBLIC_TEST_VIEW_ENABLED` to `.env.example`; set the intended production value in Railway and redeploy.
6. Manually reset and rebuild seven recent entries, inspect the resulting records, then exercise normal and blind-comparison flows.

Rollback disables memory selection/update in application code while leaving additive tables and the nullable analysis column intact. The Test-view flag can hide experiment controls after a rebuild; changing it requires redeployment.

## Open Questions

No blocking design questions remain. Success criteria are intentionally left to the user's informal judgment, and deferred product questions remain in `memory-backlog.md`.
