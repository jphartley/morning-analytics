# Tasks — Delete an analysis safely

Ordered by layer (core logic → server → UI → tests). Validation command per task.
Stack commands: `cd app && npm run build`, `npx tsc --noEmit`, `npm test`, `npm run lint`.

## Task 1 — Add `deleteAnalysisWithImages` server helper [SEQUENTIAL]
**File:** `app/lib/analytics-storage.ts` (modify)
**Traced to:** Scenario: "Server deletes DB record and owned storage objects",
"Partial storage failure is reported and retry-safe", "A user cannot delete another user's analysis"
- Add `export async function deleteAnalysisWithImages(analysisId: string, userId: string): Promise<{ success: boolean; error?: string }>`.
- `getServerSupabase()`; fetch `id, user_id, image_paths` via `.eq("id", analysisId).single()`.
- Not found → `{ success: false, error: "Analysis not found." }`.
- `row.user_id !== userId` → `{ success: false, error: "Not authorized to delete this analysis." }` (delete nothing).
- Build the object set: union of `image_paths` and `storage.from("analysis-images").list(analysisId)`
  results (map to `{analysisId}/{name}`); dedupe. `storage.remove(paths)` when non-empty.
- If storage remove errors → return `{ success: false, error: "Couldn't remove all images — please retry." }`, do NOT delete the row. Log full error server-side only.
- `.from("analyses").delete().eq("id", analysisId)`; on error → failure. On success → `{ success: true }`.
**Validate:** `cd app && npx tsc --noEmit`

## Task 2 — Add `selectNeighborId` pure util [PARALLEL: with Task 1]
**File:** `app/lib/history-neighbor.ts` (create)
**Traced to:** Scenario: "Deleting the selected analysis chooses the next logical view"
- `export function selectNeighborId(orderedIds: string[], deletedId: string): string | null`.
- Newest-first ordering: prefer the entry immediately before `deletedId` (newer neighbor); else the
  entry immediately after (older neighbor); else `null`. Return `null` if `deletedId` absent or list
  becomes empty.
**Validate:** `cd app && npx tsc --noEmit`

## Task 3 — Add `deleteAnalysis` server action [SEQUENTIAL: after Task 1]
**File:** `app/app/actions.ts` (modify)
**Traced to:** Scenario: "Server deletes DB record and owned storage objects",
"A user cannot delete another user's analysis"
- Add `export interface DeleteAnalysisResponse { success: boolean; error?: string }`.
- `export async function deleteAnalysis(analysisId: string, userId: string): Promise<DeleteAnalysisResponse>`.
- Guard `!userId` → `{ success: false, error: "User must be authenticated to delete analysis." }`.
- try/catch around `deleteAnalysisWithImages(analysisId, userId)`; return its result; catch → generic failure (mirror `regenerateImages`).
**Validate:** `cd app && npx tsc --noEmit`

