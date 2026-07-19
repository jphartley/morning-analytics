## Why

Daily analyses currently interpret each stream-of-consciousness entry in isolation, so they guess incorrectly about recurring people, relationships, emotions, and life events that earlier entries already explain. The application needs a compact, inspectable contextual memory that enriches a new analysis without allowing historical context to overwhelm the user's current writing.

## What Changes

- Infer significant, user-scoped memories exclusively from original journal writing after each completed analysis, consolidating related evidence into evolving records with confidence and temporal state.
- Select relevant memories with a dedicated AI relevance step before analysis, then inject at most five compact memories and 150 words into every analyst persona in every view.
- Preserve dated source excerpts for inspection and future capabilities without sending those excerpts to the daily analyst.
- Record which memory versions informed each saved analysis so Test view can identify the context used.
- Add a Test-view diagnostic drawer that exposes the complete read-only memory store, evidence, status, confidence, and per-analysis usage.
- Add Test-view controls to reset memory and deterministically rebuild it from the newest configurable number of journal entries, defaulting to seven.
- Add an ephemeral blind comparison for new entries that presents memory-on and memory-off text analyses as randomized A/B results, saves only the preferred result, and does not persist the preference.
- Add `NEXT_PUBLIC_TEST_VIEW_ENABLED` so deployments can hide the Test view and its experimental controls at build time while contextual memory continues to operate in all views.
- Keep analyst-generated suggestions, individual memory correction/deletion, history-deletion propagation, and weekly/monthly summaries out of the initial change as tracked in `memory-backlog.md`.

## Capabilities

### New Capabilities

- `contextual-memory`: User-scoped memory inference, consolidation, evidence, lifecycle, relevance selection, bounded prompt injection, and analysis-usage provenance.
- `memory-experimentation`: Read-only Test-view diagnostics, reset/rebuild controls, and ephemeral blind comparison behavior.

### Modified Capabilities

- `journal-analysis`: Enrich daily analysis with bounded relevant memory and update memory after the preferred analysis is saved without blocking the readable result.
- `analysis-storage`: Persist contextual-memory records, evidence, and the memory versions used by an analysis with user isolation.
- `view-density-modes`: Make Test view build-time configurable and show memory experiment controls only when Test view is enabled and selected.

## Impact

- Adds Supabase schema and RLS changes for memories, evidence, and per-analysis memory usage.
- Adds server-side Gemini flows and structured outputs for relevance selection and post-analysis memory updates.
- Changes the analysis orchestration in `app/app/page.tsx`, `app/app/actions.ts`, and `app/lib/gemini.ts` while preserving the existing text-first progressive display.
- Adds Test-view memory diagnostics and comparison UI components.
- Adds the new public build-time environment variable `NEXT_PUBLIC_TEST_VIEW_ENABLED`; Railway production must set the intended value and redeploy for changes to take effect.
- Memory mutations use the existing trusted server-write pattern and inherit the critical production debt concerning client-supplied user IDs documented in `TechnicalDebt.md`; every read and mutation must still enforce explicit user ownership.
- The active `persist-top-bar-presets` change may overlap Test-view option restoration and must be reconciled during implementation.

## Environment / Railway variables

- **New:** `NEXT_PUBLIC_TEST_VIEW_ENABLED`. Add the intended value to the Railway `morning-analytics` service in the **production** environment.
- Review Railway's staged variable changes, then deploy or redeploy; saving the variable alone does not update the running application.
- This is a `NEXT_PUBLIC_*` build-time value, so the redeploy must rebuild the client bundle.
- No environment variables are changed or removed by this change.
