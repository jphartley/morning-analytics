# Design: Delete an analysis safely

**Created:** 2026-07-18
**Complexity:** Complex (6-7 files; security/authorization + irreversible data loss)
**Based on:** intent.md, plan.md (both post-Grill-Me revision)

---

## System Architecture

Three cooperating layers, mirroring the existing `regenerateImages` end-to-end shape. Nothing new is
introduced at the framework level — this is a new server action + helper, one pure util, one new
presentational component, and additive props/state on two existing files.

```
                 CLIENT  (page.tsx owns ALL orchestration)
  +----------------------------+        +-------------------------------+
  | HistorySidebar             |        | Selected-view "Delete" button |
  |  - kebab -> onRequestDelete |        |  (viewing-history state)      |
  |  - pendingRemovedId (hide) |        +---------------+---------------+
  +-------------+--------------+                        |
                | onRequestDelete(entry)                | setPendingDelete(...)
                +-------------------+-------------------+
                                    v
                     +------------------------------------+
                     | ConfirmDeleteDialog  (NEW, presentational)
                     |  role=dialog, aria-modal, focus trap
                     |  names date+preview, warns images deleted
                     |  useLayoutEffect cleanup restores focus:
                     |    document.contains(opener) ? opener : fallbackFocusRef
                     +------------------+-----------------+
                                        | onConfirm
                                        v
                     +------------------------------------+
                     | deleteAnalysis(analysisId, userId)  (NEW server action)
                     |  guard !userId / !analysisId; try/catch
                     +------------------+-----------------+
                                        v
                     +------------------------------------+
                     | deleteAnalysisWithImages (NEW helper, service role)
                     |  1. fetch row (id, user_id, image_paths)
                     |  2. VERIFY user_id === userId  ---> reject (delete nothing)
                     |  3. resolveDeletionPaths(...) -> storage.remove  (row intact on fail)
                     |  4. delete row  (only if storage clean)
                     +------------------+-----------------+
                          success       |     failure (row intact, retry-safe)
                                        v
                     +------------------------------------+
                     | page: if deleted === selected ->    |
                     |   selectNeighborId(orderedIds, id)  (NEW pure util)
                     |     id  -> handleHistorySelect(id)  |
                     |     null-> handleNewAnalysis()      |
                     | else -> leave current view untouched|
                     | always: setPendingRemovedId(id),    |
                     |   bump refreshTrigger, announce      |
                     +------------------------------------+
```

**Component inventory:** 3 new (`deleteAnalysis` action, `deleteAnalysisWithImages` helper +
`resolveDeletionPaths` pure util in analytics-storage.ts, `selectNeighborId` pure util,
`ConfirmDeleteDialog` component) · 3 modified (`actions.ts`, `analytics-storage.ts`,
`HistorySidebar.tsx`, `page.tsx`) · existing untouched infra (Supabase service-role client, RLS
DELETE policy, `analysis-images` bucket).

**Data flow (happy path):** confirm → `deleteAnalysis` → `deleteAnalysisWithImages` verifies
ownership → removes owned storage objects under `{id}/` → deletes DB row → `{success:true}` → page
picks neighbor (only if the deleted entry was the open one) → optimistically hides the row, bumps
`refreshTrigger`, announces via an `aria-live` toast.

## API Contracts

### `deleteAnalysis` — server action (NEW, `app/app/actions.ts`)

```
deleteAnalysis(analysisId: string, userId: string): Promise<DeleteAnalysisResponse>

Request:  analysisId  — UUID of the analysis to delete
          userId      — authenticated session user id (from client useAuth(), consistent
                        with analyzeText/generateImages/regenerateImages; inherits the
                        project-wide client-supplied-userId debt — NOT fixed here)

Response (DeleteAnalysisResponse):
          { success: true }
          { success: false, error: string }   // generic, secret-free, retry-safe

Errors (all return success:false with a user-safe message; full detail logged server-side):
          !userId                    -> "User must be authenticated to delete analysis."
          !analysisId                -> "No analysis specified."
          row not found              -> "Analysis not found."
          row.user_id !== userId     -> "Not authorized to delete this analysis."
          storage remove failed      -> "Couldn't remove all images — please retry."  (row intact)
          db delete failed           -> "Couldn't finish deleting — please retry."     (storage gone)
          unexpected throw           -> "Failed to delete analysis."
```