## Task 4 — Create `ConfirmDeleteDialog` component [PARALLEL: with Task 3]
**File:** `app/components/ConfirmDeleteDialog.tsx` (create)
**Traced to:** Scenario: "Confirmation identifies the item and warns about image deletion",
"Cancel returns focus to the opening control", "Delete is discoverable but guarded against accidental clicks"
- Props: `{ dateLabel: string; isDeleting: boolean; error: string | null; onConfirm: () => void; onCancel: () => void; fallbackFocusRef: React.RefObject<HTMLElement> }` (`preview` was cut post-Check — see intent.md SC2 revision note).
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-describedby`; body names date + preview and states generated images will be permanently removed.
- Focus moves to the dialog on open; focus trap; Escape + backdrop click → `onCancel`; on unmount/close restore focus to the previously focused element (opener) if it's still in the DOM (`document.contains`); otherwise call the `fallbackFocusRef` prop (never leave focus on `<body>`).
- Add `fallbackFocusRef: React.RefObject<HTMLElement>` prop for the case where a successful delete removes the opener (sidebar kebab) from the DOM.
- Destructive confirm button visually distinct via design tokens (e.g. `bg-accent` vs a clearly-destructive treatment); Cancel is the low-emphasis / default-focused control.
- When `error` is set, render it inline and keep the dialog open (retry); disable buttons while `isDeleting`.
**Validate:** `cd app && npm run lint`

## Task 5 — Add kebab menu + delete plumbing to HistorySidebar [SEQUENTIAL: after Task 4]
**File:** `app/components/HistorySidebar.tsx` (modify)
**Traced to:** Scenario: "Delete is discoverable but guarded against accidental clicks",
"Deleting the selected analysis chooses the next logical view"
- Add optional props `onRequestDelete?: (entry: HistoryEntry) => void` and `onEntriesChange?: (entries: HistoryEntry[]) => void`.
- Call `onEntriesChange(result.data)` when history loads (so page can compute neighbors without a second fetch).
- Add a per-entry kebab button (accessible label, e.g. "Analysis options") that opens a small menu with a "Delete" item calling `onRequestDelete(entry)`. Ensure the kebab click does NOT trigger the entry's `onSelect` (stop propagation) — single click on the row still just selects.
- Keyboard accessible; menu dismissible with Escape / outside click.
**Validate:** `cd app && npm run lint`

## Task 6 — Orchestrate delete in page.tsx (both surfaces) [SEQUENTIAL: after Task 3, 4, 5]
**File:** `app/app/page.tsx` (modify)
**Traced to:** Scenario: "Deleting the selected analysis chooses the next logical view",
"Partial storage failure is reported and retry-safe", "Cancel returns focus to the opening control"
- Import `deleteAnalysis`, `ConfirmDeleteDialog`, `selectNeighborId`.
- State: `pendingDelete: { id: string; dateLabel: string; preview: string } | null`, `isDeleting`, `deleteError`, and `historyEntryIds: string[]` (fed by sidebar `onEntriesChange`).
- Pass `onRequestDelete` + `onEntriesChange` to `<HistorySidebar>`.
- Add a "Delete analysis" button in the `viewing-history` view that sets `pendingDelete` from `historyViewData` (date from `createdAt`, preview from `inputText`).
- Render `<ConfirmDeleteDialog>` when `pendingDelete`. On confirm: `setIsDeleting(true)`; `await deleteAnalysis(pendingDelete.id, user.id)`.
  - Success: if `id === selectedHistoryId` (the deleted entry is the one currently open), compute `selectNeighborId(historyEntryIds, id)` → if id, `handleHistorySelect(neighborId)`; if `null`, `handleNewAnalysis()`. Otherwise (deleted entry was not the one currently open) leave `selectedHistoryId`/`historyViewData` untouched — no navigation. Always `setHistoryRefreshTrigger(n=>n+1)`, clear `pendingDelete`, and set a success announcement (reuse `successToast` + an `aria-live` region).
  - Failure: `setDeleteError(result.error)`, keep dialog open (retry-safe).
- Ensure `aria-live="polite"` announcement region exists for the deletion confirmation.
**Validate:** `cd app && npm run build`

## Task 7 — Unit test `selectNeighborId` [PARALLEL: with Task 8]
**File:** `app/lib/history-neighbor.test.ts` (create)
**Traced to:** Scenario: "Deleting the selected analysis chooses the next logical view"
- Cases: delete middle → newer neighbor; delete first (newest) → next-older; delete only remaining → `null`; deletedId not in list → `null`.
**Validate:** `cd app && npm test`

## Task 8 — Unit test `deleteAnalysisWithImages` [PARALLEL: with Task 7]
**File:** `app/lib/analytics-storage.test.ts` (modify)
**Traced to:** Scenario: "Server deletes DB record and owned storage objects",
"Partial storage failure is reported and retry-safe", "A user cannot delete another user's analysis"
- Mock `getServerSupabase` (from/select/eq/single, storage.list/remove, delete) in the repo's existing style.
- Happy path: owner match → storage objects removed + row deleted → `{ success: true }`.
- Wrong owner: `user_id !== userId` → failure, `remove`/`delete` never called.
- Storage failure: `remove` returns error → failure, row `delete` never called (retry-safe).
**Validate:** `cd app && npm test`

## Task 9 — Full validation sweep [SEQUENTIAL: after all]
**Traced to:** Infrastructure: required by all scenarios
- `cd app && npx tsc --noEmit && npm run lint && npm test && npm run build`.
- Manual pass (mock mode ok) for the `manual` scenarios: kebab guarded, dialog copy/focus, cancel focus-restore, post-delete neighbor/new-analysis + announcement, and deleting a non-selected entry leaves the current view untouched.
**Validate:** `cd app && npm run build && npm test`
