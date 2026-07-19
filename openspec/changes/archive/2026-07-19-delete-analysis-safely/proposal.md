## Why

Users need an in-product way to permanently remove sensitive saved analyses and their generated images. The completed Temper feature provides that flow, but its requirements are not yet represented in the canonical OpenSpec capability set.

## What Changes

- Add a guarded per-analysis delete action to owned history entries and the selected history view.
- Require an accessible confirmation flow before destructive work begins.
- Delete analysis-owned storage objects and the database row through an ownership-checked server path.
- Preserve retry safety and truthful error reporting across partial storage or database failures.
- Define deterministic post-delete navigation and accessible success feedback.

## Capabilities

### New Capabilities

- `analysis-deletion`: User-facing, authorization-safe deletion of one saved analysis and its generated images.

### Modified Capabilities

None.

## Impact

This capability covers the root app history experience, `HistorySidebar`, the confirmation dialog, the delete server action, Supabase analysis storage cleanup, and neighbor selection after deletion. It introduces no database migration or environment-variable change.

This OpenSpec change imports a completed Temper feature already present on `main`; it records the durable product contract rather than proposing new implementation work.