- `"use server"`, structured exactly like `regenerateImages` (actions.ts:208-279): guards, delegates
  to the helper, wraps in try/catch, returns a plain result object.
- This is the ONLY server entry point the client calls. It does not surface internal error `code`s;
  it maps them to the fixed user-safe strings above.

### `deleteAnalysisWithImages` — service-role helper (NEW, `app/lib/analytics-storage.ts`)

```
deleteAnalysisWithImages(analysisId: string, userId: string):
    Promise<{ success: boolean; code?: DeleteFailureCode; error?: string }>

type DeleteFailureCode = "not_found" | "forbidden" | "storage_failed" | "db_failed";
```

Algorithm (order is load-bearing — see Decision D-store-order in plan.md, not repeated here):

1. `supabase = getServerSupabase()` (service role, bypasses RLS).
2. Fetch: `.from("analyses").select("id, user_id, image_paths").eq("id", analysisId).single()`.
   - `fetchError || !row` → `{ success:false, code:"not_found" }`.
3. **Ownership guard (primary):** `if (row.user_id !== userId)` → `{ success:false, code:"forbidden" }`.
   Verbatim the `regenerateImages` guard (actions.ts:231). The RLS DELETE policy is a backstop only.
4. List the owned folder to catch regeneration/orphan drift:
   `.storage.from("analysis-images").list(analysisId)` → objects with `.name` (bare filenames).
   - If `list` errors: log and continue with `image_paths` only (best-effort sweep — see D1). Do
     **not** abort; a missing sweep is recoverable on retry, an aborted delete strands the user.
5. `paths = resolveDeletionPaths(analysisId, row.image_paths, listedNames)` (pure; see below).
6. If `paths.length > 0`: `.storage.from("analysis-images").remove(paths)`.
   - `remove` is idempotent (already-absent objects are simply not returned, not errored).
   - On `error` → `{ success:false, code:"storage_failed" }` **without deleting the row** → user can
     retry; the still-present row keeps pointing at the objects.
7. `.from("analyses").delete().eq("id", analysisId)`.
   - On `error` → `{ success:false, code:"db_failed" }`. Storage is already clean; a retry re-fetches
     the row, the list/remove no-ops (objects gone), and the row delete is retried. Still safe.
8. `{ success:true }`.

### `resolveDeletionPaths` — pure util (NEW, exported from `app/lib/analytics-storage.ts`)

```
resolveDeletionPaths(
  analysisId: string,
  imagePaths: string[] | null | undefined,
  listedNames: string[]
): string[]
```

- Maps each `listedNames[i]` to a full path `${analysisId}/${name}`.
- Unions those with `imagePaths` (already full paths), de-duplicates via a `Set`.
- **Prefix guard:** keeps ONLY paths that start with `${analysisId}/`. This is the security control
  that prevents over-deletion across the shared bucket even if `image_paths` is corrupt or a caller
  supplies foreign paths — the removal set is provably scoped to the analysis's own folder.
- Returns a sorted array (deterministic for unit assertions).
- Extracted as a pure function specifically so the union/dedupe/scoping logic is unit-tested without
  mocking Supabase storage (see D2).

### `selectNeighborId` — pure util (NEW, `app/lib/history-neighbor.ts`)

```
selectNeighborId(orderedIds: string[], deletedId: string): string | null
```

- `orderedIds` is the **newest-first** id list as currently loaded in the sidebar, still containing
  `deletedId` (the pre-deletion snapshot).
