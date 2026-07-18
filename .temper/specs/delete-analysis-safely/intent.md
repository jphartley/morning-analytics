# Intent — Delete an analysis safely

_Source: docs/ui-ux-improvement-backlog.md § 6 "Delete an analysis safely" (P1 · Size M · Difficulty Hard · History Management & Privacy)._

## Intent

### Problem

The client can list and read analyses (`listAnalyses`, `getAnalysisById`) but there is **no
per-analysis delete action anywhere** in the app. A user who wrote something they regret, or who
simply wants to prune old entries, has no in-product way to remove a saved analysis or its
generated images. The only deletion path today is an admin CLI (`scripts/cleanup-history.js`) that
deletes by "keep the N newest" — not user-facing, not per-item, and not authorization-scoped.

Morning pages contain sensitive personal writing, so the absence of a delete control is a privacy
gap, not just missing polish. Deletion is also irreversible and touches two backing stores (the
`analyses` Postgres row and the owned objects in the `analysis-images` storage bucket), so a naive
implementation risks orphaned images, false "deleted" confirmations, or — worst — one user deleting
another user's data.

### Target Users

Authenticated Morning Analytics users managing their own saved history — on both the desktop
sidebar and (as it lands) the mobile drawer.

### Success Criteria

- **SC1 — Guarded, discoverable delete control.** Each owned history entry exposes a delete action
  that cannot fire from a single accidental click (menu → explicit confirm).
  Validate: scenario — covered by "Delete is discoverable but guarded against accidental clicks".
- **SC2 — Informative confirmation.** The confirmation names the analysis by date + preview and
  states that its generated images will also be removed.
  Validate: scenario — covered by "Confirmation identifies the item and warns about image deletion".
