## Context

The feature was completed through Temper and is already present on `main`. Analyses are stored in Supabase and may reference generated objects in the shared `analysis-images` bucket. The server-side client uses service-role access, so explicit ownership validation and strict storage-path scoping are required before irreversible work.

## Goals / Non-Goals

**Goals:**

- Provide one consistent delete flow from both history surfaces.
- Prevent cross-user and cross-analysis deletion.
- Keep partial failures truthful and retry-safe.
- Preserve keyboard focus and deterministic history navigation.

**Non-Goals:**

- Bulk deletion, trash, undo, or soft deletion.
- Repairing the project-wide client-supplied-user-id debt.
- Changing database schemas, RLS policies, or storage bucket policies.

## Decisions

### Centralize orchestration in the page

The page owns the selected analysis and receives the sidebar's ordered entry list, so it coordinates confirmation, deletion, refresh, and neighbor selection for both delete entry points. Keeping the full flow in the sidebar would duplicate selection logic and could desynchronize the selected view.

### Use a server action backed by a service-role helper

The client calls one server action. The storage helper fetches the row, verifies ownership, resolves a deduplicated set of objects limited to the `{analysisId}/` prefix, removes those objects, and then deletes the row. A browser-only RLS delete cannot reliably clean up service-managed storage objects.

### Delete storage before the database row

If storage removal fails, retaining the row keeps the operation discoverable and retryable. If row deletion fails after storage succeeds, another attempt can safely repeat the idempotent storage step and finish deleting the row. Deleting the row first could strand images without a retryable record.

### Extract deterministic pure helpers

Storage-path resolution and post-delete neighbor selection are pure functions so prefix safety, deduplication, and navigation rules can be verified without a browser or live Supabase dependency.

### Restore focus with a fallback

The confirmation dialog records its opener, traps focus while mounted, and restores focus on close. If successful deletion removes the opener from the DOM, focus moves to a stable new-analysis control instead of falling back to the document body.

## Risks / Trade-offs

- [Service-role access can bypass RLS] → Verify row ownership before any delete and restrict every storage path to the analysis prefix.
- [Two-store deletion cannot be transactional] → Use storage-first ordering, idempotent cleanup, truthful errors, and retry-safe behavior.
- [The sidebar entry can disappear before focus restoration] → Use a stable fallback focus target.
- [The action receives a client-provided user identifier] → Preserve the existing application pattern for this completed change and retain the broader authentication hardening item as technical debt.

## Migration Plan

No data migration is required. The implementation and tests landed before this specification import. Archive sync adds the `analysis-deletion` capability to the canonical OpenSpec specs.

## Open Questions

None for this completed import.