- Find `index = orderedIds.indexOf(deletedId)`.
  - `index < 0` (not found / defensive) → `null`.
  - Prefer the **newer** neighbor: `orderedIds[index - 1]` if it exists.
  - Else the **older** neighbor: `orderedIds[index + 1]` if it exists.
  - Else (it was the only entry) → `null` (page returns to new-analysis state).
- Pure and deterministic; the entire post-delete view-selection rule lives here, out of the
  component, and is exhaustively unit-tested (middle→newer, first→older, last-remaining→null,
  unknown-id→null).

## Component Contract — `ConfirmDeleteDialog` (NEW, `app/components/ConfirmDeleteDialog.tsx`)

Presentational modal. Owns no data-fetching and never calls the server itself — the page passes
`onConfirm`/`onCancel` and the busy/error state. Rendered only while `pendingDelete !== null`
(mount = open, unmount = closed).

```tsx
interface ConfirmDeleteDialogProps {
  dateLabel: string;                       // e.g. "Jul 14, 9:32 AM" (formatted by caller)
  preview: string;                         // short text preview identifying the entry
  isDeleting: boolean;                     // disables buttons + backdrop/Escape while true
  error: string | null;                    // shown inline; dialog stays open for retry
  onConfirm: () => void;                   // page runs the server action
  onCancel: () => void;                    // page clears pendingDelete
  fallbackFocusRef: React.RefObject<HTMLElement | null>; // sidebar "New Analysis" button
}
```

**Rendering / a11y:**
- Backdrop + centered panel using design tokens only (`bg-surface`, `text-ink`, `text-ink-muted`,
  `border-outline`, `bg-page` overlay via `/opacity`).
- Panel: `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}`,
  `aria-describedby={bodyId}`.
- Title (e.g. "Delete this analysis?"). Body identifies the entry (`dateLabel` + `preview`) and
  states verbatim intent: **"Its generated images will also be permanently deleted. This cannot be
  undone."** (satisfies SC2).
- Two buttons:
  - **Cancel** — neutral (`border-outline`, `text-ink`), autofocused on open (safe default for a
    destructive dialog).
  - **Delete** — destructive, visually distinct via the new `bg-danger` / `hover:bg-danger-hover`
    token (see D7), `text-white`. Shows a spinner + "Deleting…" and is `disabled` while `isDeleting`.
- `error` renders in an inline `role="alert"` region above the buttons; the dialog stays open so the
  user can press Delete again (retry). Storage-first + idempotent `remove` makes retry safe.

**Focus management (satisfies SC3):**
- On mount: `openerRef.current = document.activeElement as HTMLElement | null` (the kebab or the
  selected-view Delete button), then move focus to the Cancel button.
- Focus trap: a `keydown` handler cycles Tab / Shift+Tab within the panel's focusable elements.
- **Escape** and **backdrop click** → `onCancel` (both no-ops while `isDeleting`).
- **Focus restore on close** — a single `useLayoutEffect(() => () => { restore() }, [])` cleanup runs
  on unmount, for BOTH cancel and successful-delete:
  ```ts
  const opener = openerRef.current;
  if (opener && document.contains(opener)) {
    opener.focus();                    // cancel / error-retry-then-cancel: opener still present
  } else {
    fallbackFocusRef.current?.focus(); // successful delete: opener's kebab removed with its row
  }
  ```
  `useLayoutEffect` (not `useEffect`) so the cleanup runs synchronously **after** DOM mutations in the
  same commit — this is what makes the `document.contains` check deterministic (see D3). Focus is
  never left on `<body>`.

## Modified Component Contract — `HistorySidebar` (`app/components/HistorySidebar.tsx`)

Additive, backward-compatible props (existing call site keeps compiling):