- **SC3 — Cancel restores focus.** Cancelling returns focus to the control that opened the dialog.
  If a successful delete has removed that control from the DOM (e.g. the sidebar kebab of the
  now-deleted entry), focus falls back to a stable landmark (the sidebar's "New Analysis" button)
  instead of being lost to `<body>`.
  Validate: scenario — covered by "Cancel returns focus to the opening control".
- **SC4 — Atomic server-side cleanup.** The server deletes both the DB record and owned storage
  objects under a server-verified `user_id` check; success is reported only when both complete.
  Validate: scenario — covered by "Server deletes DB record and owned storage objects".
- **SC5 — Accurate partial-failure handling.** A partial DB/storage failure never reports success,
  surfaces a support-safe (no-secret) message, and is safe to retry.
  Validate: scenario — covered by "Partial storage failure is reported and retry-safe".
- **SC6 — Sensible post-delete view.** After deleting the selected analysis, the UI selects a
  neighboring entry or returns to the new-analysis state, and the entry disappears from all history
  surfaces with an accessible confirmation. Deleting an entry that is NOT the one currently open
  (e.g. via the sidebar kebab while viewing something else) must leave the current view untouched —
  the entry only disappears from the list, no navigation occurs.
  Validate: scenario — covered by "Deleting the selected analysis chooses the next logical view" and
  "Deleting a non-selected entry leaves the current view untouched".
- **SC7 — Cross-user isolation.** A user cannot delete another user's analysis or images.
  Validate: scenario — covered by "A user cannot delete another user's analysis".

### Constraints

- **Server-only destructive path.** Deletion MUST run in a server action using the service-role
  client. The service role bypasses RLS, so the action MUST re-verify ownership explicitly
  (`analysis.user_id === userId`) before any deletion — mirror `regenerateImages` (actions.ts:219-232).
  The existing DELETE RLS policy is a defense-in-depth backstop, not the primary guard.
- **Ownership source is the session `userId`** passed from the client `useAuth()` hook, consistent
  with every other server action. This inherits the project-wide client-supplied-userId technical
  debt (see `TechnicalDebt.md` / CLAUDE.md auth notes) — do NOT attempt to fix that here; stay
  consistent with `analyzeText`/`generateImages`/`regenerateImages`.
- **Deletion order = storage first, then DB row**, aborting before the DB delete if any storage
  object fails to remove. `storage.remove` is idempotent, so an aborted-then-retried delete is safe
  and never orphans images the user can no longer see.
- **No success on partial completion.** If storage removal partially fails, return a failure result
  with a retry-safe, secret-free message; leave the DB row intact.
- **Design tokens only** for any new UI (`bg-surface`, `text-ink`, `bg-accent`, `border-outline`,
  etc.) — no hardcoded Tailwind palette colors (CLAUDE.md component convention).
- **Reuse the single history fetch.** `HistorySidebar` owns the entries list; do not add a second
  independent fetch. Neighbor selection must operate on that already-loaded ordered list.
- Bucket name is `analysis-images`; storage paths are `{analysisId}/{index}.{ext}`.

## Scenarios (BDD)

_Note legend: `unit` = pure logic; `mock` = external dependency stubbed; `integration` =
cross-boundary; `manual` = human/visual verification._

### Scenario: Delete is discoverable but guarded against accidental clicks
```gherkin
Given I am viewing my history list with at least one saved analysis
When I click a history entry once
Then the analysis opens and is NOT deleted
And a contextual menu control (kebab) is available on the entry
When I open the contextual menu and choose "Delete"
Then a confirmation dialog appears and nothing is deleted yet
```
Note: manual

### Scenario: Confirmation identifies the item and warns about image deletion
```gherkin
Given I have chosen "Delete" on an analysis created on a known date with a known preview
When the confirmation dialog appears
Then it shows the analysis date and a text preview identifying the entry
And it states that the associated generated images will also be permanently deleted
And the destructive confirm control is visually distinct from cancel
```
Note: manual

### Scenario: Cancel returns focus to the opening control
```gherkin
Given the delete confirmation dialog is open, opened from an entry's kebab menu
When I press Escape or click "Cancel"
Then the dialog closes
And no deletion occurs
And keyboard focus returns to the control that opened the dialog
```
Note: manual

### Scenario: Server deletes DB record and owned storage objects
```gherkin
Given I own analysis "A" with image paths ["A/0.jpg","A/1.jpg"]
When I confirm deletion of analysis "A"
Then the server verifies I own "A"
And it removes all owned objects under the "A/" prefix from the analysis-images bucket
And it deletes the "A" row from the analyses table
And it returns success only after both complete
```
Note: mock

### Scenario: Partial storage failure is reported and retry-safe
```gherkin
Given I own analysis "A" and one of its storage objects fails to remove
When I confirm deletion of analysis "A"
Then the server does NOT delete the analyses row
And the result is a failure with a support-safe message that exposes no secrets
And retrying the deletion re-removes remaining objects idempotently and completes
```
Note: mock

### Scenario: Deleting the selected analysis chooses the next logical view
```gherkin
Given I am viewing analysis "B" which sits between "A" (newer) and "C" (older) in history
When I delete "B" successfully
Then "B" is removed from the history list and the selected view
And a neighboring analysis is selected and shown
And when I delete the last remaining analysis, the app returns to the new-analysis state
And an accessible confirmation of the deletion is announced
```
Note: unit

### Scenario: Deleting a non-selected entry leaves the current view untouched
```gherkin
Given I am viewing analysis "B" in the selected-analysis view
And "D" is a different, unrelated analysis in my history list
When I delete "D" via its sidebar kebab menu
Then "D" is removed from the history list
And the selected-analysis view still shows "B" unchanged
And no navigation or neighbor-selection logic runs
```
Note: manual

### Scenario: A user cannot delete another user's analysis
```gherkin
Given analysis "X" is owned by another user
When a delete request for "X" arrives with my session userId
Then the server rejects it with an authorization error
And neither "X" nor any of its storage objects are deleted
```
Note: mock
