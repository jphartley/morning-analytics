/**
 * Choose which history entry the UI should show after deleting the currently-selected
 * one. `orderedIds` is the newest-first id list as currently loaded in the sidebar,
 * still containing `deletedId` (the pre-deletion snapshot).
 *
 * Preference order: the newer neighbor (immediately before `deletedId`), then the
 * older neighbor (immediately after), then `null` when no neighbor exists (the page
 * should return to the new-analysis state).
 */
export function selectNeighborId(orderedIds: string[], deletedId: string): string | null {
  const index = orderedIds.indexOf(deletedId);

  if (index < 0) {
    return null;
  }

  if (index - 1 >= 0) {
    return orderedIds[index - 1];
  }

  if (index + 1 < orderedIds.length) {
    return orderedIds[index + 1];
  }

  return null;
}