```tsx
interface HistorySidebarProps {
  // ...existing: selectedId, onSelect, onNewAnalysis, refreshTrigger, onHistoryEmptyChange
  onRequestDelete?: (entry: { id: string; dateLabel: string; preview: string }) => void;
  onEntriesChange?: (entries: HistoryEntry[]) => void; // report ordered list up (no 2nd fetch)
  pendingRemovedId?: string | null;                    // optimistic hide of a just-deleted row
  newAnalysisButtonRef?: React.RefObject<HTMLButtonElement | null>; // fallback focus target
}
```

- **Kebab, without nested interactives:** the list item is currently a single `<button>` wrapping the
  whole row. Nesting a kebab `<button>` inside it is invalid HTML. Restructure each `<li>` into a
  `relative` container holding two **sibling** buttons: the existing row-select button (unchanged
  styling/behavior) and an absolutely-positioned kebab button (see D4). The kebab's `onClick` calls
  `stopPropagation()` and opens a tiny one-item menu ("Delete") that calls
  `onRequestDelete({ id, dateLabel: formatDateTime(created_at), preview: input_preview })`. Opening
  the menu / choosing Delete never selects or opens the entry (satisfies SC1).
- **Report entries up:** after the existing single `listAnalyses()` fetch resolves, call
  `onEntriesChange?.(entries)` so the page has the ordered id list for `selectNeighborId` — no second
  fetch (intent Constraint). `onHistoryEmptyChange` is retained unchanged.
- **Optimistic removal:** the rendered list filters out `pendingRemovedId`
  (`entries.filter(e => e.id !== pendingRemovedId)`). This removes the deleted row (and its kebab)
  from the DOM synchronously in the same commit that unmounts the dialog — the mechanism that makes
  the dialog's `document.contains` fallback fire correctly (see D3). The subsequent `refreshTrigger`
  refetch reconciles with server truth.
- Attach `newAnalysisButtonRef` to the existing "+ New Analysis" button so the page can pass it to
  the dialog as `fallbackFocusRef`.

## Modified Orchestration — `page.tsx`

New state: `pendingDelete: { id, dateLabel, preview } | null`, `deleteError: string | null`,
`isDeleting: boolean`, `pendingRemovedId: string | null`, `historyEntryIds: string[]` (fed by
`onEntriesChange`), and a `newAnalysisButtonRef`.

- Both surfaces set `pendingDelete`: the sidebar kebab via `onRequestDelete`, and a new "Delete
  analysis" button rendered in the `viewing-history` view (built with `historyViewData.id`,
  `createdAt`, `inputText` for the date/preview).
- Render `<ConfirmDeleteDialog>` when `pendingDelete` is set, passing `isDeleting`, `deleteError`,
  and `fallbackFocusRef={newAnalysisButtonRef}`.
- **onConfirm handler:**
  ```
  setIsDeleting(true); setDeleteError(null);
  const res = await deleteAnalysis(pendingDelete.id, user.id);
  if (!res.success) { setDeleteError(res.error); setIsDeleting(false); return; } // dialog stays open
  const deletedId = pendingDelete.id;
  // batch (React 18 auto-batches after await):
  setPendingRemovedId(deletedId);          // sidebar hides row synchronously -> opener leaves DOM
  setPendingDelete(null);                  // unmount dialog -> layout-effect focus restore -> fallback
  setIsDeleting(false);
  if (deletedId === selectedHistoryId) {   // deleted the OPEN entry -> navigate
    const neighbor = selectNeighborId(historyEntryIds, deletedId);
    if (neighbor) handleHistorySelect(neighbor); else handleNewAnalysis();
  }
  // else: deleted a NON-selected entry -> leave selectedHistoryId/historyViewData untouched (SC6b)
  setHistoryRefreshTrigger(prev => prev + 1); // reconcile sidebar with server; clears stale row
  setSuccessToast("Analysis deleted.");       // announced via aria-live (see D5)
  ```
