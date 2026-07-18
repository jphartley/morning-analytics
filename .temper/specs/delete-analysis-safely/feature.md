# Feature: Delete an analysis safely

**Status:** SHIPPED
**Branch:** feature/delete-analysis-safely
**Base:** 0246d8ed56dcb02149ca29b7f5f0d56241eaf29d
**Backlog source:** docs/ui-ux-improvement-backlog.md § 6 (P1 · Size M · Difficulty Hard)

## What shipped

```
 app/app/actions.ts                     |  58 ++++++++++-
 app/app/globals.css                    |   6 ++
 app/app/page.tsx                       | 114 ++++++++++++++++++++-
 app/components/ConfirmDeleteDialog.tsx | 157 ++++++++++++++++++++++++++++
 app/components/HistorySidebar.tsx      | 102 +++++++++++++++++--
 app/lib/analytics-storage.test.ts      | 181 ++++++++++++++++++++++++++++++++-
 app/lib/analytics-storage.ts           |  85 ++++++++++++++++
 app/lib/history-neighbor.test.ts       |  29 ++++++
 app/lib/history-neighbor.ts            |  26 +++++
 app/package.json                       |   1 +
 10 files changed, 744 insertions(+), 15 deletions(-)
```

A new `deleteAnalysis` server action (`app/app/actions.ts`) delegates to
`deleteAnalysisWithImages` (`app/lib/analytics-storage.ts`), which re-verifies
`row.user_id === userId` before any deletion (the service-role client bypasses RLS), removes
owned storage objects under the `{analysisId}/` prefix via the pure, prefix-scoped
`resolveDeletionPaths`, and only then deletes the DB row — so a partial failure never reports
success and always leaves the row retry-safe. A new `ConfirmDeleteDialog` (focus-trapped,
`document.contains`-checked focus restoration with a `fallbackFocusRef`) is triggered from a
new sidebar kebab menu or a "Delete analysis" button in the selected-analysis view; `page.tsx`
centralizes the confirm/execute/navigate flow for both surfaces, navigating away only when the
deleted entry was the one currently open (`selectNeighborId`, pure + unit-tested).

## Acceptance criteria (from intent.md)

- [x] SC1 — Guarded, discoverable delete control (menu → confirm, no accidental single-click delete)
- [x] SC2 — Informative confirmation (date; revised post-Check to drop the text preview per
      direct design feedback — see intent.md revision note)
- [x] SC3 — Cancel restores focus (to opener, or a fallback landmark if the opener was removed
      by a successful delete elsewhere)
- [x] SC4 — Atomic server-side cleanup (storage-first, then DB row, under an explicit
      ownership check)
- [x] SC5 — Accurate partial-failure handling (no success on partial completion; retry-safe)
- [x] SC6 — Sensible post-delete view (neighbor/new-analysis on deleting the open entry;
      untouched view on deleting any other entry)
- [x] SC7 — Cross-user isolation (ownership check rejects mismatched `user_id`, deletes nothing)

## Process notes

- Plan stage classified this **complex** (security/authorization + irreversible data loss);
  Design stage ran.
- Grill Me on the plan caught two real gaps before any code was written: no defined behavior
  for deleting a non-selected entry, and a focus-restore assumption that the opener DOM node
  would still exist. Both were fixed in intent.md/plan.md before Build.
- Design stage caught a third, related bug in fixing the second gap: a naive post-unmount
  `document.contains` check is racy against the sidebar's async refetch. Resolved with an
  optimistic `pendingRemovedId` hide + `useLayoutEffect` cleanup ordering (Decision D3).
- Build: 9/9 tasks, 15 new tests, full validation sweep green on first pass.
- Review: 0 issues at any severity; intent verdict "satisfied."
- Check: full pipeline green; 8/8 scenarios covered (4 automated, 4 code-path-verified —
  this project has no jsdom/@testing-library/react, so UI-interaction scenarios are manual by
  convention, not a gap introduced here).
- Post-Check: direct product feedback on the actual rendered dialog (screenshot review) led to
  dropping the text preview and retuning the danger button color — documented as an intentional
  deviation from the original backlog wording in intent.md's SC2.
- Autonomous run (build → review → check) with 0 feedback loops; parked at the Commit gate per
  the no-auto-commit guarantee; human approved commit after the design-feedback round-trip.