- `pendingRemovedId` is reset (to `null`) the next time a delete dialog opens, or when the refreshed
  entries no longer include it; filtering an absent id is a harmless no-op in the meantime.

## Integration Points

| System | Direction | Protocol | Purpose |
|--------|-----------|----------|---------|
| Supabase Postgres (`analyses`) | outbound | supabase-js (service role) | fetch row for ownership check; delete row |
| Supabase Storage (`analysis-images`) | outbound | supabase-js (service role) | `list("{id}")` sweep + `remove([...])` owned objects |
| RLS DELETE policy on `analyses` | passive | Postgres RLS | defense-in-depth backstop (service role bypasses it; explicit `user_id` check is primary) |

No external network services (no Gemini/Discord/Midjourney) are touched by this feature.

## Database Changes

**None.** The DELETE RLS policy already exists (migration `20250215100000`, lines 38-42) and the
`analyses` schema is unchanged. No migration is added; the service-role path needs no new storage
policy and no anon delete path is introduced.

## Error Handling & Retry Semantics

| Failure point | Server result | DB row | Storage | Client behavior | Retry-safe? |
|---------------|---------------|--------|---------|-----------------|-------------|
| Not authenticated | `"User must be authenticated to delete analysis."` | — | — | dialog shows error | yes |
| Row missing | `"Analysis not found."` | — | — | dialog shows error | yes (already gone) |
| Wrong owner | `"Not authorized to delete this analysis."` | intact | intact | dialog shows error | n/a (rejected) |
| Storage `remove` error | `"Couldn't remove all images — please retry."` | **intact** | partial | dialog stays open, Delete re-enabled | **yes** — row still points at objects; retry re-lists + re-removes idempotently, then deletes row |
| DB `delete` error | `"Couldn't finish deleting — please retry."` | intact | **cleared** | dialog stays open | **yes** — retry: list/remove no-op, row delete retried |
| Unexpected throw | `"Failed to delete analysis."` | undefined | undefined | dialog shows error | yes (idempotent path) |

- **No success on partial completion** (SC5): storage-first + row-intact-on-storage-failure means the
  UI never shows "deleted" while owned objects remain reachable.
- **Error hygiene:** all client-facing strings are generic and secret-free; `console.error` logs the
  full Supabase error server-side only (mirrors existing actions).
- **Concurrency:** buttons are `disabled` while `isDeleting`, preventing double-submit; a duplicate
  delete would in any case be idempotent (second attempt hits `not_found`).

## Security Considerations

- **IDOR/BOLA is the primary risk.** The service-role client bypasses RLS, so the explicit
  fetch-then-compare `row.user_id === userId` **before any deletion** is load-bearing (SC7). Verified
  by the "A user cannot delete another user's analysis" scenario — mismatch deletes nothing.
- **Over-deletion containment:** `resolveDeletionPaths` hard-scopes the removal set to the
  `{analysisId}/` prefix; nothing outside the analysis's own folder can be removed even from a
  corrupt `image_paths` (mitigates the shared-bucket blast radius flagged in plan.md Security Impact).
- **Client-supplied userId debt** is inherited unchanged from every existing action and explicitly
  out of scope (intent Constraints / TechnicalDebt.md).

## Performance Considerations

- One extra `storage.list` round-trip per delete (the orphan sweep). Negligible: bounded by ≤20
  objects per analysis (`MAX_IMAGES_PER_ANALYSIS`), single folder, single request.
- Optimistic `pendingRemovedId` hide makes the row disappear instantly; the `refreshTrigger` refetch
  is a background reconcile, so perceived latency is just the server round-trip.
- No new caching, no schema/index changes.

## Decision Log

> The Plan stage already recorded 3 load-bearing decisions (dedicated server action vs. client anon
> delete; storage-first-then-DB ordering; page-level orchestration). Those are **not** repeated here.
> Below are only NEW decisions made during design.

| # | Decision | Options Considered | Chosen | Rationale |
|---|----------|-------------------|--------|-----------|
| D1 | Object set to delete | (a) `image_paths` only; (b) `storage.list("{id}/")` only; (c) union of both, list-error non-fatal | **(c)** | `image_paths` can drift from actual objects after regeneration; the `list` sweep catches orphans. Treating a `list` error as non-fatal (fall back to `image_paths`) keeps deletion available and recoverable rather than aborting on a best-effort step. |
| D2 | Testability of removal-set logic | (a) inline in helper, mock storage; (b) extract pure `resolveDeletionPaths` | **(b)** | Pure union/dedupe/prefix-scoping is unit-tested without a Supabase storage mock, matching the repo's preference for pure, mechanically-verifiable logic (cf. `appendImageGenerationState`, `selectNeighborId`). |
| D3 | Making the dialog's `document.contains` focus fallback deterministic | (a) unmount `useEffect` cleanup + `contains` (racy: async refetch removes the kebab AFTER unmount, so `contains` wrongly returns true and focus is stranded); (b) page focuses fallback itself, split from dialog; (c) optimistic `pendingRemovedId` hide + `useLayoutEffect` cleanup | **(c)** | Keeps the grill-pass mechanism (single `contains` check + `fallbackFocusRef` inside the dialog) intact AND correct: hiding the deleted row in the same commit that unmounts the dialog disconnects the opener before the layout-effect cleanup runs, so `contains` is reliably false → fallback fires. Avoids the async-refetch race. |
| D4 | Kebab placement in the sidebar row | (a) nest kebab `<button>` inside the row `<button>` (invalid HTML); (b) restructure `<li>` into a positioned container with two sibling buttons | **(b)** | Nested interactive elements are invalid and break keyboard/AT behavior. Sibling buttons in a `relative` container keep row-select unchanged and let the kebab `stopPropagation` so it never triggers selection (SC1). |
| D5 | Accessible deletion confirmation (SC6) | (a) new dedicated visually-hidden `aria-live` region; (b) reuse the existing success toast + add `role="status"`/`aria-live="polite"` | **(b)** | The page already has a `successToast`; adding live semantics to it announces "Analysis deleted." to screen readers with no new component and no duplicate surface. |
| D6 | Client-facing error surface | (a) pass internal `code` + raw Supabase message through; (b) return only `{success,error}` with fixed user-safe strings, log detail server-side | **(b)** | Meets SC5 "support-safe (no-secret) message" and matches existing actions' error hygiene; internal `DeleteFailureCode` stays server-side for logging/branching. |
| D7 | Destructive-button styling with no existing danger token | (a) hardcode `bg-red-600` (matches the current error toast but violates the token convention); (b) add per-palette `--color-danger` across all 20 palettes; (c) define one palette-independent `--color-danger`/`--color-danger-hover` in the `@theme inline` block | **(c)** | Gives a real `bg-danger` design token (satisfying "design tokens only") defined once, without editing 20 palettes; a fixed red reads as destructive in every palette. Confirm button uses `bg-danger hover:bg-danger-hover text-white`. |

## Tests (from plan, contracts firmed here)

- **`app/lib/history-neighbor.test.ts` (create):** `selectNeighborId` — middle→newer, first(newest)→
  older, last-remaining→null, unknown-id→null.
- **`app/lib/analytics-storage.test.ts` (extend):**
  - `resolveDeletionPaths` (pure): union + dedupe of `image_paths` and listed names; prefix guard
    drops foreign paths; empty inputs → `[]`.
  - `deleteAnalysisWithImages` (mock `getServerSupabase` via `vi.mock`/`vi.hoisted`, matching
    `image-generation-orchestrator.test.ts` style): happy path removes storage then deletes row;
    wrong-owner → `code:"forbidden"`, deletes nothing; storage-remove error → `code:"storage_failed"`
    and row NOT deleted.
```
